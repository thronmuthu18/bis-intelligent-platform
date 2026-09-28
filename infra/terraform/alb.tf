# ==============================================================================
# Application Load Balancer (ALB), Listeners, and Target Groups
# Routes /api/* traffic to API containers and default traffic to Web containers
# ==============================================================================

# Public Application Load Balancer
resource "aws_lb" "main" {
  name               = "bis-${var.environment}-alb"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = aws_subnet.public[*].id

  enable_deletion_protection = var.environment == "production"

  tags = {
    Name = "bis-${var.environment}-alb"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Target Groups (IP Target Type for ECS Fargate awsvpc Mode)
# ─────────────────────────────────────────────────────────────────────────────

# Web Target Group (Port 8080)
resource "aws_lb_target_group" "web" {
  name        = "bis-${var.environment}-tg-web"
  port        = 8080
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/healthz"
    port                = "8080"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name = "bis-${var.environment}-tg-web"
  }
}

# API Target Group (Port 5000)
resource "aws_lb_target_group" "api" {
  name        = "bis-${var.environment}-tg-api"
  port        = 5000
  protocol    = "HTTP"
  vpc_id      = aws_vpc.main.id
  target_type = "ip"

  health_check {
    enabled             = true
    path                = "/api/v1/health/live"
    port                = "5000"
    protocol            = "HTTP"
    interval            = 30
    timeout             = 5
    healthy_threshold   = 2
    unhealthy_threshold = 3
    matcher             = "200"
  }

  tags = {
    Name = "bis-${var.environment}-tg-api"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# Listeners & Path-Based Routing Rules
# ─────────────────────────────────────────────────────────────────────────────

# HTTP Listener (Port 80)
resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

# Listener Rule: Forward /api/* traffic to API Target Group
resource "aws_lb_listener_rule" "api_routing" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 10

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}
