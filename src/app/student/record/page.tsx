"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { mainApi } from "@/services";
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

export default function StudentRecordPage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "cs207";
  const examId = searchParams.get("examId") || "final-exam";

  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [exam, setExam] = useState<StudentExamDetailResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [timeSec, setTimeSec] = useState(0);
  const [isOnline, setIsOnline] = useState(true);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showStopModal, setShowStopModal] = useState(false);
  const [showWarning, setShowWarning] = useState(true);
  const [pdfPreviewFailed, setPdfPreviewFailed] = useState(false);

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
        setPdfPreviewFailed(false);
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
    };
  }, [courseId, examId]);

  useEffect(() => {
    if (!isRecording) return;
    const timer = setInterval(() => {
      setTimeSec((prev) => prev + 1);
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
    const total = Math.max(0, Math.floor(timeSec));
    const h = String(Math.floor(total / 3600)).padStart(2, "0");
    const m = String(Math.floor((total % 3600) / 60)).padStart(2, "0");
    const s = String(total % 60).padStart(2, "0");
    return `${h}:${m}:${s}`;
  }, [timeSec]);

  const beginEnd = useMemo(
    () => (exam ? parseBeginEnd(exam.timeWindow) : { beginTime: "-", endTime: "-" }),
    [exam]
  );

  const handleAllowPermission = () => {
    setShowPermissionModal(false);
    setShowWarning(false);
    setIsRecording(true);
  };

  return (
    <div className="page bg-record">
      {!isRecording && (
        <header className="nav">
          <a className="brand" href="/student/home">
            Fulbright AntiCheat Knight
          </a>
          <nav className="nav-links" aria-hidden="true"></nav>
          <div className="user">
            <span className="user-name">{username}</span>
            <span className="avatar" aria-hidden="true"></span>
          </div>
        </header>
      )}

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

        {loading && <div className={styles.placeholder}>Loading exam...</div>}
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
                    onClick={() => setShowPermissionModal(true)}
                  >
                    Start Recording &amp; Exam
                  </button>
                  {showWarning && (
                    <div className={`warning ${styles.warningCentered}`}>
                      Screen recording permission is required to start the exam.
                    </div>
                  )}
                </div>
              )}

              {isRecording && (
                <div className="pdf-tab">
                  <div className="pdf-head">
                    <a className="download-link" href={exam.examFileUrl} download>
                      <span className="dl-icon" aria-hidden="true"></span>
                      Download Problem PDF
                    </a>
                  </div>
                  {!pdfPreviewFailed ? (
                    <iframe
                      key={exam.examFileUrl}
                      className={styles.pdfPreview}
                      title="exam-pdf"
                      src={exam.examFileUrl}
                      onError={() => setPdfPreviewFailed(true)}
                    ></iframe>
                  ) : (
                    <div className={styles.pdfFallback}>
                      PDF preview is unavailable. Use Download Problem PDF.
                    </div>
                  )}
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

      {showPermissionModal && (
        <div className="modal show">
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3>Allow screen recording?</h3>
            <p>We need your permission to record your screen before starting the exam.</p>
            <div className="modal-actions">
              <button
                className={styles.modalDenyBtn}
                type="button"
                onClick={() => {
                  setShowPermissionModal(false);
                  setShowWarning(true);
                }}
              >
                Deny
              </button>
              <button
                className={styles.modalPrimaryBtn}
                type="button"
                onClick={handleAllowPermission}
              >
                Allow
              </button>
            </div>
          </div>
        </div>
      )}

      {showStopModal && (
        <div className="modal show">
          <div className="modal-card" role="dialog" aria-modal="true">
            <h3>End exam?</h3>
            <p>If you end now, your recording will be saved and your exam will be submitted.</p>
            <div className="modal-actions">
              <button
                className={styles.modalSecondaryBtn}
                type="button"
                onClick={() => setShowStopModal(false)}
              >
                Cancel
              </button>
              <button
                className={styles.modalDangerBtn}
                type="button"
                onClick={() => {
                  setShowStopModal(false);
                  setIsRecording(false);
                }}
              >
                End Exam
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
