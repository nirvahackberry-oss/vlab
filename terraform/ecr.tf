resource "aws_ecr_repository" "lab_images" {
  for_each             = toset(var.lab_types)
  name                 = "${local.name_prefix}-${each.key}-lab"
  image_tag_mutability = "MUTABLE"

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${each.key}-lab-ecr"
    LabType = each.key
  })
}

resource "aws_ecr_lifecycle_policy" "lab_images" {
  for_each   = aws_ecr_repository.lab_images
  repository = each.value.name
  policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Keep last 30 images"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 30
        }
        action = {
          type = "expire"
        }
      }
    ]
  })
}
