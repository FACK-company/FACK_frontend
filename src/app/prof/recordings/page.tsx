"use client";

import { useEffect, useMemo, useState } from "react";
import { mainApi } from "@/services";
import type { ProfessorRecordingListItem } from "@/types/api/main";
import styles from "./page.module.css";

export default function ProfRecordings() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState("prof_username");
  const [recordings, setRecordings] = useState<ProfessorRecordingListItem[]>([]);
  const [selectedExam, setSelectedExam] = useState("All exams");
  const [selectedClass, setSelectedClass] = useState("All classes");
  const [previewItem, setPreviewItem] = useState<ProfessorRecordingListItem | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [profile, recordingData] = await Promise.all([
          mainApi.getProfessorProfile(),
          mainApi.getProfessorRecordings(),
        ]);
        if (!isMounted) return;
        setUsername(profile.username || "prof_username");
        setRecordings(recordingData.recordings || []);
      } catch {
        if (!isMounted) return;
        setUsername("prof_username");
        setRecordings([]);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const examOptions = useMemo(() => {
    const values = Array.from(new Set(recordings.map((r) => r.examName)));
    return ["All exams", ...values];
  }, [recordings]);

  const classOptions = useMemo(() => {
    const values = Array.from(new Set(recordings.map((r) => r.classCode)));
    return ["All classes", ...values];
  }, [recordings]);

  const filteredRecordings = useMemo(
    () =>
      recordings.filter((r) => {
        const examMatch = selectedExam === "All exams" || r.examName === selectedExam;
        const classMatch = selectedClass === "All classes" || r.classCode === selectedClass;
        return examMatch && classMatch;
      }),
    [recordings, selectedExam, selectedClass]
  );

  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/prof/home">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links">
          <a href="/prof/home">Home</a>
          <a className="active" href="/prof/recordings">Recordings</a>
        </nav>
        <div className="user">
          <span className="user-name">{username}</span>
          <span className="avatar" aria-hidden="true"></span>
        </div>
      </header>

      <main className="main">
        <section className="frame">
          <div className="head">
            <div className="page-title">Recordings</div>
            <div className="filters">
              <label>
                <span>Exam</span>
                <select
                  value={selectedExam}
                  onChange={(e) => setSelectedExam(e.target.value)}
                >
                  {examOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                <span>Class</span>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                >
                  {classOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
          </div>

          <div className={`table table-5 ${styles.recordingsTable}`}>
            <div className={`table-head ${styles.recordingsHead}`}>
              <div>Student</div>
              <div>Exam</div>
              <div>Status</div>
              <div>Duration</div>
              <div></div>
            </div>
            {filteredRecordings.map((row) => (
              <div className={`table-row ${styles.recordingsRow}`} key={row.sessionId}>
                <div className="strong">{row.studentName}</div>
                <div>{row.examName}</div>
                <div
                  className={`status-pill ${
                    row.status === "Completed"
                      ? "complete"
                      : row.status === "Interrupted"
                      ? "interrupted"
                      : "missing"
                  }`}
                >
                  {row.status}
                </div>
                <div>{row.duration}</div>
                <div className={styles.actionsCell}>
                  <button
                    className={styles.previewBtn}
                    type="button"
                    onClick={() => {
                      setPreviewItem(row);
                      setOpen(true);
                    }}
                  >
                    Preview
                  </button>
                  <a className={`primary-btn ${styles.downloadBtn}`} href={row.videoPath} download>
                    Download
                  </a>
                </div>
              </div>
            ))}
            {!filteredRecordings.length && (
              <div className={styles.emptyState}>No recordings match selected filters.</div>
            )}
          </div>
        </section>
      </main>

      {open && previewItem && (
        <div className="modal show">
          <div className={`modal-card ${styles.previewModal}`}>
            <div className={styles.previewHead}>
              <h3 className={styles.previewTitle}>
                Preview — {previewItem.studentName}
              </h3>
              <button className={styles.closeBtn} onClick={() => setOpen(false)}>
                Close
              </button>
            </div>
            <video className={styles.previewVideo} controls preload="metadata" src={previewItem.videoPath} />
            <div className={styles.previewActions}>
              <a
                className={`primary-btn ${styles.downloadBtn}`}
                href={previewItem.videoPath}
                download
              >
                Download Video
              </a>
              <a
                className={`btn-outline ${styles.detailBtn}`}
                href={`/prof/recordings/view?courseId=${previewItem.courseId}&examId=${previewItem.examId}&sessionId=${previewItem.sessionId}`}
              >
                Open Detail
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
