import { Module } from '@nestjs/common';
import { GuildsController } from './guilds.controller.js';
import { GuildsRepository } from './guilds.repository.js';
import { GuildsService } from './guilds.service.js';

@Module({
  controllers: [GuildsController],
  providers: [GuildsService, GuildsRepository],
  exports: [GuildsService, GuildsRepository],
})
export class GuildsModule {}
