from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Enum, JSON, Text
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

class Role(enum.Enum):
    ADMIN = "Admin"
    OPERATOR = "Operator"
    READONLY = "ReadOnly"

class DataType(enum.Enum):
    BOOLEAN = "Boolean"
    INT16 = "Int16"
    INT32 = "Int32"
    FLOAT = "Float"
    DOUBLE = "Double"
    STRING = "String"
    DATETIME = "DateTime"

class AccessLevel(enum.Enum):
    READ = "CurrentRead"
    WRITE = "CurrentWrite"
    READWRITE = "CurrentReadWrite"

class SourceType(enum.Enum):
    GPIO = "gpio"
    MODBUS = "modbus"
    MQTT = "mqtt"
    MANUAL = "manual"
    SIMULATION = "simulation"
    ADS1115 = "ads1115"
    MCP3008 = "mcp3008"
    MCP3208 = "mcp3208"
    ANALOG = "analog"

class Node(Base):
    __tablename__ = "nodes"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), unique=True, nullable=False)
    node_id = Column(String(100), unique=True, nullable=False)
    parent_id = Column(Integer, ForeignKey("nodes.id"), nullable=True)
    data_type = Column(String(50), default="Float")
    access_level = Column(String(50), default="CurrentRead")
    source_type = Column(String(50))
    source_config = Column(JSON, nullable=True)
    update_interval_ms = Column(Integer, default=1000)
    initial_value = Column(String, nullable=True)
    description = Column(Text, nullable=True)
    enabled = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Scaling configuration for analog inputs
    scale_enabled = Column(Boolean, default=False)
    scale_min = Column(String, nullable=True)  # Engineering min value (e.g., 10)
    scale_max = Column(String, nullable=True)  # Engineering max value (e.g., 100)
    scale_unit = Column(String(20), nullable=True)  # Unit label (bar, °C, psi)
    voltage_min = Column(String, default="0")  # Raw voltage at min
    voltage_max = Column(String, default="3.3")  # Raw voltage at max

    # Self-referential relationship for folder structure
    children = relationship("Node", backref="parent", remote_side=[id])

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True)
    username = Column(String(50), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50), default="Admin")
    certificate_thumbprint = Column(String(64), nullable=True)
    enabled = Column(Boolean, default=True)
    last_login = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

class Certificate(Base):
    __tablename__ = "certificates"
    
    id = Column(Integer, primary_key=True)
    name = Column(String(100), nullable=False)
    cert_type = Column(String(20)) # Server, Client
    thumbprint = Column(String(64), unique=True)
    public_key_pem = Column(Text, nullable=False)
    private_key_pem = Column(Text, nullable=True)
    valid_from = Column(DateTime)
    valid_to = Column(DateTime)
    created_at = Column(DateTime, default=datetime.utcnow)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(Integer, primary_key=True)
    timestamp = Column(DateTime, default=datetime.utcnow, index=True)
    event_type = Column(String(50))
    user = Column(String(50), nullable=True)
    ip_address = Column(String(45), nullable=True)
    node_id = Column(String(100), nullable=True)
    old_value = Column(String, nullable=True)
    new_value = Column(String, nullable=True)
    success = Column(Boolean, default=True)
    details = Column(Text, nullable=True)

class ServerSetting(Base):
    __tablename__ = "server_settings"
    
    key = Column(String(50), primary_key=True)
    value = Column(Text)
    description = Column(Text, nullable=True)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
