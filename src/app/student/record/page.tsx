"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getUserMetadata, mainApi } from "@/services";
import StudentNav from "../StudentNav";
import LoadingState from "@/components/LoadingState";
import type { StudentExamDetailResponse } from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_USERNAME = "student_name";

function parseBeginEnd(timeWindow: string): { beginTime: string; endTime: string } {
  const match = timeWindow.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/
  );
  if (match) {
    const [, monthText, dayText, beginText, endText] = match;
    const day = String(Number(dayText));
    return {
      beginTime: `${monthText} ${day} - ${beginText}`,
      endTime: `${monthText} ${day} - ${endText}`,
    };
  }

  const timeOnly = timeWindow.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (timeOnly) {
    return { beginTime: timeOnly[1], endTime: timeOnly[2] };
  }

  return { beginTime: timeWindow, endTime: "-" };
}

function deriveDurationSeconds(exam: StudentExamDetailResponse | null): number {
  if (!exam) return 0;
  if (exam.durationMinutes && exam.durationMinutes > 0) {
    return exam.durationMinutes * 60;
  }

  const match = exam.timeWindow.match(/(\d{1,2}):(\d{2})\s*[-–]\s*(\d{1,2}):(\d{2})/);
  if (!match) return 0;

  const startHour = Number(match[1]);
  const startMin = Number(match[2]);
  const endHour = Number(match[3]);
  const endMin = Number(match[4]);
  const startTotal = startHour * 60 + startMin;
  const endTotal = endHour * 60 + endMin;
  const diffMinutes = Math.max(0, endTotal - startTotal);
  return diffMinutes * 60;
}

function getRecordingMimeType(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const type of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(type)) {
      return type;
    }
  }
  return "video/webm";
}

function generateSessionId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

type StartGateDecision = {
  canStart: boolean;
  remainingSeconds: number;
  message?: string;
};

function evaluateStartGate(exam: StudentExamDetailResponse | null, nowMs: number): StartGateDecision {
  const fullDurationSeconds = deriveDurationSeconds(exam);
  if (!exam?.startAvailableAt || !exam?.endAvailableAt) {
    return {
      canStart: true,
      remainingSeconds: fullDurationSeconds,
    };
  }

  const startMs = new Date(exam.startAvailableAt).getTime();
  const endMs = new Date(exam.endAvailableAt).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
    return {
      canStart: true,
      remainingSeconds: fullDurationSeconds,
    };
  }

  if (nowMs < startMs) {
    return {
      canStart: false,
      remainingSeconds: 0,
      message: "Exam has not started yet. You can begin at the scheduled start time.",
    };
  }

  const remainingByWindowSeconds = Math.floor((endMs - nowMs) / 1000);
  const remainingSeconds = Math.max(0, Math.min(fullDurationSeconds, remainingByWindowSeconds));
  if (remainingSeconds <= 0) {
    return {
      canStart: false,
      remainingSeconds: 0,
      message: "Exam start window is closed.",
    };
  }

  return {
    canStart: true,
    remainingSeconds,
    message: "Timer is capped by exam end time.",
  };
}

function StudentRecordPageContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const courseId = searchParams.get("courseId") || "cs207";
  const examId = searchParams.get("examId") || "final-exam";

  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [exam, setExam] = useState<StudentExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [remainingSec, setRemainingSec] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [isPermissionPending, setIsPermissionPending] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(Date.now());

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const chunkIndexRef = useRef(0);
  const sessionIdRef = useRef<string | null>(null);
  const stopRecorderAndFinalizeRef = useRef<(() => Promise<void>) | undefined>(undefined);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setLoading(true);
      setError("");
      try {
        const [profile, examResp] = await Promise.all([
          mainApi.getStudentProfile(),
          mainApi.getStudentExamDetail(courseId, examId),
        ]);
        if (!isMounted) return;
        setUsername(profile.username || DEFAULT_USERNAME);
        setExam(examResp);
      } catch {
        if (!isMounted) return;
        setError("Unable to load exam details.");
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    load();
    return () => {
      isMounted = false;
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
        mediaRecorderRef.current.stop();
      }
      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
    };
  }, [courseId, examId]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setRemainingSec((prev) => Math.max(0, prev - 1));
    }, 1000);
    return () => clearInterval(timer);
  }, [isRecording]);

  // Auto-submit when timer reaches 0
  useEffect(() => {
    if (isRecording && remainingSec === 0 && !isFinalizing) {
      stopRecorderAndFinalizeRef.current?.();
    }
  }, [isRecording, remainingSec, isFinalizing]);

  useEffect(() => {
    console.log("Recording session ID changed:", recordingSessionId);
  }, [recordingSessionId]);

  // Warn the student before closing/refreshing the tab while recording
  useEffect(() => {
    if (!isRecording) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isRecording]);

  // Best-effort finalize via sendBeacon when the page is actually being closed
  useEffect(() => {
    if (!isRecording) return;
    const handlePageHide = () => {
      const currentSessionId = sessionIdRef.current;
      const metadata = getUserMetadata();
      if (!currentSessionId || !metadata?.id) return;

      const baseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";
      const url = `${baseUrl}/recordings/finalize`;
      const payload = JSON.stringify({
        sessionId: currentSessionId,
        examId,
        studentId: metadata.id,
        deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      });
      navigator.sendBeacon(url, new Blob([payload], { type: "application/json" }));
    };
    window.addEventListener("pagehide", handlePageHide);
    return () => window.removeEventListener("pagehide", handlePageHide);
  }, [isRecording, examId]);

  useEffect(() => {
    const updateNetwork = () => setIsOnline(typeof navigator !== "undefined" ? navigator.onLine : true);
    updateNetwork();
    window.addEventListener("online", updateNetwork);
    window.addEventListener("offline", updateNetwork);
    return () => {
      window.removeEventListener("online", updateNetwork);
      window.removeEventListener("offline", updateNetwork);
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const timerText = useMemo(() => {
    const total = Math.max(0, Math.floor(remainingSec));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [remainingSec]);

  const beginEnd = useMemo(
    () => (exam ? parseBeginEnd(exam.timeWindow) : { beginTime: "-", endTime: "-" }),
    [exam]
  );
  const totalDurationSec = useMemo(() => deriveDurationSeconds(exam), [exam]);
  const startGate = useMemo(() => evaluateStartGate(exam, nowMs), [exam, nowMs]);

  const enqueueChunkUpload = (sessionId: string, studentId: string, chunk: Blob) => {
    const index = chunkIndexRef.current++;
    const deviceInfo = typeof navigator !== "undefined" ? navigator.userAgent : "unknown";

    uploadQueueRef.current = uploadQueueRef.current.then(async () => {
      await mainApi.uploadRecordingChunk({
        sessionId,
        examId,
        studentId,
        index,
        chunk,
        deviceInfo,
      });
    });

    uploadQueueRef.current = uploadQueueRef.current.catch(() => {
      setError("Chunk upload failed. Please check network and retry.");
    });
  };

  const startRecording = async () => {
    const metadata = getUserMetadata();
    console.log("Starting recording with user metadata:", metadata);
    if (!metadata?.id) {
      console.log("Missing user metadata. Cannot start recording.");
      setError("Missing user metadata. Please sign in again.");
      return;
    }
    console.log("Evaluating start gate with exam data:", exam);
    const gateNow = evaluateStartGate(exam, Date.now());
    if (!gateNow.canStart) {
      console.log("Start gate evaluation failed:", gateNow.message);
      setError(gateNow.message || "Exam cannot be started right now.");
      setShowWarning(true);
      return;
    }

    try {
      console.log("Requesting screen recording permission...");
      setIsPermissionPending(true);
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Enforce full-screen share (not a tab or window)
      const videoTrack = stream.getVideoTracks()[0];
      const trackSettings = videoTrack.getSettings() as MediaTrackSettings & { displaySurface?: string };
      if (trackSettings.displaySurface && trackSettings.displaySurface !== "monitor") {
        stream.getTracks().forEach((t) => t.stop());
        // setError("Please share your ENTIRE SCREEN, not a tab or window.");
        alert("Please share your ENTIRE SCREEN, not a tab or window.");
        setIsPermissionPending(false);
        return;
      }
      console.log("Screen recording permission granted. Starting recorder...");
      const sessionId = generateSessionId();
      const mimeType = getRecordingMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunkIndexRef.current = 0;
      uploadQueueRef.current = Promise.resolve();
      setRecordingSessionId(sessionId);
      sessionIdRef.current = sessionId;
      setRemainingSec(gateNow.remainingSeconds > 0 ? gateNow.remainingSeconds : totalDurationSec);
      setShowWarning(false);
      if (gateNow.message) {
        setError(gateNow.message);
        console.log("Start gate evaluation failed:", gateNow.message);
      } else {
        setError("");
      }
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          enqueueChunkUpload(sessionId, metadata.id as string, event.data);
        }
      };

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          stopRecorderAndFinalize();
        };
      });

      recorder.start(4000);
    } catch {
      // setError("Screen recording permission denied or not available.");
      setIsRecording(false);
      setShowWarning(true);
    } finally {
      setIsPermissionPending(false);
    }
  };

  const stopRecorderAndFinalize = async () => {
    const metadata = getUserMetadata();
    const currentSessionId = sessionIdRef.current;
    if (!metadata?.id || !currentSessionId) {
      console.log("Missing metadata or recording session ID", { metadata, currentSessionId });
      setError("Missing recording session information.");
      return;
    }

    setIsFinalizing(true);
    setShowStopModal(false);
    window.focus();

    try {
      const recorder = mediaRecorderRef.current;
      if (recorder && recorder.state !== "inactive") {
        await new Promise<void>((resolve) => {
          recorder.addEventListener("stop", () => resolve(), { once: true });
          recorder.stop();
        });
      }

      mediaStreamRef.current?.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;

      await uploadQueueRef.current;
      console.log("payload: ", { sessionId: currentSessionId, examId, studentId: metadata.id });
      await mainApi.finalizeRecording({
        sessionId: currentSessionId,
        examId,
        studentId: metadata.id,
        deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      });

      setIsRecording(false);
      setRecordingSessionId(null);
      sessionIdRef.current = null;
      setRemainingSec(0);

      const params = new URLSearchParams();
      params.set("courseId", courseId);
      if (exam?.courseCode) params.set("courseCode", exam.courseCode);
      if (exam?.title) params.set("examTitle", exam.title);
      router.replace(`/student/record/complete?${params.toString()}`);
    } catch {
      setError("Unable to finalize recording. Please retry ending the exam.");
    } finally {
      setIsFinalizing(false);
    }
  };

  // Keep the ref in sync with the latest stopRecorderAndFinalize
  stopRecorderAndFinalizeRef.current = stopRecorderAndFinalize;

  return (
    <div className="page bg-record">
      {!isRecording && <StudentNav username={username} />}

      <header className={`topbar ${styles.topbarLayout}`} style={{ display: isRecording ? "grid" : "none" }}>
        <div className={`status ${styles.topbarCell} ${styles.topbarLeft}`}>
          <span className="dot" aria-hidden="true"></span>
          <span className="label">Recording status:</span>
          <span className="value">Recording</span>
        </div>
        <div className={`timer ${styles.topbarCell} ${styles.topbarCenter}`}>
          <span className="label">Timer:</span>
          <span className="value">{timerText}</span>
        </div>
        <div className={`network ${styles.topbarCell} ${styles.topbarRight}`}>
          <span className="label">Network status:</span>
          <span className="value">{isOnline ? "Online" : "Offline"}</span>
        </div>
      </header>

      <main className={`${styles.layout} ${isRecording ? styles.layoutRecording : ""}`}>
        {isRecording && (
          <div className="message-bar">
            Your screen is being recorded. Please do not close this tab.
          </div>
        )}
        {!isRecording && showWarning && (
          <div className={styles.topWarningNotice}>
            Cannot begin exam without recording permission.
          </div>
        )}

        {loading && (
          <div className={styles.placeholder}>
            <LoadingState text="Loading exam..." variant="inline" />
          </div>
        )}
        {!loading && error && <div className={styles.error}>{error}</div>}

        {!loading && !error && exam && (
          <>
            <section className="panel left">
              <h2 className={styles.sectionTitle}>Exam metadata</h2>
              <div className={`meta ${styles.metaTable}`}>
                <div className="row">
                  <div className="k">Course</div>
                  <div className="v">{exam.courseCode}</div>
                </div>
                <div className={`row ${styles.descriptionRow}`}>
                  <div className="k">Description</div>
                  <div className={`v ${styles.descriptionValue}`}>{exam.description || "-"}</div>
                </div>
                <div className="row">
                  <div className="k">Duration</div>
                  <div className="v">{exam.durationMinutes} minutes</div>
                </div>
                <div className="row">
                  <div className="k">Begin time</div>
                  <div className="v">{beginEnd.beginTime}</div>
                </div>
                <div className="row">
                  <div className="k">End time</div>
                  <div className="v">{beginEnd.endTime}</div>
                </div>
                <div className="row">
                  <div className="k">Title</div>
                  <div className="v">{exam.title}</div>
                </div>
              </div>
            </section>

            <section className="panel right">
              {!isRecording && (
                <div className="actions">
                  <button
                    className="primary-btn"
                    type="button"
                    disabled={isPermissionPending || !startGate.canStart}
                    onClick={startRecording}
                  >
                    {isPermissionPending ? "Waiting for permission..." : "Start Recording & Exam"}
                  </button>
                  <div className={`warning ${styles.warningCentered}`}>
                    {startGate.canStart
                      ? "Screen recording permission is required to start the exam."
                      : (startGate.message || "Exam cannot be started right now.")}
                  </div>
                </div>
              )}
            </section>
          </>
        )}
      </main>

      <button
        className="stop-btn"
        type="button"
        style={{ display: isRecording ? "block" : "none" }}
        onClick={() => setShowStopModal(true)}
      >
        End Exam
      </button>

      {isFinalizing && (
        <div className="modal show">
          <div className="modal-card" role="dialog" aria-modal="true" style={{ textAlign: "center" }}>
            <h3>Finalizing your exam...</h3>
            <p>Please wait while your recording is being saved and submitted.</p>
            <LoadingState text="" variant="inline" />
          </div>
        </div>
      )}

      {showStopModal && !isFinalizing && (
        <div className="modal show">
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3>End exam?</h3>
            <p>If you end now, your recording will be saved and your exam will be submitted.</p>
            <div className="modal-actions">
              <button className={styles.modalSecondaryBtn} type="button" onClick={() => setShowStopModal(false)}>
                Cancel
              </button>
              <button className={styles.modalDangerBtn} type="button" onClick={stopRecorderAndFinalize}>
                End Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function StudentRecordPage() {
  return (
    <Suspense fallback={<div className="page bg-record" />}>
      <StudentRecordPageContent />
    </Suspense>
  );
}
