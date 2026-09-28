# ==============================================================================
# Terraform Variables — Staging Environment
# All sensitive variables are declared with sensitive = true
# ==============================================================================

variable "environment" {
  type        = string
  description = "Target deployment environment (staging or production)"
  default     = "staging"
  validation {
    condition     = contains(["staging", "production"], var.environment)
    error_message = "Environment must be either 'staging' or 'production'."
  }
}

variable "aws_region" {
  type        = string
  description = "AWS Region for deployment (ap-south-1 Mumbai for Indian Data Sovereignty)"
  default     = "ap-south-1"
}

variable "vpc_cidr" {
  type        = string
  description = "CIDR block for the Virtual Private Cloud"
  default     = "10.10.0.0/16"
}

variable "availability_zones" {
  type        = list(string)
  description = "Target Availability Zones in region"
  default     = ["ap-south-1a", "ap-south-1b"]
}

# ─────────────────────────────────────────────────────────────────────────────
# Database Variables (Managed PostgreSQL 17)
# ─────────────────────────────────────────────────────────────────────────────

variable "db_name" {
  type        = string
  description = "Database name"
  default     = "bis_compliance_staging"
}

variable "db_username" {
  type        = string
  description = "Database master username"
  default     = "bis_admin"
}

variable "db_password" {
  type        = string
  description = "Database master password (minimum 16 characters)"
  sensitive   = true
}

variable "db_instance_class" {
  type        = string
  description = "RDS instance class for staging (e.g. db.t4g.small)"
  default     = "db.t4g.small"
}

variable "db_allocated_storage" {
  type        = number
  description = "Allocated storage in GB"
  default     = 20
}

variable "db_max_allocated_storage" {
  type        = number
  description = "Maximum storage autoscaling in GB"
  default     = 100
}

# ─────────────────────────────────────────────────────────────────────────────
# Application Configuration & Secrets
# ─────────────────────────────────────────────────────────────────────────────

variable "jwt_secret" {
  type        = string
  description = "Cryptographically secure JWT secret key (minimum 32 characters)"
  sensitive   = true
}

variable "cors_origin" {
  type        = string
  description = "Allowed CORS origin header for the backend API"
  default     = "https://staging.bis-intelligent.gov.in"
}

variable "api_image" {
  type        = string
  description = "Docker image URI for API container (e.g. ECR URI or GHCR)"
  default     = "ghcr.io/bis/api:staging-latest"
}

variable "web_image" {
  type        = string
  description = "Docker image URI for Web container (e.g. ECR URI or GHCR)"
  default     = "ghcr.io/bis/web:staging-latest"
}

variable "container_cpu_api" {
  type        = number
  description = "Fargate CPU units for API (256 = 0.25 vCPU, 512 = 0.5 vCPU, 1024 = 1 vCPU)"
  default     = 512
}

variable "container_memory_api" {
  type        = number
  description = "Fargate Memory in MB for API"
  default     = 1024
}

variable "container_cpu_web" {
  type        = number
  description = "Fargate CPU units for Web container"
  default     = 256
}

variable "container_memory_web" {
  type        = number
  description = "Fargate Memory in MB for Web container"
  default     = 512
}

variable "api_service_desired_count" {
  type        = number
  description = "Desired number of API ECS tasks"
  default     = 1
}

variable "web_service_desired_count" {
  type        = number
  description = "Desired number of Web ECS tasks"
  default     = 1
}
