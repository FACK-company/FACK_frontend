"use client";

import { getAccessToken } from "./session";

export type SessionSocketEvent = {
  type: string;
  ts?: number;
};

type Listener = (event: SessionSocketEvent) => void;

let socket: WebSocket | null = null;
let socketToken: string | null = null;
const listeners = new Set<Listener>();

function resolveApiBaseUrl(): string {
  const env = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (env) return env;
  if (typeof window === "undefined") return "";
  return `${window.location.protocol}//${window.location.host}/api`;
}

function toWsBaseUrl(httpBase: string): string {
  if (!httpBase) return "";
  if (httpBase.startsWith("ws://") || httpBase.startsWith("wss://")) return httpBase;
  if (httpBase.startsWith("https://")) return `wss://${httpBase.slice("https://".length)}`;
  if (httpBase.startsWith("http://")) return `ws://${httpBase.slice("http://".length)}`;
  return httpBase;
}

export function connectSessionSocket(token?: string): void {
  if (typeof window === "undefined") return;
  const accessToken = token ?? getAccessToken();
  if (!accessToken) return;

  if (socket && socket.readyState === WebSocket.OPEN && socketToken === accessToken) {
    return;
  }
  if (socket && socket.readyState === WebSocket.CONNECTING && socketToken === accessToken) {
    return;
  }

  if (socket) {
    try {
      socket.close();
    } catch {
      // ignore
    }
  }

  const baseUrl = resolveApiBaseUrl();
  const wsBase = toWsBaseUrl(baseUrl);
  if (!wsBase) return;

  const wsUrl = `${wsBase}/ws/session?token=${encodeURIComponent(accessToken)}`;
  socketToken = accessToken;
  socket = new WebSocket(wsUrl);

  socket.onmessage = (event) => {
    if (!event?.data) return;
    try {
      const payload = JSON.parse(event.data as string) as SessionSocketEvent;
      listeners.forEach((listener) => listener(payload));
    } catch {
      // ignore non-JSON payloads
    }
  };

  socket.onclose = () => {
    socket = null;
    socketToken = null;
  };

  socket.onerror = () => {
    // Let onclose reset state
  };
}

export function disconnectSessionSocket(): void {
  if (socket) {
    try {
      socket.close();
    } catch {
      // ignore
    }
  }
  socket = null;
  socketToken = null;
}

export function subscribeSessionSocket(listener: Listener): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
