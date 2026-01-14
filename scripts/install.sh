#!/bin/bash

# RPi OPC UA Server - Native Installation Script
# This script automates the deployment on a fresh Raspberry Pi OS

set -e

# Configuration
PROJECT_DIR="/opt/pi-opcua-server"
USER_OPCUA="opcua"
USER_API="fastapi"
NODE_VERSION="22"

echo "🚀 Starting Native Installation for RPi OPC UA Server..."

# 1. Update and system dependencies
echo "📦 Updating system packages..."
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nginx ufw sqlite3 curl openssl

# 2. Install Node.js 22 (from NodeSource)
if ! command -v node &> /dev/null || [[ $(node -v) != v22* ]]; then
    echo "🟢 Installing Node.js $NODE_VERSION..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt-get install -y nodejs
else
    echo "✅ Node.js $(node -v) already installed."
fi

# 3. Create service users and add to hardware groups
echo "👤 Setting up service users and permissions..."
GROUP_NAME="opcua-group"
if ! getent group "$GROUP_NAME" >/dev/null; then
    sudo groupadd "$GROUP_NAME"
fi

for user in "$USER_OPCUA" "$USER_API"; do
    if ! id "$user" &>/dev/null; then
        sudo useradd -r -s /bin/false "$user"
    fi
    # Add to shared project group
    sudo usermod -aG "$GROUP_NAME" "$user"
    
    # Add to groups for GPIO/Hardware access
    for group in gpio i2c spi; do
        if getent group "$group" >/dev/null; then
            sudo usermod -aG "$group" "$user"
        fi
    done
done

# 4. Setup project directory
echo "📂 Setting up project directory at $PROJECT_DIR..."
sudo mkdir -p "$PROJECT_DIR"
sudo rm -rf "$PROJECT_DIR/certs"
sudo mkdir -p "$PROJECT_DIR/certs"
sudo cp -r . "$PROJECT_DIR"
sudo chown -R root:"$GROUP_NAME" "$PROJECT_DIR"
sudo chown -R "$USER_OPCUA":"$GROUP_NAME" "$PROJECT_DIR/certs"
sudo chmod -R 775 "$PROJECT_DIR"
sudo chmod 775 "$PROJECT_DIR/certs"

# 5. Setup Python virtual environment
echo "🐍 Setting up Python virtual environment..."
cd "$PROJECT_DIR"
sudo python3 -m venv venv
sudo "$PROJECT_DIR/venv/bin/pip" install --upgrade pip
sudo "$PROJECT_DIR/venv/bin/pip" install -r requirements.txt

# 6. Build Frontend
echo "🏗️ Building Frontend..."
cd "$PROJECT_DIR/frontend"
sudo npm install
sudo npm run build

# 7. SSL Certificate Generation (Self-signed)
CERT_DIR="/etc/ssl/certs"
KEY_DIR="/etc/ssl/private"
if [ ! -f "$CERT_DIR/opcua-server.crt" ]; then
    echo "🔐 Generating self-signed SSL certificates..."
    sudo openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
        -keyout "$KEY_DIR/opcua-server.key" \
        -out "$CERT_DIR/opcua-server.crt" \
        -subj "/C=US/ST=State/L=City/O=Organization/OU=Unit/CN=raspberrypi"
    sudo chmod 600 "$KEY_DIR/opcua-server.key"
fi

# 8. Initialize Database
echo "🗄️ Initializing database..."
cd "$PROJECT_DIR"
sudo "$PROJECT_DIR/venv/bin/python" -m scripts.seed_db

# 9. Finalized permissions
echo "🔐 Finalizing file permissions..."
sudo chown -R root:"$GROUP_NAME" "$PROJECT_DIR"
sudo chmod -R 775 "$PROJECT_DIR"

# Generate JWT Secret if it doesn't exist
if [ ! -f "$PROJECT_DIR/.env" ] || ! grep -q "JWT_SECRET_KEY" "$PROJECT_DIR/.env"; then
    echo "🔑 Generating secure JWT secret..."
    JWT_SECRET=$(openssl rand -hex 32)
    echo "JWT_SECRET_KEY=$JWT_SECRET" | sudo tee -a "$PROJECT_DIR/.env" > /dev/null
fi

# Ensure database and its folder are specifically writable by the group
sudo chmod 775 "$PROJECT_DIR/backend/database"
sudo chmod 664 "$PROJECT_DIR/backend/database/opcua_server.db" || true
chmod +x scripts/*.sh

# 10. Configure Firewall (UFW)
echo "🛡️ Configuring firewall..."
sudo ufw allow 22/tcp
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4840/tcp
sudo ufw --force enable

# 11. Install and start services
echo "⚙️ Installing unified opcua service..."
sudo cp scripts/opcua.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable opcua
# Stop old split services if they exist
sudo systemctl stop opcua-server opcua-api 2>/dev/null || true
sudo systemctl disable opcua-server opcua-api 2>/dev/null || true
sudo systemctl restart opcua
sudo ./scripts/harden.sh

# 12. Nginx setup
echo "🌐 Configuring Nginx..."
sudo cp scripts/nginx-opcua.conf /etc/nginx/sites-available/opcua
sudo ln -sf /etc/nginx/sites-available/opcua /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo ""
echo "🎉 Native Installation Complete (Unified Mode)!"
echo "------------------------------------------------"
echo "Management UI:   https://$(hostname -I | awk '{print $1}')"
echo "OPC UA Endpoint: opc.tcp://$(hostname -I | awk '{print $1}'):4840"
echo "------------------------------------------------"
echo "Check logs: sudo journalctl -u opcua -f"
