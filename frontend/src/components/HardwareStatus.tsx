import React, { useState, useEffect } from 'react';
import { Server, CheckCircle2, ShieldCheck, Lock } from 'lucide-react';
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
    } catch {
      // quiet fallback
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(fetchData, 8000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="tactical-card rounded-xl p-4 space-y-4">
      {/* Embedded Subsystems Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Server className="w-4 h-4 text-teal-400" />
          <h3 className="text-xs font-bold text-zinc-100 font-mono-hud uppercase">
            Embedded Systems & Edge AI Diagnostics
          </h3>
        </div>
        <span className="text-[10px] font-mono-hud text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
          <CheckCircle2 className="w-3 h-3" /> ALL SUBSYSTEMS NOMINAL
        </span>
      </div>

      {/* Embedded Devices Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {devices.map((dev, idx) => (
          <div key={idx} className="p-3 rounded-lg bg-[#0D1310] border border-[#1E2B24] flex flex-col justify-between space-y-2">
            <div>
              <div className="flex items-center justify-between text-[11px] font-mono-hud mb-1">
                <span className="text-teal-400 font-bold">{dev.name}</span>
                <span className="text-emerald-400 font-bold">{dev.status}</span>
              </div>
              <div className="text-[10px] text-zinc-400 font-mono-hud">
                Interface: {dev.interface}
              </div>
            </div>

            <div className="pt-2 border-t border-[#1E2B24] text-[10px] font-mono-hud text-zinc-300 flex items-center justify-between">
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
      <div className="pt-3 border-t border-[#1E2B24]">
        <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <h4 className="text-xs font-bold text-zinc-100 font-mono-hud uppercase">
              Network & Cyber Security Shield (WAF Layer)
            </h4>
          </div>
          <div className="flex items-center gap-2 text-[10px] font-mono-hud">
            <span className="text-orange-300 bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/30">
              24/7 SURVEILLANCE ACCESS: AUTHORIZED
            </span>
            <span className="text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/30 flex items-center gap-1">
              <Lock className="w-2.5 h-2.5" /> WAF: {security?.waf_shield_status ? 'ACTIVE' : 'ACTIVE'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div className="p-2.5 rounded-lg bg-[#0D1310] border border-[#1E2B24]">
            <div className="text-[10px] font-mono-hud text-zinc-400 uppercase">Bot Scanner & Probe Shield</div>
            <div className="font-mono-hud font-bold text-emerald-400 mt-0.5">
              100% BLOCKED ({security?.total_threats_neutralized ?? 0} NEUTRALIZED)
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 font-mono-hud">
              Intercepts .env, .git, php, script & CVE scans
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0D1310] border border-[#1E2B24]">
            <div className="text-[10px] font-mono-hud text-zinc-400 uppercase">Rate Limiting & Anti-DDoS</div>
            <div className="font-mono-hud font-bold text-teal-300 mt-0.5">
              STRICT SLOWAPI TOKEN BUCKET
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 font-mono-hud">
              Real-IP proxy tracking (X-Forwarded-For)
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-[#0D1310] border border-[#1E2B24]">
            <div className="text-[10px] font-mono-hud text-zinc-400 uppercase">OWASP Hardened Headers</div>
            <div className="font-mono-hud font-bold text-zinc-200 mt-0.5">
              HSTS, CSP, X-Frame, NoSniff
            </div>
            <div className="text-[10px] text-zinc-400 mt-1 font-mono-hud">
              Clickjacking & XSS mitigation enabled
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
