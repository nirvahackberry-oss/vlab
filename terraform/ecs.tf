locals {
  lab_environment_list = [
    for k, v in var.lab_environment : {
      name  = k
      value = v
    }
  ]
}

resource "aws_ecs_cluster" "lab" {
  name = "${local.name_prefix}-cluster"

  setting {
    name  = "containerInsights"
    value = "enabled"
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-cluster"
  })
}

resource "aws_cloudwatch_log_group" "ecs" {
  name              = "/aws/ecs/${local.name_prefix}-lab"
  retention_in_days = 14

  tags = local.common_tags
}

resource "aws_ecs_task_definition" "lab" {
  for_each                 = toset(var.lab_types)
  family                   = "${local.name_prefix}-${each.key}-task"
  network_mode             = "awsvpc"
  requires_compatibilities = ["FARGATE"]
  cpu                      = tostring(lookup(var.lab_cpu_by_type, each.key, var.lab_cpu))
  memory                   = tostring(lookup(var.lab_memory_by_type, each.key, var.lab_memory))
  execution_role_arn       = aws_iam_role.ecs_task_execution.arn
  task_role_arn            = aws_iam_role.ecs_task.arn

  ephemeral_storage {
    size_in_gib = var.ephemeral_storage_gib
  }

  container_definitions = jsonencode([
    {
      name      = "lab-runtime"
      image     = "${aws_ecr_repository.lab_images[each.key].repository_url}:latest"
      essential = true
      portMappings = [
        {
          containerPort = var.lab_container_port
          hostPort      = var.lab_container_port
          protocol      = "tcp"
        }
      ]
      environment = local.lab_environment_list
      logConfiguration = {
        logDriver = "awslogs"
        options = {
          awslogs-group         = aws_cloudwatch_log_group.ecs.name
          awslogs-region        = var.region
          awslogs-stream-prefix = "ecs"
        }
      }
    }
  ])

  tags = local.common_tags
}

resource "aws_lb" "lab" {
  count              = var.enable_alb ? 1 : 0
  name               = substr("${local.name_prefix}-alb", 0, 32)
  load_balancer_type = "application"
  internal           = var.enable_nat_gateway ? false : true
  security_groups    = [aws_security_group.alb[0].id]
  subnets            = var.enable_nat_gateway ? aws_subnet.public[*].id : aws_subnet.private[*].id

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-alb"
  })
}

resource "aws_lb_target_group" "lab" {
  count       = var.enable_alb ? 1 : 0
  name        = substr("${local.name_prefix}-tg", 0, 32)
  target_type = "ip"
  vpc_id      = aws_vpc.main.id
  port        = var.lab_container_port
  protocol    = "HTTP"

  health_check {
    enabled             = true
    protocol            = "HTTP"
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 5
    interval            = 30
    timeout             = 5
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-tg"
  })
}

resource "aws_lb_listener" "lab" {
  count             = var.enable_alb ? 1 : 0
  load_balancer_arn = aws_lb.lab[0].arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.lab[0].arn
  }
}

resource "aws_s3_bucket" "temp_lab_data" {
  count  = var.enable_temp_data_bucket ? 1 : 0
  bucket = "${local.name_prefix}-temp-data-${random_string.bucket_suffix[0].result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-temp-data"
  })
}

resource "random_string" "bucket_suffix" {
  count   = var.enable_temp_data_bucket ? 1 : 0
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "temp_lab_data" {
  count                   = var.enable_temp_data_bucket ? 1 : 0
  bucket                  = aws_s3_bucket.temp_lab_data[0].id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

resource "aws_s3_bucket" "test_cases" {
  bucket = "${local.name_prefix}-test-cases-${random_string.test_cases_suffix.result}"

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-test-cases"
  })
}

resource "random_string" "test_cases_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket_public_access_block" "test_cases" {
  bucket                  = aws_s3_bucket.test_cases.id
  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}
