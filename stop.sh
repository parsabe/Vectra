#!/bin/bash
# Stop Vectra AI 3D Forge & VPS Proxy Gateway servers running in the background

WORKSPACE_DIR="/www/wwwroot/vectra.parsabe.com"

echo "=== VECTRA PROTOCOL: STOPPING BACKEND SERVERS ==="

# 1. Stop Engine
if [ -f "${WORKSPACE_DIR}/engine.pid" ]; then
    PID=$(cat "${WORKSPACE_DIR}/engine.pid")
    echo "[Engine] Stopping Local GPU Engine (PID: ${PID})...."
    kill ${PID} 2>/dev/null
    rm -f "${WORKSPACE_DIR}/engine.pid"
    echo "[Engine] Stopped."
else
    # Fallback check
    pgrep -f "uvicorn main:app --host 127.0.0.1 --port 8001" | xargs kill 2>/dev/null
    echo "[Engine] Stopped (via fallback)."
fi

# 2. Stop Proxy
if [ -f "${WORKSPACE_DIR}/proxy.pid" ]; then
    PID=$(cat "${WORKSPACE_DIR}/proxy.pid")
    echo "[Proxy] Stopping VPS Proxy Gateway (PID: ${PID})..."
    kill ${PID} 2>/dev/null
    rm -f "${WORKSPACE_DIR}/proxy.pid"
    echo "[Proxy] Stopped."
else
    # Fallback check
    pgrep -f "uvicorn proxy_server:app --host 0.0.0.0 --port 8000" | xargs kill 2>/dev/null
    echo "[Proxy] Stopped (via fallback)."
fi

echo "=================================================="
