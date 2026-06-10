import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class TournamentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  countByGuild(guildId: string) {
    return this.prisma.tournament.count({ where: { guildId } });
  }

  findByGuild(guildId: string) {
    return this.prisma.tournament.findMany({
      where: { guildId },
      orderBy: { createdAt: 'desc' },
    });
  }

  findById(id: string) {
    return this.prisma.tournament.findUnique({ where: { id } });
  }

  create(data: { guildId: string; name: string; format: string }) {
    return this.prisma.tournament.create({ data });
  }

  update(id: string, data: { name?: string; registrationOpen?: boolean }) {
    return this.prisma.tournament.update({ where: { id }, data });
  }

  delete(id: string) {
    return this.prisma.tournament.delete({ where: { id } });
  }
}
