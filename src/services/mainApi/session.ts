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

  const cookieValue = getCookieValue(USER_METADATA_COOKIE);
  if (cookieValue) {
    try {
      return JSON.parse(cookieValue) as UserMetadata;
    } catch {
      clearCookieValue(USER_METADATA_COOKIE);
    }
  }

  const stored = window.localStorage.getItem(USER_METADATA_KEY);
  if (!stored) return null;
  try {
    return JSON.parse(stored) as UserMetadata;
  } catch {
    return null;
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
