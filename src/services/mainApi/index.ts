// Main API exports
import { clearAccessToken, getAccessToken, setAccessToken } from "./session";

export interface ApiFetchOptions {
	baseUrl?: string;
	path: string;
	method?: string;
	headers?: HeadersInit;
	body?: unknown;
	timeoutMs?: number;
	retryOnAuthFailure?: boolean;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 30000);
const AUTH_REFRESH_PATH = "/auth/refresh";
let refreshInFlight: Promise<string | null> | null = null;

function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

function isUnsafeMethod(method: string): boolean {
	return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

function isAuthPath(path: string): boolean {
	return path.startsWith("/auth/");
}

async function refreshAccessToken(baseUrl: string, timeoutMs: number): Promise<string | null> {
	if (!refreshInFlight) {
		refreshInFlight = (async () => {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
			try {
				const response = await fetch(`${baseUrl}${AUTH_REFRESH_PATH}`, {
					method: "POST",
					credentials: "include",
					signal: controller.signal,
				});
				if (!response.ok) {
					clearAccessToken();
					return null;
				}
				const payload = (await response.json()) as { accessToken?: string };
				const token = payload.accessToken ?? null;
				if (token) {
					setAccessToken(token);
					return token;
				}
				clearAccessToken();
				return null;
			} catch {
				clearAccessToken();
				return null;
			} finally {
				clearTimeout(timeoutId);
				refreshInFlight = null;
			}
		})();
	}
	return refreshInFlight;
}

export async function fetchServer<T>({
	baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
	path,
	method = "GET",
	headers,
	body,
	timeoutMs,
	retryOnAuthFailure = true,
}: ApiFetchOptions): Promise<T> {
	const controller = new AbortController();
	const timeout = timeoutMs ?? DEFAULT_TIMEOUT_MS;
	const timeoutId = setTimeout(() => controller.abort(), timeout);

	const isFormData = typeof FormData !== "undefined" && body instanceof FormData;
	const hasBody = body !== undefined && body !== null;

	try {
		const requestHeaders = new Headers(headers ?? {});
		if (!isFormData && !requestHeaders.has("Content-Type")) {
			requestHeaders.set("Content-Type", "application/json");
		}
		const accessToken = getAccessToken();
		if (accessToken && !requestHeaders.has("Authorization")) {
			requestHeaders.set("Authorization", `Bearer ${accessToken}`);
		}

		const csrfToken = getCookieValue("XSRF-TOKEN");
		if (
			csrfToken &&
			isUnsafeMethod(method) &&
			!requestHeaders.has("X-XSRF-TOKEN")
		) {
			requestHeaders.set("X-XSRF-TOKEN", csrfToken);
		}

		const response = await fetch(`${baseUrl}${path}`, {
			method,
			headers: requestHeaders,
			body: hasBody ? (isFormData ? (body as FormData) : JSON.stringify(body)) : undefined,
			credentials: "include",
			signal: controller.signal,
		});

		if (!response.ok) {
			if (
				response.status === 401 &&
				retryOnAuthFailure &&
				!isAuthPath(path)
			) {
				const refreshed = await refreshAccessToken(baseUrl, timeout);
				if (refreshed) {
					return fetchServer<T>({
						baseUrl,
						path,
						method,
						headers,
						body,
						timeoutMs: timeout,
						retryOnAuthFailure: false,
					});
				}
			}
			throw new Error(`HTTP ${response.status}`);
		}

		if (response.status === 204) {
			return null as T;
		}

		const contentType = response.headers.get("content-type") ?? "";
		if (contentType.includes("application/json")) {
			return (await response.json()) as T;
		}

		const text = await response.text();
		if (!text) {
			return null as T;
		}

		try {
			return JSON.parse(text) as T;
		} catch {
			return text as T;
		}
	} finally {
		clearTimeout(timeoutId);
	}
}

export { getAccessToken, setAccessToken, clearAccessToken, refreshAccessToken };
export * from "./client";
