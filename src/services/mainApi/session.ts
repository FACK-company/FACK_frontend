const ACCESS_TOKEN_KEY = "fack_access_token";
const USER_METADATA_KEY = "fack_user";
const USER_METADATA_COOKIE = "fack_user";
const USER_METADATA_COOKIE_MAX_AGE = 60 * 60 * 24 * 7; // 7 days

let accessTokenMemory: string | null = null;

export interface UserMetadata {
  id?: string;
  name?: string;
  role?: string;
}

function decodeJwtPayload(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split(".");
    if (parts.length < 2) return null;
    const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
    const padded = payload + "=".repeat((4 - (payload.length % 4)) % 4);
    const decoded = atob(padded);
    return JSON.parse(decoded) as Record<string, unknown>;
  } catch {
    return null;
  }
}

function getCookieValue(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookieValue(name: string, value: string, maxAgeSec: number): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=${encodeURIComponent(value)}; Max-Age=${maxAgeSec}; Path=/; SameSite=Lax`;
}

function clearCookieValue(name: string): void {
  if (typeof document === "undefined") return;
  document.cookie = `${name}=; Max-Age=0; Path=/; SameSite=Lax`;
}

export function getAccessToken(): string | null {
  if (accessTokenMemory) return accessTokenMemory;
  if (typeof window === "undefined") return null;
  const token = window.localStorage.getItem(ACCESS_TOKEN_KEY);
  accessTokenMemory = token;
  return token;
}

export function setAccessToken(token: string | null): void {
  accessTokenMemory = token;
  if (typeof window === "undefined") return;
  if (!token) {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    return;
  }
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

export function getUserMetadata(): UserMetadata | null {
  if (typeof window === "undefined") return null;

  const token = getAccessToken();
  const tokenPayload = token ? decodeJwtPayload(token) : null;
  const tokenUserId = String(tokenPayload?.sub ?? "").trim();
  const tokenRole = String(tokenPayload?.role ?? "").trim().toLowerCase();
  const tokenEmail = String(tokenPayload?.email ?? "").trim();

  const cookieValue = getCookieValue(USER_METADATA_COOKIE);
  if (cookieValue) {
    try {
      const parsed = JSON.parse(cookieValue) as UserMetadata;
      const merged: UserMetadata = {
        id: parsed.id || tokenUserId || undefined,
        role: parsed.role || tokenRole || undefined,
        name:
          parsed.name ||
          (tokenEmail ? tokenEmail.split("@")[0] : undefined) ||
          undefined,
      };
      if (
        merged.id !== parsed.id ||
        merged.role !== parsed.role ||
        merged.name !== parsed.name
      ) {
        setUserMetadata(merged);
      }
      return merged;
    } catch {
      clearCookieValue(USER_METADATA_COOKIE);
    }
  }

  const stored = window.localStorage.getItem(USER_METADATA_KEY);
  if (!stored) {
    if (!tokenUserId && !tokenRole && !tokenEmail) return null;
    const inferred: UserMetadata = {
      id: tokenUserId || undefined,
      role: tokenRole || undefined,
      name: tokenEmail ? tokenEmail.split("@")[0] : undefined,
    };
    setUserMetadata(inferred);
    return inferred;
  }
  try {
    const parsed = JSON.parse(stored) as UserMetadata;
    const merged: UserMetadata = {
      id: parsed.id || tokenUserId || undefined,
      role: parsed.role || tokenRole || undefined,
      name:
        parsed.name ||
        (tokenEmail ? tokenEmail.split("@")[0] : undefined) ||
        undefined,
    };
    if (
      merged.id !== parsed.id ||
      merged.role !== parsed.role ||
      merged.name !== parsed.name
    ) {
      setUserMetadata(merged);
    }
    return merged;
  } catch {
    if (!tokenUserId && !tokenRole && !tokenEmail) return null;
    const inferred: UserMetadata = {
      id: tokenUserId || undefined,
      role: tokenRole || undefined,
      name: tokenEmail ? tokenEmail.split("@")[0] : undefined,
    };
    setUserMetadata(inferred);
    return inferred;
  }
}

export function setUserMetadata(metadata: UserMetadata | null): void {
  if (typeof window === "undefined") return;
  if (!metadata || Object.keys(metadata).length === 0) {
    window.localStorage.removeItem(USER_METADATA_KEY);
    clearCookieValue(USER_METADATA_COOKIE);
    return;
  }
  const raw = JSON.stringify(metadata);
  window.localStorage.setItem(USER_METADATA_KEY, raw);
  setCookieValue(USER_METADATA_COOKIE, raw, USER_METADATA_COOKIE_MAX_AGE);
}

export function clearUserMetadata(): void {
  setUserMetadata(null);
}
