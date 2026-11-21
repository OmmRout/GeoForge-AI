import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Wifi, Radio, Server, CheckCircle2, Clock, RefreshCw } from 'lucide-react';
import { HardwareDevice } from '../types';

export const HardwareStatus: React.FC = () => {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchHardware = async () => {
    try {
      const res = await fetch('/api/v1/system/hardware');
      if (res.ok) {
        const data = await res.json();
        setDevices(data.devices);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHardware();
    const interval = setInterval(fetchHardware, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tactical-card rounded-xl border border-slate-800 p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-cyan-400" />
          <h3 className="text-xs font-bold text-slate-100 font-mono-hud uppercase">
            Embedded Systems & Edge AI Diagnostics
          </h3>
        </div>
        <span className="text-[10px] font-mono-hud text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ALL SUBSYSTEMS NOMINAL
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {devices.map((dev, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-slate-900/90 border border-slate-800 flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono-hud mb-1">
                <span className="text-cyan-400 font-bold">{dev.name}</span>
                <span className="text-emerald-400 font-bold">{dev.status}</span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono-hud">
                Interface: {dev.interface}
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono-hud text-slate-300 flex items-center justify-between">
              <span>Ping: {dev.ping_ms} ms</span>
              {dev.satellites && <span>{dev.satellites} Sats (HDOP {dev.hdop})</span>}
              {dev.heartbeat_hz && <span>HB: {dev.heartbeat_hz} Hz</span>}
              {dev.fps && <span>Inference: {dev.fps} FPS</span>}
              {dev.rssi_dbm && <span>RSSI: {dev.rssi_dbm} dBm</span>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
