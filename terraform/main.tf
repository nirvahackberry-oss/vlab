terraform {
  required_version = ">= 1.6.0"

  /*
  backend "s3" {
    bucket         = "vlab-terraform-state-wrslgizb"
    key            = "dev/terraform.tfstate"
    region         = "ap-south-1"
    dynamodb_table = "vlab-terraform-locks"
    encrypt        = true
  }
  */

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    archive = {
      source  = "hashicorp/archive"
      version = "~> 2.4"
    }
    random = {
      source  = "hashicorp/random"
      version = "~> 3.6"
    }
  }
}

provider "aws" {
  region = var.region
}

locals {
  name_prefix = "${var.project_name}-${var.environment}"
  common_tags = merge(
    {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "terraform"
    },
    var.tags
  )

  # Ignito (and similar) call http://task-public-ip:8888 from outside the VPC. Without an ALB, the
  # task ENI needs inbound on the lab port. When var.lab_task_ingress_cidr_blocks is empty, dev
  # stacks open 0.0.0.0/0; set lab_task_ingress_cidr_blocks explicitly to restrict (e.g. office IP).
  effective_lab_task_ingress_cidr_blocks = (
    length(var.lab_task_ingress_cidr_blocks) > 0 ? var.lab_task_ingress_cidr_blocks :
    (var.environment == "dev" ? ["0.0.0.0/0"] : [])
  )
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
