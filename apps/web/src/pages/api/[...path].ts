/**
 * Single Vercel function that hosts the entire NestJS API.
 *
 * NestJS uses Express under the hood; Vercel's Pages Router gives
 * us Node-style req/res that Express handles directly. The whole
 * Nest container — every controller, guard, interceptor — boots
 * lazily on the first request and is cached for the lifetime of
 * the warm function instance, so subsequent requests pay no
 * bootstrap cost.
 *
 * URL routing:
 *   - `/api/auth/*`      better-auth (its baseURL); pass through unchanged
 *   - `/api/v1/*`        NestJS controllers at /v1/*  → strip `/api` prefix
 *   - `/api/health`      NestJS HealthController     → strip `/api` prefix
 *
 * Public-facing URLs `/v1/*` and `/health` are wired to this
 * catch-all via Next.js rewrites in `next.config.mjs`, so
 * existing OpenAPI consumers + the integration tests that hit
 * the standalone server keep working with no path change.
 */
import 'reflect-metadata';

import { NestFactory } from '@nestjs/core';
import { ExpressAdapter } from '@nestjs/platform-express';
import express, { type Express } from 'express';
import type { NextApiRequest, NextApiResponse } from 'next';
import { AppModule } from '@jetnine/api/app.module';

let cached: Express | null = null;
let booting: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (cached) return cached;
  if (booting) return booting;
  booting = (async () => {
    const expressApp = express();
    const nest = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
      // Keep logs out of cold-start; Pino reconfigures itself
      // through the LoggerModule once init() runs.
      bufferLogs: true,
      // Stripe webhook handler verifies signatures against the
      // unparsed body, same as the standalone server in main.ts.
      rawBody: true,
    });
    await nest.init();
    cached = expressApp;
    return expressApp;
  })();
  try {
    return await booting;
  } finally {
    booting = null;
  }
}

// Disable Next.js's automatic body parser; Express + Nest's
// rawBody handling do their own thing. Without this Next eats
// the request stream before we get to it.
export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse): Promise<void> {
  const app = await getApp();

  // The catch-all sits at /api/[...path] so every request lands
  // here with `/api/` already in the URL. NestJS controllers are
  // configured at root paths (`/v1/sales`, `/health`); better-auth
  // is the one exception — it lives at /api/auth/* and its
  // baseURL is configured to match.
  //
  // So: strip `/api` everywhere except the auth subtree.
  const original = req.url ?? '/';
  if (!original.startsWith('/api/auth')) {
    req.url = original.replace(/^\/api(?=\/|\?|$)/, '') || '/';
  }

  app(req, res);
}
