import { Controller, Get } from '@nestjs/common';
import { Public } from './common/auth/public.decorator.js';
import { AppService } from './app.service.js';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Public()
  @Get('health')
  async getHealth() {
    return this.appService.getHealth();
  }
}
