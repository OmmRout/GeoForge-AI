export type FlightMode = "AUTO" | "GUIDED" | "LOITER" | "RTL" | "LAND" | "TAKEOFF" | "MANUAL";

export type DroneStatus = "ARMED_IN_FLIGHT" | "HOVERING" | "RETURNING_TO_BASE" | "EMERGENCY_LANDING" | "DISARMED";

export type ThreatSeverity = "NOMINAL" | "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export type TargetCategory = "HUMAN" | "VEHICLE" | "LANDSLIDE" | "ROCKFALL" | "WILDFIRE" | "FLOOD_SURGE" | "ENCAMPMENT" | "WILDLIFE" | "UNIDENTIFIED";

export interface GPSData {
  latitude: number;
  longitude: number;
  altitude_msl_m: number;
  altitude_agl_m: number;
  satellites_visible: number;
  hdop: number;
  fix_type: string;
}

export interface AttitudeData {
  pitch_deg: number;
  roll_deg: number;
  yaw_deg: number;
  heading_deg: number;
}

export interface BatteryData {
  percentage: number;
  voltage: number;
  current_draw_amps: number;
  estimated_flight_minutes_remaining: number;
  temperature_celsius: number;
}

export interface WeatherTelemetry {
  wind_speed_kmh: number;
  wind_direction_deg: number;
  gust_speed_kmh: number;
  air_temperature_c: number;
  humidity_percent: number;
  barometric_pressure_hpa: number;
  visibility_km: number;
}

export interface TelemetryFrame {
  drone_id: string;
  drone_name: string;
  timestamp: number;
  status: DroneStatus;
  mode: FlightMode;
  is_armed: boolean;
  speed_kmh: number;
  climb_rate_ms: number;
  gps: GPSData;
  attitude: AttitudeData;
  battery: BatteryData;
  weather: WeatherTelemetry;
  signal_strength_rssi_dbm: number;
  link_quality_percent: number;
}

export interface BoundingBox {
  x_min: number;
  y_min: number;
  x_max: number;
  y_max: number;
}

export interface DetectedObject {
  id: string;
  label: string;
  category: TargetCategory;
  confidence: number;
  bbox: BoundingBox;
  threat_level: ThreatSeverity;
  distance_estimate_m: number;
  estimated_gps_lat?: number;
  estimated_gps_lon?: number;
  notes?: string;
}

export interface DetectionSummary {
  total_detected: number;
  critical_hazards: number;
  humans_detected: number;
  vehicles_detected: number;
  highest_threat: ThreatSeverity;
  detections: DetectedObject[];
}

export interface ReasoningStep {
  step_number: number;
  component: string;
  thought: string;
  evidence: string;
  confidence: number;
}

export interface AgentDecision {
  id: string;
  timestamp: number;
  drone_id: string;
  action_type: string;
  headline: string;
  summary: string;
  reasoning_steps: ReasoningStep[];
  recommended_action: string;
  risk_score: number;
  auto_executed: boolean;
  requires_pilot_ack: boolean;
}

export interface TerrainAlert {
  id: string;
  drone_id: string;
  timestamp: number;
  level: "CRITICAL" | "WARNING" | "INFO";
  category: string;
  title: string;
  description: string;
  gps_lat: number;
  gps_lon: number;
  status: "ACTIVE" | "ACKNOWLEDGED" | "RESOLVED";
  action_suggested?: string;
}

export interface Waypoint {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  altitude_m: number;
  action: string;
  reached: boolean;
}

export interface DroneInfo {
  id: string;
  name: string;
  role: string;
  status: string;
  battery: number;
  location: string;
  payload: string;
}

export interface HardwareDevice {
  name: string;
  interface: string;
  status: string;
  satellites?: number;
  hdop?: number;
  heartbeat_hz?: number;
  rssi_dbm?: number;
  fps?: number;
  temp_c?: number;
  ping_ms: number;
}
