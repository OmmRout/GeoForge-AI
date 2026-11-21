from fastapi import APIRouter, Request, HTTPException
from typing import List, Optional
from app.models.alert import TerrainAlert, AlertLevel, AlertStatus
from app.services.alert_service import alert_service
from app.core.rate_limiter import limiter

router = APIRouter()

@router.get("", response_model=List[TerrainAlert])
@limiter.limit("120/minute")
def get_alerts(
    request: Request,
    level: Optional[AlertLevel] = None,
    status: Optional[AlertStatus] = None
):
    return alert_service.get_all(level=level, status=status)

@router.post("/{alert_id}/acknowledge")
@limiter.limit("60/minute")
def acknowledge_alert(request: Request, alert_id: str):
    success = alert_service.acknowledge_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True, "message": f"Alert {alert_id} acknowledged by pilot."}

@router.post("/{alert_id}/resolve")
@limiter.limit("60/minute")
def resolve_alert(request: Request, alert_id: str):
    success = alert_service.resolve_alert(alert_id)
    if not success:
        raise HTTPException(status_code=404, detail="Alert not found")
    return {"success": True, "message": f"Alert {alert_id} marked as resolved."}
