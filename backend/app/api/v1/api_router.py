from fastapi import APIRouter
from app.api.v1.endpoints import drones, telemetry, vision, agent, alerts, system

api_router = APIRouter()

api_router.include_router(drones.router, prefix="/drones", tags=["Drones"])
api_router.include_router(telemetry.router, prefix="/telemetry", tags=["Telemetry"])
api_router.include_router(vision.router, prefix="/vision", tags=["Computer Vision"])
api_router.include_router(agent.router, prefix="/agent", tags=["Agentic AI"])
api_router.include_router(alerts.router, prefix="/alerts", tags=["Terrain Alerts"])
api_router.include_router(system.router, prefix="/system", tags=["System & Hardware"])
