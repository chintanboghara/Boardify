pipeline {
    agent any

    environment {
        DOCKERHUB_USERNAME = credentials('DOCKERHUB_USERNAME')
        DOCKERHUB_TOKEN = credentials('DOCKERHUB_TOKEN')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }
        stage('Docker Login') {
            steps {
                sh 'echo $DOCKERHUB_TOKEN | docker login --username $DOCKERHUB_USERNAME --password-stdin'
            }
        }
        stage('Build') {
            steps {
                sh 'docker build -t chintanboghara/boardify:latest .'
            }
        }
        stage('Push') {
            steps {
                sh 'docker push chintanboghara/boardify:latest'
            }
        }
    }
}
