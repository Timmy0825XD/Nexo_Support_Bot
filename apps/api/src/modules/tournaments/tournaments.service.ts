import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  API_ERROR_CODES,
  MAX_TOURNAMENTS_PER_GUILD,
  type CreateTournamentInput,
  type TournamentListResponse,
  type TournamentPublicResponse,
  type TournamentResponse,
  type UpdateTournamentInput,
} from '@mw-platform/shared';
import { GuildsRepository } from '../guilds/guilds.repository.js';
import { TournamentsRepository } from './tournaments.repository.js';

@Injectable()
export class TournamentsService {
  constructor(
    private readonly tournamentsRepository: TournamentsRepository,
    private readonly guildsRepository: GuildsRepository,
  ) {}

  async listByGuild(guildId: string): Promise<TournamentListResponse> {
    await this.ensureGuildExists(guildId);

    const tournaments = await this.tournamentsRepository.findByGuild(guildId);
    return { tournaments: tournaments.map((tournament) => this.toResponse(tournament)) };
  }

  async create(guildId: string, input: CreateTournamentInput): Promise<TournamentResponse> {
    await this.ensureGuildExists(guildId);

    const count = await this.tournamentsRepository.countByGuild(guildId);
    if (count >= MAX_TOURNAMENTS_PER_GUILD) {
      throw new ConflictException({
        error: {
          code: API_ERROR_CODES.TOURNAMENT_LIMIT_REACHED,
          message: `This server already has ${MAX_TOURNAMENTS_PER_GUILD} tournaments. Delete one before adding another.`,
        },
      });
    }

    const tournament = await this.tournamentsRepository.create({
      guildId,
      name: input.name,
      format: input.format,
    });

    return this.toResponse(tournament);
  }

  async findById(tournamentId: string): Promise<TournamentResponse> {
    const tournament = await this.getTournamentOrThrow(tournamentId);
    return this.toResponse(tournament);
  }

  async findPublic(tournamentId: string): Promise<TournamentPublicResponse> {
    const tournament = await this.getTournamentOrThrow(tournamentId);

    return {
      id: tournament.id,
      name: tournament.name,
      format: tournament.format as TournamentPublicResponse['format'],
      registrationOpen: tournament.registrationOpen,
    };
  }

  async update(tournamentId: string, input: UpdateTournamentInput): Promise<TournamentResponse> {
    const tournament = await this.getTournamentOrThrow(tournamentId);

    const updated = await this.tournamentsRepository.update(tournament.id, {
      name: input.name,
    });

    return this.toResponse(updated);
  }

  async delete(tournamentId: string): Promise<void> {
    await this.getTournamentOrThrow(tournamentId);
    await this.tournamentsRepository.delete(tournamentId);
  }

  async openRegistration(tournamentId: string): Promise<TournamentResponse> {
    await this.getTournamentOrThrow(tournamentId);

    const updated = await this.tournamentsRepository.update(tournamentId, {
      registrationOpen: true,
    });

    return this.toResponse(updated);
  }

  async closeRegistration(tournamentId: string): Promise<TournamentResponse> {
    await this.getTournamentOrThrow(tournamentId);

    const updated = await this.tournamentsRepository.update(tournamentId, {
      registrationOpen: false,
    });

    return this.toResponse(updated);
  }

  private async ensureGuildExists(guildId: string) {
    const guild = await this.guildsRepository.findById(guildId);

    if (!guild) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Guild ${guildId} is not registered.`,
        },
      });
    }
  }

  private async getTournamentOrThrow(tournamentId: string) {
    const tournament = await this.tournamentsRepository.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Tournament ${tournamentId} was not found.`,
        },
      });
    }

    return tournament;
  }

  private toResponse(tournament: {
    id: string;
    guildId: string;
    name: string;
    format: string;
    registrationOpen: boolean;
    createdAt: Date;
    updatedAt: Date;
  }): TournamentResponse {
    return {
      id: tournament.id,
      guildId: tournament.guildId,
      name: tournament.name,
      format: tournament.format as TournamentResponse['format'],
      registrationOpen: tournament.registrationOpen,
      createdAt: tournament.createdAt.toISOString(),
      updatedAt: tournament.updatedAt.toISOString(),
    };
  }
}
