'use client';

import { apiUrl } from './api';

/**
 * Fetch an export endpoint and hand the result to the browser as a
 * file download. We deliberately do NOT use plain `<a href>` links for
 * exports: a top-level navigation can't share the page's error handling
 * (a failed download is completely silent to the user) and proved
 * unreliable through the same-origin proxy in browser testing, while
 * an in-page fetch of the identical URL works. This path also lets the
 * caller show busy state and surface errors as toasts.
 */
export async function downloadFile(path: string, filename: string): Promise<void> {
  const res = await fetch(`${apiUrl}${path}`, { credentials: 'include' });
  if (!res.ok) {
    const text = await res.text();
    let message = `${res.status} ${res.statusText}`;
    try {
      const body = JSON.parse(text) as { message?: string };
      if (body.message) message = body.message;
    } catch {
      if (text) message = text;
    }
    throw new Error(message);
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  // Give the browser a beat to start the download before revoking.
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
