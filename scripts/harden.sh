#!/bin/bash
# Security Hardening Script for RPi OPC UA Server

set -e

echo "🔐 Starting Security Hardening..."

# 1. Update Nginx to modern security standards
echo "🌐 Hardening Nginx..."
sudo sed -i 's/ssl_protocols.*/ssl_protocols TLSv1.2 TLSv1.3;/' /etc/nginx/sites-available/opcua
sudo systemctl restart nginx

# 2. UFW Hardening
echo "🛡️ Hardening Firewall (UFW)..."
# Recommend SSH restriction (Manual check)
echo "NOTE: If you want to restrict SSH to a specific IP, run: sudo ufw allow from YOUR_IP to any port 22"

# 3. File Permissions Check
echo "📂 Verifying file permissions..."
PROJECT_DIR="/opt/pi-opcua-server"
sudo chown -R root:opcua-group "$PROJECT_DIR"
sudo chmod -R 775 "$PROJECT_DIR"
sudo chmod 600 /etc/ssl/private/opcua-server.key

# 4. JWT Secret Check
if [ -z "$JWT_SECRET_KEY" ]; then
    echo "⚠️ WARNING: JWT_SECRET_KEY is not set in environment."
    echo "Generating a random one and adding to .env..."
    NEW_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET_KEY=$NEW_SECRET" | sudo tee -a "$PROJECT_DIR/.env" > /dev/null
fi

echo "✅ Hardening Complete!"
