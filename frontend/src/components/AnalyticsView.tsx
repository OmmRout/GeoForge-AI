import React from 'react';
import {
  AreaChart, Area, LineChart, Line, XAxis, YAxis,
  Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { TelemetryFrame } from '../types';
import { Activity, TrendingUp, ShieldAlert, Zap, Wind } from 'lucide-react';

interface AnalyticsViewProps {
  history: { time: string; altitude: number; speed: number; battery: number }[];
  telemetry: TelemetryFrame | null;
}

export const AnalyticsView: React.FC<AnalyticsViewProps> = ({ history, telemetry }) => {
  return (
    <div className="space-y-4">
      {/* Top 3 Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <div className="tactical-card p-3 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono-hud text-zinc-400">
            <span>TERRAIN ESCARPMENT RISK</span>
            <ShieldAlert className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono-hud text-zinc-100 mt-1">
            MODERATE-HIGH (74/100)
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Slope gradient: 44.2° • Scree fault lines monitored
          </div>
        </div>

        <div className="tactical-card p-3 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono-hud text-zinc-400">
            <span>MOTOR THRUST EFFICIENCY</span>
            <Zap className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono-hud text-amber-300 mt-1">
            91.4% OPTIMAL
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Hexacopter ESC telemetry: 0 desync errors
          </div>
        </div>

        <div className="tactical-card p-3 rounded-xl">
          <div className="flex items-center justify-between text-xs font-mono-hud text-zinc-400">
            <span>CROSSWIND SHEAR FACTOR</span>
            <Wind className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono-hud text-emerald-400 mt-1">
            {telemetry?.weather.wind_speed_kmh.toFixed(1) || 22.4} km/h (GUSTS +7)
          </div>
          <div className="text-[11px] text-zinc-400 mt-0.5">
            Auto-stabilizing gimbal within ±0.2° accuracy
          </div>
        </div>
      </div>

      {/* Main Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Altitude Profile Chart */}
        <div className="tactical-card p-4 rounded-xl flex flex-col min-h-[260px]">
          <div className="flex items-center justify-between text-xs font-mono-hud text-zinc-300 mb-2">
            <span className="flex items-center gap-1.5 font-bold">
              <TrendingUp className="w-4 h-4 text-amber-400" /> ALTITUDE PROFILE (METERS AGL)
            </span>
            <span className="text-amber-400 font-bold">
              CURRENT: {telemetry?.gps.altitude_agl_m.toFixed(0) || 145}m
            </span>
          </div>

          <div className="flex-1 w-full min-h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={history}>
                <defs>
                  <linearGradient id="altGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F59E0B" stopOpacity={0.38} />
                    <stop offset="95%" stopColor="#F59E0B" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#242833" />
                <XAxis dataKey="time" stroke="#71717A" tick={{ fontSize: 10 }} />
                <YAxis stroke="#71717A" domain={['auto', 'auto']} tick={{ fontSize: 10 }} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#13151B', borderColor: '#242833', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Area type="monotone" dataKey="altitude" stroke="#F59E0B" strokeWidth={2} fillOpacity={1} fill="url(#altGrad)" name="Altitude AGL" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Speed & Battery Discharge Chart */}
        <div className="tactical-card p-4 rounded-xl flex flex-col min-h-[260px]">
          <div className="flex items-center justify-between text-xs font-mono-hud text-zinc-300 mb-2">
            <span className="flex items-center gap-1.5 font-bold">
              <Activity className="w-4 h-4 text-emerald-400" /> GROUND SPEED (KM/H) & BATTERY (%)
            </span>
            <span className="text-emerald-400 font-bold">
              BAT: {telemetry?.battery.percentage.toFixed(0) || 78}%
            </span>
          </div>

          <div className="flex-1 w-full min-h-[190px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={history}>
                <CartesianGrid strokeDasharray="3 3" stroke="#242833" />
                <XAxis dataKey="time" stroke="#71717A" tick={{ fontSize: 10 }} />
                <YAxis stroke="#71717A" domain={[0, 100]} tick={{ fontSize: 10 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#13151B', borderColor: '#242833', fontSize: '11px', fontFamily: 'monospace' }}
                />
                <Line type="monotone" dataKey="speed" stroke="#F59E0B" strokeWidth={2} dot={false} name="Speed (km/h)" />
                <Line type="monotone" dataKey="battery" stroke="#22C55E" strokeWidth={2} dot={false} name="Battery (%)" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
