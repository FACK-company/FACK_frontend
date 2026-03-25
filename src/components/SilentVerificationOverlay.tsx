"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePingCheck } from "@/hooks";
import styles from "./SilentVerificationOverlay.module.css";

type SilentVerificationOverlayProps = {
  studentId: string;
};

type Phase = "idle" | "locked" | "done";

const DURATION_SECONDS = 30;

export default function SilentVerificationOverlay({
  studentId,
}: SilentVerificationOverlayProps) {
  const { active, pingId, remainingSeconds, seenPingIds } = usePingCheck(studentId);
  const [phase, setPhase] = useState<Phase>("idle");
  const [countdown, setCountdown] = useState(DURATION_SECONDS);
  const [currentPingId, setCurrentPingId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const displayCountdown = Math.max(0, Math.min(countdown, DURATION_SECONDS));

  const startCountdown = (nextPingId: string, initialSeconds: number) => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }

    setCurrentPingId(nextPingId);
    setCountdown(initialSeconds);
    setPhase("locked");

    timerRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setPhase("done");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  useEffect(() => {
    if (!active || !pingId) return;
    if (currentPingId === pingId && phase !== "idle") return;
    if (seenPingIds.current.has(pingId)) return;

    const initialSeconds =
      remainingSeconds > 0 ? Math.min(remainingSeconds, DURATION_SECONDS) : DURATION_SECONDS;
    startCountdown(pingId, initialSeconds);
  }, [active, pingId, remainingSeconds, phase, currentPingId, seenPingIds]);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    };
  }, []);

  const progressKey = useMemo(() => currentPingId ?? "idle", [currentPingId]);

  const handleDismiss = () => {
    if (currentPingId) {
      seenPingIds.current.add(currentPingId);
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    setPhase("idle");
    setCountdown(DURATION_SECONDS);
    setCurrentPingId(null);
  };

  if (phase === "idle") {
    return null;
  }

  const isDone = phase === "done";

  return (
    <div className={styles.overlay} role="dialog" aria-live="polite">
      <div className={styles.card}>
        <div className={styles.title}>
          {isDone ? "Test Complete" : "Connection Test"}
        </div>
        <div className={styles.subtitle}>
          {isDone
            ? "Your connection has been verified"
            : "Connection testing is performed, please do not close this in 30s"}
        </div>

        <div className={styles.progressTrack}>
          <div
            key={progressKey}
            className={styles.progressFill}
            style={{ animationDuration: `${DURATION_SECONDS}s` }}
          />
        </div>

        <div className={styles.countdown}>{displayCountdown}s remaining</div>

        <button
          type="button"
          className={`primary-btn ${styles.closeButton}`}
          disabled={!isDone}
          onClick={handleDismiss}
        >
          Close
        </button>
      </div>
    </div>
  );
}
