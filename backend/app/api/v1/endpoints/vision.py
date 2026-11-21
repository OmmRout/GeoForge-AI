import time
from fastapi import APIRouter, Request, UploadFile, File, Query
from fastapi.responses import StreamingResponse
from app.ml.cv_detector import cv_detector
from app.services.telemetry_simulator import telemetry_simulator
from app.models.detection import DetectionSummary
from app.core.rate_limiter import limiter

router = APIRouter()

def frame_generator(view_mode: str = "rgb"):
    """MJPEG frame generator for live aerial drone camera stream."""
    while True:
        frame_bytes = cv_detector.generate_simulated_frame(view_mode=view_mode)
        if frame_bytes:
            yield (b"--frame\r\n"
                   b"Content-Type: image/jpeg\r\n\r\n" + frame_bytes + b"\r\n")
        time.sleep(0.066)  # ~15 FPS for smooth low-bandwidth telemetry stream

@router.get("/stream")
def get_live_stream(view_mode: str = Query("rgb", pattern="^(rgb|thermal|contour)$")):
    """
    Live aerial drone video feed stream (MJPEG).
    Supports modes: 'rgb', 'thermal', 'contour'.
    """
    return StreamingResponse(
        frame_generator(view_mode),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@router.get("/detections", response_model=DetectionSummary)
@limiter.limit("120/minute")
def get_live_detections(request: Request):
    telemetry = telemetry_simulator.update()
    return cv_detector.get_current_detections(
        drone_lat=telemetry.gps.latitude,
        drone_lon=telemetry.gps.longitude
    )

@router.post("/analyze", response_model=DetectionSummary)
@limiter.limit("30/minute")
async def analyze_uploaded_image(
    request: Request,
    file: UploadFile = File(...)
):
    """
    Analyzes an uploaded aerial surveillance image with the GeoForge CV / YOLOv8 demo engine.
    """
    contents = await file.read()
    summary = cv_detector.analyze_image_bytes(contents, filename=file.filename or "uploaded.jpg")
    return summary
