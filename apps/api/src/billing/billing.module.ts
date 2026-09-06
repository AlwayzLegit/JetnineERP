import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { BillingController } from './billing.controller';
import { BillingWebhookController } from './billing-webhook.controller';
import { PlatformBillingService } from './platform-billing.service';

@Module({
  imports: [ConfigModule, AuthModule, TenancyModule, AuditModule],
  controllers: [BillingController, BillingWebhookController],
  providers: [PlatformBillingService],
  exports: [PlatformBillingService],
})
export class BillingModule {}
