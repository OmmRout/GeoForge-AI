import React, { useState } from 'react';
import {
  X, ShieldAlert, CheckCircle, MapPin, CheckCheck
} from 'lucide-react';
import { TerrainAlert } from '../types';
import { formatTimeAgo, formatCoords, getThreatBadgeClass } from '../utils/formatters';

interface AlertsDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  alerts: TerrainAlert[];
  onAcknowledge: (id: string) => void;
  onResolve: (id: string) => void;
}

export const AlertsDrawer: React.FC<AlertsDrawerProps> = ({
  isOpen,
  onClose,
  alerts,
  onAcknowledge,
  onResolve
}) => {
  const [filterLevel, setFilterLevel] = useState<string>('ALL');

  if (!isOpen) return null;

  const filteredAlerts = alerts.filter(a => {
    if (filterLevel === 'ALL') return true;
    return a.level === filterLevel;
  });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md h-full tactical-card bg-[#090D0B] border-l border-[#1E2B24] shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-[#111814] border-b border-[#1E2B24]">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-orange-400" />
            <h2 className="text-sm font-bold text-zinc-100 font-mono-hud">TERRAIN THREAT ALERTS</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-[#090D0B] text-teal-300 border border-[#1E2B24] font-mono-hud">
              {alerts.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-[#090D0B] hover:bg-[#19231D] text-zinc-400 hover:text-white border border-[#1E2B24] transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-3 border-b border-[#1E2B24] bg-[#0D1310] text-xs font-mono-hud">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-teal-500 text-zinc-950 font-bold'
                  : 'bg-[#111814] text-zinc-400 hover:text-zinc-200 border border-[#1E2B24]'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-zinc-500 text-xs py-12">
              No alerts matching the selected filter.
            </div>
          ) : (
            filteredAlerts.map(alert => {
              const isActive = alert.status === 'ACTIVE';
              return (
                <div
                  key={alert.id}
                  className={`p-3 rounded-xl border transition ${
                    isActive
                      ? 'bg-[#111814] border-[#1E2B24] shadow-md'
                      : 'bg-[#0D1310]/60 border-[#1E2B24]/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-hud mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getThreatBadgeClass(alert.level)}`}>
                      {alert.level}
                    </span>
                    <span className="text-zinc-400">{formatTimeAgo(alert.timestamp)}</span>
                  </div>

                  <h4 className="text-xs font-bold text-zinc-100 mt-1">{alert.title}</h4>
                  <p className="text-[11px] text-zinc-300 mt-1 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] font-mono-hud text-teal-400/90 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{formatCoords(alert.gps_lat, alert.gps_lon)}</span>
                  </div>

                  {alert.action_suggested && (
                    <div className="mt-2 p-2 rounded bg-[#090D0B] border border-[#1E2B24] text-[11px] font-mono-hud text-orange-300/90">
                      Recommendation: {alert.action_suggested}
                    </div>
                  )}

                  {isActive && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-[#1E2B24]">
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="flex-1 py-1 px-2 text-[11px] font-mono-hud font-semibold rounded bg-[#090D0B] hover:bg-[#19231D] text-zinc-200 border border-[#1E2B24] transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3 text-teal-400" />
                        <span>Acknowledge</span>
                      </button>

                      <button
                        onClick={() => onResolve(alert.id)}
                        className="flex-1 py-1 px-2 text-[11px] font-mono-hud font-semibold rounded bg-emerald-600/25 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCheck className="w-3 h-3 text-emerald-400" />
                        <span>Resolve</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
