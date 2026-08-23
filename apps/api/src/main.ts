import './instrument';

import { NestFactory } from '@nestjs/core';
import type { NestExpressApplication } from '@nestjs/platform-express';
import { Logger } from 'nestjs-pino';
import { AppModule } from './app.module';

async function bootstrap() {
  // rawBody:true preserves the request body so the Stripe webhook
  // handler can verify signatures (Stripe signs the unparsed bytes).
  // Other routes still receive the parsed JSON via Nest's default body
  // parser.
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
    rawBody: true,
  });
  app.useLogger(app.get(Logger));
  // STORIS import CSVs arrive as JSON body text; the express default of
  // 100kb would reject any real export file.
  app.useBodyParser('json', { limit: '25mb' });

  const corsOrigin = process.env.CORS_ORIGIN ?? 'http://localhost:3000';
  app.enableCors({
    origin: corsOrigin.split(',').map((s) => s.trim()),
    credentials: true,
  });

  const port = Number(process.env.PORT ?? 4000);
  await app.listen(port);
  app.get(Logger).log(`API listening on port ${port}`);
}

void bootstrap();
