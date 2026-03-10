"use client";

import { useEffect, useState } from "react";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../ProfNav";
import type { AddProfessorCourseRequest, ProfessorCourse } from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";
const SEMESTER_OPTIONS = ["Fall 2025", "Spring 2026", "Fall 2026"] as const;

export default function ProfHome() {
  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [profId, setProfId] = useState('');
  const [courses, setCourses] = useState<ProfessorCourse[]>([]);
  const [open, setOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState<AddProfessorCourseRequest>({
    code: "",
    name: "",
    semester: "Spring 2026",
    professorId: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      const userMetadata = getUserMetadata();
      const resolvedProfId = userMetadata?.id || '';
      const resolvedDisplayName = userMetadata?.name || '';
      setProfId(resolvedProfId);
      setUsername(resolvedDisplayName);
      try {
        // console.log("Starting loadData: Loading metadata from localStorage and fetching courses...");
        const coursesResp = await mainApi.getProfessorCourses(resolvedProfId);
        if (!isMounted) return;
        // console.log("Loaded courses: ", coursesResp);
        // console.log("Setting courses: ", coursesResp.courses);
        setCourses([...(coursesResp || [])]);
      } catch (error) {
        if (!isMounted) return;
        console.error("loadData failed with error:", error);
        console.error(
          "Error message:",
          error instanceof Error ? error.message : String(error)
        );
        setUsername(DEFAULT_PROF_USERNAME);
        setProfId(DEFAULT_PROF_USERNAME);
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
      code: form.code.trim(),
      name: form.name.trim(),
      semester: form.semester.trim(),
      professorId: profId,
    };

    if (!payload.code || !payload.name) {
      setError("Please fill in course code and course name.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      // console.log("Creating course with payload: ", payload);
      const created = await mainApi.createProfessorCourse(payload);
      setCourses((prev) => [created, ...prev]);
      setOpen(false);
      setForm({
        code: "",
        name: "",
        semester: "Spring 2026",
        professorId: profId,
        description: "",
        status: "active",
      });
    } catch(error) {
      console.error("Error creating course ", error);
      setError("Unable to create course right now.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} active="home" />

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
                <div className="course-title">{course.code} - {course.name}</div>
                {/* <div className="course-meta">
                  {course.semester} • {course.studentCount} students
                </div> */}
                <div className="course-meta">
                  {course.semester}
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
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="CS207"
                />
              </label>
              <label className={styles.field}>
                <span>Course name</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Data Structures"
                />
              </label>
              <label className={styles.field}>
                <span>Semester</span>
                <select
                  value={form.semester}
                  onChange={(e) => setForm((p) => ({ ...p, semester: e.target.value }))}
                >
                  {SEMESTER_OPTIONS.map((semester) => (
                    <option key={semester} value={semester}>
                      {semester}
                    </option>
                  ))}
                </select>
              </label>
              <label className={styles.field}>
                <span>Description</span>
                <input
                  type="text"
                  value={form.description || ""}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Course description"
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
