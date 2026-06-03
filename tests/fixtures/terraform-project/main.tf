terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
  required_version = ">= 1.5.0"
}

provider "aws" {
  region = "us-east-1"
}

provider "google" {
  project = "my-project"
  region  = "us-central1"
}

module "vpc" {
  source = "./modules/vpc"
}

module "eks" {
  source = "./modules/eks"
}

resource "aws_s3_bucket" "assets" {
  bucket = "my-assets"
}

resource "aws_lambda_function" "api" {
  function_name = "api"
  runtime       = "nodejs20.x"
}

resource "google_storage_bucket" "backups" {
  name = "my-backups"
}
