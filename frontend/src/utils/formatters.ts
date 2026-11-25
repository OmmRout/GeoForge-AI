import { ThreatSeverity } from '../types';

export function formatCoords(lat: number, lon: number): string {
  const latStr = `${Math.abs(lat).toFixed(5)}° ${lat >= 0 ? 'N' : 'S'}`;
  const lonStr = `${Math.abs(lon).toFixed(5)}° ${lon >= 0 ? 'E' : 'W'}`;
  return `${latStr}, ${lonStr}`;
}

export function formatTimeAgo(timestamp: number): string {
  const seconds = Math.floor(Date.now() / 1000 - timestamp);
  if (seconds < 5) return 'Just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function getThreatBadgeClass(level: ThreatSeverity | string): string {
  switch (level) {
    case 'CRITICAL':
      return 'bg-red-500/20 text-red-400 border-red-500/40 border';
    case 'HIGH':
      return 'bg-amber-500/20 text-amber-400 border-amber-500/40 border';
    case 'MEDIUM':
      return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/40 border';
    case 'LOW':
      return 'bg-zinc-700/40 text-zinc-300 border-zinc-600/50 border';
    case 'NOMINAL':
    default:
      return 'bg-emerald-500/15 text-emerald-400 border-emerald-500/40 border';
  }
}

export function playTacticalBeep(frequency: number = 880, duration: number = 0.08) {
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(frequency, ctx.currentTime);
    gain.gain.setValueAtTime(0.05, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + duration);
  } catch (e) {
    // Ignore audio permission restrictions on unmuted gesture
  }
}
