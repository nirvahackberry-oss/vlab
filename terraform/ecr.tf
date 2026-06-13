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
}

resource "aws_ecr_repository" "lab_base_linux" {
  name                 = "${local.name_prefix}-lab-base-linux"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-lab-base-linux-ecr"
    LabBase = "linux"
    Role    = "shared-build-base"
  })
}

resource "aws_ecr_repository" "lab_base_python" {
  name                 = "${local.name_prefix}-lab-base-python"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-lab-base-python-ecr"
    LabBase = "python"
    Role    = "shared-build-base"
  })
}

resource "aws_ecr_repository" "lab_base_java" {
  name                 = "${local.name_prefix}-lab-base-java"
  image_tag_mutability = "MUTABLE"
  force_delete         = true

  image_scanning_configuration {
    scan_on_push = true
  }

  encryption_configuration {
    encryption_type = "AES256"
  }

  tags = merge(local.common_tags, {
    Name    = "${local.name_prefix}-lab-base-java-ecr"
    LabBase = "java"
    Role    = "shared-build-base"
  })
}

resource "aws_ecr_lifecycle_policy" "lab_base_linux" {
  repository = aws_ecr_repository.lab_base_linux.name
  policy     = local.ecr_lab_lifecycle_policy
}

resource "aws_ecr_lifecycle_policy" "lab_base_python" {
  repository = aws_ecr_repository.lab_base_python.name
  policy     = local.ecr_lab_lifecycle_policy
}

resource "aws_ecr_lifecycle_policy" "lab_base_java" {
  repository = aws_ecr_repository.lab_base_java.name
  policy     = local.ecr_lab_lifecycle_policy
}

resource "aws_ecr_repository" "lab_images" {
  for_each             = toset(distinct(values(local.lab_ecr_key)))
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
