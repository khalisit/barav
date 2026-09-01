'use client';

import { useState, useEffect } from 'react';
import { api } from '@/lib/api-client';

function getClientId() {
  if (typeof window === 'undefined') return 'server';
  let cid = localStorage.getItem('barav_presence_client_id');
  if (!cid) {
    cid = 'web-' + Math.random().toString(36).substring(2, 10);
    localStorage.setItem('barav_presence_client_id', cid);
  }
  return cid;
}

export function usePresence() {
  const [onlineCount, setOnlineCount] = useState<number>(0);

  useEffect(() => {
    let ws: WebSocket | null = null;
    let reconnectTimeout: NodeJS.Timeout;
    let isDisposed = false;

    // First fetch initial count via API fallback
    api.get<{ onlineCount: number }>('/presence/count')
      .then((res) => {
        if (!isDisposed && typeof res?.onlineCount === 'number') {
          setOnlineCount(res.onlineCount);
        }
      })
      .catch(() => {});

    function connect() {
      if (isDisposed) return;

      const clientId = getClientId();
      const token = localStorage.getItem('barav-access-token');
      const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.baravquiz.com/api';
      const wsBase = apiUrl.replace(/^http/, 'ws').replace(/\/$/, '');
      const wsUrl = `${wsBase}/presence/ws?clientId=${encodeURIComponent(clientId)}${token ? `&token=${encodeURIComponent(token)}` : ''}`;

      try {
        ws = new WebSocket(wsUrl);

        ws.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            if (data.type === 'presence_update' && typeof data.count === 'number') {
              setOnlineCount(data.count);
            }
          } catch {
            // Ignore parse errors
          }
        };

        ws.onclose = () => {
          if (!isDisposed) {
            reconnectTimeout = setTimeout(connect, 5000);
          }
        };

        ws.onerror = () => {
          if (ws) {
            ws.close();
          }
        };
      } catch {
        if (!isDisposed) {
          reconnectTimeout = setTimeout(connect, 5000);
        }
      }
    }

    connect();

    return () => {
      isDisposed = true;
      clearTimeout(reconnectTimeout);
      if (ws) {
        ws.close();
      }
    };
  }, []);

  return { onlineCount };
}
