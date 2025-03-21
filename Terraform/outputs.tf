output "container_id" {
  description = "The ID of the running container"
  value       = docker_container.app_container.id
}

output "access_url" {
  description = "The URL to access the application"
  value       = "http://localhost:${var.external_port}"
}