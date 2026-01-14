#!/bin/bash
echo "📊 OPC UA Service Status:"
echo "--------------------------------"
sudo systemctl status opcua nginx --no-pager
