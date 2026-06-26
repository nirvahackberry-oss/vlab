output "ecs_task_definition_arns" {
  description = "ECS task definition ARNs by lab type."
  value       = { for lab_type, td in aws_ecs_task_definition.lab : lab_type => td.arn }
}

output "ecr_repository_urls" {
  description = "ECR repository URLs by image key (lab types that share an image use the same repo)."
  value       = { for image_key, repo in aws_ecr_repository.lab_images : image_key => repo.repository_url }
}

output "lab_ecr_image_keys" {
  description = "ECS lab type to ECR image key (e.g. agilemethodology uses the java image)."
  value       = local.lab_ecr_key
}

output "ecr_lab_base_repository_urls" {
  description = "ECR repository URLs for shared build bases (linux=Ubuntu tools, python=3.11-slim, java=Temurin 21)."
  value = {
    linux  = aws_ecr_repository.lab_base_linux.repository_url
    python = aws_ecr_repository.lab_base_python.repository_url
    java   = aws_ecr_repository.lab_base_java.repository_url
  }
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.lab.name
}

output "ecs_cluster_arn" {
  description = "ECS cluster ARN."
  value       = aws_ecs_cluster.lab.arn
}

output "ecs_task_security_group_id" {
  description = "Security group attached to lab Fargate tasks."
  value       = aws_security_group.ecs_tasks.id
}

output "ecs_task_execution_role_arn" {
  description = "IAM role ARN for ECS task execution (ECR pull, logs)."
  value       = aws_iam_role.ecs_task_execution.arn
}

output "ecs_task_role_arn" {
  description = "IAM role ARN attached to running lab tasks."
  value       = aws_iam_role.ecs_task.arn
}

output "private_subnet_ids" {
  description = "Private subnet IDs for lab Fargate tasks."
  value       = aws_subnet.private[*].id
}

output "dynamodb_table_name" {
  description = "DynamoDB table storing active sessions."
  value       = var.dynamodb_table_name
}

output "dynamodb_tables" {
  description = "DynamoDB tables used by the platform."
  value = {
    sessions    = var.dynamodb_table_name
    submissions = var.submissions_table_name
    results     = var.results_table_name
    runs        = var.runs_table_name
  }
}

output "test_cases_bucket" {
  description = "S3 bucket containing lab test case files."
  value       = aws_s3_bucket.test_cases.bucket
}
