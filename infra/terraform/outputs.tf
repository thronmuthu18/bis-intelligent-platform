# ==============================================================================
# Terraform Outputs — Staging Infrastructure
# ==============================================================================

output "alb_dns_name" {
  description = "Public DNS name of the Application Load Balancer"
  value       = aws_lb.main.dns_name
}

output "alb_zone_id" {
  description = "Canonical hosted zone ID of the ALB (for Route53 alias records)"
  value       = aws_lb.main.zone_id
}

output "ecs_cluster_name" {
  description = "Name of the ECS cluster"
  value       = aws_ecs_cluster.main.name
}

output "api_service_name" {
  description = "Name of the API ECS service"
  value       = aws_ecs_service.api.name
}

output "web_service_name" {
  description = "Name of the Web ECS service"
  value       = aws_ecs_service.web.name
}

output "rds_endpoint" {
  description = "PostgreSQL 17 database host endpoint (hostname:port)"
  value       = aws_db_instance.postgres.endpoint
}

output "rds_address" {
  description = "PostgreSQL 17 database host address (hostname only)"
  value       = aws_db_instance.postgres.address
}

output "s3_documents_bucket_name" {
  description = "Private S3 bucket name for document intelligence"
  value       = aws_s3_bucket.documents.id
}

output "s3_documents_bucket_arn" {
  description = "ARN of the private documents S3 bucket"
  value       = aws_s3_bucket.documents.arn
}

output "secrets_manager_secret_arn" {
  description = "ARN of the AWS Secrets Manager secret storing application credentials"
  value       = aws_secretsmanager_secret.app_secrets.arn
}
