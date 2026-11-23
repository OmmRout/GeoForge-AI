import time
from fastapi import APIRouter, Request
from app.core.config import settings
from app.core.rate_limiter import limiter

router = APIRouter()

start_time = time.time()

@router.get("/health")
def health_check():
    return {
        "status": "HEALTHY",
        "system": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "uptime_seconds": round(time.time() - start_time, 1)
    }

@router.get("/hardware")
@limiter.limit("60/minute")
def get_hardware_status(request: Request):
    """
    Status of the embedded drone systems stack:
    - GPS Neo-6M RTK module
    - Pixhawk 4 Autopilot via MAVLink
    - ESP32 Telemetry & LoRa Bridge
    - Raspberry Pi 5 / Jetson Orin Edge AI Computer
    """
    return {
        "devices": [
            {
                "name": "u-blox Neo-6M GPS",
                "interface": "UART @ 38400 baud",
                "status": "LOCK_3D",
                "satellites": 16,
                "hdop": 0.72,
                "ping_ms": 12
            },
            {
                "name": "Pixhawk 4 Autopilot",
                "interface": "MAVLink v2.0 (TELEM1)",
                "status": "ONLINE",
                "heartbeat_hz": 4.0,
                "ekf_status": "OPTIMAL",
                "ping_ms": 8
            },
            {
                "name": "ESP32 LoRa Long-Range Relay",
                "interface": "SPI (SX1276 868MHz)",
                "status": "MESH_ACTIVE",
                "rssi_dbm": -52,
                "packet_loss_percent": 0.2,
                "ping_ms": 18
            },
            {
                "name": "Jetson Orin Nano / RPi5 Edge AI",
                "interface": "Onboard CSI Camera / USB3",
                "status": "INFERENCE_RUNNING",
                "model": "YOLOv8s-Terrain-Custom",
                "fps": 28.5,
                "temp_c": 46.2,
                "gpu_load_percent": 64
            }
        ]
    }

@router.get("/security")
@limiter.limit("60/minute")
def get_security_status(request: Request):
    """
    Returns live WAF shield metrics, threat mitigation stats, and active security rules.
    """
    from app.core.security import security_tracker
    return security_tracker.get_status()
