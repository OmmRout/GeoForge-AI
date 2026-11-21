import React, { useState, useEffect } from 'react';
import { 
  Bot, ShieldCheck, AlertOctagon, CheckCircle2, ChevronRight, 
  Workflow, Cpu, Terminal, ArrowRight, ShieldAlert, Sparkles
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
        if (!selectedDecision && data.length > 0) {
          setSelectedDecision(data[0]);
        }
      }
    } catch (e) {
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
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="font-mono-hud font-semibold text-slate-100">AGENTIC AI REASONING CORE</span>
          <span className="text-[10px] font-mono-hud text-cyan-400 bg-cyan-950/60 px-1.5 py-0.5 rounded border border-cyan-800/60 flex items-center gap-1">
            <Sparkles className="w-2.5 h-2.5" /> LANGGRAPH COGNITIVE LOOP
          </span>
        </div>

        <div className="text-[11px] font-mono-hud text-slate-400">
          AUTONOMOUS DECISIONS: <strong className="text-cyan-300">{decisions.length}</strong>
        </div>
      </div>

      {/* Decision List & Reasoning Detail Split */}
      <div className="grid grid-cols-1 md:grid-cols-12 flex-1 overflow-hidden divide-y md:divide-y-0 md:divide-x divide-slate-800/80">
        {/* Left Column: Decision History List */}
        <div className="md:col-span-5 p-2 overflow-y-auto max-h-[320px] md:max-h-full space-y-2">
          {decisions.map((dec) => {
            const isSelected = selectedDecision?.id === dec.id;
            const isHighRisk = dec.risk_score > 75;

            return (
              <div
                key={dec.id}
                onClick={() => setSelectedDecision(dec)}
                className={`p-2.5 rounded-lg border transition cursor-pointer ${
                  isSelected
                    ? 'bg-slate-800/90 border-cyan-500/60 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] font-mono-hud text-slate-400 mb-1">
                  <span className="text-cyan-400 font-bold">{dec.id}</span>
                  <span>{formatTimeAgo(dec.timestamp)}</span>
                </div>

                <div className="text-xs font-semibold text-slate-100 line-clamp-1 mb-1">
                  {dec.headline}
                </div>

                <div className="flex items-center justify-between mt-2 pt-1.5 border-t border-slate-800/60 text-[10px] font-mono-hud">
                  <span className={`px-1.5 py-0.5 rounded ${
                    isHighRisk ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-cyan-500/20 text-cyan-300'
                  }`}>
                    RISK: {dec.risk_score.toFixed(0)}/100
                  </span>

                  <span className={dec.auto_executed ? 'text-emerald-400 font-semibold flex items-center gap-1' : 'text-amber-400'}>
                    {dec.auto_executed ? <CheckCircle2 className="w-3 h-3" /> : <AlertOctagon className="w-3 h-3" />}
                    {dec.auto_executed ? 'AUTO-EXECUTED' : 'REQUIRES PILOT ACK'}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Column: Deep Explainable Reasoning Chain */}
        <div className="md:col-span-7 p-3 overflow-y-auto flex flex-col justify-between bg-slate-950/40">
          {selectedDecision ? (
            <div className="space-y-3">
              <div>
                <div className="flex items-center justify-between text-xs font-mono-hud text-slate-400 mb-1">
                  <span className="text-cyan-300 font-bold">{selectedDecision.action_type}</span>
                  <span>DECISION REF: {selectedDecision.id}</span>
                </div>
                <h3 className="text-sm font-bold text-slate-100">
                  {selectedDecision.headline}
                </h3>
                <p className="text-xs text-slate-300 mt-1 leading-relaxed bg-slate-900/60 p-2 rounded-lg border border-slate-800/80">
                  {selectedDecision.summary}
                </p>
              </div>

              {/* Step-by-Step Reasoning Flow */}
              <div>
                <div className="text-[11px] font-mono-hud uppercase text-slate-400 font-bold tracking-wider mb-2 flex items-center gap-1.5">
                  <Workflow className="w-3.5 h-3.5 text-cyan-400" />
                  Cognitive Reasoning Chain
                </div>

                <div className="space-y-2">
                  {selectedDecision.reasoning_steps.map((step) => (
                    <div 
                      key={step.step_number}
                      className="p-2 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs relative pl-3"
                    >
                      <div className="flex items-center justify-between text-[10px] font-mono-hud text-slate-400 mb-0.5">
                        <span className="text-cyan-400 font-semibold">
                          STEP {step.step_number}: [{step.component}]
                        </span>
                        <span>Confidence: {(step.confidence * 100).toFixed(0)}%</span>
                      </div>
                      <div className="text-slate-200 text-xs">
                        {step.thought}
                      </div>
                      <div className="text-[11px] text-cyan-300/80 font-mono-hud mt-1 flex items-center gap-1">
                        <Terminal className="w-2.5 h-2.5 text-cyan-400" />
                        <span>Evidence: {step.evidence}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Directive Box */}
              <div className="p-2.5 rounded-lg bg-cyan-950/30 border border-cyan-800/60 flex items-center justify-between gap-2 mt-2">
                <div>
                  <div className="text-[10px] font-mono-hud text-cyan-400 font-bold uppercase">
                    Directive
                  </div>
                  <div className="text-xs text-slate-200 font-medium">
                    {selectedDecision.recommended_action}
                  </div>
                </div>

                {selectedDecision.requires_pilot_ack && (
                  <button
                    onClick={() => handleAuthorize(selectedDecision)}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white shadow transition cursor-pointer whitespace-nowrap"
                  >
                    Authorize Protocol
                  </button>
                )}
              </div>
            </div>
          ) : (
            <div className="text-center text-slate-500 text-xs py-8">
              Select an agent decision to inspect the cognitive reasoning chain.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
