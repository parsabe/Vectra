#!/bin/bash
# Check status of Vectra AI 3D Forge & VPS Proxy Gateway servers

WORKSPACE_DIR="/www/wwwroot"

echo "=== VECTRA PROTOCOL: SERVER STATUS ==="

if [ -f "${WORKSPACE_DIR}/engine.pid" ] && kill -0 $(cat "${WORKSPACE_DIR}/engine.pid") 2>/dev/null; then
    PID=$(cat "${WORKSPACE_DIR}/engine.pid")
    echo "[Engine] Local GPU Engine is RUNNING (PID: ${PID}) on port 8001"
else
    echo "[Engine] Local GPU Engine is STOPPED"
fi

# Done checking status

echo "======================================="
