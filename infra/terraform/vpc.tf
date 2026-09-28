# ==============================================================================
# VPC, Subnets, Routing & Security Groups (Multi-Tier Isolated Architecture)
# ==============================================================================

# ─────────────────────────────────────────────────────────────────────────────
# 1. Virtual Private Cloud (VPC)
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_vpc" "main" {
  cidr_block           = var.vpc_cidr
  enable_dns_support   = true
  enable_dns_hostnames = true

  tags = {
    Name = "bis-${var.environment}-vpc"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# 2. Subnets (2 Availability Zones for High Availability)
# ─────────────────────────────────────────────────────────────────────────────

# Public Subnets (For Application Load Balancer & NAT Gateway)
resource "aws_subnet" "public" {
  count                   = 2
  vpc_id                  = aws_vpc.main.id
  cidr_block              = cidrsubnet(var.vpc_cidr, 8, count.index + 1) # 10.10.1.0/24, 10.10.2.0/24
  availability_zone       = var.availability_zones[count.index]
  map_public_ip_on_launch = true

  tags = {
    Name = "bis-${var.environment}-public-${var.availability_zones[count.index]}"
    Tier = "Public"
  }
}

# Private Application Subnets (For ECS Fargate API & Web containers)
resource "aws_subnet" "private_app" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 11) # 10.10.11.0/24, 10.10.12.0/24
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "bis-${var.environment}-app-${var.availability_zones[count.index]}"
    Tier = "Private-App"
  }
}

# Private Database Subnets (Isolated for Managed PostgreSQL 17)
resource "aws_subnet" "private_db" {
  count             = 2
  vpc_id            = aws_vpc.main.id
  cidr_block        = cidrsubnet(var.vpc_cidr, 8, count.index + 21) # 10.10.21.0/24, 10.10.22.0/24
  availability_zone = var.availability_zones[count.index]

  tags = {
    Name = "bis-${var.environment}-db-${var.availability_zones[count.index]}"
    Tier = "Private-Database"
  }
}

# ─────────────────────────────────────────────────────────────────────────────
# 3. Internet Gateway & NAT Gateway
# ─────────────────────────────────────────────────────────────────────────────
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "bis-${var.environment}-igw"
  }
}

resource "aws_eip" "nat" {
  domain = "vpc"

  tags = {
    Name = "bis-${var.environment}-nat-eip"
  }
}

resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public[0].id

  tags = {
    Name = "bis-${var.environment}-nat-gw"
  }

  depends_on = [aws_internet_gateway.igw]
}

# ─────────────────────────────────────────────────────────────────────────────
# 4. Route Tables & Associations
# ─────────────────────────────────────────────────────────────────────────────

# Public Route Table (Outbound via IGW)
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }

  tags = {
    Name = "bis-${var.environment}-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  count          = 2
  subnet_id      = aws_subnet.public[count.index].id
  route_table_id = aws_route_table.public.id
}

# Private App Route Table (Outbound via NAT Gateway for S3 & External APIs)
resource "aws_route_table" "private_app" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }

  tags = {
    Name = "bis-${var.environment}-app-rt"
  }
}

resource "aws_route_table_association" "private_app" {
  count          = 2
  subnet_id      = aws_subnet.private_app[count.index].id
  route_table_id = aws_route_table.private_app.id
}

# Private Database Route Table (Zero Internet Egress — Airgapped Subnets)
resource "aws_route_table" "private_db" {
  vpc_id = aws_vpc.main.id

  tags = {
    Name = "bis-${var.environment}-db-rt"
  }
}

resource "aws_route_table_association" "private_db" {
  count          = 2
  subnet_id      = aws_subnet.private_db[count.index].id
  route_table_id = aws_route_table.private_db.id
}

# ─────────────────────────────────────────────────────────────────────────────
# 5. Security Groups
# ─────────────────────────────────────────────────────────────────────────────

# Application Load Balancer Security Group
resource "aws_security_group" "alb_sg" {
  name        = "bis-${var.environment}-alb-sg"
  description = "Security group for public facing Application Load Balancer"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow inbound HTTP from internet"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Allow inbound HTTPS from internet"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow outbound to VPC private subnets"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = [var.vpc_cidr]
  }

  tags = {
    Name = "bis-${var.environment}-alb-sg"
  }
}

# ECS Web Frontend Security Group
resource "aws_security_group" "ecs_web_sg" {
  name        = "bis-${var.environment}-web-sg"
  description = "Security group for ECS Web frontend containers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow port 8080 strictly from ALB"
    from_port       = 8080
    to_port         = 8080
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bis-${var.environment}-web-sg"
  }
}

# ECS API Backend Security Group
resource "aws_security_group" "ecs_api_sg" {
  name        = "bis-${var.environment}-api-sg"
  description = "Security group for ECS API backend containers"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow port 5000 strictly from ALB"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.alb_sg.id]
  }

  ingress {
    description     = "Allow port 5000 from Web container (reverse proxy)"
    from_port       = 5000
    to_port         = 5000
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_web_sg.id]
  }

  egress {
    description = "Allow outbound traffic (HTTPS for S3/APIs, PostgreSQL for DB)"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "bis-${var.environment}-api-sg"
  }
}

# Managed PostgreSQL 17 Security Group (Zero Public Ingress)
resource "aws_security_group" "db_sg" {
  name        = "bis-${var.environment}-db-sg"
  description = "Strict security group for PostgreSQL 17 database"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "Allow PostgreSQL port 5432 strictly from API containers"
    from_port       = 5432
    to_port         = 5432
    protocol        = "tcp"
    security_groups = [aws_security_group.ecs_api_sg.id]
  }

  egress {
    description = "No outbound egress required"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = []
  }

  tags = {
    Name = "bis-${var.environment}-db-sg"
  }
}
