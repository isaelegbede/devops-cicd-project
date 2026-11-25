pipeline {
    agent { label 'linux-ci' }

    options {
        timestamps()
        disableConcurrentBuilds()
        buildDiscarder(logRotator(numToKeepStr: '20'))
        timeout(time: 30, unit: 'MINUTES')
        skipDefaultCheckout(true)
    }

    environment {
        REGISTRY_IMAGE = 'docker.io/YOUR_DOCKERHUB_USER/northstar-dashboard'
        DOCKER_CREDENTIALS = 'dockerhub-creds'
        KUBECONFIG_CREDENTIALS = 'kubeconfig-staging'
        K8S_NAMESPACE = 'northstar'
        K8S_DEPLOYMENT = 'northstar-dashboard'
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
                script {
                    env.IMAGE_TAG = "${env.BUILD_NUMBER}-${env.GIT_COMMIT.take(7)}"
                }
                stash name: 'source', includes: '**', excludes: 'node_modules/**,dist/**'
            }
        }

        stage('Install and verify') {
            steps {
                sh 'npm ci'
                sh 'npm run typecheck'
                sh 'npm test -- --reporter=default'
                sh 'npm run build'
            }
        }

        stage('Dependency audit') {
            steps {
                sh 'npm audit --audit-level=high'
            }
        }

        stage('Secret scan') {
            steps {
                sh 'gitleaks detect --source . --no-git --redact --exit-code 1'
            }
        }

        stage('Infrastructure scan') {
            steps {
                sh 'trivy fs --scanners misconfig,secret --exit-code 1 --severity HIGH,CRITICAL .'
            }
        }

        stage('Build, scan and push image') {
            agent { label 'linux-docker' }
            when {
                beforeAgent true
                branch 'main'
            }
            steps {
                unstash 'source'
                sh 'docker build --pull --tag $REGISTRY_IMAGE:$IMAGE_TAG .'
                sh 'trivy image --exit-code 1 --severity HIGH,CRITICAL --ignore-unfixed $REGISTRY_IMAGE:$IMAGE_TAG'
                withCredentials([usernamePassword(
                    credentialsId: "${DOCKER_CREDENTIALS}",
                    usernameVariable: 'REGISTRY_USER',
                    passwordVariable: 'REGISTRY_PASSWORD'
                )]) {
                    sh '''
                        set +x
                        trap 'docker logout >/dev/null 2>&1 || true' EXIT
                        printf '%s' "$REGISTRY_PASSWORD" | docker login --username "$REGISTRY_USER" --password-stdin
                        docker push "$REGISTRY_IMAGE:$IMAGE_TAG"
                    '''
                }
            }
            post {
                always {
                    sh 'docker image rm "$REGISTRY_IMAGE:$IMAGE_TAG" >/dev/null 2>&1 || true'
                    cleanWs()
                }
            }
        }

        stage('Deploy to staging') {
            agent { label 'linux-kubectl' }
            when {
                beforeAgent true
                branch 'main'
            }
            steps {
                unstash 'source'
                withCredentials([file(
                    credentialsId: "${KUBECONFIG_CREDENTIALS}",
                    variable: 'KUBECONFIG'
                )]) {
                    sh '''
                        sed "s|docker.io/YOUR_DOCKERHUB_USER/northstar-dashboard:replace-me|$REGISTRY_IMAGE:$IMAGE_TAG|" \
                          k8s/deployment.yaml | kubectl apply -f -
                        kubectl apply -f k8s/ingress.yaml
                        kubectl rollout status deployment/$K8S_DEPLOYMENT \
                          --namespace=$K8S_NAMESPACE --timeout=180s
                    '''
                }
            }
            post {
                always {
                    cleanWs()
                }
            }
        }
    }

    post {
        always {
            cleanWs()
        }
    }
}
