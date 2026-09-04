# Subnet Calculator

React + Vite app that splits a CIDR into equal child subnets (aligns host addresses, RFC 3021 `/31`/`/32`, caps huge tables). Image goes to ECR; Helm deploys it to the OpenTofu lab EKS **Auto Mode** cluster.

## Stack

- **App**: React 19, Vite
- **Image**: `lab/subnet-calculator` in ECR (`us-east-2`)
- **Cluster**: `lab-eks-cluster` (EKS Auto Mode), namespace `lab`
- **Service**: internet-facing NLB (`loadBalancerClass: eks.amazonaws.com/nlb`)
- **CI**: reusable workflows in [`jason4151/gha-shared`](https://github.com/jason4151/gha-shared)
  - Push / PR: lint, build, Docker build (no AWS)
  - **Actions → CI and deploy → Run workflow**: push to ECR and Helm upgrade (needs the lab up)

## Local

```bash
npm ci
npm test
npm run dev
```

```bash
docker build -t subnet-calculator:local .
docker run --rm -p 8080:80 subnet-calculator:local
```

Open http://localhost:8080.

## Deploy (when the OpenTofu lab is running)

Repo secret required: `AWS_ACCOUNT_ID` (same GitHub OIDC role as OpenTofu: `GitHubActionsRole`).

1. Apply the OpenTofu lab (VPC with ELB subnet tags, ECR, EKS Auto Mode).
2. In this repo: **Actions → CI and deploy → Run workflow**.
3. `kubectl -n lab get svc subnet-calculator` for the NLB hostname.

Helm chart lives in `helm/`. Auto Mode node role already has ECR pull; no imagePullSecret.
