# ==============================================================================
# ECS Fargate Cluster, Task Definitions, and Services
# Non-Root, Read-Only Root Filesystem, Hardened Fargate Deployment
# ==============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# 1. ECS Cluster & CloudWatch Logs
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_ecs_cluster" "main" {
  name = "bis-${var.environment}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = {
    Name = "bis-${var.environment}-cluster"
  }
}

resource "aws_cloudwatch_log_group" "api" {
  name              = "/ecs/bis-${var.environment}-api"
  retention_in_days = var.environment == "production" ? 90 : 14

  tags = {
    Name = "bis-${var.environment}-api-logs"
  }
}

resource "aws_cloudwatch_log_group" "web" {
  name              = "/ecs/bis-${var.environment}-web"
  retention_in_days = var.environment == "production" ? 90 : 14

  tags = {
    Name = "bis-${var.environment}-web-logs"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Task Definitions
# ─────────────────────────────────────────────────────────────────────────────

# API Backend Task Definition
resource "aws_ecs_task_definition" "api" {
  family                   = "bis-${var.environment}-api"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.container_cpu_api)
  memory                   = tostring(var.container_memory_api)
  execution_role_arn       = aws_iam_role.ecs_execution.arn
  task_role_arn            = aws_iam_role.ecs_task_api.arn

  container_definitions = jsonencode([
    {
      name                   = "api"
      image                  = var.api_image
      essential              = true
      user                   = "1000"
      readonlyRootFilesystem = true
      portMappings = [
        {
          containerPort = 5000
          hostPort      = 5000
          protocol      = "tcp"
        }
      ]
      environment = [
        { name = "NODE_ENV", value = var.environment },
        { name = "PORT", value = "5000" },
        { name = "CORS_ORIGIN", value = var.cors_origin },
        { name = "STORAGE_PROVIDER", value = "s3" },
        { name = "STORAGE_BUCKET", value = aws_s3_bucket.documents.id },
        { name = "STORAGE_REGION", value = var.aws_region },
        { name = "STORAGE_FORCE_PATH_STYLE", value = "false" },
        { name = "AI_PROVIDER", value = "mock" },
        { name = "VERIFICATION_PROVIDER", value = "mock" },
        { name = "JOB_QUEUE_PROVIDER", value = "memory" },
        { name = "NOTIFICATION_CHANNELS", value = "in_app" }
      ]
      secrets = [
        {
          name      = "DATABASE_URL"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:DATABASE_URL::"
        },
        {
          name      = "JWT_SECRET"
          valueFrom = "${aws_secretsmanager_secret.app_secrets.arn}:JWT_SECRET::"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.api.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "api"
        }
      }
    }
  ])

  tags = {
    Name = "bis-${var.environment}-api-task"
  }
}

# Web Frontend Task Definition
resource "aws_ecs_task_definition" "web" {
  family                   = "bis-${var.environment}-web"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(var.container_cpu_web)
  memory                   = tostring(var.container_memory_web)
  execution_role_arn       = aws_iam_role.ecs_execution.arn

  container_definitions = jsonencode([
    {
      name                   = "web"
      image                  = var.web_image
      essential              = true
      user                   = "101"
      readonlyRootFilesystem = true
      portMappings = [
        {
          containerPort = 8080
          hostPort      = 8080
          protocol      = "tcp"
        }
      ]
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          "awslogs-group"         = aws_cloudwatch_log_group.web.name
          "awslogs-region"        = var.aws_region
          "awslogs-stream-prefix" = "web"
        }
      }
    }
  ])

  tags = {
    Name = "bis-${var.environment}-web-task"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. ECS Services (Rolling Update Deployment & Circuit Breaker)
# ─────────────────────────────────────────────────────────────────────────────

# API Backend Service
resource "aws_ecs_service" "api" {
  name            = "bis-${var.environment}-api-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.api.arn
  desired_count   = var.api_service_desired_count
  launch_type     = "FARGATE"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_api_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.api.arn
    container_name   = "api"
    container_port   = 5000
  }

  depends_on = [aws_lb_listener_rule.api_routing]

  tags = {
    Name = "bis-${var.environment}-api-service"
  }
}

# Web Frontend Service
resource "aws_ecs_service" "web" {
  name            = "bis-${var.environment}-web-service"
  cluster         = aws_ecs_cluster.main.id
  task_definition = aws_ecs_task_definition.web.arn
  desired_count   = var.web_service_desired_count
  launch_type     = "FARGATE"

  deployment_circuit_breaker {
    enable   = true
    rollback = true
  }

  network_configuration {
    subnets          = aws_subnet.private_app[*].id
    security_groups  = [aws_security_group.ecs_web_sg.id]
    assign_public_ip = false
  }

  load_balancer {
    target_group_arn = aws_lb_target_group.web.arn
    container_name   = "web"
    container_port   = 8080
  }

  depends_on = [aws_lb_listener.http]

  tags = {
    Name = "bis-${var.environment}-web-service"
  }
}
