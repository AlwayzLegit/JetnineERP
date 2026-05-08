import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Redis } from 'ioredis';
import { DRIZZLE } from '../database/database.module';
import { EmailModule } from '../email/email.module';
import { EmailService } from '../email/email.service';
import { REDIS } from '../redis/redis.module';
import { createAuth } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { SessionsController } from './sessions.controller';
import { AUTH_INSTANCE } from './auth.tokens';

@Module({
  imports: [EmailModule],
  providers: [
    {
      provide: AUTH_INSTANCE,
      useFactory: async (
        config: ConfigService,
        db: unknown,
        email: EmailService,
        redis: Redis | null,
      ) => {
        const baseURL = config.get<string>('BETTER_AUTH_URL') ?? 'http://localhost:4000';
        const secret = config.get<string>('BETTER_AUTH_SECRET');
        if (!secret || secret.length < 16) {
          throw new Error('BETTER_AUTH_SECRET is required (>=16 chars). Set it in apps/api/.env.');
        }
        const trustedOrigins = (
          config.get<string>('AUTH_TRUSTED_ORIGINS') ?? 'http://localhost:3000'
        )
          .split(',')
          .map((s) => s.trim())
          .filter(Boolean);

        return await createAuth({
          db,
          email,
          redis,
          baseURL,
          trustedOrigins,
          secret,
          productionMode: config.get<string>('NODE_ENV') === 'production',
          // Email verification is only enforced when a real transport
          // is configured. Without RESEND_API_KEY the memory transport
          // would log the verification email but never deliver it,
          // leaving signups stuck. Auto-verify in that case so a fresh
          // deploy is testable end-to-end before the merchant configures
          // Resend.
          requireEmailVerification: Boolean(config.get<string>('RESEND_API_KEY')),
        });
      },
      inject: [ConfigService, DRIZZLE, EmailService, REDIS],
    },
    AuthGuard,
  ],
  controllers: [AuthController, SessionsController],
  exports: [AUTH_INSTANCE, AuthGuard],
})
export class AuthModule {}
