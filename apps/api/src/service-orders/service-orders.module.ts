import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { ServiceOrdersController } from './service-orders.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, EmailModule],
  controllers: [ServiceOrdersController],
})
export class ServiceOrdersModule {}
