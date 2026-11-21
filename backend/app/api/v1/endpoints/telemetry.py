from fastapi import APIRouter, Request
from app.services.telemetry_simulator import telemetry_simulator
from app.models.drone import TelemetryFrame, Waypoint
from app.core.rate_limiter import limiter
from typing import List

router = APIRouter()

@router.get("/current", response_model=TelemetryFrame)
@limiter.limit("300/minute")
def get_current_telemetry(request: Request):
    return telemetry_simulator.update()

@router.get("/waypoints", response_model=List[Waypoint])
@limiter.limit("60/minute")
def get_waypoints(request: Request):
    return telemetry_simulator.waypoints
