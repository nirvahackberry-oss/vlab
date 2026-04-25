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
}

data "aws_caller_identity" "current" {}
data "aws_region" "current" {}
