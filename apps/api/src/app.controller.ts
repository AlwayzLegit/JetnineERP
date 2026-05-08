import { Controller, Get } from '@nestjs/common';
import { Public } from './tenancy/decorators';

@Public()
@Controller()
export class AppController {
  @Get()
  hello(): { name: string; status: string } {
    return { name: 'jetnine-api', status: 'ok' };
  }
}
