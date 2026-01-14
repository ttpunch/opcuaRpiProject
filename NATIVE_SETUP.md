# Native Setup Guide (Non-Docker)

This guide explains how to run the OPC UA Server project natively on Raspberry Pi OS using systemd and Nginx.

## Advantages
- **Better Performance**: No container overhead.
- **Hardware Access**: Direct access to GPIO, I2C, and SPI.
- **Reliability**: Managed by `systemd` for auto-restart on failure or reboot.

## Installation

1. **Prerequisites**: Raspberry Pi OS (Bullseye or Bookworm recommended).
2. **Clone the project**:
   ```bash
   git clone <your-repo-url> /opt/pi-opcua-server
   cd /opt/pi-opcua-server
   ```
3. **Run the installer**:
   ```bash
   chmod +x scripts/install.sh
   sudo ./scripts/install.sh
   ```

## Management Scripts

We provide helper scripts in the `scripts/` directory to manage your services:

| Script | Command | Purpose |
|--------|---------|---------|
| **Start** | `sudo ./scripts/start-services.sh` | Starts API, OPC UA, and Nginx |
| **Stop** | `sudo ./scripts/stop-services.sh` | Stops Unified OPC UA Process |
| **Status** | `./scripts/status.sh` | Checks if services are running |
| **Logs** | `./scripts/logs.sh` | Live view of all service logs |

## Manual Commands

If you prefer using `systemctl` directly:

```bash
# View All Logs (API + OPC UA)
sudo journalctl -u opcua -f

# Restart everything
sudo systemctl restart opcua nginx
```

## Directory Structure
- **Production Path**: `/opt/pi-opcua-server`
- **Virtual Env**: `/opt/pi-opcua-server/venv`
- **Frontend Build**: `/opt/pi-opcua-server/frontend/dist`
- **Database**: `/opt/pi-opcua-server/backend/database/opcua_server.db`

## Replication to other Pis
Simply copy this project folder to another Pi and run `sudo ./scripts/install.sh`. The script will handle Node.js 22, Python dependencies, and SSL certificate generation automatically.
