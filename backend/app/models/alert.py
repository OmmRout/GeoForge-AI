from pydantic import BaseModel
from typing import Optional
from enum import Enum

class AlertLevel(str, Enum):
    CRITICAL = "CRITICAL"
    WARNING = "WARNING"
    INFO = "INFO"

class AlertStatus(str, Enum):
    ACTIVE = "ACTIVE"
    ACKNOWLEDGED = "ACKNOWLEDGED"
    RESOLVED = "RESOLVED"

class TerrainAlert(BaseModel):
    id: str
    drone_id: str
    timestamp: float
    level: AlertLevel
    category: str
    title: str
    description: str
    gps_lat: float
    gps_lon: float
    status: AlertStatus = AlertStatus.ACTIVE
    action_suggested: Optional[str] = None
