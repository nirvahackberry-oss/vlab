data "aws_iam_policy_document" "ecs_task_execution_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["ecs-tasks.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "ecs_task_execution" {
  name               = "${local.name_prefix}-ecs-task-execution-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role_policy_attachment" "ecs_task_execution_managed" {
  role       = aws_iam_role.ecs_task_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name               = "${local.name_prefix}-ecs-task-role"
  assume_role_policy = data.aws_iam_policy_document.ecs_task_execution_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "scheduler_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["scheduler.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "scheduler_invoke_stop_lambda" {
  name               = "${local.name_prefix}-scheduler-stop-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.scheduler_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "scheduler_invoke_stop_lambda" {
  statement {
    effect  = "Allow"
    actions = ["lambda:InvokeFunction"]
    resources = [
      aws_lambda_function.stop_lab.arn,
      aws_lambda_function.grade_lab.arn,
      aws_lambda_function.cleanup_expired.arn
    ]
  }
}

resource "aws_iam_role_policy" "scheduler_invoke_stop_lambda" {
  name   = "${local.name_prefix}-scheduler-stop-lambda-policy"
  role   = aws_iam_role.scheduler_invoke_stop_lambda.id
  policy = data.aws_iam_policy_document.scheduler_invoke_stop_lambda.json
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"
    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "start_lab_lambda" {
  name               = "${local.name_prefix}-start-lab-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role" "stop_lab_lambda" {
  name               = "${local.name_prefix}-stop-lab-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

resource "aws_iam_role" "lab_ops_lambda" {
  name               = "${local.name_prefix}-lab-ops-lambda-role"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
  tags               = local.common_tags
}

data "aws_iam_policy_document" "start_lab_lambda" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "VpcNetworking"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "RunAndDescribeEcsTasks"
    effect = "Allow"
    actions = [
      "ecs:RunTask",
      "ecs:DescribeTasks"
    ]
    resources = concat(
      values(aws_ecs_task_definition.lab)[*].arn,
      [aws_ecs_cluster.lab.arn]
    )
  }

  statement {
    sid    = "PassEcsRoles"
    effect = "Allow"
    actions = [
      "iam:PassRole"
    ]
    resources = [
      aws_iam_role.ecs_task_execution.arn,
      aws_iam_role.ecs_task.arn,
      aws_iam_role.scheduler_invoke_stop_lambda.arn
    ]
  }

  statement {
    sid    = "ManageSchedules"
    effect = "Allow"
    actions = [
      "scheduler:CreateSchedule",
      "scheduler:GetSchedule",
      "scheduler:DeleteSchedule"
    ]
    resources = [
      "arn:aws:scheduler:${var.region}:*:schedule/${aws_scheduler_schedule_group.lab.name}/*",
      aws_scheduler_schedule_group.lab.arn
    ]
  }

  statement {
    sid    = "SessionTableWrite"
    effect = "Allow"
    actions = [
      "dynamodb:PutItem",
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem"
    ]
    resources = [aws_dynamodb_table.sessions.arn]
  }
}

resource "aws_iam_role_policy" "start_lab_lambda" {
  name   = "${local.name_prefix}-start-lab-policy"
  role   = aws_iam_role.start_lab_lambda.id
  policy = data.aws_iam_policy_document.start_lab_lambda.json
}

resource "aws_iam_role_policy_attachment" "start_lab_lambda_vpc" {
  role       = aws_iam_role.start_lab_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "stop_lab_lambda" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "VpcNetworking"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "StopAndDescribeEcsTasks"
    effect = "Allow"
    actions = [
      "ecs:StopTask",
      "ecs:DescribeTasks"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ManageSchedules"
    effect = "Allow"
    actions = [
      "scheduler:DeleteSchedule",
      "scheduler:GetSchedule"
    ]
    resources = [
      "arn:aws:scheduler:${var.region}:*:schedule/${aws_scheduler_schedule_group.lab.name}/*",
      aws_scheduler_schedule_group.lab.arn
    ]
  }

  statement {
    sid    = "SessionTableReadWrite"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:DeleteItem",
      "dynamodb:UpdateItem"
    ]
    resources = [aws_dynamodb_table.sessions.arn]
  }
}

resource "aws_iam_role_policy" "stop_lab_lambda" {
  name   = "${local.name_prefix}-stop-lab-policy"
  role   = aws_iam_role.stop_lab_lambda.id
  policy = data.aws_iam_policy_document.stop_lab_lambda.json
}

resource "aws_iam_role_policy_attachment" "stop_lab_lambda_vpc" {
  role       = aws_iam_role.stop_lab_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}

data "aws_iam_policy_document" "lab_ops_lambda" {
  statement {
    sid    = "CloudWatchLogs"
    effect = "Allow"
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:GetLogEvents",
      "logs:DescribeLogStreams"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "VpcNetworking"
    effect = "Allow"
    actions = [
      "ec2:CreateNetworkInterface",
      "ec2:DescribeNetworkInterfaces",
      "ec2:DeleteNetworkInterface",
      "ec2:AssignPrivateIpAddresses",
      "ec2:UnassignPrivateIpAddresses"
    ]
    resources = ["*"]
  }

  statement {
    sid    = "EcsExecution"
    effect = "Allow"
    actions = [
      "ecs:RunTask",
      "ecs:StopTask",
      "ecs:DescribeTasks",
      "ecs:ExecuteCommand"
    ]
    resources = ["*"]
  }

  statement {
    sid     = "PassEcsRoles"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      aws_iam_role.ecs_task_execution.arn,
      aws_iam_role.ecs_task.arn
    ]
  }

  statement {
    sid    = "DynamoAccess"
    effect = "Allow"
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem",
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
      "dynamodb:Scan",
      "dynamodb:Query"
    ]
    resources = [
      aws_dynamodb_table.sessions.arn,
      aws_dynamodb_table.submissions.arn,
      aws_dynamodb_table.results.arn
    ]
  }

  statement {
    sid    = "S3TestCases"
    effect = "Allow"
    actions = [
      "s3:GetObject",
      "s3:ListBucket"
    ]
    resources = [
      aws_s3_bucket.test_cases.arn,
      "${aws_s3_bucket.test_cases.arn}/*"
    ]
  }

  statement {
    sid       = "InvokeLabLambdas"
    effect    = "Allow"
    actions   = ["lambda:InvokeFunction"]
    resources = ["*"]
  }
}

resource "aws_iam_role_policy" "lab_ops_lambda" {
  name   = "${local.name_prefix}-lab-ops-policy"
  role   = aws_iam_role.lab_ops_lambda.id
  policy = data.aws_iam_policy_document.lab_ops_lambda.json
}

resource "aws_iam_role_policy_attachment" "lab_ops_lambda_vpc" {
  role       = aws_iam_role.lab_ops_lambda.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaVPCAccessExecutionRole"
}
