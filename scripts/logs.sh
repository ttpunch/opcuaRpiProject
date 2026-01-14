#!/bin/bash
echo "📜 Viewing live logs (Ctrl+C to stop)..."
sudo journalctl -u opcua -f
