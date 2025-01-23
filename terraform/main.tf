# terraform/main.tf
terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 4.0"
    }
  }
  
  backend "s3" {
    bucket = "votarr-terraform-state"
    key    = "state/terraform.tfstate"
    region = "us-west-2"
  }
}

provider "aws" {
  region = var.aws_region
}

# VPC Configuration
module "vpc" {
  source = "./modules/vpc"
  
  environment = var.environment
  vpc_cidr    = var.vpc_cidr
  azs         = var.availability_zones
}

# ECS Cluster
module "ecs" {
  source = "./modules/ecs"
  
  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  app_image      = var.app_image
  container_port = var.container_port
  cpu            = var.cpu
  memory         = var.memory
  
  desired_count  = var.desired_count
  
  environment_variables = {
    NODE_ENV             = var.environment
    DATABASE_URL         = var.database_url
    PLEX_CLIENT_ID       = var.plex_client_id
    JWT_SECRET           = var.jwt_secret
    SENTRY_DSN          = var.sentry_dsn
    LOGTAIL_SOURCE_TOKEN = var.logtail_token
  }
}

# RDS Database
module "rds" {
  source = "./modules/rds"
  
  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
  
  db_name     = var.db_name
  db_username = var.db_username
  db_password = var.db_password
}

# CloudFront Distribution
module "cloudfront" {
  source = "./modules/cloudfront"
  
  environment = var.environment
  domain_name = var.domain_name
  
  alb_domain_name = module.ecs.alb_domain_name
}

# Route53 DNS
module "dns" {
  source = "./modules/dns"
  
  domain_name = var.domain_name
  cloudfront_distribution_domain = module.cloudfront.distribution_domain
}

# ElastiCache for WebSocket state
module "elasticache" {
  source = "./modules/elasticache"
  
  environment     = var.environment
  vpc_id         = module.vpc.vpc_id
  private_subnets = module.vpc.private_subnets
}

# CloudWatch Monitoring
module "monitoring" {
  source = "./modules/monitoring"
  
  environment = var.environment
  ecs_cluster_name = module.ecs.cluster_name
  rds_instance_id = module.rds.instance_id
}
