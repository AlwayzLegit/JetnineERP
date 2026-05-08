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

import type { Express } from 'express';
import type { NextApiRequest, NextApiResponse } from 'next';

// Capture whatever's silently crashing the function so we can surface it
// in the next request's response.
const capturedFailures: Array<{ kind: string; message?: string; stack?: string[] }> = [];
process.on('uncaughtException', (err) => {
  console.error('[catch-all] uncaughtException:', err);
  capturedFailures.push({
    kind: 'uncaughtException',
    message: err?.message,
    stack: err?.stack?.split('\n').slice(0, 30),
  });
});
process.on('unhandledRejection', (reason) => {
  console.error('[catch-all] unhandledRejection:', reason);
  const e = reason as Error | undefined;
  capturedFailures.push({
    kind: 'unhandledRejection',
    message: e?.message ?? String(reason),
    stack: e?.stack?.split('\n').slice(0, 30),
  });
});

let cached: Express | null = null;
let booting: Promise<Express> | null = null;

async function getApp(): Promise<Express> {
  if (cached) return cached;
  if (booting) return booting;
  booting = (async () => {
    // Imports are dynamic so a "Cannot find module" failure surfaces
    // through the handler's try/catch instead of crashing the function
    // before it can run. Vercel's runtime log truncates the message
    // when the failure happens at module-load time.
    const { NestFactory } = await import('@nestjs/core');
    const { ExpressAdapter } = await import('@nestjs/platform-express');
    const { default: express } = await import('express');
    const { AppModule } = await import('@jetnine/api/app.module');

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
  console.log('[catch-all] handler entered for', req.url);

  // Debug bypass: ?fail=sync throws synchronously to see whether Next or
  // Vercel rewrites our error response, vs ?fail=catch which throws and
  // catches inside the handler.
  if (req.query.fail === 'sync') {
    throw new Error('synthetic-sync-throw');
  }
  if (req.query.fail === 'catch') {
    try {
      throw new Error('synthetic-caught-throw');
    } catch (err) {
      const e = err as Error;
      res.status(500).json({
        ok: false,
        error: 'caught_throw',
        status_returned: 500,
        message: e.message,
      });
      return;
    }
  }
  if (req.query.fail === 'catch200') {
    try {
      throw new Error('synthetic-caught-throw-200');
    } catch (err) {
      const e = err as Error;
      res.status(200).json({
        ok: false,
        error: 'caught_throw_200',
        message: e.message,
      });
      return;
    }
  }

  // Debug bypass: ?probe=1 returns immediately without booting Nest, so we can
  // tell whether the function infra works on its own. Includes any
  // capturedFailures from previous invocations on the same warm instance.
  if (typeof req.query.probe === 'string') {
    res.status(200).json({
      ok: true,
      message: 'probe ok — function infra is working',
      url: req.url,
      method: req.method,
      env: {
        NODE_ENV: process.env.NODE_ENV,
        VERCEL: process.env.VERCEL,
        hasDatabaseUrl: Boolean(process.env.DATABASE_URL),
        hasAuthSecret: Boolean(process.env.BETTER_AUTH_SECRET),
        hasAuthUrl: Boolean(process.env.BETTER_AUTH_URL),
      },
      capturedFailures,
    });
    return;
  }

  // Debug bypass: ?step=N — incrementally exercises the boot path, reports
  // which step failed and how long each took. Step 0=baseline, 1=core import,
  // 2=express import, 3=AppModule import, 4=NestFactory.create, 5=nest.init.
  if (typeof req.query.step === 'string') {
    const target = Number(req.query.step);
    const timings: Record<string, number> = {};
    let lastStep = 'start';
    try {
      const t0 = Date.now();
      lastStep = '1-import-nestjs-core';
      const { NestFactory } = await import('@nestjs/core');
      timings[lastStep] = Date.now() - t0;
      if (target < 2) {
        return void res.status(200).json({ ok: true, stoppedAfter: lastStep, timings });
      }

      const t1 = Date.now();
      lastStep = '2-import-express';
      const { ExpressAdapter } = await import('@nestjs/platform-express');
      const { default: express } = await import('express');
      timings[lastStep] = Date.now() - t1;
      if (target < 3) {
        return void res.status(200).json({ ok: true, stoppedAfter: lastStep, timings });
      }

      const t2 = Date.now();
      lastStep = '3-import-app-module';
      const { AppModule } = await import('@jetnine/api/app.module');
      timings[lastStep] = Date.now() - t2;
      if (target < 4) {
        return void res.status(200).json({ ok: true, stoppedAfter: lastStep, timings });
      }

      const t3 = Date.now();
      lastStep = '4-nest-factory-create';
      const expressApp = express();
      const nest = await NestFactory.create(AppModule, new ExpressAdapter(expressApp), {
        bufferLogs: true,
        rawBody: true,
      });
      timings[lastStep] = Date.now() - t3;
      if (target < 5) {
        return void res.status(200).json({ ok: true, stoppedAfter: lastStep, timings });
      }

      const t4 = Date.now();
      lastStep = '5-nest-init';
      await nest.init();
      timings[lastStep] = Date.now() - t4;
      return void res.status(200).json({ ok: true, stoppedAfter: lastStep, timings });
    } catch (err) {
      const e = err as Error & { code?: string };
      res.status(200).json({
        ok: false,
        failedAt: lastStep,
        timings,
        name: e?.name,
        code: e?.code,
        message: e?.message,
        stack: e?.stack?.split('\n').slice(0, 30),
      });
    }
    return;
  }

  // Debug bypass: ?boot=1 boots Nest but doesn't dispatch the request through
  // it. Reports the time taken plus any error. Always returns 200 — Next's
  // Pages Router was rewriting our 500 JSON responses to the static /500 page,
  // hiding the error detail.
  if (typeof req.query.boot === 'string') {
    const start = Date.now();
    try {
      await getApp();
      res.status(200).json({
        ok: true,
        message: 'nest booted',
        bootMs: Date.now() - start,
      });
    } catch (err) {
      const e = err as Error & { code?: string };
      res.status(200).json({
        ok: false,
        error: 'nest_boot_failed',
        bootMs: Date.now() - start,
        name: e?.name,
        code: e?.code,
        message: e?.message,
        stack: e?.stack?.split('\n').slice(0, 30),
      });
    }
    return;
  }

  let app: Express;
  try {
    console.log('[catch-all] calling getApp()');
    app = await getApp();
    console.log('[catch-all] getApp() resolved');
  } catch (err) {
    // Surface boot errors directly so we can debug without scrolling
    // through truncated runtime logs. Includes the message + stack,
    // since "Cannot find module ..." in the deployed bundle is the
    // most common failure mode.
    const e = err as Error & { code?: string };
    console.error('[catch-all] bootstrap failed:', e);
    res.status(500).json({
      error: 'bootstrap_failed',
      name: e?.name,
      code: e?.code,
      message: e?.message,
      stack: e?.stack?.split('\n').slice(0, 20),
    });
    return;
  }

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
  console.log('[catch-all] dispatching to express, url=', req.url);

  try {
    app(req, res);
  } catch (err) {
    const e = err as Error;
    console.error('[catch-all] express dispatch threw synchronously:', e);
    if (!res.headersSent) {
      res.status(500).json({
        error: 'dispatch_failed_sync',
        message: e?.message,
        stack: e?.stack?.split('\n').slice(0, 20),
      });
    }
  }
}
