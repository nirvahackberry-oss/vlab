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
resource "aws_cloudwatch_event_rule" "ecs_task_stopped" {
  name        = "${local.name_prefix}-ecs-task-stopped"
  description = "Triggered when an ECS task in the lab cluster stops"

  event_pattern = jsonencode({
    source      = ["aws.ecs"]
    detail-type = ["ECS Task State Change"]
    detail = {
      clusterArn = [aws_ecs_cluster.lab.arn]
      lastStatus = ["STOPPED"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "process_task_result" {
  rule      = aws_cloudwatch_event_rule.ecs_task_stopped.name
  target_id = "ProcessTaskResult"
  arn       = aws_lambda_function.process_task_result.arn
}

resource "aws_lambda_permission" "eventbridge_process_task_result" {
  statement_id  = "AllowExecutionFromEventBridge"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_task_result.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ecs_task_stopped.arn
}
