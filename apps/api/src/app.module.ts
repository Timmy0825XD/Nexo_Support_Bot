import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { InternalApiKeyGuard } from './common/auth/internal-api-key.guard.js';
import { GuildsModule } from './modules/guilds/guilds.module.js';
import { RegistrationModule } from './modules/registration/registration.module.js';
import { TournamentsModule } from './modules/tournaments/tournaments.module.js';
import { PrismaModule } from './prisma/prisma.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    GuildsModule,
    TournamentsModule,
    RegistrationModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    {
      provide: APP_GUARD,
      useClass: InternalApiKeyGuard,
    },
  ],
})
export class AppModule {}
