resource "aws_scheduler_schedule_group" "lab" {
  name = "${local.name_prefix}-sessions"

  tags = local.common_tags
}

resource "aws_scheduler_schedule" "cleanup_expired" {
  name       = "${local.name_prefix}-cleanup-expired"
  group_name = aws_scheduler_schedule_group.lab.name

  schedule_expression = "rate(5 minutes)"
  flexible_time_window {
    mode = "OFF"
  }

  target {
    arn      = aws_lambda_function.cleanup_expired.arn
    role_arn = aws_iam_role.scheduler_invoke_stop_lambda.arn
    input    = jsonencode({ trigger = "SCHEDULED_CLEANUP" })
  }
}
