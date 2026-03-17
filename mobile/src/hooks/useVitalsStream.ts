import { useEffect, useRef, useState, useCallback } from 'react';

const WS_URL = process.env.EXPO_PUBLIC_WS_URL || 'ws://localhost:8000/ws/vitals';

interface VitalsUpdate {
  type: string;
  patient_id: string;
  patient_name: string;
  vitals: Record<string, number>;
  risk_level: string;
  risk_score: number;
  timestamp: string;
}

export function useVitalsStream() {
  const ws = useRef<WebSocket | null>(null);
  const [connected, setConnected] = useState(false);
  const [liveVitals, setLiveVitals] = useState<Record<string, VitalsUpdate>>({});

  const connect = useCallback(() => {
    try {
      const socket = new WebSocket(WS_URL);

      socket.onopen = () => {
        setConnected(true);
        const ping = setInterval(() => {
          if (socket.readyState === WebSocket.OPEN) {
            socket.send(JSON.stringify({ type: 'ping' }));
          } else {
            clearInterval(ping);
          }
        }, 30000);
      };

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data) as VitalsUpdate;
          if (data.type === 'vitals_update') {
            setLiveVitals((prev) => ({ ...prev, [data.patient_id]: data }));
          }
        } catch { /* ignore */ }
      };

      socket.onclose = () => {
        setConnected(false);
        setTimeout(connect, 4000);
      };

      socket.onerror = () => socket.close();
      ws.current = socket;
    } catch {
      setTimeout(connect, 4000);
    }
  }, []);

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  return { connected, liveVitals };
}
