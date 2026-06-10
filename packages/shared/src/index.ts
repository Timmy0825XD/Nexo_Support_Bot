import { z } from 'zod';

export const healthResponseSchema = z.object({
  status: z.literal('ok'),
  timestamp: z.string().datetime(),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;

export const API_ERROR_CODES = {
  REGISTRATION_CLOSED: 'REGISTRATION_CLOSED',
  BANNED_PLAYER: 'BANNED_PLAYER',
  DUPLICATE_REGISTRATION: 'DUPLICATE_REGISTRATION',
  TOURNAMENT_LIMIT_REACHED: 'TOURNAMENT_LIMIT_REACHED',
  UNAUTHORIZED: 'UNAUTHORIZED',
  NOT_FOUND: 'NOT_FOUND',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
} as const;

export type ApiErrorCode = (typeof API_ERROR_CODES)[keyof typeof API_ERROR_CODES];

export const apiErrorSchema = z.object({
  error: z.object({
    code: z.string(),
    message: z.string(),
  }),
});

export type ApiError = z.infer<typeof apiErrorSchema>;

export {
  DEFAULT_GUILD_PREFIX,
  guildIdSchema,
  guildResponseSchema,
  updateGuildSchema,
  upsertGuildSchema,
} from './schemas/guild.js';

export type {
  GuildResponse,
  UpdateGuildInput,
  UpsertGuildInput,
} from './schemas/guild.js';

export {
  CURRENT_TITLES,
  PARTICIPANT_FIELD_KEYS,
  PARTICIPANT_FIELD_LABELS,
  REGISTRATION_STATUSES,
  createSubmitRegistrationSchema,
  createUpdateRegistrationSchema,
  currentTitleSchema,
  discordTagSchema,
  inGameIdSchema,
  inGameNameSchema,
  participantDiscordIdSchema,
  participantInputSchema,
  participantResponseSchema,
  registrationListResponseSchema,
  registrationResponseSchema,
  requiresManualTeamName,
  resolveTeamName,
  submitRegistrationSchema,
  teamNameSchema,
  updateRegistrationSchema,
  validateRegistrationSchema,
} from './schemas/registration.js';

export type {
  CurrentTitle,
  ParticipantInput,
  ParticipantResponse,
  RegistrationListResponse,
  RegistrationResponse,
  RegistrationStatus,
  SubmitRegistrationInput,
  UpdateRegistrationInput,
  ValidateRegistrationInput,
} from './schemas/registration.js';

export {
  MAX_TOURNAMENTS_PER_GUILD,
  TOURNAMENT_FORMATS,
  createTournamentSchema,
  getParticipantCount,
  getParticipantFieldLabel,
  getParticipantRoleLabel,
  tournamentFormatSchema,
  tournamentListResponseSchema,
  tournamentPublicResponseSchema,
  tournamentResponseSchema,
  updateTournamentSchema,
} from './schemas/tournament.js';

export type {
  CreateTournamentInput,
  TournamentFormat,
  TournamentListResponse,
  TournamentPublicResponse,
  TournamentResponse,
  UpdateTournamentInput,
} from './schemas/tournament.js';
