from pydantic import BaseModel
from typing import List

class Settings(BaseModel):
    PROJECT_NAME: str = "GeoForge AI - Autonomous Drone Surveillance System"
    VERSION: str = "1.0.0"
    API_V1_PREFIX: str = "/api/v1"
    CORS_ORIGINS: List[str] = ["*"]
    
    # Rate Limiting configuration
    DEFAULT_RATE_LIMIT: str = "120/minute"
    CV_INFERENCE_RATE_LIMIT: str = "30/minute"
    TELEMETRY_RATE_LIMIT: str = "300/minute"
    
    # Default Coordinates (Rugged Terrain - Rohtang Pass / Pir Panjal Range, Himalayas)
    DEFAULT_LAT: float = 32.3716
    DEFAULT_LON: float = 77.2466
    DEFAULT_ALTITUDE_M: float = 3978.0  # meters above sea level
    
    # Hardware Telemetry Simulation
    SIMULATION_UPDATE_HZ: float = 2.0  # 2 telemetry frames per second

settings = Settings()
