import React from 'react';
import { LayoutDashboard, Video, Map, Bot, BarChart3 } from 'lucide-react';

export type MobileTab = 'overview' | 'feed' | 'map' | 'agent' | 'analytics';

interface MobileNavProps {
  activeTab: MobileTab;
  onChangeTab: (tab: MobileTab) => void;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onChangeTab }) => {
  const tabs = [
    { id: 'overview', label: 'Command', icon: LayoutDashboard },
    { id: 'feed', label: 'Drone Cam', icon: Video },
    { id: 'map', label: 'GPS Map', icon: Map },
    { id: 'agent', label: 'Agentic AI', icon: Bot },
    { id: 'analytics', label: 'Analytics', icon: BarChart3 }
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-[#080C14]/95 border-t border-slate-800 backdrop-blur-md px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-bottom">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChangeTab(tab.id as MobileTab)}
            className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-lg transition cursor-pointer ${
              isActive ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            <Icon className={`w-4 h-4 mb-0.5 ${isActive ? 'scale-110 text-cyan-400' : ''}`} />
            <span className="text-[10px] font-mono-hud tracking-tight">{tab.label}</span>
            {isActive && <span className="w-1 h-1 rounded-full bg-cyan-400 mt-0.5"></span>}
          </button>
        );
      })}
    </nav>
  );
};
