import { z } from 'zod';
import { guildIdSchema } from './guild.js';

export const TOURNAMENT_FORMATS = ['1v1', '2v2', '3v3', '4v4', '5v5'] as const;

export type TournamentFormat = (typeof TOURNAMENT_FORMATS)[number];

export const MAX_TOURNAMENTS_PER_GUILD = 4;

export const tournamentFormatSchema = z.enum(TOURNAMENT_FORMATS);

export function getParticipantCount(format: TournamentFormat): number {
  const counts: Record<TournamentFormat, number> = {
    '1v1': 1,
    '2v2': 2,
    '3v3': 3,
    '4v4': 4,
    '5v5': 5,
  };

  return counts[format];
}

export function getParticipantRoleLabel(slotIndex: number): string {
  if (slotIndex === 0) return 'Captain';
  return `Player ${slotIndex}`;
}

export function getParticipantFieldLabel(
  slotIndex: number,
  fieldName: 'Discord Tag' | 'Discord ID' | 'In-game Name' | 'In-game ID' | 'Current Title',
): string {
  return `${getParticipantRoleLabel(slotIndex)} ${fieldName}`;
}

export const createTournamentSchema = z.object({
  name: z.string().trim().min(1).max(100),
  format: tournamentFormatSchema,
});

export type CreateTournamentInput = z.infer<typeof createTournamentSchema>;

export const updateTournamentSchema = z.object({
  name: z.string().trim().min(1).max(100).optional(),
});

export type UpdateTournamentInput = z.infer<typeof updateTournamentSchema>;

export const tournamentResponseSchema = z.object({
  id: z.string(),
  guildId: guildIdSchema,
  name: z.string(),
  format: tournamentFormatSchema,
  registrationOpen: z.boolean(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type TournamentResponse = z.infer<typeof tournamentResponseSchema>;

export const tournamentPublicResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  format: tournamentFormatSchema,
  registrationOpen: z.boolean(),
});

export type TournamentPublicResponse = z.infer<typeof tournamentPublicResponseSchema>;

export const tournamentListResponseSchema = z.object({
  tournaments: z.array(tournamentResponseSchema),
});

export type TournamentListResponse = z.infer<typeof tournamentListResponseSchema>;
