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

# ─────────────────────────────────────────────────────────────────────────────
# 3. GitHub Actions OIDC Provider & Deployment Role (Least Privilege)
# ─────────────────────────────────────────────────────────────────────────────

# GitHub Actions OpenID Connect Provider
resource "aws_iam_openid_connect_provider" "github" {
  url            = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]
  thumbprint_list = [
    "6938fd4d98bab03faadb97b34396831e3780aea1",
    "1c5824a8527fc201765f092554703d9b01ee2a9e"
  ]

  tags = {
    Name = "github-actions-oidc-provider"
  }
}

# Trust policy for GitHub Actions OIDC role
data "aws_iam_policy_document" "github_actions_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    condition {
      test     = "StringLike"
      variable = "token.actions.githubusercontent.com:sub"
      values = [
        "repo:${var.github_repo}:environment:staging",
        "repo:thronmuthu18@219131024/bis-intelligent-platform@1392951318:environment:staging",
        "repo:${var.github_repo}:ref:refs/heads/main",
        "repo:thronmuthu18@219131024/bis-intelligent-platform@1392951318:ref:refs/heads/main",
        "repo:thronmuthu18*/bis-intelligent-platform*:environment:staging",
        "repo:thronmuthu18*/bis-intelligent-platform*:ref:refs/heads/main"
      ]
    }
  }
}

# GitHub Actions deployment role
resource "aws_iam_role" "github_actions" {
  name               = "bis-${var.environment}-github-actions-deploy-role"
  assume_role_policy = data.aws_iam_policy_document.github_actions_assume_role.json

  tags = {
    Name = "bis-${var.environment}-github-actions-deploy-role"
  }
}

# Scoped least-privilege policy for CI/CD deployment
resource "aws_iam_policy" "github_actions_deploy" {
  name        = "bis-${var.environment}-github-actions-deploy-policy"
  description = "Scoped least-privilege permissions for GitHub Actions CI/CD deployment"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      # 1. ECR Authentication Token
      {
        Sid    = "ECRAuthToken"
        Effect = "Allow"
        Action = [
          "ecr:GetAuthorizationToken"
        ]
        Resource = "*"
      },
      # 2. ECR Push & Pull for staging repositories
      {
        Sid    = "ECRPushRepositories"
        Effect = "Allow"
        Action = [
          "ecr:BatchCheckLayerAvailability",
          "ecr:GetDownloadUrlForLayer",
          "ecr:GetRepositoryPolicy",
          "ecr:DescribeRepositories",
          "ecr:ListImages",
          "ecr:DescribeImages",
          "ecr:BatchGetImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload",
          "ecr:PutImage"
        ]
        Resource = [
          "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/bis-${var.environment}-api",
          "arn:aws:ecr:${var.aws_region}:${data.aws_caller_identity.current.account_id}:repository/bis-${var.environment}-web"
        ]
      },
      # 3. ECS Task Definition Registration & Describe
      {
        Sid    = "ECSTaskDefinition"
        Effect = "Allow"
        Action = [
          "ecs:RegisterTaskDefinition",
          "ecs:DescribeTaskDefinition"
        ]
        Resource = "*"
      },
      # 4. ECS Service Update, Describe and RunTask
      {
        Sid    = "ECSServiceUpdateAndRunTask"
        Effect = "Allow"
        Action = [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeClusters",
          "ecs:DescribeTasks",
          "ecs:RunTask",
          "ecs:StopTask"
        ]
        Resource = [
          aws_ecs_cluster.main.arn,
          aws_ecs_service.api.id,
          aws_ecs_service.web.id,
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task/${aws_ecs_cluster.main.name}/*",
          "arn:aws:ecs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:task-definition/bis-${var.environment}-*"
        ]
      },
      # 5. PassRole for existing ECS execution and task roles
      {
        Sid    = "PassRoleToECS"
        Effect = "Allow"
        Action = [
          "iam:PassRole"
        ]
        Resource = [
          aws_iam_role.ecs_execution.arn,
          aws_iam_role.ecs_task_api.arn
        ]
        Condition = {
          StringEquals = {
            "iam:PassedToService" = "ecs-tasks.amazonaws.com"
          }
        }
      },
      # 6. ALB & Target Group Describe for Health Check Verification
      {
        Sid    = "ALBDescribe"
        Effect = "Allow"
        Action = [
          "elasticloadbalancing:DescribeLoadBalancers",
          "elasticloadbalancing:DescribeTargetHealth"
        ]
        Resource = "*"
      },
      # 7. VPC & Security Group Describe for ECS RunTask Network Configuration
      {
        Sid    = "EC2NetworkDescribe"
        Effect = "Allow"
        Action = [
          "ec2:DescribeSubnets",
          "ec2:DescribeSecurityGroups"
        ]
        Resource = "*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "github_actions_deploy" {
  role       = aws_iam_role.github_actions.name
  policy_arn = aws_iam_policy.github_actions_deploy.arn
}
