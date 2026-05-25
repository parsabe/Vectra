#!/bin/bash
# Start Vectra AI 3D Forge & VPS Proxy Gateway servers in the background

WORKSPACE_DIR="/www/wwwroot"
VENV_PYTHON="${WORKSPACE_DIR}/venv/bin/python"

echo "=== VECTRA PROTOCOL: STARTING BACKEND SERVERS ==="

# Check if engine is already running
ENGINE_RUNNING=false
if [ -f "${WORKSPACE_DIR}/engine.pid" ]; then
    PID=$(cat "${WORKSPACE_DIR}/engine.pid")
    if kill -0 ${PID} 2>/dev/null; then
        ENGINE_RUNNING=true
    fi
fi

if [ "$ENGINE_RUNNING" = true ]; then
    echo "[Engine] Local GPU Engine is already running (PID: ${PID})."
else
    echo "[Engine] Starting Local GPU Engine on port 8001..."
    nohup ${VENV_PYTHON} -m uvicorn main:app --host 127.0.0.1 --port 8001 > ${WORKSPACE_DIR}/engine.log 2>&1 &
    PID=$!
    echo ${PID} > ${WORKSPACE_DIR}/engine.pid
    sleep 1
    if kill -0 ${PID} 2>/dev/null; then
        echo "[Engine] Started successfully (PID: ${PID})"
    else
        echo "[Engine] ERROR: Failed to start. Check ${WORKSPACE_DIR}/engine.log"
    fi
fi

echo "=================================================="
echo "Servers are running in the background."
echo "- Log files: engine.log, proxy.log"
echo "- PID files: engine.pid, proxy.pid"
echo "To stop them, run: ./stop.sh"
echo "To check status, run: ./status.sh"
