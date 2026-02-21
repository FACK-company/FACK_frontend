const ACCESS_TOKEN_KEY = "fack_access_token";

let accessTokenMemory: string | null = null;

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
