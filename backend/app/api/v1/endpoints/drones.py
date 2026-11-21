from fastapi import APIRouter, HTTPException, Request
from typing import List, Dict, Any
from app.models.drone import FlightCommand, FlightMode
from app.services.telemetry_simulator import telemetry_simulator
from app.core.rate_limiter import limiter

router = APIRouter()

FLEET = [
    {
        "id": "GF-FALCON-01",
        "name": "GeoForge Falcon Alpha (Hexacopter)",
        "role": "Search & Rescue / Hazard Mapping",
        "status": "IN_FLIGHT",
        "battery": 78,
        "location": "Pir Panjal Pass, Himalayas",
        "payload": "YOLOv8 Dual RGB-Thermal Gimbal + Neo-6M RTK"
    },
    {
        "id": "GF-HAWK-02",
        "name": "GeoForge Hawk Beta (Quad VTOL)",
        "role": "Long-Range Forest Fire Perimeter Scan",
        "status": "STANDBY",
        "battery": 94,
        "location": "Base Camp Hangar 2",
        "payload": "Multispectral FLIR + LIDAR Altimeter"
    },
    {
        "id": "GF-EAGLE-03",
        "name": "GeoForge Eagle Gamma (Tethered Relay)",
        "role": "Communications & Emergency Mesh Repeater",
        "status": "ACTIVE_RELAY",
        "battery": 100,
        "location": "Ridge Overlook 4",
        "payload": "ESP32 LoRa Mesh Bridge + 5.8GHz Telemetry Link"
    }
]

@router.get("/fleet")
@limiter.limit("60/minute")
def get_fleet(request: Request):
    return {"fleet": FLEET, "active_drone_id": telemetry_simulator.drone_id}

@router.post("/command")
@limiter.limit("30/minute")
def send_drone_command(request: Request, cmd: FlightCommand):
    result = telemetry_simulator.execute_command(cmd.action, cmd.target_mode)
    if not result.get("success"):
        raise HTTPException(status_code=400, detail=result.get("message"))
    return result
