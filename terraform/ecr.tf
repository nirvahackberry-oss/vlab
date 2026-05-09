locals {
  # CI pushes one mutable :latest per repo; untagged digests appear when tags move.
  ecr_lab_lifecycle_policy = jsonencode({
    rules = [
      {
        rulePriority = 1
        description  = "Expire excess untagged images (orphaned when :latest is overwritten)"
        selection = {
          tagStatus   = "untagged"
          countType   = "imageCountMoreThan"
          countNumber = 2
        }
        action = {
          type = "expire"
        }
      },
      {
        rulePriority = 2
        description  = "Cap total images per repository (small rollback window beyond :latest)"
        selection = {
          tagStatus   = "any"
          countType   = "imageCountMoreThan"
          countNumber = 8
        }
        action = {
          type = "expire"
        }
      }
    ]
  })

  lab_base_kinds = toset(["linux", "python", "java"])
}

resource "aws_ecr_repository" "lab_bases" {
  for_each             = local.lab_base_kinds
  name                 = "${local.name_prefix}-lab-base-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name     = "${local.name_prefix}-lab-base-${each.key}-ecr"
    LabBase  = each.key
    Role     = "shared-build-base"
  })
}

resource "aws_ecr_lifecycle_policy" "lab_bases" {
  for_each   = aws_ecr_repository.lab_bases
  repository = each.value.name
  policy     = local.ecr_lab_lifecycle_policy
}

resource "aws_ecr_repository" "lab_images" {
  for_each             = toset(var.lab_types)
  name                 = "${local.name_prefix}-${each.key}"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-${each.key}-ecr"
    LabType = each.key
  })
}

resource "aws_ecr_lifecycle_policy" "lab_images" {
  for_each   = aws_ecr_repository.lab_images
  repository = each.value.name
  policy     = local.ecr_lab_lifecycle_policy
}
