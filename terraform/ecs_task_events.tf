resource "aws_cloudwatch_event_rule" "ecs_task_stopped" {
  name        = "${local.name_prefix}-ecs-task-stopped"
  description = "Capture ECS task STOPPED events to persist run output."

  event_pattern = jsonencode({
    source      = ["aws.ecs"],
    detail-type = ["ECS Task State Change"],
    detail = {
      clusterArn = [aws_ecs_cluster.lab.arn],
      lastStatus = ["STOPPED"]
    }
  })

  tags = local.common_tags
}

resource "aws_cloudwatch_event_target" "ecs_task_stopped_to_processor" {
  rule      = aws_cloudwatch_event_rule.ecs_task_stopped.name
  target_id = "process-task-result"
  arn       = aws_lambda_function.process_task_result.arn
}

resource "aws_lambda_permission" "eventbridge_invoke_process_task_result" {
  statement_id  = "AllowEventBridgeInvokeProcessTaskResult"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.process_task_result.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ecs_task_stopped.arn
}

