pipeline {
    // Run the pipeline on any available agent
    agent any

    // Environment variables loaded from Jenkins credentials
    environment {
        DOCKERHUB_USERNAME = credentials('DOCKERHUB_USERNAME')
        DOCKERHUB_TOKEN = credentials('DOCKERHUB_TOKEN')
    }

    stages {
        stage('Checkout') {
            steps {
                // Checkout the source code from the repository
                checkout scm
            }
        }
        stage('Build') {
            steps {
                // Build the Docker image and tag it as 'latest'
                sh 'docker build -t chintanboghara/boardify:latest .'
            }
        }
        stage('Docker Login') {
            steps {
                // Log in to Docker Hub using stored credentials
                sh 'echo $DOCKERHUB_TOKEN | docker login --username $DOCKERHUB_USERNAME --password-stdin'
            }
        }
        stage('Push') {
            steps {
                // Push the Docker image to Docker Hub
                sh 'docker push chintanboghara/boardify:latest'
            }
        }
    }
}
