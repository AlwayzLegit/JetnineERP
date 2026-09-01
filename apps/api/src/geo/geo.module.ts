import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { TenancyModule } from '../tenancy/tenancy.module';
import { GeoController } from './geo.controller';

@Module({
  imports: [AuthModule, TenancyModule],
  controllers: [GeoController],
})
export class GeoModule {}
