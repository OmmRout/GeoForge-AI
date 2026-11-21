import { useState, useEffect, useCallback } from 'react';
import { TerrainAlert } from '../types';
import { playTacticalBeep } from '../utils/formatters';

export function useAlerts() {
  const [alerts, setAlerts] = useState<TerrainAlert[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [unreadCriticalCount, setUnreadCriticalCount] = useState<number>(0);

  const fetchAlerts = useCallback(async () => {
    try {
      const res = await fetch('/api/v1/alerts');
      if (res.ok) {
        const data: TerrainAlert[] = await res.json();
        setAlerts(data);
        const criticalActive = data.filter(a => a.level === 'CRITICAL' && a.status === 'ACTIVE').length;
        setUnreadCriticalCount(criticalActive);
      }
    } catch (e) {
      // offline fallback or quiet fail
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAlerts();
    const interval = setInterval(fetchAlerts, 5000);
    return () => clearInterval(interval);
  }, [fetchAlerts]);

  const acknowledgeAlert = async (id: string) => {
    try {
      await fetch(`/api/v1/alerts/${id}/acknowledge`, { method: 'POST' });
      playTacticalBeep(650, 0.05);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  const resolveAlert = async (id: string) => {
    try {
      await fetch(`/api/v1/alerts/${id}/resolve`, { method: 'POST' });
      playTacticalBeep(520, 0.05);
      fetchAlerts();
    } catch (e) {
      console.error(e);
    }
  };

  return { alerts, loading, unreadCriticalCount, acknowledgeAlert, resolveAlert, refetch: fetchAlerts };
}
