"use client";

import { useEffect, useState } from "react";
import { mainApi } from "@/services";
import type { AddProfessorCourseRequest, ProfessorCourse } from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";

export default function ProfHome() {
  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [courses, setCourses] = useState<ProfessorCourse[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AddProfessorCourseRequest>({
    courseCode: "",
    courseName: "",
    term: "Spring 2026",
    studentCount: 0,
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [profile, coursesResp] = await Promise.all([
          mainApi.getProfessorProfile(),
          mainApi.getProfessorCourses(),
        ]);
        if (!isMounted) return;
        setUsername(profile.username || DEFAULT_PROF_USERNAME);
        setCourses([...(coursesResp.courses || [])]);
      } catch {
        if (!isMounted) return;
        setUsername(DEFAULT_PROF_USERNAME);
        setCourses([]);
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const handleCreateCourse = async () => {
    const payload: AddProfessorCourseRequest = {
      courseCode: form.courseCode.trim(),
      courseName: form.courseName.trim(),
      term: form.term.trim(),
      studentCount: Number(form.studentCount),
    };

    if (!payload.courseCode || !payload.courseName || !payload.term) {
      setError("Please fill in course code, course name, and term.");
      return;
    }
    if (Number.isNaN(payload.studentCount) || payload.studentCount < 0) {
      setError("Student count must be 0 or greater.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await mainApi.createProfessorCourse(payload);
      setCourses((prev) => [created, ...prev]);
      setOpen(false);
      setForm({
        courseCode: "",
        courseName: "",
        term: "Spring 2026",
        studentCount: 0,
      });
    } catch {
      setError("Unable to create course right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/prof/home">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links">
          <a className="active" href="/prof/home">
            Home
          </a>
          <a href="/prof/recordings">Recordings</a>
        </nav>
        <div className="user">
          <span className="user-name">{username}</span>
          <span className="avatar" aria-hidden="true"></span>
        </div>
      </header>

      <main className="main">
        <section className="frame">
          <div className={styles.frameHead}>
            <div className="page-title">Courses</div>
            <button className={styles.createTrigger} type="button" onClick={() => setOpen(true)}>
              <span className={styles.addBtn} aria-hidden="true">
                +
              </span>
              <span>Create new course</span>
            </button>
          </div>

          <div className="cards">
            {courses.map((course) => (
              <article className="course-card" key={course.id}>
                <div className="course-title">{course.title}</div>
                <div className="course-meta">
                  {course.term} • {course.studentCount} students
                </div>
                <a className="primary-btn" href={`/prof/course?courseId=${course.id}`}>
                  View Course
                </a>
              </article>
            ))}
          </div>
        </section>
      </main>

      {open && (
        <div className="modal show">
          <div className={`modal-card ${styles.modalCard}`}>
            <h3 className={styles.modalTitle}>Create Course</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Course code</span>
                <input
                  type="text"
                  value={form.courseCode}
                  onChange={(e) => setForm((p) => ({ ...p, courseCode: e.target.value }))}
                  placeholder="CS207"
                />
              </label>
              <label className={styles.field}>
                <span>Course name</span>
                <input
                  type="text"
                  value={form.courseName}
                  onChange={(e) => setForm((p) => ({ ...p, courseName: e.target.value }))}
                  placeholder="Data Structures"
                />
              </label>
              <label className={styles.field}>
                <span>Term</span>
                <input
                  type="text"
                  value={form.term}
                  onChange={(e) => setForm((p) => ({ ...p, term: e.target.value }))}
                  placeholder="Spring 2026"
                />
              </label>
              <label className={styles.field}>
                <span>Student count</span>
                <input
                  type="number"
                  min={0}
                  value={form.studentCount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, studentCount: Number(e.target.value || 0) }))
                  }
                />
              </label>
            </div>

            {error && <div className={styles.errorText}>{error}</div>}

            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} type="button" onClick={() => setOpen(false)}>
                Cancel
              </button>
              <button
                className={`primary-btn ${styles.createBtn}`}
                type="button"
                onClick={handleCreateCourse}
                disabled={saving}
              >
                {saving ? "Creating..." : "Create Course"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
