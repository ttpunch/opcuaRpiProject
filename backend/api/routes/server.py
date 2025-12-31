from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from backend.database.db import get_db
from backend.database.models import ServerSetting
from .auth import get_current_user
import subprocess
import os
import asyncio

from ..context import opcua_server

router = APIRouter()

@router.get("/status")
async def get_server_status(current_user = Depends(get_current_user)):
    # Get active sessions from the asyncua server
    connections = []
    if opcua_server.is_running and opcua_server.server:
        try:
            # Try multiple ways to get sessions for compatibility
            sessions = []
            if hasattr(opcua_server.server, "get_sessions"):
                sessions = opcua_server.server.get_sessions()
            elif hasattr(opcua_server.server.iserver, "session_manager"):
                sessions = opcua_server.server.iserver.session_manager.get_sessions()
            elif hasattr(opcua_server.server.iserver, "isession_manager"):
                sessions = opcua_server.server.iserver.isession_manager.get_sessions()
                
            for session in sessions:
                # Basic info from session
                info = getattr(session, "get_session_info", lambda: None)()
                if info:
                    connections.append({
                        "username": info.session_name or "Anonymous",
                        "ip": info.client_address or "Unknown",
                        "connected_since": info.start_time.strftime("%Y-%m-%d %H:%M:%S") if info.start_time else "N/A"
                    })
        except Exception as e:
            print(f"Error fetching sessions in status API: {e}")

    return {
        "state": "Running" if opcua_server.is_running else "Stopped",
        "endpoint": opcua_server.endpoint,
        "uptime": "N/A", # Could be tracked better if needed
        "active_connections": len(connections),
        "connections": connections,
        "last_error": getattr(opcua_server, "last_error", None),
        "instance_id": getattr(opcua_server, "instance_id", "Unknown")
    }

@router.post("/start")
async def start_server(current_user = Depends(get_current_user)):
    if opcua_server.is_running:
        return {"message": "Server is already running"}
    # The server starts automatically with the API, but we could add manual restart logic
    asyncio.create_task(opcua_server.start())
    return {"message": "Server start initiated"}

@router.post("/stop")
async def stop_server(current_user = Depends(get_current_user)):
    await opcua_server.stop()
    return {"message": "Server stop initiated"}

@router.post("/restart")
async def restart_server(current_user = Depends(get_current_user)):
    await opcua_server.stop()
    asyncio.create_task(opcua_server.start())
    return {"message": "Server restart initiated"}

@router.get("/settings")
async def get_settings(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_settings = {s.key: s.value for s in db.query(ServerSetting).all()}
    
    # Define default values
    defaults = {
        "server_name": "RPi OPC UA Server",
        "port": "4840",
        "namespace_uri": "http://raspberry.opcua.server",
        "polling_rate": "1000",
        "alert_cpu": "false",
        "cpu_threshold": "90",
        "alert_cert": "false",
        "cert_expiry_days": "30"
    }
    
    # Merge defaults with db values
    return {**defaults, **db_settings}

@router.put("/settings")
async def update_settings(settings: dict, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    for key, value in settings.items():
        db_setting = db.query(ServerSetting).filter(ServerSetting.key == key).first()
        if db_setting:
            db_setting.value = str(value)
        else:
            db.add(ServerSetting(key=key, value=str(value)))
    db.commit()
    return {"message": "Settings updated"}
