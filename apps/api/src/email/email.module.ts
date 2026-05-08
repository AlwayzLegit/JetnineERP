import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DevEmailController } from './dev.controller';
import { DevSeedController } from './dev-seed.controller';
import { EMAIL_TRANSPORT, EmailService, createEmailTransport } from './email.service';

const isProd = process.env.NODE_ENV === 'production';

@Module({
  providers: [
    {
      provide: EMAIL_TRANSPORT,
      useFactory: (config: ConfigService) => createEmailTransport(config),
      inject: [ConfigService],
    },
    EmailService,
  ],
  controllers: isProd ? [] : [DevEmailController, DevSeedController],
  exports: [EmailService, EMAIL_TRANSPORT],
})
export class EmailModule {}
