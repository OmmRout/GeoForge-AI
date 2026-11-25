import React, { useState } from 'react';
import { Header } from './components/Header';
import { TelemetryHUD } from './components/TelemetryHUD';
import { VideoFeed } from './components/VideoFeed';
import { TacticalMap } from './components/TacticalMap';
import { AgenticPanel } from './components/AgenticPanel';
import { CopilotChat } from './components/CopilotChat';
import { AnalyticsView } from './components/AnalyticsView';
import { HardwareStatus } from './components/HardwareStatus';
import { MLTestingModal } from './components/MLTestingModal';
import { AlertsDrawer } from './components/AlertsDrawer';
import { MobileNav, MobileTab } from './components/MobileNav';
import { useDroneTelemetry } from './hooks/useDroneTelemetry';
import { useAlerts } from './hooks/useAlerts';
import { DetectedObject } from './types';

export function App() {
  const { telemetry, detections, isConnected, history, sendCommand } = useDroneTelemetry();
  const { alerts, unreadCriticalCount, acknowledgeAlert, resolveAlert } = useAlerts();

  const [isAlertsOpen, setIsAlertsOpen] = useState<boolean>(false);
  const [isMLTesterOpen, setIsMLTesterOpen] = useState<boolean>(false);
  const [mobileTab, setMobileTab] = useState<MobileTab>('overview');
  const [selectedTarget, setSelectedTarget] = useState<DetectedObject | null>(null);

  const handleExecuteSuggestedAction = async (action: string) => {
    if (action.includes('RTL') || action === 'CONFIRM_RTL') {
      await sendCommand('RTL');
    } else if (action === 'LOITER' || action === 'MAINTAIN_STANDOFF_ORBIT') {
      await sendCommand('LOITER');
    } else {
      await sendCommand(action);
    }
  };

  return (
    <div className="min-h-screen bg-[#0B0C10] text-zinc-100 flex flex-col pb-16 md:pb-6 font-sans">
      {/* Top Tactical Command Header */}
      <Header
        telemetry={telemetry}
        isConnected={isConnected}
        unreadAlertsCount={unreadCriticalCount}
        onOpenAlerts={() => setIsAlertsOpen(true)}
        onOpenMLTester={() => setIsMLTesterOpen(true)}
        onSendCommand={sendCommand}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-[1720px] w-full mx-auto p-3 sm:p-5 space-y-4">
        {/* Top Telemetry HUD Strip */}
        <TelemetryHUD telemetry={telemetry} />

        {/* Desktop View & Mobile Switchable Views */}
        <div className="space-y-4">
          {/* Mobile View: Render current tab */}
          <div className="block md:hidden">
            {mobileTab === 'overview' && (
              <div className="space-y-4">
                <div className="h-[300px]">
                  <VideoFeed detections={detections} onSelectTarget={setSelectedTarget} />
                </div>
                <div className="h-[280px]">
                  <TacticalMap telemetry={telemetry} detections={detections} />
                </div>
                <div className="h-[380px]">
                  <AgenticPanel onSendCommand={sendCommand} />
                </div>
              </div>
            )}

            {mobileTab === 'feed' && (
              <div className="h-[calc(100vh-230px)]">
                <VideoFeed detections={detections} onSelectTarget={setSelectedTarget} />
              </div>
            )}

            {mobileTab === 'map' && (
              <div className="h-[calc(100vh-230px)]">
                <TacticalMap telemetry={telemetry} detections={detections} />
              </div>
            )}

            {mobileTab === 'agent' && (
              <div className="space-y-4">
                <div className="h-[360px]">
                  <AgenticPanel onSendCommand={sendCommand} />
                </div>
                <div className="h-[380px]">
                  <CopilotChat 
                    droneId={telemetry?.drone_id || 'GF-FALCON-01'} 
                    onExecuteSuggestedAction={handleExecuteSuggestedAction}
                  />
                </div>
              </div>
            )}

            {mobileTab === 'analytics' && (
              <div className="space-y-4">
                <AnalyticsView history={history} telemetry={telemetry} />
                <HardwareStatus />
              </div>
            )}
          </div>

          {/* Desktop & Tablet View: Structured Multi-Pane Grid */}
          <div className="hidden md:block space-y-4">
            {/* Primary Surveillance Grid: Video Feed & Tactical Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Left/Center: Live Drone Camera Stream */}
              <div className="lg:col-span-6 h-[390px] xl:h-[440px]">
                <VideoFeed detections={detections} onSelectTarget={setSelectedTarget} />
              </div>

              {/* Right: Tactical GPS Geo-Map */}
              <div className="lg:col-span-6 h-[390px] xl:h-[440px]">
                <TacticalMap telemetry={telemetry} detections={detections} />
              </div>
            </div>

            {/* Cognitive AI & Mission Planning Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
              {/* Agentic Reasoning Panel */}
              <div className="lg:col-span-7 h-[420px]">
                <AgenticPanel onSendCommand={sendCommand} />
              </div>

              {/* AI Mission Co-pilot Chat */}
              <div className="lg:col-span-5 h-[420px]">
                <CopilotChat
                  droneId={telemetry?.drone_id || 'GF-FALCON-01'}
                  onExecuteSuggestedAction={handleExecuteSuggestedAction}
                />
              </div>
            </div>

            {/* Telemetry Analytics & Historical Charts */}
            <AnalyticsView history={history} telemetry={telemetry} />

            {/* Embedded Drone Subsystems Diagnostics */}
            <HardwareStatus />
          </div>
        </div>
      </main>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav activeTab={mobileTab} onChangeTab={setMobileTab} />

      {/* ML Model Testing Lab Modal */}
      <MLTestingModal
        isOpen={isMLTesterOpen}
        onClose={() => setIsMLTesterOpen(false)}
      />

      {/* Alerts Drawer */}
      <AlertsDrawer
        isOpen={isAlertsOpen}
        onClose={() => setIsAlertsOpen(false)}
        alerts={alerts}
        onAcknowledge={acknowledgeAlert}
        onResolve={resolveAlert}
      />
    </div>
  );
}
export default App;
