import { Controller, Get, NotFoundException, Query } from '@nestjs/common';
import { Public } from '../tenancy/decorators';
import { EmailService, type CapturedEmail } from './email.service';

// Dev-only inbox: lets Playwright pull the most recent verification/reset
// emails out of the in-memory transport. Only registered when NODE_ENV is
// not "production"; see EmailModule.
@Public()
@Controller('v1/dev/email')
export class DevEmailController {
  constructor(private readonly email: EmailService) {}

  @Get('last')
  last(@Query('to') to?: string): CapturedEmail {
    const all = this.email.drainCaptured();
    const matching = to ? all.filter((m) => m.to === to) : all;
    const last = matching.at(-1);
    if (!last) throw new NotFoundException('No captured email');
    return last;
  }
}
