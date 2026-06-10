import { Body, Controller, Get, Param, Patch, Post, Req } from '@nestjs/common';
import type { Request } from 'express';
import {
  submitRegistrationSchema,
  updateRegistrationSchema,
  type SubmitRegistrationInput,
  type UpdateRegistrationInput,
} from '@mw-platform/shared';
import { Public } from '../../common/auth/public.decorator.js';
import { getClientIp } from '../../common/utils/client-ip.js';
import { ZodValidationPipe } from '../../common/pipes/zod-validation.pipe.js';
import { RegistrationService } from './registration.service.js';

@Controller()
export class RegistrationController {
  constructor(private readonly registrationService: RegistrationService) {}

  @Public()
  @Post('tournaments/:tournamentId/registrations')
  submit(
    @Param('tournamentId') tournamentId: string,
    @Body(new ZodValidationPipe(submitRegistrationSchema)) body: SubmitRegistrationInput,
    @Req() request: Request,
  ) {
    return this.registrationService.submit(tournamentId, body, getClientIp(request));
  }

  @Get('tournaments/:tournamentId/registrations')
  listByTournament(@Param('tournamentId') tournamentId: string) {
    return this.registrationService.listByTournament(tournamentId);
  }

  @Patch('registrations/:registrationId')
  update(
    @Param('registrationId') registrationId: string,
    @Body(new ZodValidationPipe(updateRegistrationSchema)) body: UpdateRegistrationInput,
  ) {
    return this.registrationService.update(registrationId, body);
  }
}
