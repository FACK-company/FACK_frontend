import { useEffect, useRef, useState } from "react";
import { getAccessToken, refreshAccessToken } from "@/services";

type PingWsMessage = {
  type?: string | null;
  pingId?: string | null;
  studentId?: string | null;
  startTime?: string | null;
  expiresAt?: string | null;
  durationSeconds?: number | null;
  remainingSeconds?: number | null;
};

type PingCheckState = {
  active: boolean;
  pingId: string | null;
  remainingSeconds: number;
  expiresAt: string | null;
};

const DEFAULT_DURATION_SECONDS = 30;
const RECONNECT_DELAY_MS = 3000;

function buildWebSocketUrl(token: string): string | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
  if (!baseUrl) return null;
  const wsBase = baseUrl.replace(/^http/i, "ws").replace(/\/+$/, "");
  return `${wsBase}/ws/ping?token=${encodeURIComponent(token)}`;
}

export function usePingCheck(studentId: string) {
  const [state, setState] = useState<PingCheckState>({
    active: false,
    pingId: null,
    remainingSeconds: 0,
    expiresAt: null,
  });
  const seenPingIds = useRef<Set<string>>(new Set());
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const connectingRef = useRef(false);
  const shouldReconnectRef = useRef(true);

  useEffect(() => {
    if (!studentId) {
      setState({
        active: false,
        pingId: null,
        remainingSeconds: 0,
        expiresAt: null,
      });
      return;
    }

    let cancelled = false;
    shouldReconnectRef.current = true;

    const scheduleReconnect = () => {
      if (!shouldReconnectRef.current) return;
      if (reconnectTimerRef.current) return;
      reconnectTimerRef.current = setTimeout(() => {
        reconnectTimerRef.current = null;
        void connect();
      }, RECONNECT_DELAY_MS);
    };

    const handleMessage = (event: MessageEvent) => {
      if (!event?.data) return;
      let payload: PingWsMessage | null = null;
      try {
        payload = JSON.parse(event.data) as PingWsMessage;
      } catch {
        return;
      }
      if (!payload || payload.type !== "PING") return;

      const pingId = payload.pingId ?? null;
      if (!pingId) return;
      if (seenPingIds.current.has(pingId)) return;

      const durationSeconds =
        typeof payload.durationSeconds === "number" && payload.durationSeconds > 0
          ? payload.durationSeconds
          : DEFAULT_DURATION_SECONDS;

      const nowMs = Date.now();
      const startMs = payload.startTime ? Date.parse(payload.startTime) : nowMs;
      const expiresMs = payload.expiresAt
        ? Date.parse(payload.expiresAt)
        : startMs + durationSeconds * 1000;
      const remainingSeconds =
        typeof payload.remainingSeconds === "number"
          ? Math.max(0, Math.min(payload.remainingSeconds, durationSeconds))
          : Math.max(0, Math.ceil((expiresMs - nowMs) / 1000));

      if (remainingSeconds <= 0) return;

      setState({
        active: true,
        pingId,
        remainingSeconds: Math.min(remainingSeconds, durationSeconds),
        expiresAt: payload.expiresAt ?? new Date(expiresMs).toISOString(),
      });
    };

    const connect = async () => {
      if (connectingRef.current || cancelled) return;
      connectingRef.current = true;
      try {
        let token = getAccessToken();
        if (!token) {
          try {
            token = await refreshAccessToken(
              process.env.NEXT_PUBLIC_API_BASE_URL ?? "",
              Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 30000)
            );
          } catch {
            token = null;
          }
        }

        if (!token || cancelled) {
          connectingRef.current = false;
          return;
        }

        const wsUrl = buildWebSocketUrl(token);
        if (!wsUrl) {
          connectingRef.current = false;
          return;
        }

        const ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          connectingRef.current = false;
        };

        ws.onmessage = handleMessage;

        ws.onclose = () => {
          wsRef.current = null;
          connectingRef.current = false;
          if (cancelled) return;
          scheduleReconnect();
        };

        ws.onerror = () => {
          connectingRef.current = false;
          try {
            ws.close();
          } catch {
            // ignore
          }
        };
      } catch {
        connectingRef.current = false;
        scheduleReconnect();
      }
    };

    void connect();
    return () => {
      cancelled = true;
      shouldReconnectRef.current = false;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
        reconnectTimerRef.current = null;
      }
      if (wsRef.current) {
        try {
          wsRef.current.close();
        } catch {
          // ignore
        }
        wsRef.current = null;
      }
    };
  }, [studentId]);

  const markSeen = (pingId?: string | null) => {
    if (!pingId) return;
    seenPingIds.current.add(pingId);
  };

  return {
    active: state.active,
    pingId: state.pingId,
    remainingSeconds: state.remainingSeconds,
    expiresAt: state.expiresAt,
    seenPingIds,
    markSeen,
  };
}
