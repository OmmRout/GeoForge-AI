import time
import math
import random
from typing import Dict, List, Optional, Any
from app.models.drone import (
    TelemetryFrame, FlightMode, DroneStatus, GPSData, AttitudeData, 
    BatteryData, WeatherTelemetry, Waypoint
)
from app.core.config import settings

class TelemetrySimulator:
    def __init__(self):
        self.drone_id = "GF-FALCON-01"
        self.drone_name = "GeoForge Falcon Alpha (Hexacopter)"
        self.mode = FlightMode.AUTO
        self.status = DroneStatus.ARMED_IN_FLIGHT
        self.is_armed = True
        
        # Rohtang Pass Base Coordinates (Himalayan rugged terrain)
        self.base_lat = settings.DEFAULT_LAT
        self.base_lon = settings.DEFAULT_LON
        self.current_lat = self.base_lat
        self.current_lon = self.base_lon
        
        self.altitude_agl = 145.0  # Above ground level in meters
        self.altitude_msl = settings.DEFAULT_ALTITUDE_M + self.altitude_agl
        
        self.speed_kmh = 38.5
        self.heading = 45.0
        self.pitch = -2.4
        self.roll = 1.8
        self.yaw = 45.0
        
        self.battery_percent = 78.5
        self.battery_voltage = 22.8  # 6S LiPo
        self.current_draw = 24.5  # Amps
        
        self.start_time = time.time()
        self.last_update = time.time()
        self.patrol_step = 0.0

        # Predefined Mountain Waypoints
        self.waypoints: List[Waypoint] = [
            Waypoint(id=1, name="WP-1 Base Camp Launch", latitude=32.3716, longitude=77.2466, altitude_m=120.0, reached=True),
            Waypoint(id=2, name="WP-2 Eastern Ridge Crest", latitude=32.3748, longitude=77.2510, altitude_m=160.0, reached=True),
            Waypoint(id=3, name="WP-3 Glacier Moraine Valley", latitude=32.3792, longitude=77.2538, altitude_m=180.0, reached=False),
            Waypoint(id=4, name="WP-4 Escarpment Hazard Overlook", latitude=32.3820, longitude=77.2490, altitude_m=210.0, reached=False),
            Waypoint(id=5, name="WP-5 Southern Pass Observation", latitude=32.3760, longitude=77.2425, altitude_m=150.0, reached=False),
        ]

    def update(self) -> TelemetryFrame:
        now = time.time()
        dt = min(1.0, now - self.last_update)
        self.last_update = now

        # Update flight physics based on mode
        if self.mode == FlightMode.AUTO:
            self.patrol_step += 0.02 * dt
            # Circular-elliptical patrol path around the mountain valley
            radius_lat = 0.008
            radius_lon = 0.012
            self.current_lat = self.base_lat + radius_lat * math.sin(self.patrol_step)
            self.current_lon = self.base_lon + radius_lon * math.cos(self.patrol_step * 0.8)
            
            # Dynamic terrain altitude variations (flying over ridges)
            self.altitude_agl = 130.0 + 35.0 * math.sin(self.patrol_step * 2.0) + random.uniform(-1.0, 1.0)
            self.altitude_msl = settings.DEFAULT_ALTITUDE_M + self.altitude_agl
            self.speed_kmh = 36.0 + 4.0 * math.cos(self.patrol_step * 1.5)
            self.heading = (math.degrees(self.patrol_step) + 90) % 360
            self.pitch = -2.0 + 1.5 * math.sin(self.patrol_step * 3.0)
            self.roll = 2.5 * math.sin(self.patrol_step * 2.0)

        elif self.mode == FlightMode.LOITER:
            self.speed_kmh = max(0.5, self.speed_kmh * 0.9)
            self.pitch = random.uniform(-0.5, 0.5)
            self.roll = random.uniform(-0.5, 0.5)
            # Hover in place with slight wind drift

        elif self.mode == FlightMode.RTL:
            # Fly directly towards base camp
            d_lat = self.base_lat - self.current_lat
            d_lon = self.base_lon - self.current_lon
            dist = math.hypot(d_lat, d_lon)
            if dist > 0.0005:
                self.current_lat += (d_lat / dist) * 0.0003 * dt
                self.current_lon += (d_lon / dist) * 0.0003 * dt
                self.speed_kmh = 42.0
                self.heading = math.degrees(math.atan2(d_lon, d_lat)) % 360
            else:
                self.mode = FlightMode.LAND
                self.status = DroneStatus.EMERGENCY_LANDING

        elif self.mode == FlightMode.LAND:
            self.altitude_agl = max(0.0, self.altitude_agl - 2.5 * dt)
            self.altitude_msl = settings.DEFAULT_ALTITUDE_M + self.altitude_agl
            self.speed_kmh = 0.0
            if self.altitude_agl <= 0.5:
                self.is_armed = False
                self.status = DroneStatus.DISARMED

        # Battery slow discharge
        self.battery_percent = max(0.0, self.battery_percent - 0.015 * dt)
        self.battery_voltage = 19.5 + (self.battery_percent / 100.0) * (25.2 - 19.5)
        remaining_minutes = (self.battery_percent / 100.0) * 28.0  # max 28 min flight

        # Weather simulation
        wind_speed = 22.4 + 6.0 * math.sin(now * 0.05) + random.uniform(-2, 2)
        wind_dir = (280 + 15 * math.sin(now * 0.03)) % 360
        gust = wind_speed + random.uniform(4.0, 9.0)

        return TelemetryFrame(
            drone_id=self.drone_id,
            drone_name=self.drone_name,
            timestamp=now,
            status=self.status,
            mode=self.mode,
            is_armed=self.is_armed,
            speed_kmh=round(self.speed_kmh, 1),
            climb_rate_ms=round(random.uniform(-0.4, 0.4), 2),
            gps=GPSData(
                latitude=round(self.current_lat, 6),
                longitude=round(self.current_lon, 6),
                altitude_msl_m=round(self.altitude_msl, 1),
                altitude_agl_m=round(self.altitude_agl, 1),
                satellites_visible=16,
                hdop=0.72,
                fix_type="3D DGPS Fix (Neo-6M RTK)"
            ),
            attitude=AttitudeData(
                pitch_deg=round(self.pitch, 1),
                roll_deg=round(self.roll, 1),
                yaw_deg=round(self.heading, 1),
                heading_deg=round(self.heading, 1)
            ),
            battery=BatteryData(
                percentage=round(self.battery_percent, 1),
                voltage=round(self.battery_voltage, 2),
                current_draw_amps=round(self.current_draw + random.uniform(-1.0, 1.0), 1),
                estimated_flight_minutes_remaining=round(remaining_minutes, 1),
                temperature_celsius=round(24.0 + (100 - self.battery_percent) * 0.12, 1)
            ),
            weather=WeatherTelemetry(
                wind_speed_kmh=round(wind_speed, 1),
                wind_direction_deg=round(wind_dir, 1),
                gust_speed_kmh=round(gust, 1),
                air_temperature_c=round(3.2 + random.uniform(-0.2, 0.2), 1),
                humidity_percent=68.0,
                barometric_pressure_hpa=642.5,  # High altitude pressure
                visibility_km=14.5
            ),
            signal_strength_rssi_dbm=-52,
            link_quality_percent=99
        )

    def execute_command(self, action: str, target_mode: Optional[FlightMode] = None) -> Dict[str, Any]:
        action = action.upper()
        if action == "RTL":
            self.mode = FlightMode.RTL
            self.status = DroneStatus.RETURNING_TO_BASE
            return {"success": True, "message": "Return to Launch (RTL) activated. Ascending to clear terrain obstacle ceiling."}
        elif action == "LOITER" or action == "HOLD":
            self.mode = FlightMode.LOITER
            self.status = DroneStatus.HOVERING
            return {"success": True, "message": "Loiter mode engaged. Drone holding 3D position over coordinates."}
        elif action == "AUTO" or action == "RESUME_PATROL":
            self.mode = FlightMode.AUTO
            self.status = DroneStatus.ARMED_IN_FLIGHT
            return {"success": True, "message": "Autonomous patrol mission resumed. Tracking waypoints WP-3 to WP-5."}
        elif action == "LAND":
            self.mode = FlightMode.LAND
            self.status = DroneStatus.EMERGENCY_LANDING
            return {"success": True, "message": "Landing sequence initiated at current position."}
        elif action == "TAKEOFF":
            self.is_armed = True
            self.altitude_agl = 80.0
            self.mode = FlightMode.AUTO
            self.status = DroneStatus.ARMED_IN_FLIGHT
            return {"success": True, "message": "Motors armed. Ascending to operational ceiling 80m AGL."}
        elif action == "SET_MODE" and target_mode:
            self.mode = target_mode
            return {"success": True, "message": f"Flight mode switched to {target_mode.value}"}
        
        return {"success": False, "message": f"Unknown action: {action}"}

telemetry_simulator = TelemetrySimulator()
