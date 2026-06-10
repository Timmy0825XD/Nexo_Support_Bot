import { z } from 'zod';
import {
  getParticipantCount,
  getParticipantFieldLabel,
  tournamentFormatSchema,
  type TournamentFormat,
} from './tournament.js';

export const CURRENT_TITLES = ['Untitled', 'Hero', 'Legend'] as const;

export type CurrentTitle = (typeof CURRENT_TITLES)[number];

export const REGISTRATION_STATUSES = ['pending', 'confirmed', 'rejected'] as const;

export type RegistrationStatus = (typeof REGISTRATION_STATUSES)[number];

export const discordTagSchema = z
  .string()
  .trim()
  .transform((value) => value.toLowerCase())
  .pipe(
    z
      .string()
      .min(1, 'Discord tag is required')
      .regex(
        /^[a-z0-9_]+$/,
        'Discord tag can only contain lowercase letters, numbers, and underscores',
      ),
  );

export const participantDiscordIdSchema = z
  .string()
  .trim()
  .regex(/^\d+$/, 'Discord ID must contain digits only');

export const inGameNameSchema = z.string().trim().min(1, 'In-game name is required');

export const inGameIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]+$/, 'In-game ID must be hexadecimal (0-9, A-F)');

export const currentTitleSchema = z.enum(CURRENT_TITLES, {
  message: 'Current title must be Untitled, Hero, or Legend',
});

export const teamNameSchema = z
  .string()
  .trim()
  .min(1, 'Team name is required')
  .max(20, 'Team name must be 20 characters or fewer')
  .regex(/^[a-zA-Z0-9 ]+$/, 'Team name can only contain letters, numbers, and spaces');

export function requiresManualTeamName(format: TournamentFormat): boolean {
  return format !== '1v1';
}

export function resolveTeamName(
  format: TournamentFormat,
  participants: ParticipantInput[],
  teamName?: string,
): string {
  if (format === '1v1') {
    return participants[0].discordTag;
  }

  return teamName ?? '';
}

export const participantInputSchema = z.object({
  discordTag: discordTagSchema,
  discordId: participantDiscordIdSchema,
  inGameName: inGameNameSchema,
  inGameId: inGameIdSchema,
  currentTitle: currentTitleSchema,
});

export type ParticipantInput = z.infer<typeof participantInputSchema>;

export const submitRegistrationSchema = z.object({
  teamName: z.string().optional(),
  participants: z.array(participantInputSchema).min(1),
});

export type SubmitRegistrationInput = z.infer<typeof submitRegistrationSchema>;

export function createSubmitRegistrationSchema(format: TournamentFormat) {
  const expectedCount = getParticipantCount(format);

  return submitRegistrationSchema.superRefine((data, ctx) => {
    if (data.participants.length !== expectedCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `This tournament requires exactly ${expectedCount} participant(s) for ${format} format.`,
        path: ['participants'],
      });
      return;
    }

    if (requiresManualTeamName(format)) {
      const teamNameResult = teamNameSchema.safeParse(data.teamName);
      if (!teamNameResult.success) {
        const message = teamNameResult.error.errors.map((issue) => issue.message).join('; ');
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message,
          path: ['teamName'],
        });
      }
    } else if (data.teamName !== undefined && data.teamName.trim().length > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Team name is set automatically from the captain Discord tag in 1v1 tournaments.',
        path: ['teamName'],
      });
    }

    const seenDiscordIds = new Set<string>();
    const seenInGameIds = new Set<string>();

    for (let slotIndex = 0; slotIndex < data.participants.length; slotIndex++) {
      const participant = data.participants[slotIndex];

      if (seenDiscordIds.has(participant.discordId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${getParticipantFieldLabel(slotIndex, 'Discord ID')} is duplicated within this registration.`,
          path: ['participants', slotIndex, 'discordId'],
        });
      } else {
        seenDiscordIds.add(participant.discordId);
      }

      const inGameId = participant.inGameId.toLowerCase();
      if (seenInGameIds.has(inGameId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${getParticipantFieldLabel(slotIndex, 'In-game ID')} is duplicated within this registration.`,
          path: ['participants', slotIndex, 'inGameId'],
        });
      } else {
        seenInGameIds.add(inGameId);
      }
    }
  });
}

export const participantResponseSchema = z.object({
  slotIndex: z.number().int().min(0).max(4),
  discordTag: z.string(),
  discordId: z.string(),
  inGameName: z.string(),
  inGameId: z.string(),
  currentTitle: currentTitleSchema,
});

export type ParticipantResponse = z.infer<typeof participantResponseSchema>;

export const registrationResponseSchema = z.object({
  id: z.string(),
  tournamentId: z.string(),
  teamName: z.string(),
  status: z.enum(REGISTRATION_STATUSES),
  flaggedForReview: z.boolean(),
  participants: z.array(participantResponseSchema),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type RegistrationResponse = z.infer<typeof registrationResponseSchema>;

export const registrationListResponseSchema = z.object({
  registrations: z.array(registrationResponseSchema),
});

export type RegistrationListResponse = z.infer<typeof registrationListResponseSchema>;

export const validateRegistrationSchema = z.object({
  status: z.enum(['confirmed', 'rejected']),
});

export type ValidateRegistrationInput = z.infer<typeof validateRegistrationSchema>;

export const updateRegistrationSchema = z
  .object({
    teamName: z.string().optional(),
    status: z.enum(REGISTRATION_STATUSES).optional(),
    flaggedForReview: z.boolean().optional(),
    participants: z.array(participantInputSchema).min(1).optional(),
  })
  .refine(
    (data) =>
      data.teamName !== undefined ||
      data.status !== undefined ||
      data.flaggedForReview !== undefined ||
      data.participants !== undefined,
    { message: 'At least one field must be provided' },
  );

export type UpdateRegistrationInput = z.infer<typeof updateRegistrationSchema>;

export function createUpdateRegistrationSchema(format: TournamentFormat) {
  const expectedCount = getParticipantCount(format);

  return updateRegistrationSchema.superRefine((data, ctx) => {
    if (data.participants !== undefined && data.participants.length !== expectedCount) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `This tournament requires exactly ${expectedCount} participant(s) for ${format} format.`,
        path: ['participants'],
      });
      return;
    }

    if (data.teamName !== undefined) {
      if (requiresManualTeamName(format)) {
        const teamNameResult = teamNameSchema.safeParse(data.teamName);
        if (!teamNameResult.success) {
          const message = teamNameResult.error.errors.map((issue) => issue.message).join('; ');
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message,
            path: ['teamName'],
          });
        }
      } else if (data.teamName.trim().length > 0) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: 'Team name is set automatically from the captain Discord tag in 1v1 tournaments.',
          path: ['teamName'],
        });
      }
    }

    if (!data.participants) return;

    const seenDiscordIds = new Set<string>();
    const seenInGameIds = new Set<string>();

    for (let slotIndex = 0; slotIndex < data.participants.length; slotIndex++) {
      const participant = data.participants[slotIndex];

      if (seenDiscordIds.has(participant.discordId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${getParticipantFieldLabel(slotIndex, 'Discord ID')} is duplicated within this registration.`,
          path: ['participants', slotIndex, 'discordId'],
        });
      } else {
        seenDiscordIds.add(participant.discordId);
      }

      const inGameId = participant.inGameId.toLowerCase();
      if (seenInGameIds.has(inGameId)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `${getParticipantFieldLabel(slotIndex, 'In-game ID')} is duplicated within this registration.`,
          path: ['participants', slotIndex, 'inGameId'],
        });
      } else {
        seenInGameIds.add(inGameId);
      }
    }
  });
}

export const PARTICIPANT_FIELD_KEYS = [
  'discordTag',
  'discordId',
  'inGameName',
  'inGameId',
  'currentTitle',
] as const;

export const PARTICIPANT_FIELD_LABELS: Record<(typeof PARTICIPANT_FIELD_KEYS)[number], string> = {
  discordTag: 'Discord Tag',
  discordId: 'Discord ID',
  inGameName: 'In-game Name',
  inGameId: 'In-game ID',
  currentTitle: 'Current Title',
};

export { tournamentFormatSchema };
