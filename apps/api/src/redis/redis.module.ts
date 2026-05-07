import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Redis } from 'ioredis';

export const REDIS = Symbol('REDIS');

@Global()
@Module({
  providers: [
    {
      provide: REDIS,
      useFactory: (config: ConfigService): Redis | null => {
        const url = config.get<string>('REDIS_URL');
        if (!url) return null;
        return new Redis(url, {
          // Lazy connect so missing Redis in CI doesn't crash module init.
          // Callers must handle the null case (rate limiter falls back to
          // memory) or the connection error if they require Redis.
          lazyConnect: true,
          maxRetriesPerRequest: 1,
        });
      },
      inject: [ConfigService],
    },
  ],
  exports: [REDIS],
})
export class RedisModule {}
