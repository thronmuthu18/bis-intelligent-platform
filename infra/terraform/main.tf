# ==============================================================================
# Terraform Main Configuration — BIS Intelligent Platform (Staging Architecture)
# AWS Provider: ap-south-1 (Mumbai) for Indian DPDP Act & Data Sovereignty
# ==============================================================================

terraform {
  required_version = ">= 1.5.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.40"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }

  # Staging backend configuration (configured via CLI backend-config or local state in dev)
  # backend "s3" {
  #   bucket         = "bis-terraform-state-staging"
  #   key            = "staging/terraform.tfstate"
  #   region         = "ap-south-1"
  #   dynamodb_table = "bis-terraform-locks-staging"
  #   encrypt        = true
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "BIS-Intelligent-Platform"
      Environment = var.environment
      ManagedBy   = "Terraform"
      Compliance  = "DPDP-Act-2023"
      Repository  = "https://github.com/bis/intelligent-platform"
    }
  }
}

resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}

data "aws_caller_identity" "current" {}
