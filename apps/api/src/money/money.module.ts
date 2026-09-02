import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { EmailModule } from '../email/email.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CommissionsController } from './commissions.controller';
import { CommissionsService } from './commissions.service';
import { OverdueSchedulerService } from './overdue-scheduler.service';
import { PaymentPlansController } from './payment-plans.controller';
import { SalespersonActivityController } from './salesperson-activity.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule, EmailModule],
  controllers: [PaymentPlansController, CommissionsController, SalespersonActivityController],
  providers: [CommissionsService, OverdueSchedulerService],
  // Sales and orders accrue commission at completion through this service.
  exports: [CommissionsService],
})
export class MoneyModule {}
