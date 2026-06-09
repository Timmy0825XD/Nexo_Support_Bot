import { Body, Controller, Get, Param, Patch, Put } from '@nestjs/common';
import {
  guildIdSchema,
  type UpdateGuildInput,
  type UpsertGuildInput,
  updateGuildSchema,
  upsertGuildSchema,
} from '@mw-platform/shared';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { GuildsService } from './guilds.service.js';

@Controller('guilds')
export class GuildsController {
  constructor(private readonly guildsService: GuildsService) {}

  @Get(':guildId')
  getGuild(@Param('guildId', new ZodValidationPipe(guildIdSchema)) guildId: string) {
    return this.guildsService.findById(guildId);
  }

  @Put(':guildId')
  upsertGuild(
    @Param('guildId', new ZodValidationPipe(guildIdSchema)) guildId: string,
    @Body(new ZodValidationPipe(upsertGuildSchema)) body: UpsertGuildInput,
  ) {
    return this.guildsService.upsert(guildId, body);
  }

  @Patch(':guildId')
  updateGuild(
    @Param('guildId', new ZodValidationPipe(guildIdSchema)) guildId: string,
    @Body(new ZodValidationPipe(updateGuildSchema)) body: UpdateGuildInput,
  ) {
    return this.guildsService.update(guildId, body);
  }
}
