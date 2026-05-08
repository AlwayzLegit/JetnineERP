# syntax=docker/dockerfile:1.7
#
# Multi-stage build for the Jetnine NestJS API.
#
#   1. `builder` — installs every workspace dep (incl. dev deps for
#      tsc), copies sources, runs `turbo build --filter=@jetnine/api`.
#      Output: compiled `dist/` for apps/api + every package it
#      depends on (@jetnine/db, @jetnine/shared).
#   2. `runtime` — slim production image. Reinstalls deps with
#      --prod, then layers in the dist trees from the builder.
#      Includes the drizzle migration assets so the fly
#      release_command can run `tsx packages/db/src/migrate.ts`
#      on every deploy.
#
# CMD launches main.js directly. The release_command in fly.toml
# (`pnpm --filter @jetnine/db migrate`) handles schema changes.

# --- Builder ---------------------------------------------------------------
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /repo

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml turbo.json tsconfig.base.json ./
COPY apps/api/package.json apps/api/package.json
COPY packages/config/package.json packages/config/package.json
COPY packages/db/package.json packages/db/package.json
COPY packages/shared/package.json packages/shared/package.json
COPY packages/ui/package.json packages/ui/package.json
RUN pnpm install --frozen-lockfile

COPY . .
RUN pnpm turbo build --filter=@jetnine/api

# --- Runtime ---------------------------------------------------------------
FROM node:22-alpine AS runtime
RUN corepack enable && corepack prepare pnpm@9.15.9 --activate
WORKDIR /app
ENV NODE_ENV=production

# Manifests for the prod-only install.
COPY --from=builder /repo/pnpm-workspace.yaml /repo/package.json /repo/pnpm-lock.yaml ./
COPY --from=builder /repo/apps/api/package.json apps/api/package.json
COPY --from=builder /repo/packages/db/package.json packages/db/package.json
COPY --from=builder /repo/packages/shared/package.json packages/shared/package.json
RUN pnpm install --prod --frozen-lockfile --filter @jetnine/api...

# Compiled output trees. The package.json `main` fields point at
# `./dist/...`, so these have to land at the matching path inside
# the workspace package directories.
COPY --from=builder /repo/apps/api/dist apps/api/dist
COPY --from=builder /repo/packages/db/dist packages/db/dist
COPY --from=builder /repo/packages/shared/dist packages/shared/dist

# Migration assets the fly release_command consumes — the compiled
# migrate.js (under packages/db/dist/) reads .sql files from these
# dirs at runtime.
COPY --from=builder /repo/packages/db/drizzle packages/db/drizzle
COPY --from=builder /repo/packages/db/src/migrations packages/db/src/migrations

EXPOSE 4000
ENV PORT=4000
CMD ["node", "apps/api/dist/main.js"]
