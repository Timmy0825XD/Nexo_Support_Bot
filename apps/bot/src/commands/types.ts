export interface CommandContext {
  apiClient: ReturnType<typeof import('../services/api-client.js').createApiClient>;
}

export interface SlashCommand {
  data: import('discord.js').SlashCommandBuilder;
  execute: (
    interaction: import('discord.js').ChatInputCommandInteraction,
    context: CommandContext,
  ) => Promise<void>;
}
