import { Injectable } from '@nestjs/common';
import { DEFAULT_GUILD_PREFIX } from '@mw-platform/shared';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class GuildsRepository {
  constructor(private readonly prisma: PrismaService) {}

  findById(id: string) {
    return this.prisma.guild.findUnique({ where: { id } });
  }

  upsert(id: string, prefix = DEFAULT_GUILD_PREFIX) {
    return this.prisma.guild.upsert({
      where: { id },
      create: { id, prefix },
      update: {},
    });
  }

  updatePrefix(id: string, prefix: string) {
    return this.prisma.guild.update({
      where: { id },
      data: { prefix },
    });
  }
}
