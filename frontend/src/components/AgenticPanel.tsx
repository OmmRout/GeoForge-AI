import React, { useState, useEffect } from 'react';
import {
  Bot, AlertOctagon, CheckCircle2,
  Workflow, Terminal, Sparkles
} from 'lucide-react';
import { AgentDecision } from '../types';
import { formatTimeAgo, playTacticalBeep } from '../utils/formatters';

interface AgenticPanelProps {
  onSendCommand?: (action: string) => Promise<any>;
}

export const AgenticPanel: React.FC<AgenticPanelProps> = ({ onSendCommand }) => {
  const [decisions, setDecisions] = useState<AgentDecision[]>([]);
  const [selectedDecision, setSelectedDecision] = useState<AgentDecision | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchDecisions = async () => {
    try {
      const res = await fetch('/api/v1/agent/decisions');
      if (res.ok) {
        const data: AgentDecision[] = await res.json();
        setDecisions(data);
        setSelectedDecision((prev) => {
          if (!prev && data.length > 0) return data[0];
          if (prev) {
            const updated = data.find((d) => d.id === prev.id);
            return updated || prev;
          }
          return prev;
        });
      }
    } catch {
      // quiet fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDecisions();
    const interval = setInterval(fetchDecisions, 6000);
    return () => clearInterval(interval);
  }, []);

  const handleAuthorize = (dec: AgentDecision) => {
    playTacticalBeep(700, 0.1);
    if (onSendCommand && dec.action_type === 'EMERGENCY_RTL') {
      onSendCommand('RTL');
    }
  };

  return (
    <div className="tactical-card rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3.5 py-2.5 bg-slate-900/90 border-b border-slate-800 text-xs shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <Bot className="w-4 h-4 text-cyan-400 shrink-0" />
          <span className="font-mono-hud font-semibold text-slate-100 truncate">
            AGENTIC AI REASONING CORE
          </span>
          <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-mono-hud text-cyan-400 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-800/60 shrink-0">
            <Sparkles className="w-2.5 h-2.5" /> LANGGRAPH LOOP
          </span>
        </div>

        <div className="text-[11px] font-mono-hud text-slate-400 shrink-0">
          DECISIONS: <strong className="text-cyan-300">{decisions.length}</strong>
        </div>
      </div>

      {/* Decision List & Reasoning Detail Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 min-h-0 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
        {/* Left Column: Decision History List */}
        <div className="md:col-span-5 p-2.5 overflow-y-auto min-h-0 space-y-2 bg-slate-950/20">
          {loading && decisions.length === 0 ? (
            <div className="text-center text-slate-500 text-xs py-8 font-mono-hud">
              Loading agent decisions...
            </div>
          ) : (
            decisions.map((dec) => {
              const isSelected = selectedDecision?.id === dec.id;
              const isHighRisk = dec.risk_score > 75;

              return (
                <button
                  key={dec.id}
                  type="button"
                  onClick={() => setSelectedDecision(dec)}
                  className={`w-full text-left p-3 rounded-lg border transition cursor-pointer ${
                    isSelected
                      ? 'bg-slate-800/90 border-cyan-500/70 ring-1 ring-cyan-500/30 shadow-md'
                      : 'bg-slate-900/60 border-slate-800/90 hover:border-slate-700 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] font-mono-hud text-slate-400 mb-1">
                    <span className="text-cyan-400 font-bold">{dec.id}</span>
                    <span>{formatTimeAgo(dec.timestamp)}</span>
                  </div>

                  <div className="text-xs font-semibold text-slate-100 line-clamp-2 leading-snug">
                    {dec.headline}
                  </div>

                  <div className="flex items-center justify-between gap-2 mt-2.5 pt-2 border-t border-slate-800/70 text-[10px] font-mono-hud">
                    <span
                      className={`px-1.5 py-0.5 rounded font-semibold ${
                        isHighRisk
                          ? 'bg-red-500/15 text-red-400 border border-red-500/30'
                          : 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                      }`}
                    >
                      RISK {dec.risk_score.toFixed(0)}/100
                    </span>

                    <span
                      className={`flex items-center gap-1 font-semibold ${
                        dec.auto_executed ? 'text-emerald-400' : 'text-amber-400'
                      }`}
                    >
                      {dec.auto_executed ? (
                        <CheckCircle2 className="w-3 h-3 shrink-0" />
                      ) : (
                        <AlertOctagon className="w-3 h-3 shrink-0" />
                      )}
                      {dec.auto_executed ? 'AUTO-EXECUTED' : 'PILOT ACK'}
                    </span>
                  </div>
                </button>
              );
            })
          )}
        </div>

        {/* Right Column: Clean Explainable Reasoning Detail */}
        <div className="md:col-span-7 flex flex-col min-h-0 bg-slate-950/40">
          {selectedDecision ? (
            <>
              {/* Pinned Decision Summary Header */}
              <div className="px-3.5 py-2.5 border-b border-slate-800/80 bg-slate-900/50 shrink-0">
                <div className="flex items-center justify-between gap-2 text-[10px] font-mono-hud mb-1">
                  <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 text-cyan-300 border border-cyan-800/60 font-semibold tracking-wide">
                    {selectedDecision.action_type.replace(/_/g, ' ')}
                  </span>
                  <span className="text-slate-400">REF: {selectedDecision.id}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100 leading-snug">
                  {selectedDecision.headline}
                </h3>
                <p className="text-xs text-slate-300/90 mt-1 leading-relaxed">
                  {selectedDecision.summary}
                </p>
              </div>

              {/* Scrollable Step-by-Step Reasoning Timeline */}
              <div className="flex-1 overflow-y-auto min-h-0 px-3.5 py-3">
                <div className="text-[10px] font-mono-hud uppercase text-slate-400 font-bold tracking-wider mb-2.5 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                  Cognitive Reasoning Chain
                </div>

                <div className="relative pl-5 space-y-3 before:content-[''] before:absolute before:left-[9px] before:top-2 before:bottom-2 before:w-px before:bg-slate-800">
                  {selectedDecision.reasoning_steps.map((step) => (
                    <div key={step.step_number} className="relative">
                      {/* Step Number Dot */}
                      <span className="absolute -left-5 top-0.5 w-5 h-5 rounded-full bg-slate-900 border border-cyan-500/60 text-[10px] font-mono-hud font-bold text-cyan-300 flex items-center justify-center">
                        {step.step_number}
                      </span>

                      <div className="rounded-lg bg-slate-900/75 border border-slate-800/80 px-3 py-2 space-y-1.5">
                        <div className="flex items-center justify-between gap-2 text-[11px] font-mono-hud">
                          <span className="text-cyan-400 font-semibold">
                            {step.component}
                          </span>
                          <span className="text-slate-400">
                            {(step.confidence * 100).toFixed(0)}% conf
                          </span>
                        </div>

                        <p className="text-xs text-slate-200 leading-relaxed">
                          {step.thought}
                        </p>

                        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-slate-950/90 border border-slate-800 text-[11px] text-cyan-300/90 font-mono-hud">
                          <Terminal className="w-3 h-3 text-cyan-400 shrink-0" />
                          <span>{step.evidence}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Pinned Directive Footer */}
              <div className="px-3.5 py-2.5 bg-cyan-950/25 border-t border-cyan-800/50 flex items-center justify-between gap-3 shrink-0">
                <div className="min-w-0">
                  <div className="text-[10px] font-mono-hud text-cyan-400 font-bold uppercase tracking-wider">
                    Directive
                  </div>
                  <div className="text-xs text-slate-100 font-medium truncate">
                    {selectedDecision.recommended_action}
                  </div>
                </div>

                {selectedDecision.requires_pilot_ack && (
                  <button
                    type="button"
                    onClick={() => handleAuthorize(selectedDecision)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer shrink-0"
                  >
                    Authorize
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-slate-500 text-xs p-6">
              Select a decision on the left to inspect its reasoning chain.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
