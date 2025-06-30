import { useEffect, useState } from 'react';
import { subscribeToSystemStatus } from '../services/api';

export interface SystemStatusRow {
  component: string;
  status: 'healthy' | 'degraded' | 'down';
  response_time_ms?: number | null;
  message?: string | null;
  updated_at: string;
}

export const useSystemStatusStream = () => {
  const [latestRows, setLatestRows] = useState<SystemStatusRow[]>([]);

  useEffect(() => {
    const subscription = subscribeToSystemStatus((row: SystemStatusRow) => {
      setLatestRows((prev) => {
        // Replace existing component row with newer updated_at
        const filtered = prev.filter((r) => r.component !== row.component);
        return [...filtered, row];
      });
    });
    
    return () => {
      // Close SSE connection safely
      try {
        if (subscription && typeof subscription.unsubscribe === 'function') {
          subscription.unsubscribe();
        }
      } catch (error) {
        console.warn('Error cleaning up system status subscription:', error);
      }
    };
  }, []);

  return latestRows;
}; 