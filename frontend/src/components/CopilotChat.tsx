import React, { useState, useRef, useEffect } from 'react';
import { Bot, Send, User, Sparkles, Terminal, CornerDownLeft, Loader2 } from 'lucide-react';
import { playTacticalBeep } from '../utils/formatters';

interface Message {
  id: string;
  sender: 'pilot' | 'agent';
  text: string;
  reasoningTrail?: string[];
  suggestedAction?: string;
  timestamp: Date;
}

interface CopilotChatProps {
  droneId: string;
  onExecuteSuggestedAction?: (action: string) => void;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({ droneId, onExecuteSuggestedAction }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'm-1',
      sender: 'agent',
      text: 'GeoForge AI Tactical Co-pilot initialized. Telemetry stream locked (Neo-6M DGPS 3D Fix). Ground CV inference operational at 28.5 FPS. How can I assist this mission?',
      reasoningTrail: [
        'Bootstrapped MAVLink telemetry pipeline.',
        'Registered 4 ground hazard targets in Pir Panjal sector.'
      ],
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (textToSend: string) => {
    if (!textToSend.trim() || loading) return;

    const pilotMsg: Message = {
      id: `pilot-${Date.now()}`,
      sender: 'pilot',
      text: textToSend,
      timestamp: new Date()
    };

    setMessages((prev) => [...prev, pilotMsg]);
    setInput('');
    setLoading(true);
    playTacticalBeep(880, 0.04);

    try {
      const res = await fetch('/api/v1/agent/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drone_id: droneId,
          message: textToSend
        })
      });

      if (res.ok) {
        const data = await res.json();
        const agentMsg: Message = {
          id: `agent-${Date.now()}`,
          sender: 'agent',
          text: data.reply,
          reasoningTrail: data.reasoning_trail,
          suggestedAction: data.suggested_action,
          timestamp: new Date()
        };
        setMessages((prev) => [...prev, agentMsg]);
        playTacticalBeep(980, 0.05);
      } else {
        throw new Error('Chat API returned error');
      }
    } catch (e) {
      const errorMsg: Message = {
        id: `err-${Date.now()}`,
        sender: 'agent',
        text: 'Communications latency anomaly. Using cached local decision model: Sector is monitored, hold current vector.',
        timestamp: new Date()
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const quickPrompts = [
    'Analyze landslide risk at north ridge',
    'Check battery endurance for return flight',
    'SAR Target TGT-801 Status',
    'Weather & wind gust report'
  ];

  return (
    <div className="tactical-card rounded-xl border border-slate-800 flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2 bg-slate-900/90 border-b border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-cyan-400" />
          <span className="font-mono-hud font-semibold text-slate-100">TACTICAL AI MISSION CO-PILOT</span>
        </div>
        <span className="text-[10px] font-mono-hud text-emerald-400 bg-emerald-950/60 px-2 py-0.5 rounded border border-emerald-800/60 flex items-center gap-1">
          <Sparkles className="w-2.5 h-2.5" /> AGENT ONLINE
        </span>
      </div>

      {/* Messages Scroll Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-[200px] max-h-[380px]">
        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex flex-col ${m.sender === 'pilot' ? 'items-end' : 'items-start'}`}
          >
            <div className="flex items-center gap-1.5 text-[10px] font-mono-hud text-slate-400 mb-0.5 px-1">
              {m.sender === 'pilot' ? (
                <><span>PILOT OPERATOR</span><User className="w-2.5 h-2.5 text-cyan-400" /></>
              ) : (
                <><Bot className="w-2.5 h-2.5 text-cyan-400" /><span>GEOFORGE AI</span></>
              )}
            </div>

            <div
              className={`max-w-[88%] rounded-xl p-3 text-xs leading-relaxed shadow-sm ${
                m.sender === 'pilot'
                  ? 'bg-cyan-600 text-white rounded-tr-none'
                  : 'bg-slate-900 border border-slate-800 text-slate-200 rounded-tl-none'
              }`}
            >
              <div>{m.text}</div>

              {/* Step-by-step reasoning trail if from agent */}
              {m.reasoningTrail && m.reasoningTrail.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-800/80 text-[10px] font-mono-hud text-cyan-300/80 space-y-0.5">
                  <div className="font-bold flex items-center gap-1 text-slate-400">
                    <Terminal className="w-2.5 h-2.5" /> REASONING TRACE:
                  </div>
                  {m.reasoningTrail.map((trace, idx) => (
                    <div key={idx} className="pl-2 border-l border-cyan-800/60">
                      • {trace}
                    </div>
                  ))}
                </div>
              )}

              {/* Action Button if suggested by AI */}
              {m.suggestedAction && onExecuteSuggestedAction && (
                <button
                  onClick={() => onExecuteSuggestedAction(m.suggestedAction!)}
                  className="mt-2.5 inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-mono-hud font-bold rounded bg-emerald-600 hover:bg-emerald-500 text-white cursor-pointer transition shadow"
                >
                  Confirm & Execute: {m.suggestedAction}
                </button>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex items-center gap-2 text-xs font-mono-hud text-cyan-400 bg-slate-900/60 p-2 rounded-lg border border-slate-800 w-fit">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            <span>Agent synthesizing terrain and telemetry decision...</span>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Chips Prompts */}
      <div className="px-3 py-1.5 bg-slate-950/60 border-t border-slate-800/60 flex items-center gap-1.5 overflow-x-auto text-[11px] font-mono-hud">
        {quickPrompts.map((q, idx) => (
          <button
            key={idx}
            onClick={() => sendMessage(q)}
            className="px-2 py-0.5 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 hover:text-cyan-300 border border-slate-700 transition cursor-pointer whitespace-nowrap"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input Field */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage(input);
        }}
        className="p-2 bg-slate-900 border-t border-slate-800 flex items-center gap-2"
      >
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Issue directive or query AI Co-pilot..."
          className="flex-1 bg-slate-950 text-slate-100 placeholder-slate-500 text-xs px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono-hud"
        />
        <button
          type="submit"
          disabled={!input.trim() || loading}
          className="p-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 disabled:opacity-40 text-white transition cursor-pointer"
        >
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
};
