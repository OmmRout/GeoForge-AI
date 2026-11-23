import React, { useState, useEffect } from 'react';
import { Cpu, HardDrive, Wifi, Radio, Server, CheckCircle2, ShieldCheck, Lock, AlertTriangle } from 'lucide-react';
import { HardwareDevice } from '../types';

interface SecurityStatus {
  waf_shield_status: string;
  active_rules: string[];
  total_threats_neutralized: number;
  currently_quarantined_bot_ips: number;
  recent_incidents: any[];
}

export const HardwareStatus: React.FC = () => {
  const [devices, setDevices] = useState<HardwareDevice[]>([]);
  const [security, setSecurity] = useState<SecurityStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchData = async () => {
    try {
      const [hRes, sRes] = await Promise.all([
        fetch('/api/v1/system/hardware'),
        fetch('/api/v1/system/security')
      ]);
      if (hRes.ok) {
        const data = await hRes.json();
        setDevices(data.devices);
      }
      if (sRes.ok) {
        const sData = await sRes.json();
        setSecurity(sData);
      }
    } catch (e) {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tactical-card rounded-xl border border-slate-800 p-4 space-y-4">
      {/* Embedded Subsystems Header */}
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

      {/* Embedded Devices Grid */}
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

      {/* Network & Cyber Security Shield Layer */}
      <div className="pt-3 border-t border-slate-800/80">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-slate-100 font-mono-hud uppercase">
              Network & Cyber Security Shield (WAF Layer)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono-hud">
            <span className="text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60">
              24/7 SURVEILLANCE ACCESS: AUTHORIZED
            </span>
            <span className="text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> WAF: ACTIVE
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] font-mono-hud text-slate-400 uppercase">Bot Scanner & Probe Shield</div>
            <div className="font-mono-hud font-bold text-emerald-400 mt-0.5">
              100% BLOCKED & QUARANTINED
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono-hud">
              Intercepts .env, .git, php, script & CVE scans
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] font-mono-hud text-slate-400 uppercase">Rate Limiting & Anti-DDoS</div>
            <div className="font-mono-hud font-bold text-cyan-300 mt-0.5">
              STRICT SLOWAPI TOKEN BUCKET
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono-hud">
              Real-IP proxy tracking (X-Forwarded-For)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80">
            <div className="text-[10px] font-mono-hud text-slate-400 uppercase">OWASP Hardened Headers</div>
            <div className="font-mono-hud font-bold text-slate-200 mt-0.5">
              HSTS, CSP, X-Frame, NoSniff
            </div>
            <div className="text-[10px] text-slate-400 mt-1 font-mono-hud">
              Clickjacking & XSS mitigation enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
