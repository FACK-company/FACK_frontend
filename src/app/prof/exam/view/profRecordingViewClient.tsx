"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mainApi } from "@/services";
import { getUserMetadata } from "@/services/mainApi/session";
import ProfileMenu from "@/components/ProfileMenu";
import type {
  ProfessorRecordingComment,
  ProfessorRecordingDetailResponse,
  ExamSession,
} from "@/types/api/main";
import styles from "./page.module.css";

function formatSeconds(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

type ProfRecordingViewClientProps = {
  courseId: string;
  examId: string;
  sessionId: string;
};

export default function ProfRecordingViewClient({
  courseId,
  examId,
  sessionId,
}: ProfRecordingViewClientProps) {
  const [sessionData, setSessionData] = useState<ExamSession | null>(null);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [comments, setComments] = useState<ProfessorRecordingComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("prof_username");
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const metadata = await mainApi.getExamSessionMetadata(sessionId);
        const url = mainApi.getSessionRecordingUrl(sessionId);
        
        if (!isMounted) return;
        setSessionData(metadata);
        setVideoUrl(url);
        // Comments can be loaded separately if needed
        setComments([]);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading session:", err);
        setError("Unable to load recording detail.");
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [sessionId]);

  useEffect(() => {
    setIsMounted(true);
    const metadata = getUserMetadata();
    // console.log("User metadata:", metadata);
    setUsername(metadata?.name?.trim() || "prof_username");
  }, []);

  const formatDateTime = (dateString: string) => {
    if (!isMounted) return "Loading...";
    try {
      return new Date(dateString).toLocaleString();
    } catch {
      return dateString;
    }
  };

  const sortedComments = useMemo(
    () => [...comments].sort((a, b) => a.timestampSec - b.timestampSec),
    [comments]
  );

  const handleJumpTo = (timestampSec: number) => {
    if (!videoRef.current) return;
    videoRef.current.currentTime = timestampSec;
    videoRef.current.play().catch(() => {});
  };

  const handleAddComment = async () => {
    const text = commentText.trim();
    if (!text || !sessionData) return;

    const currentTime = videoRef.current?.currentTime ?? 0;
    setIsSubmitting(true);
    setError("");

    try {
      const newComment = await mainApi.addRecordingComment(courseId, examId, sessionId, {
        timestampSec: Math.floor(currentTime),
        text,
      });
      setComments((prev) => [newComment, ...prev]);
      setCommentText("");
    } catch {
      setError("Unable to save comment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const calculateDuration = () => {
    if (!sessionData || !sessionData.endTime) return "In progress";
    const durationSec = Math.round(
      (new Date(sessionData.endTime).getTime() - new Date(sessionData.startTime).getTime()) / 1000
    );
    if (durationSec < 60) return `${durationSec} sec`;
    const durationMin = Math.round(durationSec / 60);
    return `${durationMin} min`;
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/prof/home">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links">
          <a href="/prof/home">Home</a>
          {/* <a href="/prof/recordings">Recordings</a> */}
        </nav>
        <ProfileMenu username={username} />
      </header>

      <main className="main">
        <section className="frame">
          {isLoading && <div className={styles.emptyText}>Loading recording...</div>}
          
          {!isLoading && (
            <>
              <div className="page-title">
                Recording Detail
                {sessionData ? ` — ${sessionData.student.name} (${sessionData.student.email})` : ""}
              </div>

              {error && <div className={styles.errorBanner}>{error}</div>}

              {sessionData && (
            <>
              <section className={`detail-card ${styles.detailCard}`}>
                <div className="row">
                  <div>
                    <div className="label">Exam ID</div>
                    <div className="value">{sessionData.examId}</div>
                  </div>
                  <span
                    className={`badge ${
                      sessionData.status === "submitted" ? "submitted" : "not-started"
                    }`}
                  >
                    {sessionData.status}
                  </span>
                </div>
                <div className={styles.metaGrid}>
                  <div>
                    <div className="label">Student</div>
                    <div className="value">{sessionData.student.name}</div>
                  </div>
                  <div>
                    <div className="label">Start time</div>
                    <div className="value">{formatDateTime(sessionData.startTime)}</div>
                  </div>
                  <div>
                    <div className="label">End time</div>
                    <div className="value">{sessionData.endTime ? formatDateTime(sessionData.endTime) : "In progress"}</div>
                  </div>
                  <div>
                    <div className="label">Duration</div>
                    <div className="value">{calculateDuration()}</div>
                  </div>
                </div>
                {sessionData.browserInfo && (
                  <div className={styles.metaGrid}>
                    <div>
                      <div className="label">Browser Info</div>
                      <div className="value" style={{ fontSize: "12px" }}>{sessionData.browserInfo}</div>
                    </div>
                    <div>
                      <div className="label">IP Address</div>
                      <div className="value">{sessionData.ipAddress || "—"}</div>
                    </div>
                  </div>
                )}
              </section>

              <div className={styles.contentGrid}>
                {videoUrl && sessionData.screenRecordingPath ? (
                  <section className={`player ${styles.player}`}>
                    <video
                      ref={videoRef}
                      className={styles.videoPlayer}
                      controls
                      preload="metadata"
                      src={videoUrl}
                    />
                    <div className={styles.videoActions}>
                      <a
                        className={`primary-btn ${styles.downloadBtn}`}
                        href={videoUrl}
                        download
                      >
                        Download Video
                      </a>
                    </div>
                  </section>
                ) : (
                  <section className={`player ${styles.player}`}>
                    <div className={styles.noRecordingMsg}>
                      No recording available for this session.
                    </div>
                  </section>
                )}

                <section className={styles.commentSection}>
                  <div className={styles.commentHeader}>Timeline comments</div>
                  <div className={styles.commentForm}>
                    <textarea
                      className={styles.commentInput}
                      value={commentText}
                      onChange={(event) => setCommentText(event.target.value)}
                      placeholder="Add a comment at the current video timestamp..."
                    />
                    <button
                      className="primary-btn"
                      type="button"
                      onClick={handleAddComment}
                      disabled={isSubmitting || !commentText.trim()}
                    >
                      {isSubmitting ? "Saving..." : "Add Comment at Current Time"}
                    </button>
                  </div>

                  <div className={styles.commentList}>
                    {sortedComments.map((comment) => (
                      <div className={styles.commentItem} key={comment.id}>
                        <button
                          className={styles.timestampBtn}
                          type="button"
                          onClick={() => handleJumpTo(comment.timestampSec)}
                        >
                          {formatSeconds(comment.timestampSec)}
                        </button>
                        <div className={styles.commentText}>{comment.text}</div>
                      </div>
                    ))}
                    {!sortedComments.length && (
                      <div className={styles.emptyText}>No comments yet.</div>
                    )}
                  </div>
                </section>
              </div>
              </>
            )}
          </>
          )}
        </section>
      </main>
    </div>
  );
}
