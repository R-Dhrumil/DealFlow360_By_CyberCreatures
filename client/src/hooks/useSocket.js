import { useEffect, useRef, useCallback } from 'react';
import { io } from 'socket.io-client';

/**
 * Get the Socket.IO server URL (single source of truth).
 * Strips /api suffix from VITE_API_URL or falls back to current hostname:5001.
 */
function getSocketUrl() {
  if (import.meta.env.VITE_API_URL) {
    return import.meta.env.VITE_API_URL.replace(/\/api\/?$/, '');
  }
  const hostname = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
  return `http://${hostname}:5001`;
}

// ─── Singleton socket instance shared across all hooks ──────────────────────
let sharedSocket = null;
let subscriberCount = 0;

function getOrCreateSocket() {
  if (!sharedSocket || sharedSocket.disconnected) {
    sharedSocket = io(getSocketUrl(), {
      transports: ['polling', 'websocket'],
      withCredentials: true,
      reconnectionAttempts: 10,
    });

    // Auto-register user on connect
    sharedSocket.on('connect', () => {
      try {
        const raw = localStorage.getItem('user');
        const user = raw ? JSON.parse(raw) : null;
        if (user) {
          sharedSocket.emit('register_user', {
            userId: user.id || user.userId,
            role: user.role,
            companyId: user.company_id || user.companyId || 'c1',
          });
        }
      } catch (_) {
        // ignore corrupted localStorage
      }
    });
  }
  return sharedSocket;
}

function releaseSocket() {
  subscriberCount = Math.max(0, subscriberCount - 1);
  if (subscriberCount === 0 && sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
  }
}

/**
 * Forcibly disconnect the singleton socket (e.g. on logout).
 */
export function disconnectSocket() {
  if (sharedSocket) {
    sharedSocket.disconnect();
    sharedSocket = null;
    subscriberCount = 0;
  }
}

/**
 * Subscribe to a Socket.IO event on the shared singleton connection.
 * Automatically connects on first subscriber and disconnects when the last one unmounts.
 *
 * @param {string} eventName - Socket.IO event name (e.g. 'pipeline_updated')
 * @param {Function} callback - Handler called when the event fires
 */
export function useSocketEvent(eventName, callback) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    const socket = getOrCreateSocket();
    subscriberCount++;

    const handler = (...args) => savedCallback.current(...args);
    socket.on(eventName, handler);

    return () => {
      socket.off(eventName, handler);
      releaseSocket();
    };
  }, [eventName]);
}
