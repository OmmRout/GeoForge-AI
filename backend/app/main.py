import asyncio
import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.config import settings
from app.core.rate_limiter import limiter
from app.core.security import SecurityWAFMiddleware
from app.core.websocket_manager import ws_manager
from app.api.v1.api_router import api_router
from app.services.telemetry_simulator import telemetry_simulator
from app.ml.cv_detector import cv_detector
from app.services.agentic_engine import agentic_engine

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("geoforge.main")

# Background telemetry broadcaster task for websockets
async def telemetry_broadcaster():
    logger.info("Starting background WebSocket telemetry broadcaster...")
    while True:
        try:
            if ws_manager.active_connections:
                telemetry = telemetry_simulator.update()
                detections = cv_detector.get_current_detections(
                    telemetry.gps.latitude, telemetry.gps.longitude
                )
                # Check for agentic decisions triggered by live events
                agentic_engine.evaluate_live_state(telemetry.model_dump(), detections.model_dump())

                packet = {
                    "type": "TELEMETRY_UPDATE",
                    "telemetry": telemetry.model_dump(),
                    "detections": detections.model_dump()
                }
                await ws_manager.broadcast_json(packet)
        except Exception as e:
            logger.error(f"Error in telemetry broadcaster: {e}")
        await asyncio.sleep(0.5)  # 2 Hz telemetry stream

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: spawn broadcaster task
    task = asyncio.create_task(telemetry_broadcaster())
    yield
    # Shutdown: cancel task
    task.cancel()
    try:
        await task
    except asyncio.CancelledError:
        pass

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Agentic AI Autonomous Drone Surveillance System for Challenging Terrains",
    lifespan=lifespan
)

# Attach rate limiter
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# CORS middleware for seamless frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Attach security WAF shield and OWASP headers middleware
app.add_middleware(SecurityWAFMiddleware)

# Include API v1 router
app.include_router(api_router, prefix=settings.API_V1_PREFIX)

@app.websocket("/ws/telemetry")
async def websocket_telemetry_endpoint(websocket: WebSocket):
    await ws_manager.connect(websocket)
    try:
        while True:
            # Keep connection alive & accept client ping / command
            data = await websocket.receive_text()
            # echo acknowledgment or handle client messages
    except WebSocketDisconnect:
        ws_manager.disconnect(websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        ws_manager.disconnect(websocket)

import os
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse

# Check potential locations for frontend dist
possible_dist_paths = [
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../../frontend/dist")),
    os.path.abspath(os.path.join(os.path.dirname(__file__), "../../frontend/dist")),
    os.path.abspath("frontend/dist"),
    os.path.abspath("dist"),
]

dist_path = next((p for p in possible_dist_paths if os.path.exists(p) and os.path.isdir(p)), None)

if dist_path:
    logger.info(f"Serving compiled production frontend from {dist_path}")
    assets_path = os.path.join(dist_path, "assets")
    if os.path.exists(assets_path):
        app.mount("/assets", StaticFiles(directory=assets_path), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        # Don't intercept API or docs routes
        if full_path.startswith("api") or full_path.startswith("docs") or full_path.startswith("openapi.json"):
            return None
        file_path = os.path.join(dist_path, full_path)
        if os.path.exists(file_path) and os.path.isfile(file_path):
            return FileResponse(file_path)
        return FileResponse(os.path.join(dist_path, "index.html"))
else:
    @app.get("/")
    def root():
        return {
            "name": settings.PROJECT_NAME,
            "status": "ONLINE",
            "docs_url": "/docs",
            "api_v1": settings.API_V1_PREFIX
        }
