import { Module } from '@nestjs/common';
import { TournamentsModule } from '../tournaments/tournaments.module.js';
import { BannedPlayersService } from './banned-players.service.js';
import { RegistrationController } from './registration.controller.js';
import { RegistrationRepository } from './registration.repository.js';
import { RegistrationService } from './registration.service.js';

@Module({
  imports: [TournamentsModule],
  controllers: [RegistrationController],
  providers: [RegistrationService, RegistrationRepository, BannedPlayersService],
})
export class RegistrationModule {}
