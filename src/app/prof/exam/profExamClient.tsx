"use client";

import { useEffect, useState } from "react";
import styles from "./page.module.css";
import { getUserMetadata } from "@/services/mainApi/session";
import { mainApi } from "@/services";
import ProfNav from "../ProfNav";
import type { AddProfessorExamRequest, ProfessorRecordingListItem } from "@/types/api/main";

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
  examDetails: ProfExamDetails;
};

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
  examDetails,
}: ProfExamClientProps) {
  const [username, setUsername] = useState("");
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState("");
  const [recordings, setRecordings] = useState<ProfessorRecordingListItem[]>([]);
  const [recordingsLoading, setRecordingsLoading] = useState(true);
  const [recordingsError, setRecordingsError] = useState("");
  const [localDetails, setLocalDetails] = useState(examDetails);
  const [editForm, setEditForm] = useState<AddProfessorExamRequest>({
    title: examDetails.title,
    description: examDetails.description,
    examFile: null,
    durationMinutes: examDetails.durationMinutes,
    startAvailableAt: toDateTimeInput(examDetails.startAvailableAt),
    endAvailableAt: toDateTimeInput(examDetails.endAvailableAt),
  });

  useEffect(() => {
    const userMetadata = getUserMetadata();
    setUsername(userMetadata?.name?.trim() || "Professor");
  }, []);

  useEffect(() => {
    setLocalDetails(examDetails);
    setEditForm({
      title: examDetails.title,
      description: examDetails.description,
      examFile: null,
      durationMinutes: examDetails.durationMinutes,
      startAvailableAt: toDateTimeInput(examDetails.startAvailableAt),
      endAvailableAt: toDateTimeInput(examDetails.endAvailableAt),
    });
  }, [examDetails]);

  useEffect(() => {
    let isMounted = true;

    const loadRecordings = async () => {
      setRecordingsLoading(true);
      setRecordingsError("");
      try {
        const response = await mainApi.getProfessorRecordings();
        const filtered = response.recordings.filter(
          (item) => item.examId === localDetails.id
        );
        if (isMounted) {
          setRecordings(filtered);
        }
      } catch {
        if (isMounted) {
          setRecordingsError("Unable to load recordings.");
        }
      } finally {
        if (isMounted) {
          setRecordingsLoading(false);
        }
      }
    };

    if (localDetails.id) {
      loadRecordings();
    }

    return () => {
      isMounted = false;
    };
  }, [localDetails.id]);

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

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} />

      <main className="main">
        <section className="frame">
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
          </div>

          <div className={styles.sectionTitle}>Recording</div>
          <div className={`table table-5 ${styles.recordingTable}`}>
            <div className={`table-head ${styles.recordingTableHead}`}>
              <div>Student</div>
              <div>Status</div>
              <div>Duration</div>
              <div>Video</div>
              <div></div>
            </div>
            {recordingsLoading && (
              <div className={`table-row ${styles.recordingTableRow}`}>
                <div>Loading recordings...</div>
              </div>
            )}
            {!recordingsLoading && recordingsError && (
              <div className={`table-row ${styles.recordingTableRow}`}>
                <div className={styles.errorText}>{recordingsError}</div>
              </div>
            )}
            {!recordingsLoading && !recordingsError && recordings.length === 0 && (
              <div className={`table-row ${styles.recordingTableRow}`}>
                <div>No recordings yet.</div>
              </div>
            )}
            {!recordingsLoading && !recordingsError && recordings.map((recording) => (
              <div
                className={`table-row ${styles.recordingTableRow}`}
                key={recording.sessionId}
              >
                <div className="strong">{recording.studentName}</div>
                <div
                  className={`status-pill ${
                    recording.status === "Completed"
                      ? "complete"
                      : recording.status === "Interrupted"
                      ? "interrupted"
                      : "missing"
                  }`}
                >
                  {recording.status}
                </div>
                <div>{recording.duration || "—"}</div>
                <div>{recording.videoPath || "—"}</div>
                <a
                  className="primary-btn"
                  href={`/prof/recordings/view?courseId=${recording.courseId}&examId=${recording.examId}&sessionId=${recording.sessionId}`}
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
