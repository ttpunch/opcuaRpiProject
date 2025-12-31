#!/bin/bash

# Start the unified Management API and OPC UA Server
echo "Starting Unified Backend (API + OPC UA)..."
python3 -m uvicorn backend.api.main:app --host 0.0.0.0 --port 8000 --proxy-headers --forwarded-allow-ips='*'
