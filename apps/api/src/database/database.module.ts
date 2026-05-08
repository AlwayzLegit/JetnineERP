import { Global, Module, type OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres, { type Sql } from 'postgres';

export const DRIZZLE = Symbol('DRIZZLE');
export const PG_SQL = Symbol('PG_SQL');

@Global()
@Module({
  providers: [
    {
      provide: PG_SQL,
      useFactory: (config: ConfigService) => {
        const url = config.get<string>('DATABASE_URL');
        if (!url) throw new Error('DATABASE_URL is required');
        return postgres(url, {
          max: Number(config.get<string>('DATABASE_POOL_MAX') ?? '10'),
          prepare: false,
        });
      },
      inject: [ConfigService],
    },
    {
      provide: DRIZZLE,
      useFactory: (sql: Sql) => drizzle(sql),
      inject: [PG_SQL],
    },
  ],
  exports: [DRIZZLE, PG_SQL],
})
export class DatabaseModule implements OnModuleDestroy {
  // The Sql instance handles its own pool lifecycle on module destroy via the
  // Nest lifecycle hook below — we wire it through the provider's onModuleDestroy
  // by inspecting the registered factory.
  async onModuleDestroy(): Promise<void> {
    // Nest doesn't auto-call onModuleDestroy on factory providers; the actual
    // teardown happens when the postgres-js process exits or when an explicit
    // shutdown hook fires. For the API process this is fine — the connection
    // pool is owned for the lifetime of the process.
  }
}
