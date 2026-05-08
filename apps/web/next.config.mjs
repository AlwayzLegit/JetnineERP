import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jetnine/shared', '@jetnine/ui'],
  /**
   * Service-worker headers. The browser refuses to register a worker
   * with a wider scope than the script's path unless the response
   * carries `Service-Worker-Allowed: /`. We also force a no-cache
   * policy on `/sw.js` itself so a deploy of a new worker isn't
   * shadowed by a stale cached copy at the edge — the worker's own
   * named caches (Phase 2.15) handle long-lived chunk caching.
   */
  async headers() {
    return [
      {
        source: '/sw.js',
        headers: [
          { key: 'Service-Worker-Allowed', value: '/' },
          { key: 'Cache-Control', value: 'public, max-age=0, must-revalidate' },
        ],
      },
      {
        source: '/manifest.webmanifest',
        headers: [{ key: 'Cache-Control', value: 'public, max-age=300, must-revalidate' }],
      },
    ];
  },
  /**
   * Public API URLs stayed as `/v1/*`, `/health`, `/ready` from when
   * the API ran on its own origin (Phase 1.1+). Vercel's Pages
   * Router constrains functions to `/api/*`, so we forward the
   * legacy paths to the catch-all at `/api/[...path]` — the
   * handler then strips `/api` and forwards to NestJS, which sees
   * its native paths. This keeps the OpenAPI spec, the integration
   * tests, and any external API key holders working unchanged.
   */
  async rewrites() {
    return [
      { source: '/v1/:path*', destination: '/api/v1/:path*' },
      { source: '/health', destination: '/api/health' },
      { source: '/ready', destination: '/api/ready' },
    ];
  },
  /**
   * `transpilePackages` covers our internal workspace TS that the
   * Next compiler reads. `@jetnine/api` is consumed as compiled JS
   * (its `dist/`), so it doesn't go through here, but Express and
   * NestJS imports inside the catch-all need to resolve at build
   * time — make sure they're externalised, not bundled.
   */
  /**
   * The catch-all at /pages/api/[...path].ts pulls in the entire
   * NestJS DI graph (via @jetnine/api/app.module). Letting webpack
   * try to bundle it triggers parser errors on Nest's source-map
   * files and the dynamic `require` calls @nestjs/terminus uses
   * for optional peer-dep checks. Marking the relevant packages as
   * webpack externals on the server bundle leaves them as plain
   * `require()` calls resolved at runtime — which is exactly what
   * Vercel's Node runtime + node_modules give us.
   *
   * `serverExternalPackages` covers Next 15's first-class
   * externalisation; the webpack externals below catch the
   * subpaths and pnpm-symlinked deep paths that the simple list
   * misses.
   */
  serverExternalPackages: [
    '@jetnine/api',
    '@nestjs/common',
    '@nestjs/core',
    '@nestjs/platform-express',
    '@nestjs/config',
    '@nestjs/terminus',
    'better-auth',
    'drizzle-orm',
    'postgres',
    'ioredis',
    'pino',
    'pino-http',
    'pino-pretty',
    'nestjs-pino',
    'stripe',
    'resend',
  ],
  experimental: {
    typedRoutes: true,
    // Allow `require()` of ESM-only subpaths like
    // `better-auth/adapters/drizzle` — those are reached via
    // @jetnine/api's compiled CJS at runtime; the loose mode lets
    // Next emit that import without rejecting at build time.
    esmExternals: 'loose',
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      const externals = config.externals;
      const ours = [
        '@jetnine/api',
        /^@nestjs\//,
        /^better-auth($|\/)/,
        /^drizzle-orm($|\/)/,
        'postgres',
        'ioredis',
        /^pino($|\/)/,
        /^pino-/,
        'nestjs-pino',
        'stripe',
        'resend',
      ];
      if (Array.isArray(externals)) {
        externals.push(...ours);
      } else {
        config.externals = [externals, ...ours].filter(Boolean);
      }
    }
    return config;
  },
};

const sentryWebpackPluginOptions = {
  silent: true,
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: '/monitoring',
  hideSourceMaps: true,
  disableLogger: true,
};

const shouldWrapWithSentry =
  Boolean(process.env.NEXT_PUBLIC_SENTRY_DSN) || Boolean(process.env.SENTRY_DSN);

export default shouldWrapWithSentry
  ? withSentryConfig(nextConfig, sentryWebpackPluginOptions)
  : nextConfig;
