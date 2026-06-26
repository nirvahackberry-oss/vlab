resource "aws_security_group" "ecs_tasks" {
  name        = "${local.name_prefix}-ecs-task-sg"
  description = "Security group for ephemeral lab tasks"
  vpc_id      = aws_vpc.main.id

  dynamic "ingress" {
    for_each = length(var.lab_control_plane_security_group_ids) > 0 ? [1] : []
    content {
      description     = "Allow control plane (e.g. API Lambdas in app repo) to reach lab runtime"
      from_port       = 8080
      to_port         = 8080
      protocol        = "tcp"
      security_groups = var.lab_control_plane_security_group_ids
    }
  }

  dynamic "ingress" {
    for_each = length(var.lab_control_plane_security_group_ids) > 0 ? [1] : []
    content {
      description     = "Allow control plane to reach Jupyter on datascience tasks"
      from_port       = 8888
      to_port         = 8888
      protocol        = "tcp"
      security_groups = var.lab_control_plane_security_group_ids
    }
  }

  dynamic "ingress" {
    for_each = length(var.lab_browser_ingress_cidr_blocks) > 0 ? [1] : []
    content {
      description = "Browser access to code-server (8080) on lab public IPs"
      from_port   = 8080
      to_port     = 8080
      protocol    = "tcp"
      cidr_blocks = var.lab_browser_ingress_cidr_blocks
    }
  }

  dynamic "ingress" {
    for_each = length(var.lab_browser_ingress_cidr_blocks) > 0 ? [1] : []
    content {
      description = "Browser access to JupyterLab (8888) on lab public IPs"
      from_port   = 8888
      to_port     = 8888
      protocol    = "tcp"
      cidr_blocks = var.lab_browser_ingress_cidr_blocks
    }
  }

  egress {
    description = "Allow all outbound"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-ecs-task-sg"
  })
}

resource "aws_security_group" "vpc_endpoints" {
  name        = "${local.name_prefix}-vpce-sg"
  description = "Security group for interface VPC endpoints"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "Allow VPC resources to call endpoints"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    security_groups = [
      aws_security_group.ecs_tasks.id,
    ]
  }

  egress {
    description = "Allow endpoint responses"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = merge(local.common_tags, {
    Name = "${local.name_prefix}-vpce-sg"
  })
}
