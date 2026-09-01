import { Module } from '@nestjs/common';
import { AuditModule } from '../audit/audit.module';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { OpsDashboardController } from './ops-dashboard.controller';
import { OpsFeedService } from './ops-feed.service';
import { OpsReviewsController } from './ops-reviews.controller';

@Module({
  imports: [AuthModule, TenancyModule, AuditModule],
  controllers: [OpsDashboardController, OpsReviewsController],
  providers: [OpsFeedService],
  exports: [OpsFeedService],
})
export class OpsModule {}
