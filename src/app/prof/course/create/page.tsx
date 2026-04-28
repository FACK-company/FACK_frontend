"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../../ProfNav";
import type { AddProfessorCourseRequest } from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";
const SEMESTER_OPTIONS = ["Fall 2025", "Spring 2026", "Fall 2026"] as const;

export default function CreateCoursePage() {
  const router = useRouter();
  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [profId, setProfId] = useState("");
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
    const metadata = getUserMetadata();
    setUsername(metadata?.name?.trim() || DEFAULT_PROF_USERNAME);
    setProfId(metadata?.id || "");
    setForm((prev) => ({ ...prev, professorId: metadata?.id || "" }));
  }, []);

  const handleCreateCourse = async () => {
    const payload: AddProfessorCourseRequest = {
      code: form.code.trim(),
      name: form.name.trim(),
      semester: form.semester.trim(),
      professorId: profId,
      description: form.description?.trim() || "",
      status: form.status || "active",
    };

    if (!payload.code || !payload.name || !payload.semester) {
      setError("Please fill in course code, course name, and semester.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      const created = await mainApi.createProfessorCourse(payload);
      router.push(`/prof/course?courseId=${created.id}`);
    } catch (err) {
      console.error(err);
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
          <div className={styles.headerRow}>
            <div>
              <div className={styles.eyebrow}>Professor workspace</div>
              <div className="page-title">Create Course</div>
            </div>
            <a className={styles.backBtn} href="/prof/home">
              Back to courses
            </a>
          </div>

          <div className={styles.formCard}>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Course code *</span>
                <input
                  type="text"
                  value={form.code}
                  onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="CS207"
                />
              </label>
              <label className={styles.field}>
                <span>Course name *</span>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Data Structures"
                />
              </label>
              <label className={styles.field}>
                <span>Semester *</span>
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
                <span>Status</span>
                <select
                  value={form.status || "active"}
                  onChange={(e) => setForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className={`${styles.field} ${styles.spanAll}`}>
                <span>Description</span>
                <textarea
                  value={form.description || ""}
                  onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                  placeholder="Course description"
                />
              </label>
            </div>

            {error && <div className={styles.errorText}>{error}</div>}

            <div className={styles.actions}>
              <button className={styles.ghostBtn} type="button" onClick={() => router.push('/prof/home')}>
                Cancel
              </button>
              <button className="primary-btn" type="button" onClick={handleCreateCourse} disabled={saving}>
                {saving ? "Creating..." : "Create Course"}
              </button>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
