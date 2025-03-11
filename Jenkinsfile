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
        stage('Build') {
            steps {
                sh 'docker build -t chintanboghara/boardify:latest .'
            }
        }
        stage('Docker Login') {
            steps {
                sh 'echo $DOCKERHUB_TOKEN | docker login --username $DOCKERHUB_USERNAME --password-stdin'
            }
        }
        stage('Push') {
            steps {
                sh 'docker push chintanboghara/boardify:latest'
            }
        }
        stage('Pull') {
            steps {
                sh 'docker pull chintanboghara/boardify:latest'
            }
        }
        stage('Run') {
            steps {
                sh 'docker run --rm -d -p 5173:5173 chintanboghara/boardify:latest'
            }
        }
    }
}
