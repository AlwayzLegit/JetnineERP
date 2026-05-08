import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jetnine/shared', '@jetnine/ui'],
  experimental: {
    typedRoutes: true,
  },
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
