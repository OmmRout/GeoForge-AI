import React, { useState } from 'react';
import {
  Eye, Flame, Layers, Crosshair, Activity
} from 'lucide-react';
import { DetectionSummary, DetectedObject } from '../types';
import { getThreatBadgeClass } from '../utils/formatters';

interface VideoFeedProps {
  detections: DetectionSummary | null;
  onSelectTarget?: (target: DetectedObject) => void;
}

export const VideoFeed: React.FC<VideoFeedProps> = ({ detections, onSelectTarget }) => {
  const [viewMode, setViewMode] = useState<'rgb' | 'thermal' | 'contour'>('rgb');
  const [showOverlays, setShowOverlays] = useState<boolean>(true);
  const [selectedTarget, setSelectedTarget] = useState<DetectedObject | null>(null);

  const streamUrl = `/api/v1/vision/stream?view_mode=${viewMode}&t=${Date.now()}`;

  const handleTargetClick = (tgt: DetectedObject) => {
    setSelectedTarget(tgt);
    if (onSelectTarget) onSelectTarget(tgt);
  };

  return (
    <div className="tactical-card rounded-xl flex flex-col h-full overflow-hidden relative">
      {/* Feed Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-[#13151B] border-b border-[#242833] text-xs">
        <div className="flex items-center gap-2">
          <span className="flex h-2 w-2 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
          </span>
          <span className="font-mono-hud font-semibold text-zinc-200">GIMBAL CAM #1 [STREAM]</span>
          <span className="text-[10px] font-mono-hud text-amber-400 bg-amber-500/10 px-1.5 py-0.5 rounded border border-amber-500/30">
            YOLOv8s REALTIME
          </span>
        </div>

        {/* View Mode Switcher */}
        <div className="flex items-center gap-1 bg-[#0B0C10] p-0.5 rounded-lg border border-[#242833] text-[11px] font-mono-hud">
          <button
            onClick={() => setViewMode('rgb')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer ${
              viewMode === 'rgb' ? 'bg-amber-500 text-zinc-950 font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span className="hidden sm:inline">RGB</span>
          </button>

          <button
            onClick={() => setViewMode('thermal')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer ${
              viewMode === 'thermal' ? 'bg-orange-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Flame className="w-3 h-3" />
            <span className="hidden sm:inline">FLIR</span>
          </button>

          <button
            onClick={() => setViewMode('contour')}
            className={`flex items-center gap-1 px-2 py-1 rounded transition cursor-pointer ${
              viewMode === 'contour' ? 'bg-emerald-600 text-white font-bold' : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Layers className="w-3 h-3" />
            <span className="hidden sm:inline">CONTOUR</span>
          </button>
        </div>
      </div>

      {/* Video Canvas Container */}
      <div className="relative flex-1 bg-black overflow-hidden flex items-center justify-center min-h-[260px] sm:min-h-[320px]">
        <img
          key={viewMode}
          src={streamUrl}
          alt="GeoForge Live Aerial Camera Feed"
          className="w-full h-full object-cover select-none pointer-events-none"
          loading="eager"
        />

        {/* Interactive Bounding Boxes Overlay */}
        {showOverlays && detections?.detections.map((tgt) => {
          const leftPercent = tgt.bbox.x_min * 100;
          const topPercent = tgt.bbox.y_min * 100;
          const widthPercent = (tgt.bbox.x_max - tgt.bbox.x_min) * 100;
          const heightPercent = (tgt.bbox.y_max - tgt.bbox.y_min) * 100;

          const isCritical = tgt.threat_level === 'CRITICAL';
          const isHigh = tgt.threat_level === 'HIGH';

          const borderColor = isCritical
            ? 'border-red-500 shadow-sm shadow-red-500/50'
            : isHigh
            ? 'border-amber-400 shadow-sm shadow-amber-400/50'
            : 'border-emerald-400';

          const badgeBg = isCritical ? 'bg-red-600' : isHigh ? 'bg-amber-600' : 'bg-emerald-600';

          return (
            <div
              key={tgt.id}
              onClick={() => handleTargetClick(tgt)}
              className={`absolute border-2 ${borderColor} cursor-pointer transition-all hover:scale-105 group z-20`}
              style={{
                left: `${leftPercent}%`,
                top: `${topPercent}%`,
                width: `${widthPercent}%`,
                height: `${heightPercent}%`
              }}
            >
              <div className="absolute -top-1 -left-1 w-2 h-2 border-t-2 border-l-2 border-white" />
              <div className="absolute -top-1 -right-1 w-2 h-2 border-t-2 border-r-2 border-white" />
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-b-2 border-l-2 border-white" />
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-b-2 border-r-2 border-white" />

              <div className={`absolute -top-6 left-0 flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-mono-hud font-bold text-white ${badgeBg} whitespace-nowrap shadow`}>
                <span>{tgt.label.split(' ')[0]}</span>
                <span>{(tgt.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>
          );
        })}

        {/* Telemetry Corner Readout HUD */}
        <div className="absolute top-2 left-2 pointer-events-none text-[10px] font-mono-hud text-amber-300 bg-[#0B0C10]/85 px-2 py-1 rounded border border-[#242833] backdrop-blur-sm z-10">
          <div>FOV: 84° WIDE-ANGLE</div>
          <div>STAB: 3-AXIS GIMBAL LOCK</div>
        </div>

        <div className="absolute top-2 right-2 pointer-events-none text-[10px] font-mono-hud text-zinc-300 bg-[#0B0C10]/85 px-2 py-1 rounded border border-[#242833] backdrop-blur-sm z-10 flex items-center gap-1.5">
          <Activity className="w-3 h-3 text-emerald-400 animate-pulse" />
          <span>INFERENCE: 28.5 FPS</span>
        </div>

        {/* Selected Target Drawer */}
        {selectedTarget && (
          <div className="absolute bottom-2 left-2 right-2 bg-[#13151B]/95 border border-amber-500/50 rounded-lg p-2.5 z-30 backdrop-blur-md flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-400">
                <Crosshair className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-bold text-zinc-100 flex items-center gap-2">
                  <span>{selectedTarget.label}</span>
                  <span className={`text-[9px] px-1.5 py-0.2 rounded font-mono-hud ${getThreatBadgeClass(selectedTarget.threat_level)}`}>
                    {selectedTarget.threat_level}
                  </span>
                </div>
                <div className="text-[10px] text-zinc-400 font-mono-hud">
                  Est. Dist: {selectedTarget.distance_estimate_m}m • Conf: {(selectedTarget.confidence * 100).toFixed(0)}% • ID: {selectedTarget.id}
                </div>
              </div>
            </div>

            <button
              onClick={() => setSelectedTarget(null)}
              className="px-2 py-1 text-[11px] font-mono-hud bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700 transition cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Feed Bottom Controls Bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-[#13151B] border-t border-[#242833] text-xs">
        <div className="flex items-center gap-2 text-zinc-400 text-[11px] font-mono-hud">
          <span>TARGETS: <strong className="text-amber-300">{detections?.total_detected || 0}</strong></span>
          <span>•</span>
          <span className="text-red-400">CRITICAL: {detections?.critical_hazards || 0}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowOverlays(!showOverlays)}
            className={`px-2 py-1 text-[11px] font-mono-hud rounded transition cursor-pointer ${
              showOverlays ? 'bg-amber-500/15 text-amber-300 border border-amber-500/40' : 'bg-zinc-800 text-zinc-400'
            }`}
          >
            {showOverlays ? 'AI Overlay: ON' : 'AI Overlay: OFF'}
          </button>
        </div>
      </div>
    </div>
  );
};
