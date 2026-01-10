#!/bin/bash
echo "🚀 Starting OPC UA Services..."
sudo systemctl start opcua nginx
sudo systemctl status opcua nginx
