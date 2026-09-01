import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { MyDayController } from './my-day.controller';

@Module({
  imports: [AuthModule, TenancyModule],
  controllers: [MyDayController],
})
export class CashierModule {}
