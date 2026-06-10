import { Module } from '@nestjs/common';
import { GuildsModule } from '../guilds/guilds.module.js';
import { TournamentsController } from './tournaments.controller.js';
import { TournamentsRepository } from './tournaments.repository.js';
import { TournamentsService } from './tournaments.service.js';

@Module({
  imports: [GuildsModule],
  controllers: [TournamentsController],
  providers: [TournamentsService, TournamentsRepository],
  exports: [TournamentsService, TournamentsRepository],
})
export class TournamentsModule {}
