import { DEFAULT_GUILD_PREFIX } from '@mw-platform/shared';
import type { createApiClient } from './api-client.js';

type ApiClient = ReturnType<typeof createApiClient>;

export class GuildConfigCache {
  private readonly prefixes = new Map<string, string>();

  getPrefix(guildId: string) {
    return this.prefixes.get(guildId) ?? DEFAULT_GUILD_PREFIX;
  }

  setPrefix(guildId: string, prefix: string) {
    this.prefixes.set(guildId, prefix);
  }

  async ensureGuild(guildId: string, apiClient: ApiClient) {
    try {
      const guild = await apiClient.upsertGuild(guildId);
      this.setPrefix(guildId, guild.prefix);
      return guild;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Failed to register guild ${guildId}: ${message}`);
      this.setPrefix(guildId, DEFAULT_GUILD_PREFIX);
      return null;
    }
  }

  async syncAllGuilds(guildIds: string[], apiClient: ApiClient) {
    const results = await Promise.all(guildIds.map((guildId) => this.ensureGuild(guildId, apiClient)));

    const failed = results.filter((result) => result === null).length;
    const synced = results.length - failed;

    if (failed > 0) {
      console.warn(`Guild sync: ${synced} succeeded, ${failed} failed`);
      return;
    }

    console.log(`Guild sync: ${synced} guild(s) registered`);
  }

  async refreshPrefix(guildId: string, apiClient: ApiClient) {
    const guild = await apiClient.getGuild(guildId);
    this.setPrefix(guildId, guild.prefix);
    return guild;
  }
}
