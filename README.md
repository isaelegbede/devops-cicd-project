# Northstar Operations Dashboard

An enterprise-oriented frontend starter and Jenkins delivery pipeline. The UI currently uses sample data: it has no authentication, backend API, database, or real operational metrics. Integrate those before exposing it as a production service.

## Assumptions and recommended stack

- **Application:** React + TypeScript + Vite; Vitest and Testing Library.
- **Packaging:** multi-stage Docker build and unprivileged NGINX static hosting.
- **CI/CD:** Jenkins Multibranch Pipeline; Linux agents; GitHub webhook; Docker Hub as the example registry.
- **Deployment:** a Kubernetes staging namespace with an NGINX Ingress controller and a TLS secret. The same layout works with managed EKS, GKE, or AKS.
- **Quality/security gates:** type check, unit tests, production build, npm audit, Gitleaks, Trivy filesystem and image scans. Findings at High/Critical severity block delivery.

The Jenkins pipeline deploys only `main`. Other branches run the validation and source-security checks, but do not get Docker-daemon access, registry credentials, or cluster credentials.

## 1. Local development

Install Node.js 22 LTS and Docker Desktop. In PowerShell, from the project directory:

```powershell
npm install
npm run typecheck
npm test
npm run build
npm run dev
```

Open the Vite URL printed in the terminal (normally `http://localhost:5173`). `npm install` creates `package-lock.json`; commit that file. CI and the Docker build intentionally use `npm ci` for repeatable dependency installation.

The initial UI is a dashboard example. Replace the sample structures in `src/data.ts` with a typed API client and an authenticated backend. Do not put credentials or secrets in frontend environment variables; anything bundled into a browser app is public.

## 2. Run the container locally

After committing `package-lock.json`:

```powershell
docker build --pull -t northstar-dashboard:local .
docker run --rm -p 8080:8080 northstar-dashboard:local
```

Open `http://localhost:8080`. NGINX serves the SPA on port 8080, runs as a non-root user, and sets restrictive browser security headers. Before production, pin both Docker base images by digest and keep them updated.

## 3. Prepare the Kubernetes staging environment

Provision a managed Kubernetes cluster (EKS, GKE, or AKS), a node pool, an NGINX Ingress controller, and DNS for a hostname you control. Configure `k8s/ingress.yaml` with that hostname. Create the TLS secret in the `northstar` namespace using your certificate-manager or platform TLS process.

Using an administrator/platform-bootstrap identity, initialize the namespace and deployer role once:

```sh
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/jenkins-rbac.yaml
kubectl create secret tls northstar-dashboard-tls \
  --namespace northstar \
  --cert=/path/to/tls.crt \
  --key=/path/to/tls.key
```

Configure Jenkins Kubernetes access for the `jenkins-deployer` identity and save it as a Jenkins **Secret file** credential. Prefer your cloud provider's short-lived workload identity/exec authentication. For EKS/GKE/AKS identities, bind the mapped Kubernetes `User` or `Group` in `k8s/jenkins-rbac.yaml` instead of its ServiceAccount subject. If using a token-based kubeconfig, rotate it through your secrets-management process; do not check it into Git or print it in build logs. The included Role is namespace-scoped and does not grant access to secrets or cluster-wide resources.

The sample deployment expects a public Docker Hub image. For a private registry, configure a restricted image-pull secret through your cluster's secret-management mechanism.

## 4. Configure Jenkins

### Agent requirements

Create isolated Linux agents with these labels and tools:

- `linux-ci`: Node.js 22/npm, Git, Gitleaks, Trivy, and Jenkins Workspace Cleanup support.
- `linux-docker`: Docker CLI/BuildKit and Trivy, with access to an isolated Docker daemon.
- `linux-kubectl`: `kubectl` compatible with the target cluster.

Install Jenkins plugins: **Pipeline**, **Git**, **GitHub Branch Source**, **Credentials Binding**, and **Workspace Cleanup**. Keep fork/untrusted pull requests off privileged agents. Restrict agent access, use ephemeral workers where possible, and never expose the Docker socket or deployment credentials to validation jobs.

### Add credentials

In **Manage Jenkins → Credentials → System → Global credentials**, create:

1. **Docker Hub:** kind **Username with password**, ID `dockerhub-creds`. Use a dedicated registry account/token with push permission to only the application repository.
2. **Staging cluster:** kind **Secret file**, ID `kubeconfig-staging`. This file must authenticate as the namespace-scoped deploy identity described above.

Never put credentials in the Jenkinsfile, repository, Docker build args, or console output. Update `REGISTRY_IMAGE` in `Jenkinsfile` to your Docker Hub namespace/repository. The pipeline replaces the sample image in `k8s/deployment.yaml` with the unique build tag before applying it.

### Create the multibranch job and webhook

1. Push the repository, including `package-lock.json`, to GitHub.
2. In Jenkins, choose **New Item → Multibranch Pipeline**. Add the GitHub repository source, credentials if the repository is private, and enable branch discovery/PR discovery as appropriate.
3. Configure the repository webhook URL as `https://JENKINS_PUBLIC_URL/github-webhook/` (trailing slash included), content type `application/json`, and events for **Pushes** and **Pull requests**.
4. Ensure Jenkins is reachable by GitHub over HTTPS. In GitHub, verify webhook deliveries return a successful HTTP status. For a private Jenkins, use a secured webhook relay/tunnel instead of exposing Jenkins broadly.
5. Add a branch protection rule for `main` requiring review and successful Jenkins checks. The job must be Multibranch so `when { branch 'main' }` behaves as intended.

Webhook authentication and Jenkins URL/TLS configuration should follow your organization's standard ingress and identity policies.

## 5. Pipeline flow

`Jenkinsfile` runs these stages:

1. Checkout and derive a unique image tag from build number + commit.
2. `npm ci`, TypeScript type check, unit tests, and optimized Vite build.
3. `npm audit --audit-level=high`.
4. Gitleaks source scan and Trivy filesystem misconfiguration/secret scan.
5. On `main` only: Docker build, Trivy High/Critical image scan, then authenticated push.
6. On `main` only: deploy the pushed tag to staging and wait for Kubernetes rollout completion.

The configured Jenkins agents must have the scanner CLIs installed and updated. Review scanner exceptions rather than globally suppressing findings. This pipeline does not include production promotion; add a separate approval-gated production stage with separate credentials and environment-specific manifests.

## 6. Verify a deployment

After a successful `main` build:

```sh
kubectl -n northstar get deployments,services,ingresses
kubectl -n northstar rollout status deployment/northstar-dashboard
```

Open the configured HTTPS hostname. To diagnose a failed rollout, inspect `kubectl -n northstar describe deployment northstar-dashboard` and pod logs. Jenkins removes its local image and workspace in the post action.

## Repository layout

```text
src/                 React UI, sample data, and focused UI tests
k8s/                 Namespace bootstrap, least-privilege RBAC, app, and ingress
Dockerfile           Vite build + unprivileged NGINX runtime
nginx.conf           SPA fallback and browser security headers
Jenkinsfile           CI checks, image build/scan/push, staging rollout
```
