# ==============================================================================
# Multi-Stage Dockerfile for @bis/web (Vite React SPA)
# High-Performance, Unprivileged Nginx Container
# ==============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# Stage 1: Build & Bundle SPA
# ─────────────────────────────────────────────────────────────────────────────
FROM node:20-alpine AS builder

WORKDIR /app

# Copy workspace package manifests
COPY package.json package-lock.json ./
COPY apps/web/package.json ./apps/web/
COPY packages/shared/package.json ./packages/shared/

# Install dependencies
RUN npm ci

# Copy shared code and web frontend sources
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web

# Build-time environment arguments (VITE_ prefix ensures inclusion in client bundle)
ARG VITE_API_URL="/api/v1"
ENV VITE_API_URL=$VITE_API_URL

# Build production bundle with TypeScript typecheck & Vite minification
RUN npm run build:web

# ─────────────────────────────────────────────────────────────────────────────
# Stage 2: Production Nginx Server
# ─────────────────────────────────────────────────────────────────────────────
FROM nginx:alpine AS runner

# Remove default nginx configurations and default pid directive
RUN rm -rf /etc/nginx/conf.d/* && \
    sed -i '/pid/d' /etc/nginx/nginx.conf

# Copy hardened nginx configuration
COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf

# Copy compiled static assets from builder stage
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html

# Configure file ownership and runtime directories for unprivileged execution
RUN touch /var/run/nginx.pid && \
    chown -R nginx:nginx /var/run/nginx.pid \
                         /usr/share/nginx/html \
                         /var/cache/nginx \
                         /var/log/nginx \
                         /etc/nginx/conf.d

# Switch to unprivileged nginx user
USER nginx

# Expose unprivileged web port
EXPOSE 8080

# Health probe targeting internal nginx health endpoint
HEALTHCHECK --interval=30s --timeout=5s --start-period=5s --retries=3 \
  CMD wget -qO- http://localhost:8080/healthz || exit 1

# Start Nginx in foreground with PID configured in writable /tmp
CMD ["nginx", "-g", "daemon off; pid /tmp/nginx.pid;"]
