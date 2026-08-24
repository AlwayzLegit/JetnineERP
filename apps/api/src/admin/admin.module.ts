import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { EmailModule } from '../email/email.module';
import { AcceptInviteController } from './accept-invite.controller';
import { AdminBusinessesController } from './businesses.controller';
import { ImpersonateController } from './impersonate.controller';
import { AdminMetricsController } from './metrics.controller';
import { AdminTemplatesController } from './templates.controller';
import { SuperAdminBootstrapService } from './super-admin-bootstrap.service';
import { SystemRoleSyncService } from './system-role-sync.service';
import { TemplatesService } from './templates.service';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, EmailModule],
  controllers: [
    AdminBusinessesController,
    ImpersonateController,
    AdminMetricsController,
    AcceptInviteController,
    AdminTemplatesController,
  ],
  providers: [TemplatesService, SuperAdminBootstrapService, SystemRoleSyncService],
})
export class AdminModule {}
