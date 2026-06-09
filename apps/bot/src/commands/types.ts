import type { SlashCommandSubcommandsOnlyBuilder } from 'discord.js';
import type { createApiClient } from '../services/api-client.js';
import type { GuildConfigCache } from '../services/guild-config.js';

export interface CommandContext {
  apiClient: ReturnType<typeof createApiClient>;
  guildConfig: GuildConfigCache;
}

export interface SlashCommand {
  data:
    | import('discord.js').SlashCommandBuilder
    | SlashCommandSubcommandsOnlyBuilder;
  execute: (
    interaction: import('discord.js').ChatInputCommandInteraction,
    context: CommandContext,
  ) => Promise<void>;
}

export interface PrefixCommand {
  name: string;
  execute: (
    message: import('discord.js').Message,
    args: string[],
    context: CommandContext,
  ) => Promise<void>;
}
