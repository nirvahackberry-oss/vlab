output "ecs_task_definition_arns" {
  description = "ECS task definition ARNs by lab type."
  value       = { for lab_type, td in aws_ecs_task_definition.lab : lab_type => td.arn }
}

output "api_gateway_url" {
  description = "HTTP API invoke URL."
  value       = aws_apigatewayv2_api.lab.api_endpoint
}

output "ecr_repository_urls" {
  description = "ECR repository URLs by lab type."
  value       = { for lab_type, repo in aws_ecr_repository.lab_images : lab_type => repo.repository_url }
}

output "ecs_cluster_name" {
  description = "ECS cluster name."
  value       = aws_ecs_cluster.lab.name
}

output "dynamodb_table_name" {
  description = "DynamoDB table storing active sessions."
  value       = aws_dynamodb_table.sessions.name
}

output "dynamodb_tables" {
  description = "DynamoDB tables used by the platform."
  value = {
    sessions    = aws_dynamodb_table.sessions.name
    submissions = aws_dynamodb_table.submissions.name
    results     = aws_dynamodb_table.results.name
  }
}

output "lambda_arns" {
  description = "Lambda ARNs for lab control plane."
  value = {
    start_lab       = aws_lambda_function.start_lab.arn
    stop_lab        = aws_lambda_function.stop_lab.arn
    execute_code    = aws_lambda_function.execute_code.arn
    submit_code     = aws_lambda_function.submit_code.arn
    grade_lab       = aws_lambda_function.grade_lab.arn
    cleanup_expired = aws_lambda_function.cleanup_expired.arn
    get_result      = aws_lambda_function.get_result.arn
  }
}

output "test_cases_bucket" {
  description = "S3 bucket containing lab test case files."
  value       = aws_s3_bucket.test_cases.bucket
}

output "alb_dns_name" {
  description = "Optional ALB DNS name."
  value       = var.enable_alb ? aws_lb.lab[0].dns_name : null
}
