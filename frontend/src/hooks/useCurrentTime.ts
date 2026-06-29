// src/hooks/useCurrentTime.ts
import { useState, useEffect } from 'react';

// 1. We create global state OUTSIDE the React components
const subscribers = new Set<() => void>();
let globalNow = new Date();
let intervalId: ReturnType<typeof setInterval> | null = null;

// 2. The global ticking engine
const startGlobalTicker = () => {
  if (intervalId) return;
  intervalId = setInterval(() => {
    globalNow = new Date();
    // Notify all active components to re-render
    subscribers.forEach(notify => notify()); 
  }, 1000); // Ticks every second
};

const stopGlobalTicker = () => {
  if (subscribers.size === 0 && intervalId) {
    clearInterval(intervalId);
    intervalId = null;
  }
};

// 3. The Hook
export const useCurrentTime = (refreshIntervalMs: number | null = 1000) => {
  const [now, setNow] = useState(globalNow);

  useEffect(() => {

    if (refreshIntervalMs === null) return;
    
    // If a component wants a fast update (1 sec), it subscribes to the global ticker
    if (refreshIntervalMs <= 1000) {
      const updateTime = () => setNow(globalNow);
      subscribers.add(updateTime);
      startGlobalTicker();

      return () => {
        subscribers.delete(updateTime);
        stopGlobalTicker(); // Automatically shuts down if nobody is listening!
      };
    } 
    
    // For slow updates (like the 60s Hub Modal), a local interval is fine
    const interval = setInterval(() => setNow(new Date()), refreshIntervalMs);
    return () => clearInterval(interval);

  }, [refreshIntervalMs]);

  return now;
};