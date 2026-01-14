#!/bin/bash

# RPi OPC UA Server - Docker Setup Script
# This script installs Docker and starts the project using Docker Compose

set -e

echo "🚀 Starting Raspberry Pi OPC UA Server Setup..."

# 1. Update system
echo "📦 Updating system packages..."
sudo apt-get update && sudo apt-get upgrade -y

# 2. Install Docker if not present
if ! command -v docker &> /dev/null; then
    echo "🐳 Installing Docker..."
    curl -sSL https://get.docker.com | sh
    sudo usermod -aG docker $USER
    echo "✅ Docker installed. Please note: you might need to log out and back in for group changes to take effect."
else
    echo "✅ Docker is already installed."
fi

# 3. Install Docker Compose if not present
if ! docker compose version &> /dev/null; then
    echo "🐙 Installing Docker Compose..."
    sudo apt-get install -y docker-compose-plugin
else
    echo "✅ Docker Compose is already installed."
fi

# 4. Generate SSL Certificates for Nginx (Self-signed)
CERT_DIR="./certs"
if [ ! -d "$CERT_DIR" ]; then
    echo "🔐 Generating self-signed SSL certificates..."
    mkdir -p "$CERT_DIR"
    openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$CERT_DIR/opcua-server.key" \
        -out "$CERT_DIR/opcua-server.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=raspberrypi"
    echo "✅ SSL certificates generated."
fi

# 5. Build and Start Services
echo "🏗️ Building and starting Docker containers..."
sudo docker compose up -d --build

echo ""
echo "🎉 Setup Complete!"
echo "------------------------------------------------"
echo "Management UI:   https://$(hostname -I | awk '{print $1}')"
echo "OPC UA Endpoint: opc.tcp://$(hostname -I | awk '{print $1}'):4840"
echo "------------------------------------------------"
echo "Note: If you just installed Docker, you may need to run 'sudo docker compose up -d' if the command failed above."
