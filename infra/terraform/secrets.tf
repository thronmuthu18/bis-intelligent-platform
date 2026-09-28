# ==============================================================================
# AWS Secrets Manager — Secure Key Storage & Injection
# Secrets are managed securely and injected at runtime without committing values
# ==============================================================================

resource "aws_secretsmanager_secret" "app_secrets" {
  name                    = "bis/${var.environment}/app-secrets-${random_string.suffix.result}"
  description             = "Runtime credentials and cryptographic keys for BIS platform"
  recovery_window_in_days = var.environment == "production" ? 30 : 0

  tags = {
    Name       = "bis-${var.environment}-secrets"
    Compliance = "DPDP-Act-2023"
  }
}

resource "aws_secretsmanager_secret_version" "app_secrets_val" {
  secret_id = aws_secretsmanager_secret.app_secrets.id

  secret_string = jsonencode({
    DATABASE_URL = "postgresql://${var.db_username}:${var.db_password}@${aws_db_instance.postgres.endpoint}/${var.db_name}?sslmode=require&schema=public"
    JWT_SECRET   = var.jwt_secret
  })
}
