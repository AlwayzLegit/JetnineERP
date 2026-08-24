import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { MarketingController } from './marketing.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, EmailModule],
  controllers: [MarketingController],
})
export class MarketingModule {}
