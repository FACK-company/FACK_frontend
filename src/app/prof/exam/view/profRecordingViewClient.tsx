"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { mainApi } from "@/services";
import { getUserMetadata } from "@/services/mainApi/session";
import ProfNav from "../../ProfNav";
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
  const [liveVersion, setLiveVersion] = useState(0);
  const [finalizing, setFinalizing] = useState(false);
  const [finalized, setFinalized] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const refreshInFlightRef = useRef(false);
  const pendingSeekRef = useRef<{ time: number; wasPlaying: boolean } | null>(null);

  const LIVE_REFRESH_MS = 120000;

  useEffect(() => {
    let isMounted = true;

    async function finalizeIfLive() {
      setFinalizing(true);
      setError("");
      try {
        // Fetch session metadata first
        const metadata = await mainApi.getExamSessionMetadata(sessionId);
        if (!isMounted) return;
        setSessionData(metadata);

        // If session is running (live), finalize it before streaming
        if (metadata.status === "running") {
          try {
            console.log("[PROF RECORDING VIEW] Finalizing live recording for session:", sessionId, "metadata:", metadata);
            console.log("examId:", examId);
            console.log("User agent:", typeof navigator !== "undefined" ? navigator.userAgent : "unknown");
            const previewResult = await mainApi.previewRecording({
              sessionId: sessionId,
              examId,
              studentId: metadata.student.id,
              deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
            });
            setFinalized(true);
            // Use the preview file path returned by backend (stream/{sessionId} still
            // points to the student's full recording — we don't want that here).
            const previewUrl = previewResult?.filePath
              ? `${mainApi.getSessionRecordingUrl(sessionId).replace(/\/stream\/.*/, "")}/stream-preview/${sessionId}`
              : mainApi.getSessionRecordingUrl(sessionId);
            console.log("[PROF RECORDING VIEW] Resolved live preview URL to:", previewUrl);
            setVideoUrl(previewUrl);
          } catch (err) {
            console.error("[PROF RECORDING VIEW] Failed to finalize live video:", err);
            // If finalize fails, show error but allow retry
            setError("Failed to finalize live video. Please try again.");
            setFinalized(false);
            setFinalizing(false);
            return;
          }
        } else {
          setFinalized(true);
          // Already-submitted session: stream the full recording from DB path
          const url = mainApi.getSessionRecordingUrl(sessionId);
          console.log("[PROF RECORDING VIEW] Session already finalized/ended. Streaming from full path:", url);
          setVideoUrl(url);
        }
        setComments([]);
      } catch (err) {
        if (!isMounted) return;
        console.error("Error loading session:", err);
        setError("Unable to load recording detail.");
      } finally {
        if (isMounted) setIsLoading(false);
        setFinalizing(false);
      }
    }

    finalizeIfLive();

    return () => {
      isMounted = false;
    };
  }, [sessionId, examId]);

  useEffect(() => {
    setIsMounted(true);
    const metadata = getUserMetadata();
    // console.log("User metadata:", metadata);
    setUsername(metadata?.name?.trim() || "prof_username");
  }, []);

  useEffect(() => {
    if (sessionData?.status !== "running") return;

    const timer = setInterval(async () => {
      if (refreshInFlightRef.current) return;
      if (!sessionData?.student?.id) return;

      const video = videoRef.current;
      if (video && video.paused) return;

      refreshInFlightRef.current = true;
      setIsRefreshing(true);
      try {
        if (video) {
          pendingSeekRef.current = {
            time: video.currentTime || 0,
            wasPlaying: !video.paused && !video.ended,
          };
        }
        await mainApi.previewRecording({
          sessionId,
          examId,
          studentId: sessionData.student.id,
          deviceInfo: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
        });
        setLiveVersion((prev) => prev + 1);
      } catch (err) {
        console.error("[PROF RECORDING VIEW] Auto-refresh preview failed:", err);
      } finally {
        refreshInFlightRef.current = false;
        setIsRefreshing(false);
      }
    }, LIVE_REFRESH_MS);

    return () => clearInterval(timer);
  }, [sessionData?.status, sessionData?.student?.id, sessionId, examId]);

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
    videoRef.current.play().catch(() => { });
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

  const streamUrl = useMemo(() => {
    if (!videoUrl) return "";
    if (sessionData?.status !== "running") return videoUrl;
    const sep = videoUrl.includes("?") ? "&" : "?";
    return `${videoUrl}${sep}v=${liveVersion}`;
  }, [videoUrl, sessionData?.status, liveVersion]);
  // ...existing code...
  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} />

      <main className="main">
        <section className="frame">
          {isLoading && <div className={styles.emptyText}>Loading recording...</div>}
          {finalizing && <div className={styles.emptyText}>Finalizing live video...</div>}
          {error && <div className={styles.errorBanner}>{error}</div>}
          {!isLoading && finalized && (
            <>
              <div className="page-title">
                Recording Detail
                {sessionData ? ` — ${sessionData.student?.name ?? ""} (${sessionData.student?.email ?? ""})` : ""}
              </div>

              {sessionData && (
                <section className={`detail-card ${styles.detailCard}`}>
                  <div className="row">
                    <div>
                      <div className="label">Exam ID</div>
                      <div className="value">{sessionData.examId}</div>
                    </div>
                    <span
                      className={`badge ${sessionData.status === "submitted" ? "submitted" : "not-started"}`}
                    >
                      {sessionData.status}
                    </span>
                  </div>
                  <div className={styles.metaGrid}>
                    <div>
                      <div className="label">Student</div>
                      <div className="value">{sessionData.student?.name ?? ""}</div>
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
              )}

              <div className={styles.contentGrid}>
                {videoUrl && sessionData && (sessionData.screenRecordingPath || sessionData.status === "running") ? (
                  <section className={`player ${styles.player}`}>
                    {sessionData.status === "running" && (
                      <div className={styles.emptyText}>
                        Live preview (running session). Auto-refreshing every {Math.round(LIVE_REFRESH_MS / 1000)}s
                        {isRefreshing ? " — refreshing…" : ""}.
                      </div>
                    )}
                    <video
                      ref={videoRef}
                      className={styles.videoPlayer}
                      controls
                      autoPlay={sessionData.status === "running"}
                      preload="metadata"
                      src={streamUrl}
                      onLoadedMetadata={(e) => {
                        const target = e.currentTarget;
                        console.log(
                          "[VIDEO EVENT] LoadedMetadata:",
                          "\nResolution:", target.videoWidth, "x", target.videoHeight,
                          "\nDuration:", target.duration, "seconds",
                          "\nSrc:", target.src
                        );
                        const pending = pendingSeekRef.current;
                        if (pending) {
                          const safeTime = Math.max(0, Math.min(pending.time, Math.max(0, target.duration - 0.1)));
                          target.currentTime = Number.isFinite(safeTime) ? safeTime : 0;
                          if (pending.wasPlaying) {
                            target.play().catch(() => { });
                          }
                          pendingSeekRef.current = null;
                        }
                      }}
                      onLoadedData={() => {
                        console.log("[VIDEO EVENT] LoadedData triggered.");
                        if (sessionData && sessionData.status === "running") {
                          videoRef.current?.play().catch((err) => console.warn("[VIDEO EVENT] Auto-play prevented:", err));
                        }
                      }}
                      onPlay={() => console.log("[VIDEO EVENT] Play triggered.")}
                      onPause={() => console.log("[VIDEO EVENT] Pause triggered.")}
                      onWaiting={() => console.log("[VIDEO EVENT] Waiting for more data...")}
                      onPlaying={() => console.log("[VIDEO EVENT] Playing started.")}
                      onError={(e) => {
                        const target = e.currentTarget;
                        console.error("[VIDEO EVENT] Error occurred:", target.error);
                      }}
                      onEnded={() => {
                        console.log("[VIDEO EVENT] Ended.");
                        if (sessionData && sessionData.status === "running") {
                          setLiveVersion((prev) => prev + 1);
                        }
                      }}
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
        </section>
      </main>
    </div>
  );
}
