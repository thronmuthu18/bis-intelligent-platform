# Staging Deployment & Verification Runbook

This guide details the procedures for executing, validating, and rolling back deployments to the **BIS Intelligent Platform** staging environment.

---

## 1. Staging Environment Overview

The staging environment mirrors production architecture with right-sized infrastructure to enable comprehensive pre-production validation:

- **Target Domain**: `https://staging.bis-intelligent.gov.in`
- **API Endpoint**: `https://staging-api.bis-intelligent.gov.in/api/v1`
- **Database**: AWS RDS PostgreSQL 17 (`db.t4g.small` in private subnets)
- **Object Storage**: Private S3 bucket (`bis-staging-documents-*`)
- **Container Runtime**: AWS ECS Fargate (`ap-south-1`)

---

## 2. Pre-Deployment Verification

Before triggering a deployment:
1. Ensure the CI pipeline (`.github/workflows/ci.yml`) passed on the release branch.
2. Confirm all 309 unit, integration, and security tests pass.
3. Verify database migration scripts with `npx prisma migrate status`.

---

## 3. Deployment Procedure

### Automated Deployment via GitHub Actions
Staging deployments can be triggered manually or automatically upon merge to `develop`:

1. Navigate to **Actions** -> **Staging Deployment Pipeline** in the GitHub repository.
2. Select **Run workflow**.
3. Choose whether to execute database migrations (Default: `true`).
4. Choose whether to execute post-deployment smoke tests (Default: `true`).
5. Click **Run workflow**.

### Manual Command-Line Procedure
If executing deployment from an authorized bastion/runner:

```bash
# 1. Apply database migrations (Idempotent and safe)
npx prisma migrate deploy --schema=apps/api/prisma/schema.prisma

# 2. Build and push container images
docker build -t <ECR_REPO>/bis-api:staging-${GIT_SHA} -f apps/api/Dockerfile .
docker build -t <ECR_REPO>/bis-web:staging-${GIT_SHA} -f apps/web/Dockerfile .

docker push <ECR_REPO>/bis-api:staging-${GIT_SHA}
docker push <ECR_REPO>/bis-web:staging-${GIT_SHA}

# 3. Update ECS service to roll out new task definitions
aws ecs update-service --cluster bis-staging-cluster \
  --service bis-staging-api-service --force-new-deployment

aws ecs update-service --cluster bis-staging-cluster \
  --service bis-staging-web-service --force-new-deployment
```

---

## 4. Post-Deployment Smoke Verification

Execute the automated staging smoke test suite:

```bash
# Set staging endpoints
export STAGING_API_URL="https://staging-api.bis-intelligent.gov.in/api/v1"
export STAGING_WEB_URL="https://staging.bis-intelligent.gov.in"

# Execute smoke test script
npm run test:staging-smoke
```

### Probes Evaluated
1. **API Liveness Probe (`/api/v1/health/live`)**: Validates process health and event loop responsiveness.
2. **API Readiness Probe (`/api/v1/health/ready`)**: Performs an active database ping to verify PostgreSQL 17 connectivity without leaking secrets.
3. **Web Frontend Ingress (`/healthz`)**: Validates Nginx web server responsiveness and SPA asset availability.
4. **Public Standards Directory Query (`/api/v1/standards`)**: Verifies read access to Indian Standards metadata.
5. **Consumer Verification Boundary (`/api/v1/consumer/verify/licence`)**: Verifies verification provider response envelopes.
6. **RBAC Security Boundaries (`/api/v1/admin/overview`)**: Confirms protected routes reject unauthenticated requests with `401/403`.
7. **Production Error Masking**: Confirms 404/500 errors omit stack traces and sensitive connection details.

---

## 5. Rollback Procedures

### Container Service Rollback
ECS Fargate services are configured with automated circuit breakers:
```hcl
deployment_circuit_breaker {
  enable   = true
  rollback = true
}
```
If new containers fail health probes during rollout, ECS automatically rolls back to the previous healthy task definition.

To manually roll back to a specific prior deployment:
```bash
aws ecs update-service --cluster bis-staging-cluster \
  --service bis-staging-api-service \
  --task-definition bis-staging-api:<PREVIOUS_REVISION>

aws ecs update-service --cluster bis-staging-cluster \
  --service bis-staging-web-service \
  --task-definition bis-staging-web:<PREVIOUS_REVISION>
```

### Database Rollback
- Since Prisma migrations are forward-only, rollbacks must be accomplished by deploying a forward-fixing migration using `prisma migrate deploy`.
- For staging environments requiring a hard reset, point-in-time recovery (PITR) can be used to restore the RDS instance to a prior timestamp.
