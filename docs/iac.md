# Infrastructure as Code (IaC) Architecture & Provisioning Guide

This document describes the Terraform Infrastructure as Code (IaC) architecture, component topology, security posture, and lifecycle procedures for the **BIS Intelligent Platform**.

---

## 1. Cloud Provider & Sovereign Compliance

- **Cloud Provider**: Amazon Web Services (AWS)
- **Target Region**: `ap-south-1` (Mumbai, India)
- **Legal & Regulatory Compliance**:
  - **Digital Personal Data Protection (DPDP) Act, 2023**: All citizen, manufacturer, and laboratory audit trails remain strictly stored within Indian sovereign borders.
  - **Bureau of Indian Standards (BIS) Information Security Guidelines**: Zero public database exposure, strict TLS 1.3/1.2 transit encryption, AES-256 storage encryption.

---

## 2. Infrastructure Topology

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                      VPC: 10.10.0.0/16 (ap-south-1)                         │
│                                                                             │
│  ┌───────────────────────────────────────────────────────────────────────┐  │
│  │ Tier 1: Public Subnets (10.10.1.0/24, 10.10.2.0/24)                    │  │
│  │  - Internet Gateway (IGW)                                             │  │
│  │  - NAT Gateway (EIP)                                                  │  │
│  │  - Application Load Balancer (ALB)                                     │  │
│  │    ├─ Port 80 / 443 (Edge TLS Termination)                             │  │
│  │    ├─ /api/*  ──► Forward to ECS API Target Group (Port 5000)         │  │
│  │    └─ Default ──► Forward to ECS Web Target Group (Port 8080)         │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │                                      │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Tier 2: Private Application Subnets (10.10.11.0/24, 10.10.12.0/24)    │  │
│  │  - ECS Fargate Cluster (Container Insights Enabled)                   │  │
│  │    ├─ Web Service (Nginx, UID 101, Port 8080, Read-Only RootFS)       │  │
│  │    └─ API Service (Node 20, UID 1000, Port 5000, Read-Only RootFS)    │  │
│  │  - Outbound via NAT Gateway (For AI APIs, ECR, CloudWatch)            │  │
│  └───────────────────────────────────┬───────────────────────────────────┘  │
│                                      │ (Port 5432 Strictly from API SG)     │
│  ┌───────────────────────────────────▼───────────────────────────────────┐  │
│  │ Tier 3: Isolated Database Subnets (10.10.21.0/24, 10.10.22.0/24)      │  │
│  │  - Managed PostgreSQL 17 (RDS Multi-AZ, Encrypted gp3)                │  │
│  │  - TLS Enforced (rds.force_ssl = 1)                                   │  │
│  │  - Zero Internet Egress / Zero Public Ingress                         │  │
│  └───────────────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────┬──────────────────────────────────────┘
                                       │
            ┌──────────────────────────┴──────────────────────────┐
            ▼                                                     ▼
┌──────────────────────────────────────┐  ┌───────────────────────────────────┐
│ Private S3 Bucket (Compliance Docs)  │  │ AWS Secrets Manager               │
│ - Block All Public Access            │  │ - Encrypted at rest (KMS)         │
│ - AES256 Encryption at Rest          │  │ - Injected into ECS at runtime    │
│ - Versioning & Lifecycle Rules       │  │ - Zero secrets committed to Git   │
└──────────────────────────────────────┘  └───────────────────────────────────┘
```

---

## 3. Terraform Resource Breakdown

| File | Purpose | Key AWS Resources |
|---|---|---|
| [`main.tf`](../infra/terraform/main.tf) | Provider & Backend specification | `aws` provider (5.40+), `random_string` |
| [`variables.tf`](../infra/terraform/variables.tf) | Environment parameterization | Sensitive variable declarations, sizing defaults |
| [`vpc.tf`](../infra/terraform/vpc.tf) | Network isolation & security groups | `aws_vpc`, 6 subnets across 2 AZs, IGW, NAT GW, 4 Security Groups |
| [`rds.tf`](../infra/terraform/rds.tf) | Managed PostgreSQL 17 database | `aws_db_instance`, `aws_db_subnet_group`, `aws_db_parameter_group` |
| [`s3.tf`](../infra/terraform/s3.tf) | Sovereign private document store | `aws_s3_bucket`, `aws_s3_bucket_public_access_block`, encryption |
| [`iam.tf`](../infra/terraform/iam.tf) | Least-privilege IAM roles | `aws_iam_role` (execution & scoped task roles), zero wildcards |
| [`secrets.tf`](../infra/terraform/secrets.tf) | Encrypted secret storage | `aws_secretsmanager_secret`, `aws_secretsmanager_secret_version` |
| [`alb.tf`](../infra/terraform/alb.tf) | Ingress routing & health checking | `aws_lb`, listeners, target groups (`/api/*` and default) |
| [`ecs.tf`](../infra/terraform/ecs.tf) | Container orchestration | `aws_ecs_cluster`, task definitions, `aws_ecs_service`, CloudWatch logs |
| [`outputs.tf`](../infra/terraform/outputs.tf) | Exported endpoints & IDs | ALB DNS, RDS endpoint hostname, S3 bucket name, ECS service names |

---

## 4. Security & Zero-Trust Safeguards

1. **Airgapped Database Tier**: The database subnets (`10.10.21.0/24`, `10.10.22.0/24`) have no route to the Internet Gateway or NAT Gateway. Inbound connections are strictly restricted to the API Security Group on port 5432.
2. **Mandatory Storage Lockdown**: The documents S3 bucket has all four public access blocks enabled (`block_public_acls`, `block_public_policy`, `ignore_public_acls`, `restrict_public_buckets`).
3. **Least-Privilege Task Roles**: The API container role (`aws_iam_role.ecs_task_api`) is granted permissions only to its specific bucket ARN (`s3:GetObject`, `s3:PutObject`, `s3:DeleteObject`, `s3:ListBucket`).
4. **Secret Injection**: Secrets are retrieved directly by the ECS agent via AWS Secrets Manager at task startup (`valueFrom`), preventing credentials from appearing in task definitions or Git history.
5. **Circuit Breaker Rollbacks**: ECS services have `deployment_circuit_breaker { enable = true, rollback = true }`, automatically rolling back failed container updates without human intervention.

---

## 5. Provisioning Workflow (When Cloud Account is Connected)

```bash
# 1. Navigate to Terraform directory
cd infra/terraform

# 2. Copy and configure variables
cp terraform.tfvars.example terraform.tfvars
# Fill in db_password, jwt_secret, and image URIs in terraform.tfvars

# 3. Initialize Terraform plugins
terraform init

# 4. Review planned infrastructure modifications
terraform plan -out=staging.tfplan

# 5. Apply infrastructure changes
terraform apply staging.tfplan

# 6. Retrieve outputs
terraform output alb_dns_name
terraform output rds_endpoint
```
