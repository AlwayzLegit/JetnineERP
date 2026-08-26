import { Global, Module } from '@nestjs/common';
import { AuditLogsController } from './audit-logs.controller';
import { AuditInterceptor } from './audit.interceptor';
import { AuditService } from './audit.service';
import { NotificationsController } from './notifications.controller';

@Global()
@Module({
  providers: [AuditService, AuditInterceptor],
  controllers: [AuditLogsController, NotificationsController],
  exports: [AuditService, AuditInterceptor],
})
export class AuditModule {}
