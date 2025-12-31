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
    return {
        "state": "Running" if opcua_server.is_running else "Stopped",
        "endpoint": opcua_server.endpoint,
        "uptime": "N/A", # Could be tracked in OPCUAServer
        "active_connections": 0 # TODO: Implement real session counting
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
    settings = db.query(ServerSetting).all()
    return {s.key: s.value for s in settings}

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
