"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { mainApi } from "@/services";
import type { ProfessorRecordingComment, ProfessorRecordingDetailResponse } from "@/types/api/main";
import styles from "./page.module.css";

function formatSeconds(totalSec: number): string {
  const sec = Math.max(0, Math.floor(totalSec));
  const h = String(Math.floor(sec / 3600)).padStart(2, "0");
  const m = String(Math.floor((sec % 3600) / 60)).padStart(2, "0");
  const s = String(sec % 60).padStart(2, "0");
  return `${h}:${m}:${s}`;
}

export default function ProfRecordingViewPage() {
  const params = useSearchParams();
  const courseId = params.get("courseId") || "cs207";
  const examId = params.get("examId") || "final-exam";
  const sessionId = params.get("sessionId") || "s-1";

  const [recording, setRecording] = useState<ProfessorRecordingDetailResponse | null>(null);
  const [comments, setComments] = useState<ProfessorRecordingComment[]>([]);
  const [commentText, setCommentText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("prof_username");

  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const data = await mainApi.getRecordingDetail(courseId, examId, sessionId);
        if (!isMounted) return;
        setRecording(data);
        setComments(data.comments || []);
      } catch {
        if (!isMounted) return;
        setError("Unable to load recording detail.");
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, [courseId, examId, sessionId]);

  useEffect(() => {
    let isMounted = true;

    async function loadUsername() {
      try {
        const profile = await mainApi.getProfessorProfile();
        if (!isMounted) return;
        setUsername(profile.username || "prof_username");
      } catch {
        if (!isMounted) return;
        setUsername("prof_username");
      }
    }

    loadUsername();

    return () => {
      isMounted = false;
    };
  }, []);

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
    if (!text || !recording) return;

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

  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/prof/home">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links">
          <a href="/prof/home">Home</a>
          <a href="/prof/recordings">Recordings</a>
        </nav>
        <div className="user">
          <span className="user-name">{username}</span>
          <span className="avatar" aria-hidden="true"></span>
        </div>
      </header>

      <main className="main">
        <section className="frame">
          <div className="page-title">
            Recording Detail
            {recording ? ` — ${recording.studentName} (${recording.studentEmail})` : ""}
          </div>

          {error && <div className={styles.errorBanner}>{error}</div>}

          {recording && (
            <>
              <section className={`detail-card ${styles.detailCard}`}>
                <div className="row">
                  <div>
                    <div className="label">Exam name</div>
                    <div className="value">{recording.examTitle}</div>
                  </div>
                  <span className={`badge ${recording.status === "Completed" ? "submitted" : "not-started"}`}>
                    {recording.status}
                  </span>
                </div>
                <div className={styles.metaGrid}>
                  <div>
                    <div className="label">Course</div>
                    <div className="value">{recording.courseCode}</div>
                  </div>
                  <div>
                    <div className="label">Start time</div>
                    <div className="value">{recording.startTime}</div>
                  </div>
                  <div>
                    <div className="label">End time</div>
                    <div className="value">{recording.endTime}</div>
                  </div>
                  <div>
                    <div className="label">Duration</div>
                    <div className="value">{recording.duration}</div>
                  </div>
                </div>
              </section>

              <div className={styles.contentGrid}>
                <section className={`player ${styles.player}`}>
                  <video
                    ref={videoRef}
                    className={styles.videoPlayer}
                    controls
                    preload="metadata"
                    src={recording.videoPath}
                  />
                  <div className={styles.videoActions}>
                    <a
                      className={`primary-btn ${styles.downloadBtn}`}
                      href={recording.videoPath}
                      download
                    >
                      Download Video
                    </a>
                  </div>
                </section>

                <section className={styles.commentSection}>
                  <div className={styles.commentHeader}>Timeline comments</div>
                  <div className={styles.commentForm}>
                    <textarea
                      className={styles.commentInput}
                      value={commentText}
                      onChange={(e) => setCommentText(e.target.value)}
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
        </section>
      </main>
    </div>
  );
}
