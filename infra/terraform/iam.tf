# ==============================================================================
# IAM Roles & Policies (Principle of Least Privilege)
# ==============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# 1. ECS Task Execution Role (Pull Images, Push Logs, Fetch Secrets)
# ─────────────────────────────────────────────────────────────────────────────
data "aws_iam_policy_document" "ecs_assume_role" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "ecs_execution" {
  name               = "bis-${var.environment}-ecs-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = {
    Name = "bis-${var.environment}-ecs-execution-role"
  }
}

# Attach standard AWS ECS Task Execution policy
resource "aws_iam_role_policy_attachment" "ecs_execution_standard" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

# Policy allowing execution role to read Secrets Manager secrets
resource "aws_iam_policy" "ecs_secrets_access" {
  name        = "bis-${var.environment}-secrets-access"
  description = "Allows ECS agent to read application secrets at task boot"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "secretsmanager:GetSecretValue"
        ]
        Resource = [aws_secretsmanager_secret.app_secrets.arn]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_secrets" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = aws_iam_policy.ecs_secrets_access.arn
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. ECS Task Role for API (Scoped S3 Access Only)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_iam_role" "ecs_task_api" {
  name               = "bis-${var.environment}-ecs-task-api-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_assume_role.json

  tags = {
    Name = "bis-${var.environment}-ecs-task-api-role"
  }
}

# Scoped policy granting API container access strictly to its assigned documents bucket
resource "aws_iam_policy" "s3_documents_access" {
  name        = "bis-${var.environment}-s3-documents-access"
  description = "Scoped S3 access for BIS document intelligence upload/download"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:ListBucket",
          "s3:GetBucketLocation"
        ]
        Resource = [aws_s3_bucket.documents.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:PutObject",
          "s3:DeleteObject"
        ]
        Resource = ["${aws_s3_bucket.documents.arn}/*"]
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "api_s3_access" {
  role       = aws_iam_role.ecs_task_api.name
  policy_arn = aws_iam_policy.s3_documents_access.arn
}
