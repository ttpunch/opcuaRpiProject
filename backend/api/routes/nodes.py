from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from pydantic import BaseModel
from backend.database.db import get_db
from backend.database.models import Node
from .auth import get_current_user
from ..context import opcua_server

router = APIRouter()

class NodeSourceConfig(BaseModel):
    type: str
    sim_type: Optional[str] = None
    min: Optional[float] = None
    max: Optional[float] = None
    pin: Optional[int] = None
    mode: Optional[str] = None
    initial_value: Optional[float] = None
    # ADC Config
    channel: Optional[int] = None # 0-3 for ADS1115, 0-7 for MCP3008
    gain: Optional[int] = 1 # ADS1115 only
    i2c_address: Optional[int] = 0x48 # ADS1115 only
    cs_pin: Optional[int] = 8 # MCP3008 only (default SPI CE0)

class NodeCreate(BaseModel):
    name: str
    node_id: str
    parent_id: Optional[int] = None
    data_type: str = "Float"
    access_level: str = "CurrentRead"
    source_type: str
    source_config: Optional[dict] = None
    update_interval_ms: int = 1000
    initial_value: Optional[str] = None
    description: Optional[str] = None
    enabled: bool = True

class NodeResponse(NodeCreate):
    id: int
    class Config:
        from_attributes = True

@router.get("/", response_model=List[NodeResponse])
async def get_nodes(db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    return db.query(Node).all()

@router.post("/", response_model=NodeResponse)
async def create_node(node: NodeCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_node = Node(**node.dict())
    db.add(db_node)
    try:
        db.commit()
        db.refresh(db_node)
        
        # Dynamically add to running server
        await opcua_server.add_dynamic_node(db_node)
        
        return db_node
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{node_id}", response_model=NodeResponse)
async def get_node(node_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_node = db.query(Node).filter(Node.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")
    return db_node

@router.put("/{node_id}", response_model=NodeResponse)
async def update_node(node_id: int, node: NodeCreate, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_node = db.query(Node).filter(Node.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    for key, value in node.dict().items():
        setattr(db_node, key, value)
    
    db.commit()
    db.refresh(db_node)
    
    # Dynamically update running server
    await opcua_server.update_dynamic_node(db_node)
    
    return db_node

@router.delete("/{node_id}")
async def delete_node(node_id: int, db: Session = Depends(get_db), current_user = Depends(get_current_user)):
    db_node = db.query(Node).filter(Node.id == node_id).first()
    if not db_node:
        raise HTTPException(status_code=404, detail="Node not found")
    
    # Dynamically remove from running server
    await opcua_server.remove_dynamic_node(db_node.node_id)
    
    db.delete(db_node)
    db.commit()
    return {"message": "Node deleted successfully"}

@router.get("/live/values")
async def get_node_values(current_user = Depends(get_current_user)):
    """Returns current values and error states for all active data sources."""
    results = []
    for node_id, source in opcua_server.data_sources.items():
        # Read current value (this might be slightly delayed by the polling loop but that's fine)
        val = await source.read()
        error = getattr(source, "error", None)
        
        results.append({
            "node_id": node_id,
            "name": source.config.get("name", "Unknown"),
            "value": val,
            "error": error,
            "type": source.config.get("type"),
            "pin": source.config.get("pin")
        })
    return results
