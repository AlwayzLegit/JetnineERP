import { Controller, Get, Inject } from '@nestjs/common';
import { HealthCheck, HealthCheckService } from '@nestjs/terminus';
import { Public } from '../tenancy/decorators';

@Public()
@Controller()
export class HealthController {
  // Explicit token — see the note in idempotency.interceptor.ts: reflected
  // parameter types are not available under esbuild/vitest.
  constructor(@Inject(HealthCheckService) private readonly health: HealthCheckService) {}

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
