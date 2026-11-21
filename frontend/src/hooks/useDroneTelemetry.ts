import { useState, useEffect, useRef, useCallback } from 'react';
import { TelemetryFrame, DetectionSummary, FlightMode } from '../types';

export function useDroneTelemetry() {
  const [telemetry, setTelemetry] = useState<TelemetryFrame | null>(null);
  const [detections, setDetections] = useState<DetectionSummary | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [history, setHistory] = useState<{ time: string; altitude: number; speed: number; battery: number }[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<any>(null);

  const appendHistory = useCallback((frame: TelemetryFrame) => {
    const timeLabel = new Date(frame.timestamp * 1000).toLocaleTimeString([], { hour12: false, minute: '2-digit', second: '2-digit' });
    setHistory((prev) => {
      const next = [...prev, {
        time: timeLabel,
        altitude: Math.round(frame.gps.altitude_agl_m),
        speed: Math.round(frame.speed_kmh),
        battery: Math.round(frame.battery.percentage)
      }];
      return next.slice(-25); // keep last 25 telemetry points for high-performance chart
    });
  }, []);

  // Polling fallback if WebSocket drops
  const fetchPolling = useCallback(async () => {
    try {
      const [tRes, dRes] = await Promise.all([
        fetch('/api/v1/telemetry/current'),
        fetch('/api/v1/vision/detections')
      ]);
      if (tRes.ok) {
        const tData = await tRes.json();
        setTelemetry(tData);
        appendHistory(tData);
        setIsConnected(true);
      }
      if (dRes.ok) {
        const dData = await dRes.json();
        setDetections(dData);
      }
    } catch (e) {
      setIsConnected(false);
    }
  }, [appendHistory]);

  useEffect(() => {
    let isMounted = true;
    let pollInterval: any = null;

    function connectWs() {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/ws/telemetry`;

      try {
        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          if (!isMounted) return;
          setIsConnected(true);
          if (pollInterval) clearInterval(pollInterval);
        };

        ws.onmessage = (event) => {
          if (!isMounted) return;
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'TELEMETRY_UPDATE') {
              setTelemetry(data.telemetry);
              setDetections(data.detections);
              appendHistory(data.telemetry);
            }
          } catch (err) {
            console.error('Error parsing WS message:', err);
          }
        };

        ws.onclose = () => {
          if (!isMounted) return;
          setIsConnected(false);
          // Start fallback polling until reconnect
          if (!pollInterval) {
            fetchPolling();
            pollInterval = setInterval(fetchPolling, 1500);
          }
          reconnectTimeoutRef.current = setTimeout(connectWs, 3000);
        };

        ws.onerror = () => {
          ws.close();
        };
      } catch (err) {
        // Fallback directly to polling
        if (!pollInterval) {
          fetchPolling();
          pollInterval = setInterval(fetchPolling, 1500);
        }
        reconnectTimeoutRef.current = setTimeout(connectWs, 4000);
      }
    }

    connectWs();

    return () => {
      isMounted = false;
      if (wsRef.current) wsRef.current.close();
      if (reconnectTimeoutRef.current) clearTimeout(reconnectTimeoutRef.current);
      if (pollInterval) clearInterval(pollInterval);
    };
  }, [appendHistory, fetchPolling]);

  const sendCommand = async (action: string, targetMode?: FlightMode) => {
    try {
      const res = await fetch('/api/v1/drones/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          drone_id: telemetry?.drone_id || 'GF-FALCON-01',
          action,
          target_mode: targetMode
        })
      });
      return await res.json();
    } catch (e) {
      return { success: false, message: 'Command failed to send to flight controller.' };
    }
  };

  return { telemetry, detections, isConnected, history, sendCommand };
}
