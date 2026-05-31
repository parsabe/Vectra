#!/bin/bash
# Start Vectra AI 3D Forge & VPS Proxy Gateway servers in the background

WORKSPACE_DIR="/www/wwwroot/vectra.parsabe.com"
VENV_PYTHON="/www/wwwroot/venv/bin/python"

echo "=== VECTRA PROTOCOL: STARTING BACKEND SERVERS ==="

# 1. Start Engine on port 8001
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
    cd ${WORKSPACE_DIR}
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

# 2. Start Proxy on port 8000
PROXY_RUNNING=false
if [ -f "${WORKSPACE_DIR}/proxy.pid" ]; then
    PID=$(cat "${WORKSPACE_DIR}/proxy.pid")
    if kill -0 ${PID} 2>/dev/null; then
        PROXY_RUNNING=true
    fi
fi

if [ "$PROXY_RUNNING" = true ]; then
    echo "[Proxy] VPS Proxy Gateway is already running (PID: ${PID})."
else
    echo "[Proxy] Starting VPS Proxy Gateway on port 8000..."
    cd ${WORKSPACE_DIR}
    nohup ${VENV_PYTHON} -m uvicorn proxy_server:app --host 0.0.0.0 --port 8000 > ${WORKSPACE_DIR}/proxy.log 2>&1 &
    PID=$!
    echo ${PID} > ${WORKSPACE_DIR}/proxy.pid
    sleep 1
    if kill -0 ${PID} 2>/dev/null; then
        echo "[Proxy] Started successfully (PID: ${PID})"
    else
        echo "[Proxy] ERROR: Failed to start. Check ${WORKSPACE_DIR}/proxy.log"
    fi
fi

echo "=================================================="
echo "Servers are running in the background."
echo "- Log files: ${WORKSPACE_DIR}/engine.log, ${WORKSPACE_DIR}/proxy.log"
echo "- PID files: ${WORKSPACE_DIR}/engine.pid, ${WORKSPACE_DIR}/proxy.pid"
echo "To stop them, run: ./stop.sh"
echo "To check status, run: ./status.sh"
