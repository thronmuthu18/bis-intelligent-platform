# ==============================================================================
# Private S3-Compatible Object Storage for Compliance Documents
# Zero Public Access, AES256 Encrypted, Versioned & Lifecycle Governed
# ==============================================================================

# Private S3 Bucket
resource "aws_s3_bucket" "documents" {
  bucket        = "bis-${var.environment}-documents-${random_string.suffix.result}"
  force_destroy = var.environment != "production"

  tags = {
    Name       = "bis-${var.environment}-documents"
    Component  = "Storage"
    Compliance = "DPDP-Act-2023"
  }
}

# Strict Block All Public Access (Mandatory Compliance Control)
resource "aws_s3_bucket_public_access_block" "documents" {
  bucket = aws_s3_bucket.documents.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# Server-Side Encryption at Rest (AES256 SSE-S3)
resource "aws_s3_bucket_server_side_encryption_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    apply_server_side_encryption_by_default {
      sse_algorithm = "AES256"
    }
  }
}

# Bucket Versioning for Audit Trail & Data Loss Prevention
resource "aws_s3_bucket_versioning" "documents" {
  bucket = aws_s3_bucket.documents.id

  versioning_configuration {
    status = "Enabled"
  }
}

# Lifecycle Management for Cost Optimization & Audit Retention
resource "aws_s3_bucket_lifecycle_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  rule {
    id     = "archive-historical-versions"
    status = "Enabled"

    filter {}

    noncurrent_version_transition {
      noncurrent_days = 30
      storage_class   = "STANDARD_IA"
    }

    noncurrent_version_expiration {
      noncurrent_days = 365
    }
  }
}

# CORS Configuration for Direct Presigned Upload/Download Ingress
resource "aws_s3_bucket_cors_configuration" "documents" {
  bucket = aws_s3_bucket.documents.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST", "DELETE", "HEAD"]
    allowed_origins = [var.cors_origin]
    expose_headers  = ["ETag"]
    max_age_seconds = 3600
  }
}
