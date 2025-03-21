terraform {
  backend "s3" {
    bucket         = "boardify-terraform-state-bucket"
    key            = "boardify/terraform.tfstate"
    region         = "ap-south-2"
    dynamodb_table = "boardify-terraform-lock"              
  }
}