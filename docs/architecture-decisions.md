# Architecture Decision Records

## ADR-001: Monorepo with npm Workspaces

**Date:** 2026-09-24  
**Status:** Accepted

### Context
The platform has three distinct code units: frontend (React), backend (Express), and shared types. They need to share types without duplication.

### Decision
Use npm workspaces monorepo with three packages:
- `apps/web` — frontend
- `apps/api` — backend  
- `packages/shared` — shared TypeScript types

### Consequences
- Single `npm install` installs all dependencies
- `@bis/shared` can be imported in both frontend and backend
- TypeScript paths are configured for development-time resolution

---

## ADR-002: Prisma as ORM

**Date:** 2026-09-24  
**Status:** Accepted

### Context
Need a type-safe, migration-capable ORM for PostgreSQL.

### Decision
Use Prisma ORM with:
- Schema-first design in `apps/api/prisma/schema.prisma`
- Generated TypeScript client
- Migration files for version control

### Consequences
- Full type safety from database to API layer
- Migrations tracked in `prisma/migrations/`
- Prisma Studio available for development inspection
- Future pgvector extension can be added via Prisma

---

## ADR-003: Source-Grounded AI Constraint

**Date:** 2026-09-24  
**Status:** Accepted

### Context
The platform deals with regulatory compliance for Indian Standards. Incorrect information could mislead users into legal or financial risk.

### Decision
The AI layer must:
1. Never generate BIS standard numbers without source provenance
2. Never invent certification requirements, fees, or timelines
3. Always attach a `Citation` record to regulatory findings
4. Explicitly identify uncertainty rather than fabricate
5. Prefer official BIS/government URLs over secondary sources

### Consequences
- Every compliance finding has a `citations` relation in the database
- The `StandardReference` type carries `isVerified` and `sourceAuthority` fields
- AI agents are instructed to refuse unsupported claims

---

## ADR-004: Versioned REST API

**Date:** 2026-09-24  
**Status:** Accepted

### Decision
All API endpoints are prefixed with `/api/v1/`. Future breaking changes will introduce `/api/v2/`.

### Consequences
- Frontend API client uses the versioned base URL from environment
- Breaking changes can be deployed without breaking existing clients

---

## ADR-005: Centralized Error Handling

**Date:** 2026-09-24  
**Status:** Accepted

### Decision
- `AppError` class carries `statusCode`, `code` (string enum), and `isOperational` flag
- The global `errorHandler` middleware catches all errors
- Zod validation errors are automatically caught and formatted
- Stack traces are never sent to clients in production

### Consequences
- Consistent error envelope across all endpoints
- Safe production error messages
- Development mode exposes additional error details

---

## ADR-006: Design Token System

**Date:** 2026-09-24  
**Status:** Accepted

### Decision
All colors, typography, and spacing are defined as Tailwind custom tokens in `tailwind.config.js`.

Primary palette: warm milky white (`#F8F8F5`) background, clean white cards, dark charcoal text (`#202124`), restrained accent blue (`#1a56db`).

### Consequences
- No raw hex colors scattered in components
- Design system can be updated from one file
- Consistent visual language across all future pages

---

## ADR-007: No BIS Data Fabrication

**Date:** 2026-09-24  
**Status:** Accepted — Non-negotiable

### Decision
The platform must not:
- Scrape BIS content in violation of terms of service
- Create fake Indian Standards with invented numbers
- Hardcode certification requirements not sourced from official documents
- Invent laboratory names, capabilities, or contact information
- Claim to grant or verify BIS certifications

All knowledge base content must reference an authoritative source URL, authority name, retrieval date, and version.

### Consequences
- Knowledge ingestion pipeline (future phase) must include provenance tracking
- `Standard`, `Laboratory`, `Citation` models all carry source tracking fields
- AI agents must be instructed to state uncertainty rather than fabricate
