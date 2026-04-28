"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../../ProfNav";
import type { AddProfessorExamRequest } from "@/types/api/main";
import styles from "./page.module.css";

function CreateExamContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "cs207";
  const [username, setUsername] = useState("prof_username");
  const [courseName, setCourseName] = useState("Course");
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [error, setError] = useState("");
  const [examForm, setExamForm] = useState<AddProfessorExamRequest>({
    title: "",
    description: "",
    examFile: null,
    durationMinutes: 120,
    startAvailableAt: "",
    endAvailableAt: "",
  });

  useEffect(() => {
    const metadata = getUserMetadata();
    setUsername(metadata?.name?.trim() || "prof_username");
  }, []);

  useEffect(() => {
    let active = true;
    async function loadCourse() {
      try {
        const course = await mainApi.getCourseById(courseId);
        if (!active) return;
        setCourseName(course?.name || "Course");
      } catch {
        if (!active) return;
        setCourseName("Course");
      }
    }
    void loadCourse();
    return () => {
      active = false;
    };
  }, [courseId]);

  const handleCreateExam = async () => {
    const payload: AddProfessorExamRequest = {
      ...examForm,
      title: examForm.title.trim(),
      description: examForm.description.trim(),
      durationMinutes: Number(examForm.durationMinutes),
      startAvailableAt: examForm.startAvailableAt,
      endAvailableAt: examForm.endAvailableAt,
    };

    if (!payload.title) {
      setError("Please fill exam title.");
      return;
    }
    if (payload.examFile && payload.examFile.type !== "application/pdf") {
      setError("Exam file must be a PDF.");
      return;
    }
    if (Number.isNaN(payload.durationMinutes) || payload.durationMinutes <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }
    if (!payload.startAvailableAt || !payload.endAvailableAt) {
      setError("Start and end time are required.");
      return;
    }
    const startMs = new Date(payload.startAvailableAt).getTime();
    const endMs = new Date(payload.endAvailableAt).getTime();
    if (Number.isNaN(startMs) || Number.isNaN(endMs)) {
      setError("Start/end time format is invalid.");
      return;
    }
    if (startMs >= endMs) {
      setError("End time must be after start time.");
      return;
    }

    setIsCreatingExam(true);
    setError("");
    try {
      const created = await mainApi.createCourseExam(courseId, payload);
      router.push(`/prof/exam?courseId=${courseId}&examId=${created.id}`);
    } catch {
      setError("Unable to create exam.");
    } finally {
      setIsCreatingExam(false);
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} />
      <main className="main">
        <section className="frame">
          <div className={styles.headerRow}>
            <div>
              <div className={styles.eyebrow}>Exam setup</div>
              <div className="page-title">Create Exam - {courseName}</div>
            </div>
            <a className={styles.backBtn} href={`/prof/course?courseId=${courseId}`}>
              Back to course
            </a>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Title *</span>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Final Exam"
                />
              </label>
              <label className={styles.field}>
                <span>Duration (minutes) *</span>
                <input
                  type="number"
                  min={1}
                  value={examForm.durationMinutes}
                  onChange={(e) =>
                    setExamForm((p) => ({ ...p, durationMinutes: Number(e.target.value || 0) }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Start available at *</span>
                <input
                  type="datetime-local"
                  value={examForm.startAvailableAt}
                  onChange={(e) => setExamForm((p) => ({ ...p, startAvailableAt: e.target.value }))}
                />
              </label>
              <label className={styles.field}>
                <span>End available at *</span>
                <input
                  type="datetime-local"
                  value={examForm.endAvailableAt}
                  onChange={(e) => setExamForm((p) => ({ ...p, endAvailableAt: e.target.value }))}
                />
              </label>
              <label className={`${styles.field} ${styles.spanAll}`}>
                <span>Description</span>
                <textarea
                  value={examForm.description}
                  onChange={(e) => setExamForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Exam description"
                />
              </label>
              <label className={`${styles.field} ${styles.spanAll}`}>
                <span>Attach exam file (PDF)</span>
                <input
                  type="file"
                  accept="application/pdf,.pdf"
                  onChange={(e) => setExamForm((p) => ({ ...p, examFile: e.target.files?.[0] || null }))}
                />
              </label>
            </div>

            {error && <div className={styles.errorText}>{error}</div>}

            <div className={styles.actions}>
              <button className={styles.ghostBtn} type="button" onClick={() => router.push(`/prof/course?courseId=${courseId}`)}>
                Cancel
              </button>
              <button className="primary-btn" type="button" onClick={handleCreateExam} disabled={isCreatingExam}>
                {isCreatingExam ? "Creating..." : "Create Exam"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

export default function CreateExamPage() {
  return (
    <Suspense fallback={<div className="page" />}>
      <CreateExamContent />
    </Suspense>
  );
}
