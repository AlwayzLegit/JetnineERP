import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../tenancy/decorators';

@Public()
@Controller()
export class HealthController {
  constructor(private readonly health: HealthCheckService) {}

  // Liveness: process is up. Cheap and dependency-free.
  @Get('health')
  live() {
    return { status: 'ok', uptime: process.uptime() };
  }

  // Readiness: ready to take traffic. Currently mirrors liveness; gains
  // database + redis checks once those clients are wired up in Phase 1.
  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([]);
  }
}
