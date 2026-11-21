import React, { useState } from 'react';
import { 
  Radio, ShieldAlert, Navigation, Battery, Wifi, 
  ChevronDown, AlertTriangle, Play, Square, Compass, RefreshCw
} from 'lucide-react';
import { TelemetryFrame } from '../types';

interface HeaderProps {
  telemetry: TelemetryFrame | null;
  isConnected: boolean;
  unreadAlertsCount: number;
  onOpenAlerts: () => void;
  onOpenMLTester: () => void;
  onSendCommand: (action: string) => Promise<any>;
}

export const Header: React.FC<HeaderProps> = ({
  telemetry,
  isConnected,
  unreadAlertsCount,
  onOpenAlerts,
  onOpenMLTester,
  onSendCommand
}) => {
  const [fleetOpen, setFleetOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const handleAction = async (action: string) => {
    setActionLoading(action);
    await onSendCommand(action);
    setTimeout(() => setActionLoading(null), 1000);
  };

  return (
    <header className="sticky top-0 z-40 tactical-card border-b border-slate-800 bg-[#080C14]/90 backdrop-blur-md px-3 sm:px-6 py-2.5">
      <div className="flex items-center justify-between gap-3">
        {/* Left: Branding & Drone ID */}
        <div className="flex items-center gap-3">
          <div className="relative flex items-center justify-center w-9 h-9 rounded-lg bg-gradient-to-br from-cyan-500/20 to-blue-600/30 border border-cyan-500/40 text-cyan-400">
            <Navigation className="w-5 h-5 -rotate-45" />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-4 ring-[#080C14] animate-pulse"></span>
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-tactical text-lg sm:text-xl font-bold tracking-wider text-slate-100 flex items-center gap-1.5">
                GEOFORGE <span className="text-cyan-400">AI</span>
              </span>
              <span className="hidden sm:inline-block text-[10px] font-mono-hud uppercase px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-400 border border-cyan-800/60">
                v1.0 MIL-SPEC
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-xs text-slate-400">
              <span className="font-mono-hud text-cyan-300 font-semibold">{telemetry?.drone_id || 'GF-FALCON-01'}</span>
              <span className="text-slate-600">•</span>
              <span className="hidden md:inline truncate max-w-[160px] text-slate-400">
                {telemetry?.drone_name || 'Himalayan Ridge Patrol'}
              </span>
            </div>
          </div>
        </div>

        {/* Middle: Live System Telemetry Status Pills (Desktop & Tablet) */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono-hud bg-slate-900/80 px-3.5 py-1.5 rounded-full border border-slate-800/80">
          <div className="flex items-center gap-1.5">
            <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-red-500'}`} />
            <span className={isConnected ? 'text-emerald-400 font-semibold' : 'text-red-400'}>
              {isConnected ? 'MAVLINK 2.0 (LIVE 2Hz)' : 'LINK SEVERED'}
            </span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Radio className="w-3.5 h-3.5 text-cyan-400" />
            <span>NEO-6M: <strong className="text-slate-100">{telemetry?.gps.satellites_visible || 16} SATS</strong></span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5 text-slate-300">
            <Battery className="w-3.5 h-3.5 text-emerald-400" />
            <span>BAT: <strong className="text-emerald-300">{telemetry?.battery.percentage.toFixed(0) || 78}%</strong></span>
          </div>

          <span className="text-slate-700">|</span>

          <div className="flex items-center gap-1.5">
            <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
              MODE: {telemetry?.mode || 'AUTO'}
            </span>
          </div>
        </div>

        {/* Right: Quick Command Actions */}
        <div className="flex items-center gap-2">
          {/* ML Model Tester button */}
          <button
            onClick={onOpenMLTester}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-cyan-300 border border-slate-700 transition cursor-pointer"
            title="Open YOLOv8 Demo Model Inference Tester"
          >
            <RefreshCw className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Test ML Model</span>
          </button>

          {/* Emergency RTL Button */}
          <button
            onClick={() => handleAction('RTL')}
            disabled={actionLoading === 'RTL'}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold rounded-lg bg-red-600/20 hover:bg-red-600/30 text-red-400 border border-red-500/50 shadow-sm shadow-red-900/30 transition cursor-pointer"
            title="Immediate Return to Launch"
          >
            <AlertTriangle className="w-3.5 h-3.5 text-red-400 animate-pulse" />
            <span>RTL</span>
          </button>

          {/* Loiter / Hold Button */}
          <button
            onClick={() => handleAction(telemetry?.mode === 'LOITER' ? 'AUTO' : 'LOITER')}
            disabled={!!actionLoading}
            className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 text-cyan-300 border border-cyan-800/60 transition cursor-pointer"
          >
            {telemetry?.mode === 'LOITER' ? (
              <>
                <Play className="w-3 h-3 text-cyan-400" />
                <span>Resume Patrol</span>
              </>
            ) : (
              <>
                <Square className="w-3 h-3 text-cyan-400" />
                <span>Loiter Hover</span>
              </>
            )}
          </button>

          {/* Alerts Notification Drawer Trigger */}
          <button
            onClick={onOpenAlerts}
            className="relative p-2 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="View Active Terrain Alerts"
          >
            <ShieldAlert className="w-4 h-4 text-amber-400" />
            {unreadAlertsCount > 0 && (
              <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold bg-red-500 text-white animate-bounce">
                {unreadAlertsCount}
              </span>
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
