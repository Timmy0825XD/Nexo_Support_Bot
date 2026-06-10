import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import type { ParticipantInput } from '@mw-platform/shared';

@Injectable()
export class RegistrationRepository {
  constructor(private readonly prisma: PrismaService) {}

  findParticipantsByTournament(
    tournamentId: string,
    options: {
      statuses?: Array<'pending' | 'confirmed' | 'rejected'>;
      excludeRejected?: boolean;
    } = { excludeRejected: true },
  ) {
    const statusFilter = options.statuses
      ? { in: options.statuses }
      : options.excludeRejected
        ? { not: 'rejected' }
        : undefined;

    return this.prisma.participant.findMany({
      where: {
        registration: {
          tournamentId,
          ...(statusFilter ? { status: statusFilter } : {}),
        },
      },
      select: {
        registrationId: true,
        discordId: true,
        inGameId: true,
        slotIndex: true,
      },
    });
  }

  countByTournamentAndIp(tournamentId: string, submitterIp: string) {
    return this.prisma.registration.count({
      where: { tournamentId, submitterIp },
    });
  }

  findByTournament(tournamentId: string) {
    return this.prisma.registration.findMany({
      where: { tournamentId },
      include: { participants: { orderBy: { slotIndex: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  findTeamNamesByTournament(
    tournamentId: string,
    options: {
      statuses?: Array<'pending' | 'confirmed' | 'rejected'>;
      excludeRejected?: boolean;
    } = { excludeRejected: true },
  ) {
    const statusFilter = options.statuses
      ? { in: options.statuses }
      : options.excludeRejected
        ? { not: 'rejected' }
        : undefined;

    return this.prisma.registration.findMany({
      where: {
        tournamentId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      select: {
        id: true,
        teamName: true,
      },
    });
  }

  findById(id: string) {
    return this.prisma.registration.findUnique({
      where: { id },
      include: { participants: { orderBy: { slotIndex: 'asc' } } },
    });
  }

  create(data: {
    tournamentId: string;
    teamName: string;
    submitterIp?: string;
    flaggedForReview: boolean;
    participants: ParticipantInput[];
  }) {
    return this.prisma.registration.create({
      data: {
        tournamentId: data.tournamentId,
        teamName: data.teamName,
        submitterIp: data.submitterIp,
        flaggedForReview: data.flaggedForReview,
        status: 'pending',
        participants: {
          create: data.participants.map((participant, slotIndex) => ({
            slotIndex,
            discordTag: participant.discordTag,
            discordId: participant.discordId,
            inGameName: participant.inGameName,
            inGameId: participant.inGameId,
            currentTitle: participant.currentTitle,
          })),
        },
      },
      include: { participants: { orderBy: { slotIndex: 'asc' } } },
    });
  }

  updateStatus(id: string, status: 'confirmed' | 'rejected') {
    return this.update(id, { status });
  }

  update(
    id: string,
    data: {
      teamName?: string;
      status?: 'pending' | 'confirmed' | 'rejected';
      flaggedForReview?: boolean;
      participants?: ParticipantInput[];
    },
  ) {
    return this.prisma.$transaction(async (tx) => {
      if (data.participants) {
        for (let slotIndex = 0; slotIndex < data.participants.length; slotIndex++) {
          const participant = data.participants[slotIndex];

          await tx.participant.updateMany({
            where: { registrationId: id, slotIndex },
            data: {
              discordTag: participant.discordTag,
              discordId: participant.discordId,
              inGameName: participant.inGameName,
              inGameId: participant.inGameId,
              currentTitle: participant.currentTitle,
            },
          });
        }
      }

      return tx.registration.update({
        where: { id },
        data: {
          ...(data.teamName !== undefined ? { teamName: data.teamName } : {}),
          ...(data.status !== undefined ? { status: data.status } : {}),
          ...(data.flaggedForReview !== undefined ? { flaggedForReview: data.flaggedForReview } : {}),
        },
        include: { participants: { orderBy: { slotIndex: 'asc' } } },
      });
    });
  }
}
