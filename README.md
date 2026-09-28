# BIS Intelligent Platform

**AI-powered Intelligent Assistant for Indian Standards and BIS Services**

| | |
|---|---|
| **Project** | SIH26107 |
| **Organization** | Ministry of Consumer Affairs, Food & Public Distribution |
| **Department** | Department of Consumer Affairs (DoCA) |
| **Current Phase** | **Phase 11 — Consumer Services & Hallmarking Intelligence (COMPLETED)** |

---

## Project Overview

The BIS Intelligent Platform is a professional, source-backed compliance intelligence system that helps industries and consumers navigate Indian Standards, BIS certification schemes, mandatory Quality Control Orders (QCOs), testing parameters, laboratory discovery, document intelligence, compliance journey automation, and consumer verification services.

> **Important Compliance Clarification:**  
> This knowledge and intelligence layer provides explainable decision-support and candidate recommendations. It does **NOT** itself determine BIS certification, allocate laboratories, issue statutory compliance approval, or grant official BIS conformity marks. All recommendations require formal user verification and official BIS submission.

---

## Consumer Services & Hallmarking Intelligence Architecture (Phase 11)

```text
MANUFACTURER / INDUSTRY (Phases 0–10)           CITIZEN / CONSUMER (Phase 11)
               ↓                                               ↓
  Compliance Automation & Journey                Consumer Intelligence Hub (/consumer)
               ↓                                               ↓
  - Multi-standard journey orchestration         - BIS Licence Verification (CM/L & CRS)
  - Statutory application dossier                - HUID 6-digit Hallmark Verification
  - Proactive regulatory change alerts           - Assaying & Hallmarking Centres (AHC)
  - Document & STI testing intelligence          - Educational Guides (IS 1417 / IS 2112)
                                                 - Plain-Language Standards Explanations
                                                 - Official Grievance Redressal Guidance
                                                 - Saved Verification History (IDOR protected)
                                                               ↓
                                           Shared Traceable Source Repository
                                   (SourceDocument, KnowledgeChunks, Audit Logs)
```

---

## Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | React 18, Vite, TypeScript (strict), Tailwind CSS |
| **Backend** | Node.js 22, Express 4, TypeScript (strict) |
| **Database** | PostgreSQL, pgvector extension, Prisma ORM |
| **Vector Embeddings** | Server-side provider abstraction (`OpenAI text-embedding-3-small`, `Gemini text-embedding-004`, `MockEmbeddingProvider` for tests/offline) |
| **Storage Abstraction** | `DocumentStorageProvider` (`LocalPrivateStorageProvider`, S3/GCS ready) |
| **Extraction & OCR** | Multi-engine router, `PdfTextExtractor`, `OcrExtractor` with page citations |
| **Verification Providers** | `HallmarkVerificationProvider` (`OfficialSourceProvider`, `MockVerificationProvider`) |
| **Authentication** | JWT (HttpOnly, Secure Cookie), bcrypt password hashing |
| **Security & RBAC** | Multi-tenant ownership enforcement, Role guards (`USER`, `DATA_MANAGER`, `ADMIN`), Allowlisted official sources, Rate limiting |
| **Testing (API)** | Vitest, Supertest (11 suites, 145 tests) |
| **Testing (Web)** | Vitest, React Testing Library (10 suites, 59 tests) |
| **Total Tests** | **204 passing tests (100% pass rate)** |
| **Shared Types** | `@bis/shared` (Monorepo npm workspace) |

---

## Consumer API Endpoints (`/api/v1/consumer`)

| Method | Endpoint | Auth | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/consumer/services` | Optional | Get catalog of official citizen services |
| `GET` | `/api/v1/consumer/services/:serviceId` | Optional | Get specific citizen service details |
| `GET` | `/api/v1/consumer/standards/search` | Optional | Plain-language Indian Standards search with 5-part explanation |
| `POST` | `/api/v1/consumer/licence/verify` | Optional | Verify BIS CM/L or CRS licence number against authoritative source |
| `POST` | `/api/v1/consumer/huid/verify` | Optional | Verify 6-digit Hallmark Unique Identification (HUID) code |
| `GET` | `/api/v1/consumer/hallmarking-centres` | Optional | Discover and filter recognized Assaying & Hallmarking Centres (AHC) |
| `GET` | `/api/v1/consumer/hallmarking-centres/:id` | Optional | Get single Assaying & Hallmarking Centre details |
| `GET` | `/api/v1/consumer/hallmarking/education` | Optional | Hallmarking concepts, IS 1417/IS 2112 grades, 3 mandatory marks |
| `GET` | `/api/v1/consumer/guidance/:serviceType` | Optional | Step-by-step citizen grievance and complaint guidance with helplines |
| `GET` | `/api/v1/consumer/verifications` | Required | Retrieve authenticated user's saved verification history |
| `DELETE` | `/api/v1/consumer/verifications/:id` | Required | Delete saved verification history record (IDOR protected) |

---

## Local Development & Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14.0 (with `vector` extension support)

### 2. Environment Configuration
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

### 3. Database Migration & Seed
```bash
# Generate Prisma client
npm --prefix apps/api run db:generate

# Push schema to PostgreSQL
npx prisma db push --schema=apps/api/prisma/schema.prisma

# Seed verified BIS standards, schemes, manuals, & embeddings
npm --prefix apps/api run db:seed
```

### 4. Running Locally
```bash
# Start backend API (http://localhost:5000)
npm run dev:api

# Start frontend web app (http://localhost:5173)
npm run dev:web
```

### 5. Running Quality Gates & Test Suites
```bash
# Run all tests across backend and frontend (204 tests)
npm test

# Run TypeScript typecheck (0 errors across monorepo)
npm run typecheck

# Run linter (0 errors)
npm run lint

# Build production bundles
npm run build
```

---

## Phase Roadmap

| Phase | Title | Status | Description |
|---|---|---|---|
| **Phase 0** | Foundation & Architecture | ✅ Completed | Monorepo structure, Prisma, Express, React, Vite, shared packages |
| **Phase 1** | Professional UI System & Shell | ✅ Completed | Design tokens, layouts, navigation, accessibility, responsive shell |
| **Phase 2** | Authentication & User Management | ✅ Completed | JWT session in HttpOnly cookie, registration, login, protected routes |
| **Phase 3** | Product Foundation & Workspace Data Model | ✅ Completed | Real PostgreSQL Product CRUD, IDOR ownership security, workspace UI |
| **Phase 4** | BIS Knowledge Layer / Official Source Foundation | ✅ Completed | Authoritative BIS standards schema, provenance tracking, QCO mappings, search API, UI explorer |
| **Phase 5** | Hybrid Search + RAG Foundation | ✅ Completed | pgvector chunks, server embedding abstraction, hybrid ranking, exact IS boost, RAG context builder |
| **Phase 6** | Product Intelligence & Standard Matching | ✅ Completed | Structured product attribute matching, deterministic candidate ranking, source-grounded match reasons, user review confirmation |
| **Phase 7** | Certification Intelligence & Scheme Recommendation | ✅ Completed | Conformity assessment pathway determination (Scheme-I ISI mark, Scheme-II CRS, Scheme-IV), statutory fee models, documentation checklists, application requirements |
| **Phase 8** | Testing Intelligence & Laboratory Mapping | ✅ Completed | STI testing parameters, essential factory equipment & calibration checklist, accredited/recognized laboratory discovery & capability matching, user shortlist/selection workflow |
| **Phase 9** | Document Intelligence | ✅ Completed | Multi-format upload, private storage abstraction, PDF/OCR extraction with page citations, automated classification, Phase 7/8 requirement mapping, completeness engine, human verification |
| **Phase 10** | Compliance Automation & Journey Orchestration | ✅ Completed | Multi-standard journey orchestration, automated application dossier compiler, proactive regulatory change alerts, step-by-step compliance execution engine |
| **Phase 11** | Consumer Services & Hallmarking Intelligence | ✅ Completed | Dedicated consumer layer, BIS licence verification, 6-digit HUID verification, hallmarking education (3 marks), AHC centre discovery, citizen grievance guidance, saved history |
| **Phase 12** | Multilingual & Accessibility Intelligence | ⏳ Planned | Tamil / English / Hindi and additional supported languages, multilingual RAG, WCAG 2.1 AA accessibility |

10. **`ProductStandardAnalysis`**: Standard matching analysis run snapshot with `inputHash` caching.
11. **`ProductStandardMatch`**: Ranked standard candidate matches with explainable `reasons` and source `evidence` JSON.
12. **`ProductStandardReview`**: Non-destructive user review state for candidate standards (`CONFIRMED`, `REJECTED`, `NEEDS_REVIEW`).
13. **`ProductCertificationAnalysis`**: Certification intelligence snapshot with `inputHash` caching.
14. **`ProductSchemeRecommendation`**: Candidate schemes with relevance levels, internal confidence, and reasons.
15. **`ProductSchemeReview`**: Human-in-the-loop user review for certification schemes.
16. **`CertificationFeeEstimate`**: Statutory application/processing/inspection fees and variable testing disclosures.
17. **`ProductDocumentationChecklistItem`**: Categorized statutory document checklist.
18. **`ProductApplicationRequirementItem`**: Application forms and portal entry points (Manakonline, CRS Portal).
19. **`ProductQcoInformationItem`**: Gazetted QCO orders associated with the certification pathway.
20. **`ProductTestingAnalysis`**: Testing intelligence snapshot with `inputHash` caching (`readinessStatus`, `summary`, `blockers`, `nextSteps`).
21. **`ProductTestRequirement`**: Structured test parameters, clauses, methods, categories, limits, units, applicability (`FACTORY`, `EXTERNAL_LAB`, `BOTH`).
22. **`ProductTestEquipment`**: Essential in-house factory testing equipment checklist with required statuses.
23. **`ProductCalibrationRequirement`**: Calibration intervals, master instruments, and NABL/NPL traceability requirements.
24. **`ProductExternalLabRequirement`**: Scheme-specific external laboratory protocol requirements.
25. **`Laboratory`**: Verified laboratory registry with address, contact, recognition type (`isBisLab`, `isNabl`), and provenance.
26. **`LaboratoryCapability`**: Laboratory scope mapping linking standards, test names, accreditation status, and recognition status.
27. **`ProductLaboratoryReview`**: User laboratory shortlist and selection decisions (`SHORTLISTED`, `SELECTED`, `REJECTED`, `NEEDS_REVIEW`).
28. **`IngestionRun`**: Complete audit run log tracking records processed, created, updated, skipped, and errors.
29. **`ProductDocument`**: Private compliance document records with classification, extraction status, verification status, and versioning.
30. **`DocumentPageEvidence`**: Page-level compliance claims with exact page numbers, source text excerpts, and confidence scores.
31. **`DocumentStructuredExtraction`**: Normalized domain parameters (laboratory, report number, dates, standards, product/model, pass/fail status).
32. **`DocumentChecklistMatch`**: Traceable mappings against Phase 7 statutory documentation checklist requirements.
33. **`DocumentTestMatch`**: Verifiable mappings against Phase 8 testing parameters and methods.
34. **`ProductDocumentCompletenessAnalysis`**: Explainable document completeness score (0-100), status, blockers, and next steps.

---

## API Endpoints

Base URL: `http://localhost:5000/api/v1`

### Document Intelligence (`/api/v1/products`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/products/:id/documents` | Yes | Secure document upload with file validation, text extraction, OCR, classification, and requirement mapping |
| `GET` | `/api/v1/products/:id/documents` | Yes | List ingested compliance documents for product (with type and status filters) |
| `GET` | `/api/v1/products/:id/documents/completeness` | Yes | Calculate transparent platform document readiness score (0-100) and blockers |
| `GET` | `/api/v1/products/:id/documents/requirements` | Yes | List document-to-statutory requirement mappings |
| `GET` | `/api/v1/products/:id/documents/:documentId` | Yes | Retrieve full document details, structured extractions, and page citations |
| `POST` | `/api/v1/products/:id/documents/:documentId/verify` | Yes | Submit human verification decision (`VERIFIED`, `NEEDS_REVIEW`, `REJECTED`) |
| `DELETE` | `/api/v1/products/:id/documents/:documentId` | Yes | Delete compliance document and associated extracted evidence |
| `GET` | `/api/v1/products/:id/documents/:documentId/evidence` | Yes | Retrieve page-level citations and source text excerpts for document |
| `GET` | `/api/v1/products/:id/documents/:documentId/download` | Yes | Securely download or stream document with signed authorization |

### Testing & Laboratory Intelligence (`/api/v1/products`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/products/:id/testing/analyze` | Yes | Run testing intelligence analysis with SHA-256 caching (`forceRefresh: boolean`) |
| `GET` | `/api/v1/products/:id/testing` | Yes | Retrieve latest completed testing analysis for product |
| `GET` | `/api/v1/products/:id/testing/requirements` | Yes | Retrieve test requirements with category/status/standard filters |
| `GET` | `/api/v1/products/:id/testing/laboratories` | Yes | Retrieve capability-matched laboratories with location/recognition filters |
| `POST` | `/api/v1/products/:id/testing/laboratories/reviews` | Yes | Save user laboratory review decision (`SHORTLISTED`, `SELECTED`, `REJECTED`, `NEEDS_REVIEW`) |
| `GET` | `/api/v1/products/:id/testing/laboratories/reviews` | Yes | Retrieve all user laboratory review decisions for product |

### Certification Intelligence & Scheme Recommendation (`/api/v1/products`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/products/:id/certification/analyze` | Yes | Run certification intelligence analysis with SHA-256 caching (`forceRefresh: boolean`) |
| `GET` | `/api/v1/products/:id/certification` | Yes | Retrieve latest completed certification intelligence analysis for product |
| `GET` | `/api/v1/products/:id/certification/schemes/:schemeId` | Yes | Retrieve detailed scheme pathway, documentation, fees, and STI requirements |
| `POST` | `/api/v1/products/:id/certification/reviews` | Yes | Submit user confirmation/review decision on candidate scheme |
| `GET` | `/api/v1/products/:id/certification/reviews` | Yes | Retrieve user review history on candidate schemes for product |

### Product Intelligence & Standard Matching (`/api/v1/products`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/products/:id/intelligence/analyze` | Yes | Execute standard matching analysis with SHA-256 caching (`forceRefresh: boolean`) |
| `GET` | `/api/v1/products/:id/intelligence/analysis` | Yes | Retrieve latest cached standard matching analysis for product |
| `POST` | `/api/v1/products/:id/intelligence/reviews` | Yes | Save user confirmation/review decision on candidate standard |
| `GET` | `/api/v1/products/:id/intelligence/reviews` | Yes | Retrieve user review history on candidate standards for product |
| `GET` | `/api/v1/products/:id/attributes` | Yes | List structured product attributes with normalized values |
| `POST` | `/api/v1/products/:id/attributes` | Yes | Upsert structured technical product attributes |

### Standards Search & Retrieval (`/api/v1/standards`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `GET` | `/api/v1/standards/search` | Yes | Hybrid search combining lexical & pgvector retrieval (`mode=hybrid\|keyword\|semantic`) |
| `GET` | `/api/v1/standards` | Yes | List Indian Standards with pagination and sector/status filters |
| `GET` | `/api/v1/standards/:id` | Yes | Retrieve full standard details with editions, amendments, QCOs, manuals |
| `GET` | `/api/v1/standards/:id/versions` | Yes | Retrieve historical editions of a standard |
| `GET` | `/api/v1/standards/:id/amendments` | Yes | Retrieve official amendments of a standard |
| `GET` | `/api/v1/standards/:id/qcos` | Yes | Retrieve Quality Control Orders applicable to a standard |
| `GET` | `/api/v1/standards/:id/manuals` | Yes | Retrieve Product Manuals / STI documents |

### RAG Retrieval & Knowledge Management (`/api/v1/knowledge`)
| Method | Endpoint | Auth Required | Permissions | Purpose |
|---|---|---|---|---|
| `POST` | `/api/v1/knowledge/retrieve` | Yes | `USER`, `DATA_MANAGER`, `ADMIN` | Generate source-grounded RAG context with numbered citations |
| `GET` | `/api/v1/knowledge/embeddings/status` | Yes | `DATA_MANAGER`, `ADMIN` | View embedding indexing counts and active model metadata |
| `POST` | `/api/v1/knowledge/embeddings/reindex` | Yes | `DATA_MANAGER`, `ADMIN` strictly | Trigger background incremental re-indexing of knowledge chunks |
| `GET` | `/api/v1/knowledge/sources` | Yes | `USER`, `DATA_MANAGER`, `ADMIN` | List registered official BIS & government sources |
| `GET` | `/api/v1/knowledge/ingestion-runs` | Yes | `USER`, `DATA_MANAGER`, `ADMIN` | List historical knowledge ingestion audit runs |
| `POST` | `/api/v1/knowledge/ingest` | Yes | `DATA_MANAGER`, `ADMIN` strictly | Trigger verified ingestion run for registered source |

### Products (`/api/v1/products`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/products` | Yes | Create product owned by authenticated user |
| `GET` | `/api/v1/products` | Yes | List all products owned by authenticated user |
| `GET` | `/api/v1/products/stats` | Yes | Aggregate dashboard metric counts for user's products |
| `GET` | `/api/v1/products/:id` | Yes | Fetch single product by ID (Strict ownership enforced) |
| `PATCH` | `/api/v1/products/:id` | Yes | Update product details (Strict ownership enforced) |
| `DELETE` | `/api/v1/products/:id` | Yes | Safely archive product (Strict ownership enforced) |

### Authentication (`/api/v1/auth`)
| Method | Endpoint | Auth Required | Purpose |
|---|---|---|---|
| `POST` | `/api/v1/auth/register` | No | Creates new user account |
| `POST` | `/api/v1/auth/login` | No | Authenticates user and issues HttpOnly cookie |
| `POST` | `/api/v1/auth/logout` | Yes | Clears authentication session cookie |
| `GET` | `/api/v1/auth/me` | Yes | Returns current authenticated user profile |

---

## Local Development & Setup

### 1. Prerequisites
- Node.js >= 18.0.0
- PostgreSQL >= 14.0 (with `vector` extension support)

### 2. Environment Configuration
Create `apps/api/.env`:
```env
PORT=5000
NODE_ENV=development
DATABASE_URL="postgresql://postgres:password@localhost:5432/bis_compliance?schema=public"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
JWT_EXPIRES_IN="7d"
FRONTEND_URL="http://localhost:5173"

# Phase 5 Embedding Configuration (Optional: defaults to built-in deterministic mock)
EMBEDDING_PROVIDER="openai" # or "gemini" or "mock"
EMBEDDING_MODEL="text-embedding-3-small"
OPENAI_API_KEY="sk-..." # Only if EMBEDDING_PROVIDER=openai

# Optional Hybrid Search Weights (Defaults: 0.45 lexical, 0.55 semantic)
HYBRID_LEXICAL_WEIGHT=0.45
HYBRID_SEMANTIC_WEIGHT=0.55
```

Create `apps/web/.env.local`:
```env
VITE_API_BASE_URL="http://localhost:5000/api/v1"
```

*Note: Embedding API keys are kept strictly on the backend and are NEVER exposed to the frontend/Vite client.*

### 3. Database Migration & Verified Seed
```bash
# Generate Prisma client
npm --prefix apps/api run db:generate

# Push schema to PostgreSQL
npx prisma db push --schema=apps/api/prisma/schema.prisma

# Seed verified BIS standards, schemes, manuals, & embeddings
npm --prefix apps/api run db:seed
```

### 4. Running Locally
```bash
# Start backend API (http://localhost:5000)
npm run dev:api

# Start frontend web app (http://localhost:5173)
npm run dev:web
```

### 5. Running Quality Gates & Test Suites
```bash
# Run all tests across backend and frontend (138 tests)
npm test

# Run TypeScript typecheck (0 errors across monorepo)
npm run typecheck

# Run linter (0 errors)
npm run lint

# Build production bundles
npm run build
```

---

## Phase Roadmap

| Phase | Title | Status | Description |
|---|---|---|---|
| **Phase 0** | Foundation & Architecture | ✅ Completed | Monorepo structure, Prisma, Express, React, Vite, shared packages |
| **Phase 1** | Professional UI System & Shell | ✅ Completed | Design tokens, layouts, navigation, accessibility, responsive shell |
| **Phase 2** | Authentication & User Management | ✅ Completed | JWT session in HttpOnly cookie, registration, login, protected routes |
| **Phase 3** | Product Foundation & Workspace Data Model | ✅ Completed | Real PostgreSQL Product CRUD, IDOR ownership security, workspace UI |
| **Phase 4** | BIS Knowledge Layer / Official Source Foundation | ✅ Completed | Authoritative BIS standards schema, provenance tracking, QCO mappings, search API, UI explorer |
| **Phase 5** | Hybrid Search + RAG Foundation | ✅ Completed | pgvector chunks, server embedding abstraction, hybrid ranking, exact IS boost, RAG context builder |
| **Phase 6** | Product Intelligence & Standard Matching | ✅ Completed | Structured product attribute matching, deterministic candidate ranking, source-grounded match reasons, user review confirmation |
| **Phase 7** | Certification Intelligence & Scheme Recommendation | ✅ Completed | Conformity assessment pathway determination (Scheme-I ISI mark, Scheme-II CRS, Scheme-IV), statutory fee models, documentation checklists, application requirements |
| **Phase 8** | Testing Intelligence & Laboratory Mapping | ✅ Completed | STI testing parameters, essential factory equipment & calibration checklist, accredited/recognized laboratory discovery & capability matching, user shortlist/selection workflow |
| **Phase 9** | Document Intelligence | ✅ Completed | Multi-format upload, private storage abstraction, PDF/OCR extraction with page citations, automated classification, Phase 7/8 requirement mapping, completeness engine, human verification |
| **Phase 10** | Compliance Automation & Journey Orchestration | ⏳ Next Phase | Multi-standard journey orchestration, automated application dossier compiler, proactive alerts, workflow automation |
| **Phase 11** | Consumer Services & Hallmarking | ⏳ Planned | HUID verification, CRS consumer lookups, grievance & authenticity assistance |

