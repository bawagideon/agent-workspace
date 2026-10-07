#!/usr/bin/env bash
# ==============================================================================
# GIDEON AI HQ V5.2 — ORACLE ALWAYS FREE VM (ARM64) BOOTSTRAP SCRIPT
# OS Target: Ubuntu 24.04 LTS / 22.04 LTS ARM64 (Ampere A1)
# ==============================================================================

set -euo pipefail

echo "🏛️ Initializing Gideon Cloud Runner Deployment..."

# 1. Update and install prerequisites
sudo apt-get update && sudo apt-get upgrade -y
sudo apt-get install -y ca-certificates curl gnupg lsb-release git ufw

# 2. Configure Firewall (SSH only — OpenClaw and Runner stay private)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw --force enable

# 3. Install Docker Engine & Compose plugin
if ! command -v docker &> /dev/null; then
    echo "📦 Installing official Docker engine..."
    sudo install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    sudo chmod a+r /etc/apt/keyrings/docker.gpg

    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
      $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

    sudo apt-get update
    sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    sudo usermod -aG docker "$USER"
    echo "✅ Docker installed successfully."
fi

# 4. Check for .env file
if [ ! -f .env ]; then
    if [ -f .env.production.example ]; then
        cp .env.production.example .env
        echo "⚠️ Created .env from template. PLEASE EDIT .env WITH YOUR REAL CREDENTIALS BEFORE RUNNING DOCKER COMPOSE!"
        echo "   Command: nano .env"
        exit 0
    else
        echo "❌ .env.production.example not found. Please create .env first."
        exit 1
    fi
fi

# 5. Build and launch services
echo "🚀 Building and starting containers (OpenClaw Gateway + Gideon Runner)..."
docker compose down || true
docker compose build --pull
docker compose up -d

# 6. Verify status
echo "🔍 Checking container status..."
sleep 5
docker compose ps

echo "================================================================="
echo "🎉 GIDEON CLOUD RUNNER IS LIVE AND INDEPENDENT."
echo "   Monitor logs with: docker compose logs -f"
echo "   OpenClaw Gateway: Running internally on private bridge network"
echo "   Telegram Mobile Control: Active via long-polling"
echo "================================================================="
