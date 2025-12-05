import { useEffect, useRef, useState } from 'react';
import { useAppSelector } from '../app/hooks';
import { getStoredUser } from '../services/apiClient';

// WebSocket uses the same port as the HTTP server (backend)
const getWebSocketUrl = () => {
  const wsUrl = import.meta.env.VITE_WEBSOCKET_URL;
  if (wsUrl) return wsUrl;
  
  // Derive from API base URL to ensure it points to the backend server
  const API_BASE_URL =
    import.meta.env.VITE_API_BASE_URL ||
    (typeof window !== 'undefined'
      ? (window.location.origin.includes('localhost')
          ? 'http://localhost:3000/api'
          : `${window.location.origin}/api`)
      : 'http://localhost:3000/api');
  
  // Convert API URL to WebSocket URL
  if (API_BASE_URL.includes('localhost:3000')) {
    return 'ws://localhost:3000';
  }
  
  // For production, use same origin but with ws/wss protocol
  if (typeof window !== 'undefined') {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = window.location.hostname;
    const port = window.location.port ? `:${window.location.port}` : '';
    return `${protocol}//${host}${port}`;
  }
  
  return 'ws://localhost:3000';
};

export function useWebSocket(onMessage) {
  const wsRef = useRef(null);
  const reconnectTimeoutRef = useRef(null);
  const [isConnected, setIsConnected] = useState(false);
  const user = useAppSelector((state) => state.auth.user) || getStoredUser();

  useEffect(() => {
    if (!user?.id) {
      return;
    }

    // Ensure user ID is a string
    const userId = String(user.id);
    const wsUrl = `${getWebSocketUrl()}/ws?userId=${userId}`;
    console.log('Connecting to WebSocket:', wsUrl);

    const connect = () => {
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log('WebSocket connected');
        setIsConnected(true);
        // Clear any pending reconnection
        if (reconnectTimeoutRef.current) {
          clearTimeout(reconnectTimeoutRef.current);
          reconnectTimeoutRef.current = null;
        }
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (onMessage) {
            onMessage(data);
          }
        } catch (err) {
          console.error('Error parsing WebSocket message:', err);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setIsConnected(false);
      };

      ws.onclose = () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
        
        // Attempt to reconnect after 3 seconds (only if still mounted and user exists)
        if (user?._id) {
          reconnectTimeoutRef.current = setTimeout(() => {
            if (wsRef.current?.readyState === WebSocket.CLOSED) {
              console.log('Attempting to reconnect WebSocket...');
              connect();
            }
          }, 3000);
        }
      };

      wsRef.current = ws;
    };

    connect();

    return () => {
      // Cleanup
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
        reconnectTimeoutRef.current = null;
      }
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [user?._id, onMessage]);

  const sendMessage = (data) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(data));
    }
  };

  return { isConnected, sendMessage };
}

