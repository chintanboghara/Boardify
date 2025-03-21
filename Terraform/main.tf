terraform {
  required_providers {
    docker = {
      source  = "kreuzwerker/docker"
      version = "~> 3.0.0"
    }
  }
}

# Configure the Docker provider
provider "docker" {
  # Default configuration assumes Docker is running locally.
}

# Create a Docker network for isolation
resource "docker_network" "app_network" {
  name   = var.network_name
  driver = "bridge"
}

# Pull the Docker image from DockerHub
resource "docker_image" "app_image" {
  name         = "${var.image_name}:${var.image_tag}"
  keep_locally = true # Keep the image locally to avoid repeated pulls
}

# Run the Docker container
resource "docker_container" "app_container" {
  name  = var.container_name
  image = docker_image.app_image.image_id

  # Port mapping: internal port 80 (Nginx) to external port
  ports {
    internal = 80
    external = var.external_port
  }

  # Attach to the custom network
  networks_advanced {
    name = docker_network.app_network.name
  }

  # Ensure the container restarts on failure
  restart = "unless-stopped"

  # Add labels for better resource management
  labels {
    label = "app"
    value = "boardify"
  }
}
