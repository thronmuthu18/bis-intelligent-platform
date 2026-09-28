# ==============================================================================
# Multi-Stage Dockerfile for @bis/api
# Production Node.js 20+ Runtime with Non-Root User & Hardened Security
# ==============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build & Compile
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Install system dependencies required for native compilation & Prisma
RUN apk add --no-cache openssl libc6-compat

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install all dependencies (including devDependencies required for compilation)
RUN npm ci

# Copy source trees and Prisma configuration
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api

# Set dummy DATABASE_URL for Prisma client compilation
ENV DATABASE_URL="postgresql://dummy:dummy@localhost:5432/dummy"

# Generate Prisma client and compile TypeScript to JavaScript
RUN npm run db:generate --workspace=@bis/api && \
    npm run build:api

# Prune development dependencies to keep production footprint minimal
RUN npm prune --omit=dev

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production Runner
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS runner

WORKDIR /app

# Install minimal runtime dependencies:
# - openssl: required by Prisma engine on Alpine
# - dumb-init: ensures signals (SIGTERM/SIGINT) are forwarded cleanly to PID 1
RUN apk add --no-cache openssl dumb-init

# Set production environment variables
ENV NODE_ENV=production \
    PORT=5000

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY apps/api/package.json ./apps/api/
COPY packages/shared/package.json ./packages/shared/

# Copy production node_modules from builder
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared

# Copy compiled JavaScript output
COPY --from=builder /app/apps/api/dist ./apps/api/dist

# Copy Prisma schema and migrations (needed for runtime schema reflection & migration deployment)
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Ensure runtime unprivileged user owns application directory and local upload storage
RUN mkdir -p /app/uploads && chown -R node:node /app

# Switch to unprivileged user (UID 1000)
USER node

# Expose API port
EXPOSE 5000

# Healthcheck probe using Node.js built-in fetch (zero external curl/wget dependencies)
HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://localhost:' + (process.env.PORT || 5000) + '/api/v1/health/live').then(r => r.ok ? process.exit(0) : process.exit(1)).catch(() => process.exit(1))"

# Use dumb-init for reliable PID 1 signal management
ENTRYPOINT ["dumb-init", "--"]

# Launch production compiled server
CMD ["node", "apps/api/dist/apps/api/src/server.js"]
