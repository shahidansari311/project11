# 🚀 AWS EC2 Deployment Guide

This guide provides a simple, step-by-step process for deploying the SilverRealEstate backend to an AWS EC2 instance using Docker and GitHub Actions.

## Phase 1: AWS EC2 Setup

1. **Launch an EC2 Instance:**
   - Log in to AWS and go to **EC2 > Launch Instance**.
   - Choose **Ubuntu 24.04 LTS** (or 22.04).
   - Select an instance type (e.g., `t3.micro` or `t3.small`).
   - Create and download a new **Key Pair** (`.pem` file). Keep this file safe.

2. **Configure Security Groups (Firewall):**
   - Ensure the following **Inbound Rules** are set:
     - **SSH (Port 22):** Allow from your IP address only (for security).
     - **HTTP (Port 80):** Allow from anywhere `0.0.0.0/0`.
     - **HTTPS (Port 443):** Allow from anywhere `0.0.0.0/0`.
     - **Custom TCP (Port 4000):** *(Optional)* Allow if you are not using Nginx reverse proxy yet, but it is highly recommended to close this in production and route through port 80/443.

## Phase 2: Initial Server Configuration

You need to prepare the EC2 instance to run Docker containers.

1. **Connect to your EC2 instance:**
   ```bash
   ssh -i /path/to/your-key.pem ubuntu@<YOUR_EC2_PUBLIC_IP>
   ```

2. **Install Docker and Docker Compose:**
   Run the following commands on the server:
   ```bash
   sudo apt update
   sudo apt install docker.io docker-compose -y
   sudo usermod -aG docker ubuntu
   ```
   *Note: Type `exit` to disconnect, then SSH back in so the docker permission changes take effect.*

3. **Clone the Repository:**
   ```bash
   git clone <YOUR_GITHUB_REPO_URL> SilverRealEstate
   cd SilverRealEstate/backend
   ```

4. **Create the Production Environment File:**
   ```bash
   nano .env
   ```
   Paste your production variables into this file. **Crucially, make sure you set the FRONTEND_URL to your actual Vercel app domain to secure your API.**
   ```env
   PORT=4000
   DATABASE_URL="your-production-db-url"
   FRONTEND_URL="https://your-production-app.com,https://m.your-production-app.com"
   JWT_SECRET="your-highly-secure-random-string"
   JWT_EXPIRES_IN="15m"
   REFRESH_TOKEN_EXPIRES_IN="7d"
   SUPABASE_URL="your-supabase-url"
   SUPABASE_SERVICE_KEY="your-supabase-service-key"
   ```
   Press `CTRL+X`, then `Y`, then `Enter` to save.

## Phase 3: GitHub Actions CI/CD Setup

To enable automatic deployments whenever you push to the `main` branch, you must configure GitHub Secrets.

1. Go to your GitHub Repository.
2. Navigate to **Settings > Secrets and variables > Actions**.
3. Click **New repository secret** and add the following three secrets:
   - `EC2_HOST`: Your EC2 instance's Public IPv4 address (e.g., `54.123.45.67`).
   - `EC2_USER`: `ubuntu`
   - `EC2_SSH_KEY`: Open your `.pem` file in a text editor, copy the entire content (including the `-----BEGIN RSA PRIVATE KEY-----` tags), and paste it here.

## Phase 4: Deploy!

1. Commit and push your code to the `main` branch.
2. Go to the **Actions** tab in your GitHub repository.
3. You will see the `Deploy Backend to EC2` workflow running. 
4. Once it completes successfully (turns green), your backend is live! 

### Troubleshooting

- **CORS Errors:** If your Vercel frontend is getting blocked, double-check that the `FRONTEND_URL` inside the EC2 `.env` exactly matches the Vercel URL (no trailing slashes).
- **Docker Errors:** If the GitHub action fails, SSH into your server, navigate to `~/SilverRealEstate/backend`, and manually run `docker-compose up --build` to see the error logs.
