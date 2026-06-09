import { Injectable, NotFoundException } from '@nestjs/common';
import {
  API_ERROR_CODES,
  DEFAULT_GUILD_PREFIX,
  type GuildResponse,
  type UpdateGuildInput,
  type UpsertGuildInput,
} from '@mw-platform/shared';
import { GuildsRepository } from './guilds.repository.js';

@Injectable()
export class GuildsService {
  constructor(private readonly guildsRepository: GuildsRepository) {}

  async findById(guildId: string): Promise<GuildResponse> {
    const guild = await this.guildsRepository.findById(guildId);

    if (!guild) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Guild ${guildId} is not registered.`,
        },
      });
    }

    return this.toResponse(guild);
  }

  async upsert(guildId: string, input: UpsertGuildInput = {}): Promise<GuildResponse> {
    const guild = await this.guildsRepository.upsert(
      guildId,
      input.prefix ?? DEFAULT_GUILD_PREFIX,
    );

    return this.toResponse(guild);
  }

  async update(guildId: string, input: UpdateGuildInput): Promise<GuildResponse> {
    const existing = await this.guildsRepository.findById(guildId);

    if (!existing) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Guild ${guildId} is not registered.`,
        },
      });
    }

    const guild = await this.guildsRepository.updatePrefix(guildId, input.prefix);
    return this.toResponse(guild);
  }

  private toResponse(guild: {
    id: string;
    prefix: string;
    createdAt: Date;
    updatedAt: Date;
  }): GuildResponse {
    return {
      id: guild.id,
      prefix: guild.prefix,
      createdAt: guild.createdAt.toISOString(),
      updatedAt: guild.updatedAt.toISOString(),
    };
  }
}
