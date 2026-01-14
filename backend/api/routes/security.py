from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime
from sqlalchemy.orm import Session
from typing import List
from pydantic import BaseModel
from backend.database.db import get_db
from backend.database.models import User, Certificate, AuditLog
from .auth import get_current_user
from backend.opcua_server.security import SecurityManager

router = APIRouter()

class UserResponse(BaseModel):
    id: int
    username: str
    role: str
    enabled: bool
    class Config:
        from_attributes = True

class CertificateResponse(BaseModel):
    id: int
    name: str
    cert_type: str
    thumbprint: str
    valid_to: datetime
    class Config:
        from_attributes = True

@router.get("/users", response_model=List[UserResponse])
async def get_users(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(User).all()

@router.get("/certificates", response_model=List[CertificateResponse])
async def get_certificates(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Certificate).all()

@router.get("/audit-logs")
async def get_audit_logs(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    if current_user.role != "Admin":
        raise HTTPException(status_code=403, detail="Not authorized")
    return db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(100).all()

@router.post("/certificates/generate")
async def generate_cert(name: str, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    # Logic to trigger security manager certification generation
    return {"message": "Certificate generation initiated"}
