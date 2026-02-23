const ACCESS_TOKEN_KEY = "fack_access_token";
const USER_METADATA_KEY = "fack_user";

let accessTokenMemory: string | null = null;

export interface UserMetadata {
  id?: string;
  name?: string;
  role?: string;
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
    return;
  }
  window.localStorage.setItem(USER_METADATA_KEY, JSON.stringify(metadata));
}

export function clearUserMetadata(): void {
  setUserMetadata(null);
}
