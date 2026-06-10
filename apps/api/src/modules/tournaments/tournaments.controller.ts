import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import {
  createTournamentSchema,
  guildIdSchema,
  updateTournamentSchema,
  type CreateTournamentInput,
  type UpdateTournamentInput,
} from '@mw-platform/shared';
import { Public } from '../../common/auth/public.decorator.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { TournamentsService } from './tournaments.service.js';

@Controller()
export class TournamentsController {
  constructor(private readonly tournamentsService: TournamentsService) {}

  @Get('guilds/:guildId/tournaments')
  listByGuild(@Param('guildId', new ZodValidationPipe(guildIdSchema)) guildId: string) {
    return this.tournamentsService.listByGuild(guildId);
  }

  @Post('guilds/:guildId/tournaments')
  create(
    @Param('guildId', new ZodValidationPipe(guildIdSchema)) guildId: string,
    @Body(new ZodValidationPipe(createTournamentSchema)) body: CreateTournamentInput,
  ) {
    return this.tournamentsService.create(guildId, body);
  }

  @Public()
  @Get('tournaments/:tournamentId/public')
  findPublic(@Param('tournamentId') tournamentId: string) {
    return this.tournamentsService.findPublic(tournamentId);
  }

  @Get('tournaments/:tournamentId')
  findById(@Param('tournamentId') tournamentId: string) {
    return this.tournamentsService.findById(tournamentId);
  }

  @Patch('tournaments/:tournamentId')
  update(
    @Param('tournamentId') tournamentId: string,
    @Body(new ZodValidationPipe(updateTournamentSchema)) body: UpdateTournamentInput,
  ) {
    return this.tournamentsService.update(tournamentId, body);
  }

  @Delete('tournaments/:tournamentId')
  delete(@Param('tournamentId') tournamentId: string) {
    return this.tournamentsService.delete(tournamentId);
  }

  @Post('tournaments/:tournamentId/registration/open')
  openRegistration(@Param('tournamentId') tournamentId: string) {
    return this.tournamentsService.openRegistration(tournamentId);
  }

  @Post('tournaments/:tournamentId/registration/close')
  closeRegistration(@Param('tournamentId') tournamentId: string) {
    return this.tournamentsService.closeRegistration(tournamentId);
  }
}
