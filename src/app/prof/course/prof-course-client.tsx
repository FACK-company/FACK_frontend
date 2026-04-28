"use client";

import { useEffect, useState } from "react";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../ProfNav";
import type {
  AddProfessorCourseRequest,
  ProfessorExamRow,
  ProfessorCourse,
} from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";
const SEMESTER_OPTIONS = ["Fall 2025", "Spring 2026", "Fall 2026"] as const;

type ProfCourseClientProps = {
  courseId: string;
};

export default function ProfCourseClient({ courseId }: ProfCourseClientProps) {
  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [courseData, setCourseData] = useState<ProfessorCourse | null>(null);
  const [courseTitle, setCourseTitle] = useState("Course");
  const [studentCount, setStudentCount] = useState(0);
  const [exams, setExams] = useState<ProfessorExamRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [openCourseMetaModal, setOpenCourseMetaModal] = useState(false);
  const [isSavingCourseMeta, setIsSavingCourseMeta] = useState(false);
  const [courseForm, setCourseForm] = useState<AddProfessorCourseRequest>({
    code: "",
    name: "",
    semester: "",
    professorId: "",
    description: "",
    status: "active",
  });

  useEffect(() => {
    const userMetadata = getUserMetadata();
    setUsername(userMetadata?.name?.trim() || DEFAULT_PROF_USERNAME);
  }, []);

  useEffect(() => {
    let active = true;

    async function loadCourseData() {
      setIsLoading(true);
      setError("");
      try {
        const [courseResp, examsResp, studentsResp] = await Promise.all([
          mainApi.getCourseById(courseId),
          mainApi.getCourseExams(courseId),
          mainApi.getCourseStudents(courseId),
        ]);

        if (!active) return;

        setCourseData(courseResp);
        setCourseTitle(courseResp?.name || "Course");
        setStudentCount((studentsResp || []).length);
        setCourseForm({
          code: courseResp?.code || "",
          name: courseResp?.name || "",
          semester: courseResp?.semester || "",
          professorId: getUserMetadata()?.id || courseResp?.professorId || "",
          description: courseResp?.description || "",
          status: courseResp?.status || "active",
        });
        setExams(examsResp || []);
      } catch (loadError) {
        if (!active) return;
        console.error("Error loading course page data:", loadError);
        setError("Unable to load course data.");
      } finally {
        if (active) setIsLoading(false);
      }
    }

    void loadCourseData();
    return () => {
      active = false;
    };
  }, [courseId]);

  const effectiveCourseId = courseData?.id || courseId;

  const handleDeleteExam = async (examId: string) => {
    if (!window.confirm("Delete this exam? This action cannot be undone.")) {
      return;
    }
    setError("");
    try {
      await mainApi.deleteExam(examId);
      setExams((prev) => prev.filter((item) => item.id !== examId));
    } catch {
      setError("Unable to delete exam.");
    }
  };

  const handleSaveCourseMeta = async () => {
    const payload: AddProfessorCourseRequest = {
      code: courseForm.code.trim(),
      name: courseForm.name.trim(),
      semester: courseForm.semester.trim(),
      professorId: courseForm.professorId || getUserMetadata()?.id || "",
      description: courseForm.description?.trim() || "",
      status: courseForm.status || "active",
    };

    if (!payload.code || !payload.name || !payload.semester) {
      setError("Course code, name, and semester are required.");
      return;
    }

    setIsSavingCourseMeta(true);
    setError("");
    try {
      const updated = await mainApi.updateCourse(effectiveCourseId, payload);
      setCourseData(updated);
      setCourseTitle(updated.name || payload.name);
      setOpenCourseMetaModal(false);
    } catch {
      setError("Unable to update course metadata.");
    } finally {
      setIsSavingCourseMeta(false);
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} />

      <main className="main">
        <section className="frame">
          <div className="page-title">Course - {courseTitle}</div>
          {error && <div className={styles.errorText}>{error}</div>}
          {isLoading && <div className={styles.empty}>Loading course data...</div>}

          <div className={styles.layout}>
            <section className={styles.examPanel}>
              <div className={styles.metaCard}>
                <div className={styles.metaGrid}>
                  <div>
                    <div className={styles.metaLabel}>Code</div>
                    <div className={styles.metaValue}>{courseData?.code || "-"}</div>
                  </div>
                  <div>
                    <div className={styles.metaLabel}>Semester</div>
                    <div className={styles.metaValue}>{courseData?.semester || "-"}</div>
                  </div>
                  <div>
                    <div className={styles.metaLabel}>Status</div>
                    <div className={styles.metaValue}>{courseData?.status || "active"}</div>
                  </div>
                  <div>
                    <div className={styles.metaLabel}>Students</div>
                    <div className={styles.metaValue}>{studentCount}</div>
                  </div>
                  <div className={styles.metaWide}>
                    <div className={styles.metaLabel}>Description</div>
                    <div className={styles.metaValue}>{courseData?.description || "-"}</div>
                  </div>
                </div>
                <div className={styles.metaActions}>
                  <button
                    className={styles.createExamBtn}
                    type="button"
                    onClick={() => setOpenCourseMetaModal(true)}
                  >
                    Edit course data
                  </button>
                  <a
                    className={styles.secondaryActionBtn}
                    href={`/prof/course/students?courseId=${effectiveCourseId}`}
                  >
                    Manage students
                  </a>
                </div>
              </div>

              <div className={styles.examHead}>
                <div className={styles.sectionTitle}>Exams</div>
                <a
                  className={styles.createExamBtn}
                  href={`/prof/exam/create?courseId=${effectiveCourseId}`}
                >
                  + Create exam
                </a>
              </div>
              <div className={`table ${styles.courseTable}`}>
                <div className={`table-head ${styles.courseTableHead}`}>
                  <div>Exam name</div>
                  <div>Description</div>
                  <div></div>
                  <div></div>
                </div>
                {exams.map((exam) => (
                  <div className={`table-row ${styles.courseTableRow}`} key={exam.id}>
                    <div className="strong">{exam.title}</div>
                    <div>{exam.description || "-"}</div>
                    <a
                      className={`primary-btn ${styles.viewExamBtn}`}
                      href={`/prof/exam?courseId=${effectiveCourseId}&examId=${exam.id}`}
                    >
                      View Exam
                    </a>
                    <button
                      className={styles.deleteExamBtn}
                      type="button"
                      onClick={() => void handleDeleteExam(exam.id)}
                    >
                      Delete
                    </button>
                  </div>
                ))}
                {!exams.length && <div className={styles.empty}>No exams yet.</div>}
              </div>
            </section>
          </div>
        </section>
      </main>

      {openCourseMetaModal && (
        <div className="modal show">
          <div className={`modal-card ${styles.modalCard}`}>
            <h3 className={styles.modalTitle}>Edit course data</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Course code *</span>
                <input
                  type="text"
                  value={courseForm.code}
                  onChange={(e) => setCourseForm((p) => ({ ...p, code: e.target.value }))}
                  placeholder="CS201"
                />
              </label>
              <label className={styles.field}>
                <span>Course name *</span>
                <input
                  type="text"
                  value={courseForm.name}
                  onChange={(e) => setCourseForm((p) => ({ ...p, name: e.target.value }))}
                  placeholder="Intro Programming"
                />
              </label>
              <label className={styles.field}>
                <span>Semester *</span>
                <select
                  value={courseForm.semester}
                  onChange={(e) => setCourseForm((p) => ({ ...p, semester: e.target.value }))}
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
                  value={courseForm.status || "active"}
                  onChange={(e) => setCourseForm((p) => ({ ...p, status: e.target.value }))}
                >
                  <option value="active">active</option>
                  <option value="archived">archived</option>
                </select>
              </label>
              <label className={`${styles.field} ${styles.spanAll}`}>
                <span>Description</span>
                <textarea
                  value={courseForm.description || ""}
                  onChange={(e) =>
                    setCourseForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Course description"
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => setOpenCourseMetaModal(false)}
              >
                Cancel
              </button>
              <button
                className={`primary-btn ${styles.createBtn}`}
                type="button"
                onClick={handleSaveCourseMeta}
                disabled={isSavingCourseMeta}
              >
                {isSavingCourseMeta ? "Saving..." : "Save course data"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
