"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { mainApi } from "@/services";
import StudentNav from "../StudentNav";
import styles from "./page.module.css";
import type { StudentCourse, StudentExamSummary } from "@/types/api/main";

function StudentCoursePageContent() {
  const searchParams = useSearchParams();
  const courseId = useMemo(() => searchParams.get("courseId") || "CS207", [searchParams]);

  const [username, setUsername] = useState("student_name");
  const [courses, setCourses] = useState<StudentCourse[]>([]);
  const [exams, setExams] = useState<StudentExamSummary[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setLoading(true);
      try {
        const [profile, coursesResp, examsResp] = await Promise.all([
          mainApi.getStudentProfile(),
          mainApi.getStudentCourses(),
          mainApi.getStudentCourseExams(courseId),
        ]);

        if (!mounted) return;
        setUsername(profile.username || "student_name");
        setCourses(coursesResp.courses || []);
        setExams(examsResp.exams || []);
      } catch {
        if (!mounted) return;
        setUsername("student_name");
        setCourses([]);
        setExams([]);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, [courseId]);

  const course = courses.find((item) => item.id === courseId);
  const courseTitle = course ? `${course.code} - ${course.name}` : "Course Exams";

  return (
    <div className={`page ${styles.pageBg}`}>
      <StudentNav username={username} />

      <main className="main">
        <section className="frame">
          <div className={styles.pageTitle}>{courseTitle}</div>
          <div className={styles.list}>
            {loading && <div className={styles.empty}>Loading exams...</div>}
            {!loading &&
              exams.map((exam) => (
                <article className={styles.examCard} key={exam.id}>
                  <div className={styles.examRow}>
                    <div>
                      <div className={styles.label}>Exam name</div>
                      <div className={styles.value}>{exam.title}</div>
                    </div>
                    <span
                      className={`${styles.badge} ${
                        exam.status === "In progress"
                          ? styles.inProgress
                          : exam.status === "Submitted"
                          ? styles.submitted
                          : exam.status === "Ended"
                          ? styles.ended
                          : styles.notStarted
                      }`}
                    >
                      {exam.status}
                    </span>
                  </div>
                  <div className={styles.examGrid}>
                    <div>
                      <div className={styles.label}>Course</div>
                      <div className={styles.value}>{exam.courseCode}</div>
                    </div>
                    <div>
                      <div className={styles.label}>Time window</div>
                      <div className={styles.value}>{exam.timeWindow}</div>
                    </div>
                    <div className={styles.cta}>
                      <a
                        className={`primary-btn ${styles.enterBtn}`}
                        href={`/student/record?courseId=${exam.courseId}&examId=${exam.id}`}
                      >
                        {exam.status === "Not started" ? "Preview" : "Enter Exam"}
                      </a>
                    </div>
                  </div>
                </article>
              ))}
            {!loading && !exams.length && <div className={styles.empty}>No exams available.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}

export default function StudentCoursePage() {
  return (
    <Suspense fallback={<div className="page" />}>
      <StudentCoursePageContent />
    </Suspense>
  );
}
