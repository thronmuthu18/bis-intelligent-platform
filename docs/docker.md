# Docker Containerization Guide

This document describes the container architecture, security hardening, build procedures, local testing, and runtime configuration for the **BIS Intelligent Platform**.

---

## 1. Container Architecture Overview

The system is partitioned into two lightweight, secure container images built from the root monorepo context:

```
┌────────────────────────────────────────────────────────┐
│                   Host / Cloud VM                      │
│                                                        │
│  ┌───────────────────────┐   ┌──────────────────────┐  │
│  │   bis-web Container   │   │   bis-api Container  │  │
│  │  - Nginx (Alpine)     │   │  - Node.js 20+ Alpine│  │
│  │  - Non-root (UID 101) │   │  - Non-root (UID 1000│  │
│  │  - Read-Only Root FS  │   │  - Read-Only Root FS │  │
│  │  - Port 8080 (Mapped  │   │  - Port 5000 (Mapped │  │
│  │    to 80)             │   │    to 5000)          │  │
│  └───────────┬───────────┘   └──────────┬───────────┘  │
│              │                          │              │
│              └─────► bis-internal ◄─────┘              │
│                      Bridge Network                    │
└─────────────────────────────┬──────────────────────────┘
                              │ (External TLS)
                              ▼
                 Managed PostgreSQL 17 / S3 / AI
```

---

## 2. Multi-Stage Dockerfiles

### 2.1 API Container (`apps/api/Dockerfile`)
The API container uses a 2-stage build:
1. **Builder Stage (`node:20-alpine`)**:
   - Copies package manifests across workspaces.
   - Installs dependencies using `npm ci`.
   - Generates Prisma client bindings (`npm run db:generate`).
   - Compiles TypeScript to JavaScript (`npm run build:api`).
   - Prunes devDependencies (`npm prune --omit=dev`).
2. **Runner Stage (`node:20-alpine`)**:
   - Installs `openssl` (required by Prisma engine) and `dumb-init` (PID 1 process supervisor for signal handling).
   - Copies production `node_modules`, compiled `dist/`, and Prisma migrations.
   - Creates `/app/uploads` for local storage mode and grants ownership to `node:node`.
   - Drops privileges to unprivileged `node` user (`UID 1000`).
   - Configures healthcheck targeting `/api/v1/health/live`.
   - Starts production server via `dumb-init -- node apps/api/dist/apps/api/src/server.js`.

### 2.2 Web Container (`apps/web/Dockerfile`)
The Web container uses a 2-stage build:
1. **Builder Stage (`node:20-alpine`)**:
   - Installs dependencies via `npm ci`.
   - Compiles TypeScript and runs Vite production bundling (`npm run build:web`).
   - Emits minified HTML, CSS, JavaScript, and asset maps.
2. **Runner Stage (`nginx:alpine`)**:
   - Injects custom hardened `nginx.conf`.
   - Copies built static assets into `/usr/share/nginx/html`.
   - Configures runtime permissions for unprivileged user `nginx` (`UID 101`).
   - Listens on unprivileged port `8080`.
   - Configures healthcheck targeting internal `/healthz` endpoint.

---

## 3. Container Security Controls

| Security Control | Implementation | Rationale |
|---|---|---|
| **Non-Root Execution** | `USER node` (API), `USER nginx` (Web) | Mitigates container escape vulnerabilities. |
| **Read-Only Root Filesystem** | `read_only: true` in Compose | Prevents unauthorized file writes, binary tampering, or malware persistence. |
| **Capability Dropping** | `cap_drop: [ALL]` | Strips all Linux capabilities (e.g. `CAP_NET_RAW`, `CAP_SYS_ADMIN`). |
| **No New Privileges** | `security_opt: [no-new-privileges:true]` | Blocks child processes from gaining elevated privileges via setuid/setgid binaries. |
| **Ephemerality via tmpfs** | Explicit `tmpfs` mounts for `/tmp`, `/app/uploads`, `/var/run`, `/var/cache` | Allows necessary in-memory temporary writes without persisting data on disk. |
| **Resource Limits** | Memory & CPU caps defined in Compose | Prevents noisy-neighbor starvation and DoS attacks. |
| **Zero Embedded Secrets** | Zero secrets in Dockerfiles or layer history | Secrets must be injected at runtime via environment variables or secret managers. |

---

## 4. Local Docker Usage (Zero AWS Dependencies)

For local testing and container validation, the stack operates with **zero cloud dependencies** by leveraging local/mock providers:

```bash
# 1. Provide local PostgreSQL and JWT secret in environment or .env
export DATABASE_URL="postgresql://postgres:postgres@host.docker.internal:5432/bis_compliance?schema=public"
export JWT_SECRET="local-dev-secret-key-32-chars-long-minimum!!"
export STORAGE_PROVIDER="local"
export AI_PROVIDER="mock"
export VERIFICATION_PROVIDER="mock"
export TRANSLATION_PROVIDER="mock"
export JOB_QUEUE_PROVIDER="memory"

# 2. Build and start local production container stack
docker compose -f docker-compose.prod.yml up -d --build

# 3. Verify health
curl -f http://localhost:5000/api/v1/health/live
curl -f http://localhost:5000/api/v1/health/ready
curl -f http://localhost:80/healthz

# 4. Stop containers
docker compose -f docker-compose.prod.yml down
```

---

## 5. Production Image Build

To build the images locally or in CI from the repository root:

```bash
# Build API image
docker build -t bis-api:latest -f apps/api/Dockerfile .

# Build Web image (with optional API URL override)
docker build -t bis-web:latest -f apps/web/Dockerfile . \
  --build-arg VITE_API_URL="/api/v1"
```

---

## 6. Production Compose Usage

Run the production stack using `docker-compose.prod.yml`:

```bash
# 1. Prepare production environment variables
cp .env.production.example .env.production
# Fill in real production DATABASE_URL, JWT_SECRET, S3 credentials in .env.production

# 2. Validate Compose configuration
docker compose -f docker-compose.prod.yml --env-file .env.production config

# 3. Launch services in detached mode
docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build

# 4. Monitor service status and healthchecks
docker compose -f docker-compose.prod.yml ps

# 5. Tail logs
docker compose -f docker-compose.prod.yml logs -f api
docker compose -f docker-compose.prod.yml logs -f web
```

---

## 7. Database Migration Procedure

In containerized deployments, execute database schema migrations prior to launching new container tasks:

```bash
# Idempotent forward migration deployment
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# Verify migration status
npx prisma migrate status --schema=apps/api/prisma/schema.prisma
```

> **Strict Rule:** NEVER run `prisma migrate reset` or `prisma db push --force-reset` in staging or production.

---

## 8. Healthchecks & Probes

- **API Liveness Probe**:
  - `GET http://localhost:5000/api/v1/health/live`
  - Validates process responsiveness: `{"success":true,"data":{"status":"healthy","check":"liveness"}}`
- **API Readiness Probe**:
  - `GET http://localhost:5000/api/v1/health/ready`
  - Verifies active PostgreSQL connection without leaking credentials: `{"success":true,"data":{"database":{"status":"connected"}}}`
- **Web Ingress Probe**:
  - `GET http://localhost:8080/healthz`
  - Returns `200 OK` (plain text `healthy`).

---

## 9. Rollback Considerations

1. **Container Service Rollback**: Containers are stateless. If a new version fails health probes or introduces a bug, revert the container image tag in `docker-compose.prod.yml` or the orchestration definition, and restart the service.
2. **Database Rollback**: Apply a forward-fixing migration using `prisma migrate deploy`, or restore a snapshot from managed PostgreSQL PITR (Point-in-Time Recovery).

---

## 10. Future Cloud Deployment Boundary

The container definitions and Compose specifications are designed to deploy directly to managed cloud container services (AWS ECS Fargate, AWS App Runner, or Kubernetes/EKS) without code changes:
- In AWS ECS Fargate, task definitions reference these exact container specifications with `awsvpc` networking.
- S3 document storage and AWS Secrets Manager map to the exact environment variables configured in Phase 15A.
