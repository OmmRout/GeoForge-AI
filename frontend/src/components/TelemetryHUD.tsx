import React from 'react';
import {
  Wind, Gauge, ArrowUpRight, BatteryCharging,
  MapPin, Zap
} from 'lucide-react';
import { TelemetryFrame } from '../types';
import { formatCoords } from '../utils/formatters';

interface TelemetryHUDProps {
  telemetry: TelemetryFrame | null;
}

export const TelemetryHUD: React.FC<TelemetryHUDProps> = ({ telemetry }) => {
  if (!telemetry) {
    return (
      <div className="tactical-card p-4 rounded-xl flex items-center justify-center min-h-[140px] text-zinc-500 text-sm">
        Initializing telemetry downlink...
      </div>
    );
  }

  const { gps, attitude, battery, weather, speed_kmh, climb_rate_ms } = telemetry;

  const pitchOffset = attitude.pitch_deg * 2.5;
  const rollRotation = -attitude.roll_deg;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
      {/* 1. Artificial Horizon & Attitude Gauge */}
      <div className="tactical-card p-3 rounded-xl flex flex-col justify-between overflow-hidden relative group">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-hud mb-1">
          <span className="flex items-center gap-1">
            <Gauge className="w-3.5 h-3.5 text-amber-400" /> ATTITUDE
          </span>
          <span className="text-[11px] text-amber-300">P:{attitude.pitch_deg.toFixed(1)}° R:{attitude.roll_deg.toFixed(1)}°</span>
        </div>

        {/* Miniature Horizon Sphere */}
        <div className="relative w-full h-20 rounded-lg overflow-hidden bg-[#0B0C10] border border-[#242833] flex items-center justify-center">
          <div
            className="absolute inset-0 flex flex-col transition-transform duration-200 ease-out"
            style={{
              transform: `rotate(${rollRotation}deg) translateY(${pitchOffset}px)`
            }}
          >
            <div className="flex-1 bg-zinc-900/90 border-b border-amber-400/80" />
            <div className="flex-1 bg-amber-950/35" />
          </div>

          <div className="absolute w-8 h-[2px] bg-amber-400 z-10" />
          <div className="absolute w-2 h-2 rounded-full border border-amber-400 z-10" />
        </div>

        <div className="flex justify-between text-[11px] font-mono-hud text-zinc-400 mt-1">
          <span>HDG: <strong className="text-zinc-100">{attitude.heading_deg.toFixed(0)}°</strong></span>
          <span className="text-amber-400">{getCardinalDirection(attitude.heading_deg)}</span>
        </div>
      </div>

      {/* 2. Altitude AGL & MSL */}
      <div className="tactical-card p-3 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-hud">
          <span className="flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400" /> ALTITUDE
          </span>
          <span className="text-[10px] text-emerald-400 font-bold">AGL</span>
        </div>

        <div className="my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono-hud text-zinc-100 tracking-tight">
              {gps.altitude_agl_m.toFixed(0)}
            </span>
            <span className="text-xs text-zinc-400 font-mono-hud">m AGL</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono-hud">
            MSL: <span className="text-zinc-300">{gps.altitude_msl_m.toFixed(0)}m</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-hud text-zinc-400 border-t border-[#242833] pt-1">
          <span>CLIMB RATE</span>
          <span className={climb_rate_ms >= 0 ? 'text-emerald-400' : 'text-amber-400'}>
            {climb_rate_ms >= 0 ? '+' : ''}{climb_rate_ms.toFixed(1)} m/s
          </span>
        </div>
      </div>

      {/* 3. Speed & Ground Kinematics */}
      <div className="tactical-card p-3 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-hud">
          <span className="flex items-center gap-1">
            <Zap className="w-3.5 h-3.5 text-amber-400" /> GROUND SPEED
          </span>
          <span className="text-[10px] text-amber-400">GPS VECT</span>
        </div>

        <div className="my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold font-mono-hud text-amber-300 tracking-tight">
              {speed_kmh.toFixed(1)}
            </span>
            <span className="text-xs text-zinc-400 font-mono-hud">km/h</span>
          </div>
          <div className="text-[11px] text-zinc-400 font-mono-hud">
            Airspeed: <span className="text-zinc-300">{(speed_kmh * 1.05).toFixed(1)} km/h</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-hud text-zinc-400 border-t border-[#242833] pt-1">
          <span>THROTTLE</span>
          <span className="text-zinc-200">58% NOMINAL</span>
        </div>
      </div>

      {/* 4. Battery & Power Reserves */}
      <div className="tactical-card p-3 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-hud">
          <span className="flex items-center gap-1">
            <BatteryCharging className="w-3.5 h-3.5 text-amber-400" /> 6S BATTERY
          </span>
          <span className={`text-[10px] font-bold ${battery.percentage > 30 ? 'text-emerald-400' : 'text-red-400'}`}>
            {battery.percentage.toFixed(0)}%
          </span>
        </div>

        <div className="my-1">
          <div className="w-full bg-zinc-800 rounded-full h-2 overflow-hidden mb-1.5">
            <div
              className={`h-full transition-all duration-300 ${
                battery.percentage > 40 ? 'bg-gradient-to-r from-emerald-500 to-amber-400' : 'bg-red-500'
              }`}
              style={{ width: `${Math.max(5, battery.percentage)}%` }}
            />
          </div>
          <div className="flex justify-between text-[11px] font-mono-hud text-zinc-300">
            <span>{battery.voltage.toFixed(1)} V</span>
            <span className="text-amber-400">{battery.current_draw_amps.toFixed(1)} A</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-hud text-zinc-400 border-t border-[#242833] pt-1">
          <span>EST. TIME</span>
          <span className="text-emerald-400 font-semibold">{battery.estimated_flight_minutes_remaining.toFixed(1)} mins</span>
        </div>
      </div>

      {/* 5. Neo-6M GPS & DGPS Fix */}
      <div className="tactical-card p-3 rounded-xl flex flex-col justify-between">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-hud">
          <span className="flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 text-red-400" /> NEO-6M GPS
          </span>
          <span className="text-[10px] text-amber-400">HDOP {gps.hdop}</span>
        </div>

        <div className="my-1">
          <div className="text-[11px] font-mono-hud text-zinc-200 truncate">
            {formatCoords(gps.latitude, gps.longitude)}
          </div>
          <div className="text-[10px] text-emerald-400 font-mono-hud mt-0.5">
            {gps.fix_type} ({gps.satellites_visible} Sats)
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-hud text-zinc-400 border-t border-[#242833] pt-1">
          <span>LINK RSSI</span>
          <span className="text-zinc-200">{telemetry.signal_strength_rssi_dbm} dBm (99%)</span>
        </div>
      </div>

      {/* 6. Weather & Mountain Wind Vector */}
      <div className="tactical-card p-3 rounded-xl flex flex-col justify-between col-span-2 md:col-span-1">
        <div className="flex items-center justify-between text-xs text-zinc-400 font-mono-hud">
          <span className="flex items-center gap-1">
            <Wind className="w-3.5 h-3.5 text-zinc-300" /> METEOROLOGY
          </span>
          <span className="text-[10px] text-zinc-400">PIR PANJAL</span>
        </div>

        <div className="my-1">
          <div className="flex items-baseline gap-1">
            <span className="text-lg font-bold font-mono-hud text-zinc-100">
              {weather.wind_speed_kmh.toFixed(1)}
            </span>
            <span className="text-[10px] text-zinc-400 font-mono-hud">km/h</span>
            <span className="text-xs text-amber-400 font-mono-hud ml-1">@{weather.wind_direction_deg.toFixed(0)}°</span>
          </div>
          <div className="text-[11px] text-zinc-300 font-mono-hud flex items-center gap-2">
            <span>{weather.air_temperature_c}°C</span>
            <span>•</span>
            <span>{weather.barometric_pressure_hpa} hPa</span>
          </div>
        </div>

        <div className="flex items-center justify-between text-[10px] font-mono-hud text-zinc-400 border-t border-[#242833] pt-1">
          <span>GUST FACTOR</span>
          <span className="text-amber-400 font-semibold">{weather.gust_speed_kmh.toFixed(1)} km/h</span>
        </div>
      </div>
    </div>
  );
};

function getCardinalDirection(deg: number): string {
  const directions = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((deg % 360) / 45) % 8;
  return directions[index];
}
