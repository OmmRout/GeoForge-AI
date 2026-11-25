import React, { useState } from 'react';
import {
  X, UploadCloud, Cpu, AlertTriangle, CheckCircle2, RefreshCw
} from 'lucide-react';
import { DetectionSummary } from '../types';
import { getThreatBadgeClass, playTacticalBeep } from '../utils/formatters';

interface MLTestingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const MLTestingModal: React.FC<MLTestingModalProps> = ({ isOpen, onClose }) => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [results, setResults] = useState<DetectionSummary | null>(null);
  const [rateLimitNotice, setRateLimitNotice] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setSelectedFile(file);
      setImagePreview(URL.createObjectURL(file));
      setResults(null);
      setRateLimitNotice(null);
    }
  };

  const runInference = async (fileToUpload?: File) => {
    const file = fileToUpload || selectedFile;
    setLoading(true);
    setRateLimitNotice(null);
    playTacticalBeep(800, 0.05);

    try {
      const formData = new FormData();
      if (file) {
        formData.append('file', file);
      } else {
        const canvas = document.createElement('canvas');
        canvas.width = 640;
        canvas.height = 360;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#27272A';
          ctx.fillRect(0, 0, 640, 140);
          ctx.fillStyle = '#3F3F46';
          ctx.fillRect(0, 140, 640, 220);
        }
        const blob = await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b!), 'image/jpeg'));
        formData.append('file', blob, 'sample_aerial_terrain.jpg');
      }

      const res = await fetch('/api/v1/vision/analyze', {
        method: 'POST',
        body: formData
      });

      if (res.status === 429) {
        setRateLimitNotice('Rate limit exceeded (30 requests/min). SlowAPI token throttling active to protect edge compute.');
        return;
      }

      if (res.ok) {
        const data: DetectionSummary = await res.json();
        setResults(data);
        playTacticalBeep(1020, 0.08);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadScenario = (scenarioName: string, type: 'hiker' | 'landslide' | 'fire') => {
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = 360;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    if (type === 'hiker') {
      ctx.fillStyle = '#E4E4E7';
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#52525B';
      ctx.fillRect(0, 200, 640, 160);
      ctx.fillStyle = '#EA580C';
      ctx.beginPath();
      ctx.arc(280, 180, 14, 0, Math.PI * 2);
      ctx.fill();
    } else if (type === 'fire') {
      ctx.fillStyle = '#14532D';
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#DC2626';
      ctx.beginPath();
      ctx.arc(360, 160, 28, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#F59E0B';
      ctx.beginPath();
      ctx.arc(360, 160, 15, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.fillStyle = '#78350F';
      ctx.fillRect(0, 0, 640, 360);
      ctx.fillStyle = '#451A03';
      ctx.fillRect(200, 120, 240, 120);
    }

    canvas.toBlob((blob) => {
      if (blob) {
        const file = new File([blob], `${scenarioName}.jpg`, { type: 'image/jpeg' });
        setSelectedFile(file);
        setImagePreview(URL.createObjectURL(file));
        runInference(file);
      }
    }, 'image/jpeg');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="tactical-card w-full max-w-4xl max-h-[90vh] rounded-2xl border border-amber-500/40 shadow-2xl flex flex-col overflow-hidden bg-[#0B0C10]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3.5 bg-[#13151B] border-b border-[#242833]">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-amber-500/15 border border-amber-500/40 text-amber-400">
              <Cpu className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-zinc-100 flex items-center gap-2">
                GeoForge YOLOv8 Edge Inference Lab
                <span className="text-[10px] font-mono-hud px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/30">
                  DEMO CV MODEL
                </span>
              </h2>
              <p className="text-xs text-zinc-400">
                Test computer vision model with rate-limited API, OpenCV feature extraction & bounding box localization.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
          {rateLimitNotice && (
            <div className="p-3 rounded-lg bg-amber-500/20 border border-amber-500/50 text-amber-300 text-xs flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 flex-shrink-0" />
              <span>{rateLimitNotice}</span>
            </div>
          )}

          {/* Quick Scenario Buttons */}
          <div>
            <div className="text-xs font-mono-hud text-zinc-400 mb-2 font-bold uppercase">
              1-Click Terrain Test Scenarios:
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              <button
                onClick={() => loadScenario('alpine_hiker_distress', 'hiker')}
                className="p-2.5 rounded-xl bg-[#13151B] hover:bg-zinc-800/80 border border-[#242833] hover:border-amber-500/60 text-left transition cursor-pointer text-xs"
              >
                <div className="font-bold text-zinc-200">Alpine Snow Hiker</div>
                <div className="text-[11px] text-zinc-400 font-mono-hud">Search & Rescue High Contrast</div>
              </button>

              <button
                onClick={() => loadScenario('scree_slope_landslide', 'landslide')}
                className="p-2.5 rounded-xl bg-[#13151B] hover:bg-zinc-800/80 border border-[#242833] hover:border-amber-500/60 text-left transition cursor-pointer text-xs"
              >
                <div className="font-bold text-zinc-200">Landslide Escarpment</div>
                <div className="text-[11px] text-zinc-400 font-mono-hud">Rockfall & Slope Fracture</div>
              </button>

              <button
                onClick={() => loadScenario('forest_fire_hotspot', 'fire')}
                className="p-2.5 rounded-xl bg-[#13151B] hover:bg-zinc-800/80 border border-[#242833] hover:border-red-500/60 text-left transition cursor-pointer text-xs"
              >
                <div className="font-bold text-zinc-200">Ridge Wildfire Hotspot</div>
                <div className="text-[11px] text-zinc-400 font-mono-hud">Thermal IR Plume Detection</div>
              </button>
            </div>
          </div>

          {/* Upload or Dropzone */}
          <div className="relative border-2 border-dashed border-zinc-700 hover:border-amber-500/60 rounded-xl p-4 sm:p-6 text-center bg-[#13151B]/60 transition">
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <UploadCloud className="w-8 h-8 text-amber-400 mx-auto mb-2" />
            <div className="text-xs font-semibold text-zinc-200">
              Drag & drop custom aerial imagery, or click to browse
            </div>
            <div className="text-[11px] text-zinc-500 font-mono-hud mt-1">
              Supports JPEG, PNG, WEBP (Processed via OpenCV Canny & Contour Analysis)
            </div>
          </div>

          {/* Image & Bounding Boxes Preview Canvas */}
          {imagePreview && (
            <div className="relative rounded-xl overflow-hidden border border-[#242833] bg-black min-h-[220px] max-h-[360px] flex items-center justify-center">
              <img
                src={imagePreview}
                alt="Analyzed Terrain"
                className="w-full h-full object-contain max-h-[340px]"
              />

              {results?.detections.map((d) => {
                const isCrit = d.threat_level === 'CRITICAL';
                return (
                  <div
                    key={d.id}
                    className={`absolute border-2 ${isCrit ? 'border-red-500 shadow-md shadow-red-500/60' : 'border-amber-400'}`}
                    style={{
                      left: `${d.bbox.x_min * 100}%`,
                      top: `${d.bbox.y_min * 100}%`,
                      width: `${(d.bbox.x_max - d.bbox.x_min) * 100}%`,
                      height: `${(d.bbox.y_max - d.bbox.y_min) * 100}%`
                    }}
                  >
                    <div className={`absolute -top-5 left-0 px-1 py-0.5 rounded text-[9px] font-mono-hud font-bold text-white ${isCrit ? 'bg-red-600' : 'bg-amber-600'} whitespace-nowrap`}>
                      {d.label} ({(d.confidence * 100).toFixed(0)}%)
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Action Button */}
          {imagePreview && (
            <div className="flex justify-end">
              <button
                onClick={() => runInference()}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-zinc-950 text-xs font-bold font-mono-hud transition cursor-pointer shadow-lg"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                <span>{loading ? 'RUNNING YOLO INFERENCE...' : 'RUN DETECTION MODEL'}</span>
              </button>
            </div>
          )}

          {/* Inference Results Cards */}
          {results && (
            <div className="space-y-3 pt-2 border-t border-[#242833]">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-zinc-100 flex items-center gap-1.5 font-mono-hud">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  DETECTION REPORT ({results.total_detected} OBJECTS IDENTIFIED)
                </span>
                <span className={`text-[10px] font-mono-hud px-2 py-0.5 rounded ${getThreatBadgeClass(results.highest_threat)}`}>
                  THREAT LEVEL: {results.highest_threat}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {results.detections.map((d) => (
                  <div key={d.id} className="p-2.5 rounded-lg bg-[#13151B] border border-[#242833] text-xs space-y-1">
                    <div className="flex items-center justify-between font-mono-hud">
                      <span className="text-amber-400 font-bold">{d.id}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${getThreatBadgeClass(d.threat_level)}`}>
                        {d.threat_level}
                      </span>
                    </div>
                    <div className="font-bold text-zinc-100">{d.label}</div>
                    <div className="text-[11px] text-zinc-400 font-mono-hud">
                      Category: {d.category} • Conf: {(d.confidence * 100).toFixed(0)}% • Dist: {d.distance_estimate_m}m
                    </div>
                    {d.notes && (
                      <div className="text-[10px] text-zinc-500 italic">
                        {d.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
