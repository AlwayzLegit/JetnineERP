import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { CrmController } from './crm.controller';

@Module({
  imports: [AuthModule, TenancyModule],
  controllers: [CrmController],
})
export class CrmModule {}
