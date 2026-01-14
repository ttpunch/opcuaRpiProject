from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect
import psutil
import time
import asyncio
import json
import os
from .auth import get_current_user

router = APIRouter()

def get_system_temp():
    try:
        with open("/sys/class/thermal/thermal_zone0/temp", "r") as f:
            temp = float(f.read()) / 1000.0
            return round(temp, 1)
    except:
        return 0.0

def get_system_metrics():
    # Attempt to get Pi Model
    model = "N/A"
    try:
        if os.path.exists("/proc/device-tree/model"):
            with open("/proc/device-tree/model", "r") as f:
                model = f.read().strip('\x00')
    except:
        pass

    mem = psutil.virtual_memory()
    disk = psutil.disk_usage('/')
    
    return {
        "cpu_percent": psutil.cpu_percent(interval=None),
        "cpu_count": psutil.cpu_count(),
        "memory_percent": mem.percent,
        "memory_total_gb": round(mem.total / (1024**3), 1),
        "disk_percent": disk.percent,
        "disk_total_gb": round(disk.total / (1024**3), 1),
        "temperature": get_system_temp(),
        "uptime": int(time.time() - psutil.boot_time()),
        "model": model
    }

@router.get("/system")
async def get_system_health(current_user = Depends(get_current_user)):
    return get_system_metrics()

@router.websocket("/stream")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            metrics = get_system_metrics()
            await websocket.send_text(json.dumps(metrics))
            await asyncio.sleep(2)
    except WebSocketDisconnect:
        print("Client disconnected from health stream")
    except Exception as e:
        print(f"WebSocket error: {e}")
        await websocket.close()
