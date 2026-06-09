import { z } from 'zod';

export const DEFAULT_GUILD_PREFIX = '[]';

export const guildIdSchema = z
  .string()
  .regex(/^\d{17,20}$/, 'Guild ID must be a valid Discord snowflake');

export const guildResponseSchema = z.object({
  id: guildIdSchema,
  prefix: z.string(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export type GuildResponse = z.infer<typeof guildResponseSchema>;

export const upsertGuildSchema = z.object({
  prefix: z.string().min(1).max(10).optional(),
});

export type UpsertGuildInput = z.infer<typeof upsertGuildSchema>;

export const updateGuildSchema = z.object({
  prefix: z.string().min(1).max(10),
});

export type UpdateGuildInput = z.infer<typeof updateGuildSchema>;
