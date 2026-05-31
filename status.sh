#!/bin/bash
# Check status of Vectra AI 3D Forge & VPS Proxy Gateway servers

WORKSPACE_DIR="/www/wwwroot/vectra.parsabe.com"

echo "=== VECTRA PROTOCOL: SERVER STATUS ==="

if [ -f "${WORKSPACE_DIR}/engine.pid" ] && kill -0 $(cat "${WORKSPACE_DIR}/engine.pid") 2>/dev/null; then
    PID=$(cat "${WORKSPACE_DIR}/engine.pid")
    echo "[Engine] Local GPU Engine is RUNNING (PID: ${PID}) on port 8001"
else
    echo "[Engine] Local GPU Engine is STOPPED"
fi

if [ -f "${WORKSPACE_DIR}/proxy.pid" ] && kill -0 $(cat "${WORKSPACE_DIR}/proxy.pid") 2>/dev/null; then
    PID=$(cat "${WORKSPACE_DIR}/proxy.pid")
    echo "[Proxy] VPS Proxy Gateway is RUNNING (PID: ${PID}) on port 8000"
else
    echo "[Proxy] VPS Proxy Gateway is STOPPED"
fi

echo "======================================="
