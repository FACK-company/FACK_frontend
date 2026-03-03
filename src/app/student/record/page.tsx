"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
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

function StudentRecordPageContent() {
  const searchParams = useSearchParams();
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
  const [recordingSessionId, setRecordingSessionId] = useState<string | null>(null);

  const mediaStreamRef = useRef<MediaStream | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const uploadQueueRef = useRef<Promise<void>>(Promise.resolve());
  const chunkIndexRef = useRef(0);

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
    if (!metadata?.id) {
      setError("Missing user metadata. Please sign in again.");
      return;
    }

    try {
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

      const sessionId = generateSessionId();
      const mimeType = getRecordingMimeType();
      const recorder = new MediaRecorder(stream, { mimeType });

      mediaStreamRef.current = stream;
      mediaRecorderRef.current = recorder;
      chunkIndexRef.current = 0;
      uploadQueueRef.current = Promise.resolve();
      setRecordingSessionId(sessionId);
      setRemainingSec(totalDurationSec);
      setShowWarning(false);
      setError("");
      setIsRecording(true);

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          enqueueChunkUpload(sessionId, metadata.id as string, event.data);
        }
      };

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          setShowStopModal(true);
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
    if (!metadata?.id || !recordingSessionId) {
      setError("Missing recording session information.");
      return;
    }

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

      await mainApi.finalizeRecording({
        sessionId: recordingSessionId,
        examId,
        studentId: metadata.id,
        deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
      });

      setIsRecording(false);
      setRecordingSessionId(null);
      setRemainingSec(0);
      setShowStopModal(false);
    } catch {
      setError("Unable to finalize recording. Please retry ending the exam.");
    }
  };

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
                    disabled={isPermissionPending}
                    onClick={startRecording}
                  >
                    {isPermissionPending ? "Waiting for permission..." : "Start Recording & Exam"}
                  </button>
                  <div className={`warning ${styles.warningCentered}`}>
                    Screen recording permission is required to start the exam.
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

      {showStopModal && (
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
