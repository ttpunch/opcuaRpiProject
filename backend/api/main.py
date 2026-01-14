from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import logging
import asyncio
from .routes import auth, nodes, server, health, security
from .context import opcua_server

logging.basicConfig(level=logging.INFO)
_logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Start the OPC UA Server
    _logger.info("Starting OPC UA Server during API startup...")
    task = asyncio.create_task(opcua_server.start())
    yield
    # Shutdown: Stop the OPC UA Server
    _logger.info("Stopping OPC UA Server during API shutdown...")
    await opcua_server.stop()
    await task

app = FastAPI(
    title="RPi OPC UA Management API",
    description="API for managing and monitoring the OPC UA server on Raspberry Pi",
    version="1.0.0",
    lifespan=lifespan
)

# CORS setup - Disabling policy for maximum flexibility
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=False, # Should be False if allow_origins is ["*"] for wide compatibility
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(nodes.router, prefix="/api/nodes", tags=["Nodes"])
app.include_router(server.router, prefix="/api/server", tags=["Server"])
app.include_router(health.router, prefix="/api/health", tags=["Health"])
app.include_router(security.router, prefix="/api/security", tags=["Security"])

@app.get("/")
async def root():
    return {"message": "RPi OPC UA Management API is running", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
