"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { getUserMetadata } from "@/services/mainApi/session";
import { mainApi } from "@/services";
import ProfNav from "../ProfNav";
import type {
  AddProfessorExamRequest,
  ExamSession,
  ProfessorExamDetailsResponse,
  ProfessorRecordingListItem,
} from "@/types/api/main";

type ProfExamDetails = {
  id: string;
  courseId: string;
  professorId: string;
  title: string;
  description: string;
  durationMinutes: number;
  startAvailableAt: string;
  endAvailableAt: string;
  examFileUrl: string;
  recordingRequired: boolean;
  createdAt: string;
};

type ProfExamClientProps = {
  courseId: string;
  examId: string;
};

// PLACEHOLDER START: fallback exam data while backend is unavailable.
const DEFAULT_EXAM_DETAILS: ProfExamDetails = {
  id: "336cb68e-ec3d-4d69-a470-bf87299321b6",
  courseId: "a66833c2-718e-4364-b808-cdaa3869501c",
  professorId: "8e218b8d-5388-468a-9f2d-473172014e74",
  title: "Midterm Exam - Data Structures",
  description:
    "Comprehensive exam covering arrays, linked lists, trees, and graphs",
  durationMinutes: 120,
  startAvailableAt: "2024-03-15T09:00:00",
  endAvailableAt: "2024-03-15T11:30:00",
  examFileUrl: "https://storage.example.com/exams/midterm_ds.pdf",
  recordingRequired: true,
  createdAt: "2026-02-23T11:47:31",
};
// PLACEHOLDER END

function normalizeExamDetails(
  payload: ProfessorExamDetailsResponse | ProfExamDetails,
  courseId: string,
  examId: string
): ProfExamDetails {
  const source = payload as Partial<ProfExamDetails> & Partial<ProfessorExamDetailsResponse>;

  if (typeof source.title === "string") {
    return {
      id: source.id || examId,
      courseId: source.courseId || courseId,
      professorId: source.professorId || "",
      title: source.title || "Exam",
      description: source.description || "",
      durationMinutes: Number(source.durationMinutes ?? 0),
      startAvailableAt: source.startAvailableAt || "",
      endAvailableAt: source.endAvailableAt || "",
      examFileUrl: source.examFileUrl || "",
      recordingRequired: Boolean(source.recordingRequired),
      createdAt: source.createdAt || "",
    };
  }

  return {
    id: examId,
    courseId,
    professorId: "",
    title: source.examTitle || "Exam",
    description: "",
    durationMinutes: 0,
    startAvailableAt: "",
    endAvailableAt: "",
    examFileUrl: "",
    recordingRequired: false,
    createdAt: "",
  };
}

function formatDateTime(value: string): string {
  if (!value) return "—";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return parsed.toLocaleString();
}


function toDateTimeInput(value: string): string {
  if (!value) return "";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  const year = parsed.getFullYear();
  const month = String(parsed.getMonth() + 1).padStart(2, "0");
  const day = String(parsed.getDate()).padStart(2, "0");
  const hours = String(parsed.getHours()).padStart(2, "0");
  const minutes = String(parsed.getMinutes()).padStart(2, "0");
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export default function ProfExamClient({
  courseId,
  examId,
}: ProfExamClientProps) {
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [examSessions, setExamSessions] = useState<ExamSession[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState("");
  const [pingNotice, setPingNotice] = useState("");
  const [pingAllLoading, setPingAllLoading] = useState(false);
  const [pingingStudentId, setPingingStudentId] = useState<string | null>(null);
  const [localDetails, setLocalDetails] = useState<ProfExamDetails>(DEFAULT_EXAM_DETAILS);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [editForm, setEditForm] = useState<AddProfessorExamRequest>({
    title: "",
    description: "",
    examFile: null,
    durationMinutes: 120,
    startAvailableAt: "",
    endAvailableAt: "",
  });

  useEffect(() => {
    const userMetadata = getUserMetadata();
    setUsername(userMetadata?.name?.trim() || "Professor");
  }, []);

  useEffect(() => {
    let isMounted = true;

    const loadExamDetails = async () => {
      setIsLoadingDetails(true);
      setError("");
      try {
        const response = await mainApi.getExamDetails(courseId, examId);
        const normalized = normalizeExamDetails(response, courseId, examId);
        if (isMounted) {
          setLocalDetails(normalized);
          setEditForm({
            title: normalized.title,
            description: normalized.description,
            examFile: null,
            durationMinutes: normalized.durationMinutes,
            startAvailableAt: toDateTimeInput(normalized.startAvailableAt),
            endAvailableAt: toDateTimeInput(normalized.endAvailableAt),
          });
        }
      } catch {
        if (isMounted) {
          setLocalDetails(DEFAULT_EXAM_DETAILS);
          setError("Unable to load exam details.");
        }
      } finally {
        if (isMounted) {
          setIsLoadingDetails(false);
        }
      }
    };

    loadExamDetails();

    return () => {
      isMounted = false;
    };
  }, [courseId, examId]);

  useEffect(() => {
    setEditForm({
      title: localDetails.title,
      description: localDetails.description,
      examFile: null,
      durationMinutes: localDetails.durationMinutes,
      startAvailableAt: toDateTimeInput(localDetails.startAvailableAt),
      endAvailableAt: toDateTimeInput(localDetails.endAvailableAt),
    });
  }, [localDetails]);

  useEffect(() => {
    let isMounted = true;
    let timer: ReturnType<typeof setInterval> | null = null;

    const loadExamSessions = async () => {
      setRecordingsLoading(true);
      setRecordingsError("");
      try {
        const sessions = await mainApi.getExamSessions(examId);
        if (isMounted) {
          setExamSessions(sessions);
        }
      } catch {
        if (isMounted) {
          setRecordingsError("Unable to load exam sessions.");
        }
      } finally {
        if (isMounted) {
          setRecordingsLoading(false);
        }
      }
    };

    if (examId) {
      void loadExamSessions();
      timer = setInterval(() => {
        void loadExamSessions();
      }, 30000);
    }

    return () => {
      isMounted = false;
      if (timer) clearInterval(timer);
    };
  }, [examId]);

  const handleStartEdit = () => {
    setError("");
    setEditForm({
      title: localDetails.title,
      description: localDetails.description,
      examFile: null,
      durationMinutes: localDetails.durationMinutes,
      startAvailableAt: toDateTimeInput(localDetails.startAvailableAt),
      endAvailableAt: toDateTimeInput(localDetails.endAvailableAt),
    });
    setIsEditing(true);
  };

  const handleCancelEdit = () => {
    setError("");
    setEditForm({
      title: localDetails.title,
      description: localDetails.description,
      examFile: null,
      durationMinutes: localDetails.durationMinutes,
      startAvailableAt: toDateTimeInput(localDetails.startAvailableAt),
      endAvailableAt: toDateTimeInput(localDetails.endAvailableAt),
    });
    setIsEditing(false);
  };

  const handleSaveEdit = async () => {
    const trimmedTitle = editForm.title.trim();
    const trimmedDescription = editForm.description.trim();
    const duration = Number(editForm.durationMinutes);

    if (!trimmedTitle) {
      setError("Title is required.");
      return;
    }
    if (editForm.examFile && editForm.examFile.type !== "application/pdf") {
      setError("Exam file must be a PDF.");
      return;
    }
    if (!editForm.startAvailableAt || !editForm.endAvailableAt) {
      setError("Start and end availability are required.");
      return;
    }
    if (Number.isNaN(duration) || duration <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    setIsSaving(true);
    setError("");
    try {
      //   console.log("Saving exam with details:", duration);
      await mainApi.updateCourseExam(localDetails.courseId, localDetails.id, {
        ...editForm,
        title: trimmedTitle,
        description: trimmedDescription,
        durationMinutes: duration,
      });

      setLocalDetails((prev) => ({
        ...prev,
        title: trimmedTitle,
        description: trimmedDescription,
        durationMinutes: duration,
        startAvailableAt: editForm.startAvailableAt,
        endAvailableAt: editForm.endAvailableAt,
      }));
      setIsEditing(false);
    } catch {
      setError("Unable to save changes.");
    } finally {
      setIsSaving(false);
    }
  };

  const handlePingAll = async () => {
    setPingNotice("");
    setPingAllLoading(true);
    try {
      const result = await mainApi.pingAllStudents();
      setPingNotice(`Pinged ${result.pingedCount} active students.`);
    } catch {
      setPingNotice("Unable to ping all students.");
    } finally {
      setPingAllLoading(false);
    }
  };

  const handlePingStudent = async (studentId: string, studentName?: string) => {
    if (!studentId) return;
    setPingNotice("");
    setPingingStudentId(studentId);
    try {
      await mainApi.pingStudent(studentId);
      setPingNotice(`Ping sent to ${studentName || "student"}.`);
    } catch {
      setPingNotice("Unable to ping that student (not active).");
    } finally {
      setPingingStudentId(null);
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} />

      <main className="main">
        <section className="frame">
          {isLoadingDetails && (
            <div className={styles.empty}>Loading exam details...</div>
          )}
          {!isLoadingDetails && (
            <>
              <div className={styles.headerBlock}>
                <div>
                  {isEditing ? (
                    <input
                      className={styles.titleInput}
                      value={editForm.title}
                      onChange={(event) =>
                        setEditForm((prev) => ({ ...prev, title: event.target.value }))
                      }
                      placeholder="Exam title"
                    />
                  ) : (
                    <div className="page-title">Exam — {localDetails.title}</div>
                  )}
                </div>
                <div className={styles.editActions}>
                  {!isEditing ? (
                    <button
                      className={styles.ghostBtn}
                      type="button"
                      onClick={handleStartEdit}
                    >
                      Edit
                    </button>
                  ) : (
                    <>
                      <button
                        className={styles.ghostBtn}
                        type="button"
                        onClick={handleCancelEdit}
                        disabled={isSaving}
                      >
                        Cancel
                      </button>
                      <button
                        className="primary-btn"
                        type="button"
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                      >
                        {isSaving ? "Saving..." : "Save"}
                      </button>
                    </>
                  )}
                </div>
              </div>

              {error && <div className={styles.errorText}>{error}</div>}

              <div className={styles.sectionTitle}>Summary</div>
              <div className="stats">
                <div className="stat-card">
                  <div className="stat-label">Duration (minutes)</div>
                  {isEditing ? (
                    <input
                      className={styles.inputField}
                      type="number"
                      min={1}
                      value={editForm.durationMinutes}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          durationMinutes: Number(event.target.value || 0),
                        }))
                      }
                    />
                  ) : (
                    <div className="stat-value">{localDetails.durationMinutes}</div>
                  )}
                </div>
                <div className="stat-card">
                  <div className="stat-label">Start available at</div>
                  {isEditing ? (
                    <input
                      className={styles.inputField}
                      type="datetime-local"
                      value={editForm.startAvailableAt}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          startAvailableAt: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className={styles.metaValue}>
                      {formatDateTime(localDetails.startAvailableAt)}
                    </div>
                  )}
                </div>
                <div className="stat-card">
                  <div className="stat-label">End available at</div>
                  {isEditing ? (
                    <input
                      className={styles.inputField}
                      type="datetime-local"
                      value={editForm.endAvailableAt}
                      onChange={(event) =>
                        setEditForm((prev) => ({
                          ...prev,
                          endAvailableAt: event.target.value,
                        }))
                      }
                    />
                  ) : (
                    <div className={styles.metaValue}>
                      {formatDateTime(localDetails.endAvailableAt)}
                    </div>
                  )}
                </div>
              </div>

              <div className={styles.sectionTitle}>Details</div>
              <div className={`table ${styles.examTable}`}>
                <div className={`table-head ${styles.examTableHead}`}>
                  <div>Detail</div>
                  <div>Information</div>
                </div>
                <div className={`table-row ${styles.examTableRow}`}>
                  <div className="strong">Description</div>
                  <div>
                    {isEditing ? (
                      <textarea
                        className={`${styles.inputField} ${styles.textareaField}`}
                        value={editForm.description}
                        onChange={(event) =>
                          setEditForm((prev) => ({
                            ...prev,
                            description: event.target.value,
                          }))
                        }
                        placeholder="Exam description"
                      />
                    ) : (
                      localDetails.description || "—"
                    )}
                  </div>
                </div>
                <div className={`table-row ${styles.examTableRow}`}>
                  <div className="strong">Exam PDF</div>
                  <div>
                    {isEditing ? (
                      <div className={styles.fileFieldWrap}>
                        <input
                          className={styles.inputField}
                          type="file"
                          accept="application/pdf,.pdf"
                          onChange={(event) =>
                            setEditForm((prev) => ({
                              ...prev,
                              examFile: event.target.files?.[0] || null,
                            }))
                          }
                        />
                        <div className={styles.fileHint}>
                          {editForm.examFile
                            ? `Selected: ${editForm.examFile.name}`
                            : localDetails.examFileUrl
                              ? "Leave empty to keep current PDF."
                              : "No PDF uploaded yet."}
                        </div>
                      </div>
                    ) : localDetails.examFileUrl ? (
                      <a
                        href={localDetails.examFileUrl}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.fileLink}
                      >
                        View current PDF
                      </a>
                    ) : (
                      "—"
                    )}
                  </div>
                </div>
              </div>

              <div className={styles.sessionHeader}>
                <div className={styles.sectionTitle}>Exam Sessions</div>
                <div className={styles.pingActions}>
                  <button
                    className={`primary-btn ${styles.pingAllBtn}`}
                    type="button"
                    onClick={handlePingAll}
                    disabled={pingAllLoading}
                  >
                    {pingAllLoading ? "Pinging..." : "Ping All"}
                  </button>
                </div>
              </div>
              {pingNotice && <div className={styles.pingNotice}>{pingNotice}</div>}
              <div className={`table table-8 ${styles.recordingTable}`}>
                <div className={`table-head ${styles.recordingTableHead}`}>
                  <div>Student</div>
                  <div>Email</div>
                  <div>Status</div>
                  <div>Duration</div>
                  <div>Started At</div>
                  <div>Ended At</div>
                  <div>Ping</div>
                  <div></div>
                </div>
                {recordingsLoading && (
                  <div className={`table-row ${styles.recordingTableRow}`}>
                    <div>Loading exam sessions...</div>
                  </div>
                )}
                {!recordingsLoading && recordingsError && (
                  <div className={`table-row ${styles.recordingTableRow}`}>
                    <div className={styles.errorText}>{recordingsError}</div>
                  </div>
                )}
                {!recordingsLoading && !recordingsError && examSessions.length === 0 && (
                  <div className={`table-row ${styles.recordingTableRow}`}>
                    <div>No exam sessions yet.</div>
                  </div>
                )}
                {!recordingsLoading && !recordingsError && examSessions.map((session) => {
                  const calculateDuration = () => {
                    if (!session.endTime) return "In progress";
                    const durationSec = Math.round((new Date(session.endTime).getTime() - new Date(session.startTime).getTime()) / 1000);
                    if (durationSec < 60) return `${durationSec} sec`;
                    const durationMin = Math.round(durationSec / 60);
                    return `${durationMin} min`;
                  };
                  const duration = calculateDuration();
                  const canViewSession = Boolean(session.screenRecordingPath) || session.status === "running";

                  const formatTime = (timeStr?: string | null) => {
                    if (!timeStr) return "—";
                    const d = new Date(timeStr);
                    if (Number.isNaN(d.getTime())) return "—";
                    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false });
                  };

                  const targetStudentId = session.student?.id || session.studentId;
                  return (
                    <div
                      className={`table-row ${styles.recordingTableRow}`}
                      key={session.id}
                    >
                      <div className="strong">{session.student?.name || "Unknown Student"}</div>
                      <div>{session.student?.email || "Unknown Email"}</div>
                      <div
                        className={`status-pill ${(session.status === "submitted" || session.status === "completed")
                          ? "complete"
                          : session.status === "running" || session.status === "in_progress"
                            ? "interrupted"
                            : "missing"
                          }`}
                      >
                        {session.status}
                      </div>
                      <div>{duration}</div>
                      <div>{formatTime(session?.startTime)}</div>
                      <div>{formatTime(session?.endTime)}</div>
                      <div>
                        <button
                          className={`primary-btn ${styles.pingBtn}`}
                          type="button"
                          onClick={() => handlePingStudent(targetStudentId, session.student?.name)}
                          disabled={!targetStudentId || pingingStudentId === targetStudentId}
                        >
                          {pingingStudentId === targetStudentId ? "Pinging..." : "Ping"}
                        </button>
                      </div>
                      {canViewSession ? (
                        <a
                          className={`primary-btn ${styles.viewBtn}`}
                          href={`/prof/recordings/view?courseId=${courseId}&examId=${examId}&sessionId=${session.id}`}
                        >
                          {session.status === "running" ? "View live" : "View"}
                        </a>
                      ) : (
                        <div className={styles.noRecording}>No recording</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </section>
      </main>
    </div>
  );
}
