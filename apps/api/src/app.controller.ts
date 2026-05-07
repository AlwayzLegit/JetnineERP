import { Controller, Get } from '@nestjs/common';

@Controller()
export class AppController {
  @Get()
  hello(): { name: string; status: string } {
    return { name: 'jetnine-api', status: 'ok' };
  }
}
