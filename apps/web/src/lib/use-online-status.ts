'use client';

import { useEffect, useState } from 'react';

/**
 * `navigator.onLine` is the browser's native signal — it flips on
 * `online`/`offline` window events. It's not a deep "can we reach the
 * API" check (a captive portal can have onLine=true), but for the POS
 * use case (transient ISP / Wi-Fi drops) it's the right signal.
 *
 * Returns `true` while the component is server-rendering so the first
 * paint doesn't flash an "offline" badge during hydration.
 */
export function useOnlineStatus(): boolean {
  const [online, setOnline] = useState(true);

  useEffect(() => {
    if (typeof navigator === 'undefined') return;
    setOnline(navigator.onLine);
    const onOnline = () => setOnline(true);
    const onOffline = () => setOnline(false);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return online;
}
