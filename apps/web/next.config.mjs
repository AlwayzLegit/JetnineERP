import { withSentryConfig } from '@sentry/nextjs';

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@jetnine/shared', '@jetnine/ui'],
  experimental: {
    typedRoutes: true,
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
