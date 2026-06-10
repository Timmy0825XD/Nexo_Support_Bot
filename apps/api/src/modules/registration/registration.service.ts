import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  API_ERROR_CODES,
  createSubmitRegistrationSchema,
  createUpdateRegistrationSchema,
  getParticipantFieldLabel,
  requiresManualTeamName,
  resolveTeamName,
  type ParticipantInput,
  type RegistrationListResponse,
  type RegistrationResponse,
  type SubmitRegistrationInput,
  type TournamentFormat,
  type UpdateRegistrationInput,
  type ValidateRegistrationInput,
} from '@mw-platform/shared';
import { TournamentsRepository } from '../tournaments/tournaments.repository.js';
import { BannedPlayersService } from './banned-players.service.js';
import { RegistrationRepository } from './registration.repository.js';

@Injectable()
export class RegistrationService {
  constructor(
    private readonly registrationRepository: RegistrationRepository,
    private readonly tournamentsRepository: TournamentsRepository,
    private readonly bannedPlayersService: BannedPlayersService,
  ) {}

  async submit(
    tournamentId: string,
    input: SubmitRegistrationInput,
    submitterIp?: string,
  ): Promise<RegistrationResponse> {
    const tournament = await this.tournamentsRepository.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Tournament ${tournamentId} was not found.`,
        },
      });
    }

    if (!tournament.registrationOpen) {
      throw new ConflictException({
        error: {
          code: API_ERROR_CODES.REGISTRATION_CLOSED,
          message: 'Registration is closed for this tournament.',
        },
      });
    }

    const parsed = createSubmitRegistrationSchema(tournament.format as TournamentFormat).safeParse(
      input,
    );

    if (!parsed.success) {
      const message = parsed.error.errors.map((issue) => issue.message).join('; ');

      throw new BadRequestException({
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message,
        },
      });
    }

    const participants = parsed.data.participants;
    const format = tournament.format as TournamentFormat;
    const teamName = resolveTeamName(format, participants, parsed.data.teamName);

    await this.assertParticipantBusinessRules({
      tournamentId,
      participants,
      teamName,
      actionLabel: 'Registration',
    });

    const flaggedForReview =
      submitterIp !== undefined &&
      (await this.registrationRepository.countByTournamentAndIp(tournamentId, submitterIp)) >= 2;

    const registration = await this.registrationRepository.create({
      tournamentId,
      teamName,
      submitterIp,
      flaggedForReview,
      participants,
    });

    return this.toResponse(registration);
  }

  async listByTournament(tournamentId: string): Promise<RegistrationListResponse> {
    await this.ensureTournamentExists(tournamentId);

    const registrations = await this.registrationRepository.findByTournament(tournamentId);
    return { registrations: registrations.map((registration) => this.toResponse(registration)) };
  }

  async validate(
    registrationId: string,
    input: ValidateRegistrationInput,
  ): Promise<RegistrationResponse> {
    return this.update(registrationId, input);
  }

  async update(
    registrationId: string,
    input: UpdateRegistrationInput,
  ): Promise<RegistrationResponse> {
    const registration = await this.registrationRepository.findById(registrationId);

    if (!registration) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Registration ${registrationId} was not found.`,
        },
      });
    }

    const tournament = await this.tournamentsRepository.findById(registration.tournamentId);

    if (!tournament) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Tournament ${registration.tournamentId} was not found.`,
        },
      });
    }

    const format = tournament.format as TournamentFormat;
    const parsed = createUpdateRegistrationSchema(format).safeParse(input);

    if (!parsed.success) {
      const message = parsed.error.errors.map((issue) => issue.message).join('; ');

      throw new BadRequestException({
        error: {
          code: API_ERROR_CODES.VALIDATION_ERROR,
          message,
        },
      });
    }

    const existingParticipants = registration.participants.map((participant) => ({
      discordTag: participant.discordTag,
      discordId: participant.discordId,
      inGameName: participant.inGameName,
      inGameId: participant.inGameId,
      currentTitle: participant.currentTitle as ParticipantInput['currentTitle'],
    }));

    const participants = parsed.data.participants ?? existingParticipants;
    let teamName = parsed.data.teamName ?? registration.teamName;

    if (!requiresManualTeamName(format)) {
      teamName = resolveTeamName(format, participants);
    }

    const nextStatus = parsed.data.status ?? (registration.status as RegistrationResponse['status']);

    if (nextStatus === 'confirmed') {
      const duplicate = await this.findDuplicateAgainstExisting(
        registration.tournamentId,
        participants,
        registrationId,
        ['confirmed'],
      );

      if (duplicate) {
        throw new ConflictException({
          error: {
            code: API_ERROR_CODES.DUPLICATE_REGISTRATION,
            message: `Cannot confirm: ${duplicate} is already registered for this tournament.`,
          },
        });
      }

      const duplicateTeamName = await this.findDuplicateTeamName(
        registration.tournamentId,
        teamName,
        registrationId,
        ['confirmed'],
      );

      if (duplicateTeamName) {
        throw new ConflictException({
          error: {
            code: API_ERROR_CODES.DUPLICATE_REGISTRATION,
            message: `Cannot confirm: team name "${teamName}" is already registered for this tournament.`,
          },
        });
      }
    }

    if (nextStatus !== 'rejected') {
      await this.assertParticipantBusinessRules({
        tournamentId: registration.tournamentId,
        participants,
        teamName,
        excludeRegistrationId: registrationId,
        actionLabel: 'Update',
      });
    }

    const updateData: {
      teamName?: string;
      status?: RegistrationResponse['status'];
      flaggedForReview?: boolean;
      participants?: ParticipantInput[];
    } = {};

    if (parsed.data.teamName !== undefined) {
      updateData.teamName = teamName;
    } else if (!requiresManualTeamName(format) && parsed.data.participants !== undefined) {
      updateData.teamName = teamName;
    }

    if (parsed.data.status !== undefined) {
      updateData.status = parsed.data.status;
    }

    if (parsed.data.flaggedForReview !== undefined) {
      updateData.flaggedForReview = parsed.data.flaggedForReview;
    }

    if (parsed.data.participants !== undefined) {
      updateData.participants = parsed.data.participants;
    }

    const updated = await this.registrationRepository.update(registrationId, updateData);

    return this.toResponse(updated);
  }

  private async assertParticipantBusinessRules(options: {
    tournamentId: string;
    participants: ParticipantInput[];
    teamName: string;
    excludeRegistrationId?: string;
    actionLabel: 'Registration' | 'Update';
  }): Promise<void> {
    const { tournamentId, participants, teamName, excludeRegistrationId, actionLabel } = options;

    const banned = await this.bannedPlayersService.findBannedParticipant(participants);
    if (banned) {
      throw new ConflictException({
        error: {
          code: API_ERROR_CODES.BANNED_PLAYER,
          message: `${actionLabel} rejected: ${banned.fieldLabel} matches a banned player.`,
        },
      });
    }

    const withinSubmission = this.findDuplicateWithinSubmission(participants);
    if (withinSubmission) {
      throw new ConflictException({
        error: {
          code: API_ERROR_CODES.DUPLICATE_REGISTRATION,
          message: `${actionLabel} rejected: ${withinSubmission} is duplicated within this submission.`,
        },
      });
    }

    const duplicate = await this.findDuplicateAgainstExisting(
      tournamentId,
      participants,
      excludeRegistrationId,
    );
    if (duplicate) {
      throw new ConflictException({
        error: {
          code: API_ERROR_CODES.DUPLICATE_REGISTRATION,
          message: `${actionLabel} rejected: ${duplicate} is already registered for this tournament.`,
        },
      });
    }

    const duplicateTeamName = await this.findDuplicateTeamName(
      tournamentId,
      teamName,
      excludeRegistrationId,
    );
    if (duplicateTeamName) {
      throw new ConflictException({
        error: {
          code: API_ERROR_CODES.DUPLICATE_REGISTRATION,
          message: `${actionLabel} rejected: team name "${teamName}" is already registered for this tournament.`,
        },
      });
    }
  }

  private findDuplicateWithinSubmission(participants: ParticipantInput[]): string | null {
    const seenDiscordIds = new Set<string>();
    const seenInGameIds = new Set<string>();

    for (let slotIndex = 0; slotIndex < participants.length; slotIndex++) {
      const participant = participants[slotIndex];

      if (seenDiscordIds.has(participant.discordId)) {
        return getParticipantFieldLabel(slotIndex, 'Discord ID');
      }
      seenDiscordIds.add(participant.discordId);

      const inGameId = participant.inGameId.toLowerCase();
      if (seenInGameIds.has(inGameId)) {
        return getParticipantFieldLabel(slotIndex, 'In-game ID');
      }
      seenInGameIds.add(inGameId);
    }

    return null;
  }

  private async findDuplicateAgainstExisting(
    tournamentId: string,
    participants: ParticipantInput[],
    excludeRegistrationId?: string,
    statuses?: Array<'pending' | 'confirmed' | 'rejected'>,
  ): Promise<string | null> {
    const existing = await this.registrationRepository.findParticipantsByTournament(tournamentId, {
      statuses,
      excludeRejected: statuses === undefined,
    });

    const filtered = excludeRegistrationId
      ? existing.filter((participant) => participant.registrationId !== excludeRegistrationId)
      : existing;

    const existingDiscordIds = new Set(filtered.map((row) => row.discordId));
    const existingInGameIds = new Set(filtered.map((row) => row.inGameId.toLowerCase()));

    for (let slotIndex = 0; slotIndex < participants.length; slotIndex++) {
      const participant = participants[slotIndex];

      if (existingDiscordIds.has(participant.discordId)) {
        return getParticipantFieldLabel(slotIndex, 'Discord ID');
      }

      if (existingInGameIds.has(participant.inGameId.toLowerCase())) {
        return getParticipantFieldLabel(slotIndex, 'In-game ID');
      }
    }

    return null;
  }

  private async findDuplicateTeamName(
    tournamentId: string,
    teamName: string,
    excludeRegistrationId?: string,
    statuses?: Array<'pending' | 'confirmed' | 'rejected'>,
  ): Promise<boolean> {
    const existing = await this.registrationRepository.findTeamNamesByTournament(tournamentId, {
      statuses,
      excludeRejected: statuses === undefined,
    });

    const normalized = teamName.toLowerCase();
    const filtered = excludeRegistrationId
      ? existing.filter((registration) => registration.id !== excludeRegistrationId)
      : existing;

    return filtered.some((registration) => registration.teamName.toLowerCase() === normalized);
  }

  private async ensureTournamentExists(tournamentId: string) {
    const tournament = await this.tournamentsRepository.findById(tournamentId);

    if (!tournament) {
      throw new NotFoundException({
        error: {
          code: API_ERROR_CODES.NOT_FOUND,
          message: `Tournament ${tournamentId} was not found.`,
        },
      });
    }
  }

  private toResponse(registration: {
    id: string;
    tournamentId: string;
    teamName: string;
    status: string;
    flaggedForReview: boolean;
    createdAt: Date;
    updatedAt: Date;
    participants: Array<{
      slotIndex: number;
      discordTag: string;
      discordId: string;
      inGameName: string;
      inGameId: string;
      currentTitle: string;
    }>;
  }): RegistrationResponse {
    return {
      id: registration.id,
      tournamentId: registration.tournamentId,
      teamName: registration.teamName,
      status: registration.status as RegistrationResponse['status'],
      flaggedForReview: registration.flaggedForReview,
      participants: registration.participants.map((participant) => ({
        slotIndex: participant.slotIndex,
        discordTag: participant.discordTag,
        discordId: participant.discordId,
        inGameName: participant.inGameName,
        inGameId: participant.inGameId,
        currentTitle: participant.currentTitle as RegistrationResponse['participants'][0]['currentTitle'],
      })),
      createdAt: registration.createdAt.toISOString(),
      updatedAt: registration.updatedAt.toISOString(),
    };
  }
}
