from pydantic import BaseModel, Field
from typing import List, Optional
from enum import Enum

class FlightMode(str, Enum):
    AUTO = "AUTO"
    GUIDED = "GUIDED"
    LOITER = "LOITER"
    RTL = "RTL"  # Return to Launch
    LAND = "LAND"
    TAKEOFF = "TAKEOFF"
    MANUAL = "MANUAL"

class DroneStatus(str, Enum):
    ARMED_IN_FLIGHT = "ARMED_IN_FLIGHT"
    HOVERING = "HOVERING"
    RETURNING_TO_BASE = "RETURNING_TO_BASE"
    EMERGENCY_LANDING = "EMERGENCY_LANDING"
    DISARMED = "DISARMED"

class GPSData(BaseModel):
    latitude: float
    longitude: float
    altitude_msl_m: float  # Mean Sea Level
    altitude_agl_m: float  # Above Ground Level
    satellites_visible: int = 14
    hdop: float = 0.8  # Horizontal Dilution of Precision
    fix_type: str = "3D Fix (Neo-6M)"

class AttitudeData(BaseModel):
    pitch_deg: float
    roll_deg: float
    yaw_deg: float
    heading_deg: float

class BatteryData(BaseModel):
    percentage: float
    voltage: float
    current_draw_amps: float
    estimated_flight_minutes_remaining: float
    temperature_celsius: float

class WeatherTelemetry(BaseModel):
    wind_speed_kmh: float
    wind_direction_deg: float
    gust_speed_kmh: float
    air_temperature_c: float
    humidity_percent: float
    barometric_pressure_hpa: float
    visibility_km: float

class TelemetryFrame(BaseModel):
    drone_id: str
    drone_name: str
    timestamp: float
    status: DroneStatus
    mode: FlightMode
    is_armed: bool
    speed_kmh: float
    climb_rate_ms: float
    gps: GPSData
    attitude: AttitudeData
    battery: BatteryData
    weather: WeatherTelemetry
    signal_strength_rssi_dbm: int = -54
    link_quality_percent: int = 98

class Waypoint(BaseModel):
    id: int
    name: str
    latitude: float
    longitude: float
    altitude_m: float
    action: str = "WAYPOINT"
    reached: bool = False

class FlightCommand(BaseModel):
    drone_id: str
    action: str  # RTL, TAKEOFF, LAND, SET_MODE, LOITER, RESUME_PATROL
    target_mode: Optional[FlightMode] = None
    target_altitude: Optional[float] = None
