"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { mainApi } from "@/services";
import type {
  AddProfessorExamRequest,
  AddProfessorCourseStudentRequest,
  ProfessorCourseStudent,
  ProfessorExamRow,
} from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";
const DEFAULT_COURSE_ID = "cs207";
const DEFAULT_COURSE_TITLE = "CS207 Data Structures";

function parseCsvRows(csvText: string): AddProfessorCourseStudentRequest[] {
  const lines = csvText
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (!lines.length) return [];

  const cells = lines.map((line) => line.split(",").map((cell) => cell.trim()));
  const header = cells[0].map((h) => h.toLowerCase());
  const firstNameIndex = header.indexOf("first_name");
  const lastNameIndex = header.indexOf("last_name");
  const emailIndex = header.indexOf("email");
  const hasHeader = firstNameIndex >= 0 && lastNameIndex >= 0 && emailIndex >= 0;

  const rows = hasHeader ? cells.slice(1) : cells;

  return rows
    .map((row) => {
      const firstName = hasHeader ? row[firstNameIndex] : row[0];
      const lastName = hasHeader ? row[lastNameIndex] : row[1];
      const email = hasHeader ? row[emailIndex] : row[2];
      return { firstName, lastName, email };
    })
    .filter((row) => row.firstName && row.lastName && row.email?.includes("@"));
}

export default function ProfCoursePage() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || DEFAULT_COURSE_ID;

  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [courseTitle, setCourseTitle] = useState(DEFAULT_COURSE_TITLE);
  const [students, setStudents] = useState<ProfessorCourseStudent[]>([]);
  const [exams, setExams] = useState<ProfessorExamRow[]>([]);
  const [error, setError] = useState("");

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [openExamModal, setOpenExamModal] = useState(false);
  const [isCreatingExam, setIsCreatingExam] = useState(false);
  const [examForm, setExamForm] = useState<AddProfessorExamRequest>({
    title: "",
    description: "",
    examFile: null,
    durationMinutes: 120,
    startAvailableAt: "",
    endAvailableAt: "",
  });

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [profile, examsResp, studentsResp] = await Promise.all([
          mainApi.getProfessorProfile(),
          mainApi.getCourseExams(courseId),
          mainApi.getCourseStudents(courseId),
        ]);
        if (!mounted) return;
        setUsername(profile.username || DEFAULT_PROF_USERNAME);
        setCourseTitle(examsResp.courseTitle || DEFAULT_COURSE_TITLE);
        setExams(examsResp.exams || []);
        setStudents(studentsResp.students || []);
      } catch {
        if (!mounted) return;
        setError("Unable to load course data.");
      }
    }

    load();

    return () => {
      mounted = false;
    };
  }, [courseId]);

  const sortedStudents = useMemo(
    () => [...students].sort((a, b) => a.lastName.localeCompare(b.lastName)),
    [students]
  );

  const handleAddStudent = async () => {
    const payload: AddProfessorCourseStudentRequest = {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim().toLowerCase(),
    };

    if (!payload.firstName || !payload.lastName || !payload.email.includes("@")) {
      setError("Please fill first name, last name, and a valid email.");
      return;
    }

    setIsAddingStudent(true);
    setError("");
    try {
      const created = await mainApi.addCourseStudent(courseId, payload);
      setStudents((prev) => [created, ...prev]);
      setFirstName("");
      setLastName("");
      setEmail("");
    } catch {
      setError("Unable to add student.");
    } finally {
      setIsAddingStudent(false);
    }
  };

  const handleCsvUpload: React.ChangeEventHandler<HTMLInputElement> = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsImportingCsv(true);
    setError("");
    try {
      const csvText = await file.text();
      const rows = parseCsvRows(csvText);
      if (!rows.length) {
        setError("CSV has no valid rows. Use: first_name,last_name,email");
        return;
      }

      const imported = await mainApi.importCourseStudents(courseId, rows);
      setStudents((prev) => [...imported.students, ...prev]);
    } catch {
      setError("Unable to import CSV.");
    } finally {
      setIsImportingCsv(false);
      event.target.value = "";
    }
  };

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
    if (!payload.examFile) {
      setError("Please upload the exam PDF.");
      return;
    }
    if (Number.isNaN(payload.durationMinutes) || payload.durationMinutes <= 0) {
      setError("Duration must be greater than 0.");
      return;
    }

    setIsCreatingExam(true);
    setError("");
    try {
      const created = await mainApi.createCourseExam(courseId, payload);
      setExams((prev) => [created, ...prev]);
      setOpenExamModal(false);
      setExamForm({
        title: "",
        description: "",
        examFile: null,
        durationMinutes: 120,
        startAvailableAt: "",
        endAvailableAt: "",
      });
    } catch {
      setError("Unable to create exam.");
    } finally {
      setIsCreatingExam(false);
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/prof/home">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links">
          <a href="/prof/home">Home</a>
          <a href="/prof/recordings">Recordings</a>
        </nav>
        <div className="user">
          <span className="user-name">{username}</span>
          <span className="avatar" aria-hidden="true"></span>
        </div>
      </header>

      <main className="main">
        <section className="frame">
          <div className="page-title">Course — {courseTitle}</div>
          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.layout}>
            <section className={styles.studentPanel}>
              <div className={styles.sectionTitle}>Students</div>

              <div className={styles.addRow}>
                <input
                  className={styles.textInput}
                  placeholder="First name"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                />
                <input
                  className={styles.textInput}
                  placeholder="Last name"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                />
                <input
                  className={styles.textInput}
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button
                  className={`primary-btn ${styles.addBtn}`}
                  type="button"
                  onClick={handleAddStudent}
                  disabled={isAddingStudent}
                >
                  {isAddingStudent ? "Adding..." : "Add"}
                </button>
              </div>

              <div className={styles.csvRow}>
                <label className={styles.csvLabel}>
                  <input
                    className={styles.fileInput}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                    disabled={isImportingCsv}
                  />
                  {isImportingCsv ? "Importing..." : "Upload CSV"}
                </label>
              </div>

              <div className={styles.studentTable}>
                <div className={styles.studentHead}>
                  <div>First name</div>
                  <div>Last name</div>
                  <div>Email</div>
                </div>
                {sortedStudents.map((student) => (
                  <div className={styles.studentRow} key={student.id}>
                    <div>{student.firstName}</div>
                    <div>{student.lastName}</div>
                    <div className={styles.emailCell}>{student.email}</div>
                  </div>
                ))}
                {!sortedStudents.length && (
                  <div className={styles.empty}>No students yet.</div>
                )}
              </div>
            </section>

            <section className={styles.examPanel}>
              <div className={styles.examHead}>
                <div className={styles.sectionTitle}>Exams</div>
                <button
                  className={styles.createExamBtn}
                  type="button"
                  onClick={() => setOpenExamModal(true)}
                >
                  + Create exam
                </button>
              </div>
              <div className={`table ${styles.courseTable}`}>
                <div className={`table-head ${styles.courseTableHead}`}>
                  <div>Exam name</div>
                  <div>Course</div>
                  <div>Number of students</div>
                  <div></div>
                </div>
                {exams.map((exam) => (
                  <div className={`table-row ${styles.courseTableRow}`} key={exam.id}>
                    <div className="strong">{exam.examName}</div>
                    <div>{exam.courseCode}</div>
                    <div>{exam.studentCount}</div>
                    <a
                      className={`primary-btn ${styles.viewExamBtn}`}
                      href={`/prof/exam?courseId=${courseId}&examId=${exam.id}`}
                    >
                      View Exam
                    </a>
                  </div>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>

      {openExamModal && (
        <div className="modal show">
          <div className={`modal-card ${styles.modalCard}`}>
            <h3 className={styles.modalTitle}>Create Exam</h3>
            <div className={styles.formGrid}>
              <label className={styles.field}>
                <span>Title</span>
                <input
                  type="text"
                  value={examForm.title}
                  onChange={(e) => setExamForm((p) => ({ ...p, title: e.target.value }))}
                  placeholder="Final Exam"
                />
              </label>
              <label className={styles.field}>
                <span>Exam PDF</span>
                <input
                  type="file"
                  accept=".pdf,application/pdf"
                  onChange={(e) =>
                    setExamForm((p) => ({
                      ...p,
                      examFile: e.target.files?.[0] || null,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Duration (minutes)</span>
                <input
                  type="number"
                  min={1}
                  value={examForm.durationMinutes}
                  onChange={(e) =>
                    setExamForm((p) => ({
                      ...p,
                      durationMinutes: Number(e.target.value || 0),
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>Start available at</span>
                <input
                  type="datetime-local"
                  value={examForm.startAvailableAt}
                  onChange={(e) =>
                    setExamForm((p) => ({
                      ...p,
                      startAvailableAt: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={styles.field}>
                <span>End available at</span>
                <input
                  type="datetime-local"
                  value={examForm.endAvailableAt}
                  onChange={(e) =>
                    setExamForm((p) => ({
                      ...p,
                      endAvailableAt: e.target.value,
                    }))
                  }
                />
              </label>
              <label className={`${styles.field} ${styles.spanAll}`}>
                <span>Description</span>
                <textarea
                  value={examForm.description}
                  onChange={(e) =>
                    setExamForm((p) => ({ ...p, description: e.target.value }))
                  }
                  placeholder="Exam description"
                />
              </label>
            </div>
            <div className={styles.modalActions}>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => setOpenExamModal(false)}
              >
                Cancel
              </button>
              <button
                className={`primary-btn ${styles.createBtn}`}
                type="button"
                onClick={handleCreateExam}
                disabled={isCreatingExam}
              >
                {isCreatingExam ? "Creating..." : "Create Exam"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
