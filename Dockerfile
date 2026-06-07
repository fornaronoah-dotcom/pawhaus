# syntax=docker/dockerfile:1

# ---------------------------------------------------------------------------
# Base — Node 22 (alpine) met pnpm via corepack
# ---------------------------------------------------------------------------
FROM node:22-alpine AS base
# libc6-compat is nodig voor sharp (image-optimalisatie) op alpine.
RUN apk add --no-cache libc6-compat
RUN corepack enable
WORKDIR /app

# ---------------------------------------------------------------------------
# Dependencies — alleen lockfiles, voor goede layer-caching
# ---------------------------------------------------------------------------
FROM base AS deps
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
RUN pnpm install --frozen-lockfile

# ---------------------------------------------------------------------------
# Builder — bouwt de standalone output
# ---------------------------------------------------------------------------
FROM base AS builder
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
RUN pnpm build

# ---------------------------------------------------------------------------
# Runner — minimale productie-image
# ---------------------------------------------------------------------------
FROM base AS runner
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Niet-root gebruiker
RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 nextjs

# Standalone server + statische bestanden + public assets
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
