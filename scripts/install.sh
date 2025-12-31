#!/bin/bash

# RPi OPC UA Server Installation Script
# This script should be run on the target Raspberry Pi OS

set -e

# Configuration
PROJECT_DIR="/opt/pi-opcua-server"
USER_OPCUA="opcua"
USER_API="fastapi"

echo "Starting installation..."

# 1. Update and install system dependencies
sudo apt update
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx ufw sqlite3

# 2. Create service users
if ! id "$USER_OPCUA" &>/dev/null; then
    sudo useradd -r -s /bin/false "$USER_OPCUA"
fi
if ! id "$USER_API" &>/dev/null; then
    sudo useradd -r -s /bin/false "$USER_API"
fi

# 3. Setup project directory
sudo mkdir -p "$PROJECT_DIR"
sudo cp -r . "$PROJECT_DIR"
sudo chown -R root:root "$PROJECT_DIR"

# 4. Setup Python environment
cd "$PROJECT_DIR"
sudo python3 -m venv venv
sudo "$PROJECT_DIR/venv/bin/pip" install -r requirements.txt

# 5. Build Frontend
cd "$PROJECT_DIR/frontend"
sudo npm install
sudo npm run build

# 6. Initialize Database
cd "$PROJECT_DIR"
sudo "$PROJECT_DIR/venv/bin/python" -m scripts.seed_db

# 7. Setup permissions
sudo chown -R "$USER_OPCUA":"$USER_OPCUA" "$PROJECT_DIR/backend/opcua_server"
sudo chown -R "$USER_OPCUA":"$USER_OPCUA" "$PROJECT_DIR/certs" || true
sudo chown -R "$USER_API":"$USER_API" "$PROJECT_DIR/backend/database"
sudo chmod 640 "$PROJECT_DIR/backend/database/opcua_server.db" || true

# 8. Configure Firewall (UFW)
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow 22/tcp
sudo ufw allow 443/tcp
sudo ufw allow 4840/tcp
sudo ufw --force enable

# 9. Install and start services
sudo cp scripts/opcua-server.service /etc/systemd/system/
sudo cp scripts/opcua-api.service /etc/systemd/system/
sudo systemctl daemon-reload
sudo systemctl enable opcua-server opcua-api
sudo systemctl start opcua-server opcua-api

# 10. Nginx setup
sudo cp scripts/nginx-opcua.conf /etc/nginx/sites-available/opcua
sudo ln -sf /etc/nginx/sites-available/opcua /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo systemctl restart nginx

echo "Installation complete!"
echo "Management UI: https://$(hostname -I | awk '{print $1}')"
echo "OPC UA Endpoint: opc.tcp://$(hostname -I | awk '{print $1}'):4840"
