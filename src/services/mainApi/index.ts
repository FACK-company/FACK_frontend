// Main API exports

export interface ApiFetchOptions {
	baseUrl?: string;
	path: string;
	method?: string;
	headers?: HeadersInit;
	body?: unknown;
	timeoutMs?: number;
}

const DEFAULT_TIMEOUT_MS = Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 30000);

function getCookieValue(name: string): string | null {
	if (typeof document === "undefined") return null;
	const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
	return match ? decodeURIComponent(match[1]) : null;
}

function isUnsafeMethod(method: string): boolean {
	return !["GET", "HEAD", "OPTIONS"].includes(method.toUpperCase());
}

export async function fetchServer<T>({
	baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
	path,
	method = "GET",
	headers,
	body,
	timeoutMs,
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

export * from "./client";