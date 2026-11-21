import React, { useState } from 'react';
import { 
  X, ShieldAlert, CheckCircle, BellRing, Filter, 
  MapPin, AlertTriangle, ArrowRight, CheckCheck 
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
      <div className="w-full max-w-md h-full tactical-card bg-[#0A0F1D] border-l border-slate-800 shadow-2xl flex flex-col">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-900 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-sm font-bold text-slate-100 font-mono-hud">TERRAIN THREAT ALERTS</h2>
            <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-cyan-300 font-mono-hud">
              {alerts.length}
            </span>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-1.5 p-3 border-b border-slate-800 bg-slate-950/60 text-xs font-mono-hud">
          {['ALL', 'CRITICAL', 'WARNING', 'INFO'].map(lvl => (
            <button
              key={lvl}
              onClick={() => setFilterLevel(lvl)}
              className={`px-2.5 py-1 rounded-md transition cursor-pointer ${
                filterLevel === lvl
                  ? 'bg-cyan-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>

        {/* Alerts List */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {filteredAlerts.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-12">
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
                      ? 'bg-slate-900/90 border-slate-700 shadow-md'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-hud mb-1">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${getThreatBadgeClass(alert.level)}`}>
                      {alert.level}
                    </span>
                    <span className="text-slate-400">{formatTimeAgo(alert.timestamp)}</span>
                  </div>

                  <h4 className="text-xs font-bold text-slate-100 mt-1">{alert.title}</h4>
                  <p className="text-[11px] text-slate-300 mt-1 leading-relaxed">
                    {alert.description}
                  </p>

                  <div className="flex items-center gap-1 text-[10px] font-mono-hud text-cyan-400/90 mt-2">
                    <MapPin className="w-3 h-3" />
                    <span>{formatCoords(alert.gps_lat, alert.gps_lon)}</span>
                  </div>

                  {alert.action_suggested && (
                    <div className="mt-2 p-2 rounded bg-slate-950 border border-slate-800 text-[11px] font-mono-hud text-amber-300/90">
                      Recommendation: {alert.action_suggested}
                    </div>
                  )}

                  {/* Actions Bar */}
                  {isActive && (
                    <div className="flex items-center gap-2 mt-3 pt-2 border-t border-slate-800/80">
                      <button
                        onClick={() => onAcknowledge(alert.id)}
                        className="flex-1 py-1 px-2 text-[11px] font-mono-hud font-semibold rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer flex items-center justify-center gap-1"
                      >
                        <CheckCircle className="w-3 h-3 text-cyan-400" />
                        <span>Acknowledge</span>
                      </button>

                      <button
                        onClick={() => onResolve(alert.id)}
                        className="flex-1 py-1 px-2 text-[11px] font-mono-hud font-semibold rounded bg-emerald-600/30 hover:bg-emerald-600/50 text-emerald-300 border border-emerald-500/40 transition cursor-pointer flex items-center justify-center gap-1"
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
