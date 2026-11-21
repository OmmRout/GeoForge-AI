from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class TargetClass(str, Enum):
    HUMAN = "HUMAN"
    VEHICLE = "VEHICLE"
    LANDSLIDE = "LANDSLIDE"
    ROCKFALL = "ROCKFALL"
    WILDFIRE = "WILDFIRE"
    FLOOD_SURGE = "FLOOD_SURGE"
    ENCAMPMENT = "ENCAMPMENT"
    WILDLIFE = "WILDLIFE"
    UNIDENTIFIED = "UNIDENTIFIED"

class ThreatSeverity(str, Enum):
    NOMINAL = "NOMINAL"
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CRITICAL = "CRITICAL"

class BoundingBox(BaseModel):
    x_min: float  # normalized 0.0 - 1.0
    y_min: float
    x_max: float
    y_max: float

class DetectedObject(BaseModel):
    id: str
    label: str
    category: TargetClass
    confidence: float
    bbox: BoundingBox
    threat_level: ThreatSeverity
    distance_estimate_m: float
    estimated_gps_lat: Optional[float] = None
    estimated_gps_lon: Optional[float] = None
    notes: Optional[str] = None

class DetectionSummary(BaseModel):
    total_detected: int
    critical_hazards: int
    humans_detected: int
    vehicles_detected: int
    highest_threat: ThreatSeverity
    detections: List[DetectedObject]
