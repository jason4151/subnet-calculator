# Subnet Calculator

A simple web application built with React and Vite to calculate and display subnets from a given IP network. Deployed to an AWS EKS cluster using Helm and GitHub Actions.

## Overview

This tool allows users to input a base network (e.g., `10.0.0.0/16`) and a target subnet mask (e.g., `/21`) to generate a table of subnets, including their addresses, ranges, and usable IPs. It’s designed for network planning, such as organizing subnets across an AWS environment.

- **Frontend**: React + Vite
- **Container**: Docker (Nginx serving the static app)
- **Deployment**: AWS EKS (`lab-eks-cluster`) in `us-east-2`
- **CI/CD**: GitHub Actions with OIDC
- **Orchestration**: Helm

## Prerequisites

- **AWS Account**: With an EKS cluster (`lab-eks-cluster`) in `us-east-2`.
- **ECR Repository**: For storing the Docker image.
- **GitHub OIDC**: Configured with an IAM role (e.g., `GitHubActionsRole`) allowing `ecr:*` and `eks:*` actions for `repo:jason4151/subnet-calculator`.
- **Local Tools**: Node.js, Docker, Helm, AWS CLI, `kubectl`.

## Setup Instructions

### 1. Clone the Repository
```bash
git clone https://github.com/jason4151/subnet-calculator.git
cd subnet-calculator
npm install
npm run dev
```
### 2. Build Docker Image
```bash
docker build -t subnet-calculator:latest .
docker run -p 80:80 subnet-calculator:latest
```
Test at http://localhost.

