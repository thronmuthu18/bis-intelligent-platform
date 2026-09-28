# ==============================================================================
# Managed PostgreSQL 17 Database Configuration (Encrypted, Private, Multi-AZ Ready)
# ==============================================================================

# Private Subnet Group across multiple AZs
resource "aws_db_subnet_group" "db" {
  name        = "bis-${var.environment}-db-subnet-group"
  description = "Isolated database subnet group for BIS compliance database"
  subnet_ids  = aws_subnet.private_db[*].id

  tags = {
    Name = "bis-${var.environment}-db-subnet-group"
  }
}

# Parameter Group for PostgreSQL 17 enforcing TLS/SSL
resource "aws_db_parameter_group" "pg17" {
  name        = "bis-${var.environment}-pg17-params"
  family      = "postgres17"
  description = "PostgreSQL 17 parameter group with enforced TLS for BIS compliance"

  parameter {
    name  = "rds.force_ssl"
    value = "1"
  }

  parameter {
    name  = "log_connections"
    value = "1"
  }

  parameter {
    name  = "log_disconnections"
    value = "1"
  }

  tags = {
    Name = "bis-${var.environment}-pg17-params"
  }
}

# Managed PostgreSQL 17 DB Instance
resource "aws_db_instance" "postgres" {
  identifier            = "bis-${var.environment}-pg17"
  engine                = "postgres"
  engine_version        = "17.11"
  instance_class        = var.db_instance_class
  allocated_storage     = var.db_allocated_storage
  max_allocated_storage = var.db_max_allocated_storage
  storage_type          = "gp3"
  storage_encrypted     = true

  db_name  = var.db_name
  username = var.db_username
  password = var.db_password
  port     = 5432

  publicly_accessible    = false
  vpc_security_group_ids = [aws_security_group.db_sg.id]
  db_subnet_group_name   = aws_db_subnet_group.db.name
  parameter_group_name   = aws_db_parameter_group.pg17.name

  multi_az                   = var.environment == "production"
  auto_minor_version_upgrade = true
  copy_tags_to_snapshot      = true

  backup_retention_period = var.environment == "production" ? 30 : 7
  backup_window           = "19:00-20:00"
  maintenance_window      = "Sun:20:30-Sun:21:30"

  deletion_protection       = var.environment == "production"
  skip_final_snapshot       = var.environment != "production"
  final_snapshot_identifier = var.environment == "production" ? "bis-${var.environment}-pg17-final-snapshot" : null

  tags = {
    Name       = "bis-${var.environment}-pg17"
    Component  = "Database"
    Compliance = "DPDP-Act-2023"
  }
}
