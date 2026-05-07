import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { StripeController } from './stripe.controller';
import { StripeService } from './stripe.service';
import { StripeWebhookController } from './stripe-webhook.controller';

@Module({
  imports: [ConfigModule, AuthModule, TenancyModule, AuditModule],
  controllers: [StripeController, StripeWebhookController],
  providers: [StripeService],
  exports: [StripeService],
})
export class StripeModule {}
