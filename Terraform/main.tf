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

# Build the Docker image locally
resource "docker_image" "app_image" {
  name = "${var.image_name}:${var.image_tag}" // Name for the locally built image
  build {
    context    = "../." // Path to the root of the project
    dockerfile = "Dockerfile" // Dockerfile is in the root (context)
    tag        = ["${var.image_name}:${var.image_tag}"] // Tag the built image
    // Adding platform might be useful for cross-platform consistency if needed, e.g. platform = "linux/amd64"
    // For now, let's omit it unless issues arise.
  }
  keep_locally = true // Keep the built image locally
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
