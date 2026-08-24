import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { ImportService } from '../import/import.service';
import { TenancyModule } from '../tenancy/tenancy.module';
import { INTEGRATION_FETCH } from './connectors';
import { IntegrationsController } from './integrations.controller';

export { INTEGRATION_FETCH } from './connectors';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [IntegrationsController],
  providers: [
    ImportService,
    {
      provide: INTEGRATION_FETCH,
      useValue: fetch,
    },
  ],
})
export class IntegrationsModule {}
