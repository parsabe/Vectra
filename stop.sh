#!/bin/bash
# Stop Vectra AI 3D Forge & VPS Proxy Gateway servers running in the background

WORKSPACE_DIR="/www/wwwroot"

echo "=== VECTRA PROTOCOL: STOPPING BACKEND SERVERS ==="

if [ -f "${WORKSPACE_DIR}/engine.pid" ]; then
    PID=$(cat "${WORKSPACE_DIR}/engine.pid")
    echo "[Engine] Stopping Local GPU Engine (PID: ${PID})..."
    kill ${PID} 2>/dev/null
    rm -f "${WORKSPACE_DIR}/engine.pid"
    echo "[Engine] Stopped."
else
    # Fallback check
    pgrep -f "uvicorn main:app --host 127.0.0.1 --port 8001" | xargs kill 2>/dev/null
    echo "[Engine] Stopped (via fallback)."
fi

echo "=================================================="
