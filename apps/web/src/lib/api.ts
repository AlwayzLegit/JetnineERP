// Tiny fetch wrapper used by the admin pages. Always sends credentials so
// the session cookie + impersonate cookies travel with each request.
//
// `apiUrl` used to point at a separate origin (NEXT_PUBLIC_API_URL); after
// Phase 2.21 the API runs as a Vercel function on the same origin as the
// web app, so the value is empty string by default and every call goes
// out as a relative URL. Setting NEXT_PUBLIC_API_URL is still supported
// for local dev pointing at a separate API server.
export const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? '';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${apiUrl}${path}`, {
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  });
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
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}
