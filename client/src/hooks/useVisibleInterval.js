import { useEffect, useRef } from 'react';

/**
 * Like setInterval, but pauses when the browser tab is hidden and
 * fires one catch-up call immediately when the tab becomes visible again.
 *
 * @param {Function} callback - Function to call on each tick
 * @param {number} delayMs   - Interval in milliseconds
 */
export function useVisibleInterval(callback, delayMs) {
  const savedCallback = useRef(callback);
  savedCallback.current = callback;

  useEffect(() => {
    if (!delayMs || delayMs <= 0) return;

    let intervalId = null;

    const start = () => {
      if (!intervalId) {
        intervalId = setInterval(() => {
          if (!document.hidden) {
            savedCallback.current();
          }
        }, delayMs);
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Tab hidden → stop interval to save resources
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      } else {
        // Tab visible again → catch-up fetch + restart interval
        savedCallback.current();
        start();
      }
    };

    // Initial start
    start();
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (intervalId) clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [delayMs]);
}
