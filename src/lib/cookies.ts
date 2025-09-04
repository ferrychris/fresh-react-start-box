// Lightweight cookie helpers with JSON support and expirations
// Note: Cookies are limited (~4KB per cookie). Use sparingly for small datasets.

export function setCookie(name: string, value: string, maxAgeSeconds?: number, path = "/"): void {
  if (typeof document === "undefined") return;
  const parts = [
    `${encodeURIComponent(name)}=${encodeURIComponent(value)}`,
    `path=${path}`,
  ];
  if (maxAgeSeconds && Number.isFinite(maxAgeSeconds)) {
    parts.push(`max-age=${Math.max(0, Math.floor(maxAgeSeconds))}`);
  }
  // Lax by default to be safer
  parts.push("samesite=lax");
  document.cookie = parts.join("; ");
}

export function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const cookies = document.cookie ? document.cookie.split("; ") : [];
  for (const c of cookies) {
    const idx = c.indexOf("=");
    if (idx === -1) continue;
    const k = decodeURIComponent(c.slice(0, idx));
    if (k === name) return decodeURIComponent(c.slice(idx + 1));
  }
  return null;
}

export function deleteCookie(name: string, path = "/"): void {
  setCookie(name, "", 0, path);
}

export function setJSONCookie<T>(name: string, data: T, maxAgeSeconds?: number, path = "/"): void {
  try {
    const payload = JSON.stringify(data);
    setCookie(name, payload, maxAgeSeconds, path);
  } catch (e) {
    // swallow JSON errors; avoid breaking app due to circular data
    // console.debug('setJSONCookie failed', e);
  }
}

export function getJSONCookie<T = unknown>(name: string): T | null {
  const raw = getCookie(name);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}
