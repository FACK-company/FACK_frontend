"use client";

import { Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import StudentNav from "../../StudentNav";
import styles from "./page.module.css";

function ExamCompleteContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const courseCode = searchParams.get("courseCode") || "—";
  const examTitle = searchParams.get("examTitle") || "Exam";
  const courseId = searchParams.get("courseId") || "";

  return (
    <div className="page">
      <StudentNav username="" />

      <div className={styles.container}>
        <div className={styles.icon}>✅</div>
        <h1 className={styles.title}>Exam Submitted</h1>
        <p className={styles.subtitle}>
          Your screen recording has been uploaded and your exam has been
          submitted successfully. You may now close this tab.
        </p>

        <div className={styles.details}>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Course</span>
            <span className={styles.detailValue}>{courseCode}</span>
          </div>
          <div className={styles.detailRow}>
            <span className={styles.detailLabel}>Exam</span>
            <span className={styles.detailValue}>{examTitle}</span>
          </div>
        </div>

        <button
          className={styles.backBtn}
          type="button"
          onClick={() =>
            router.push(courseId ? `/student/course?courseId=${courseId}` : "/student/home")
          }
        >
          ← Back to Course
        </button>
      </div>
    </div>
  );
}

export default function ExamCompletePage() {
  return (
    <Suspense fallback={<div className="page" />}>
      <ExamCompleteContent />
    </Suspense>
  );
}
