"use client";

import { useEffect, useMemo, useState } from "react";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../ProfNav";
import LoadingState from "@/components/LoadingState";
import type {
  AddProfessorExamRequest,
  Student,
  ProfessorExamRow,
  ProfessorCourse,
  CsvPreviewResponse,
} from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";

type ProfCourseClientProps = {
  courseId: string;
};

function normalizeStudent(student: Student): Student {
  if (student.name) return student;
  if (!student.firstName && !student.lastName) return student;
  const combined = [student.firstName, student.lastName].filter(Boolean).join(" ");
  return { ...student, name: combined };
}

function normalizeStudents(items: Student[]) {
  return items.map(normalizeStudent);
}

function normalizeHeaderCell(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, "_");
}

function deriveNameFromEmail(email: string) {
  const local = email.split("@")[0] ?? "";
  const dotParts = local.split(".");
  const trimmedParts =
    dotParts.length > 1 && /^\d+$/.test(dotParts[dotParts.length - 1])
      ? dotParts.slice(0, -1)
      : dotParts;
  const cleaned = trimmedParts.join(".").replace(/[._-]+/g, " ").trim();
  if (!cleaned) return local;
  return cleaned
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export default function ProfCourseClient({
  courseId,
}: ProfCourseClientProps) {
  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [courseData, setCourseData] = useState<ProfessorCourse | null>(null);
  const [courseTitle, setCourseTitle] = useState("Course");
  const [students, setStudents] = useState<Student[]>([]);
  const [exams, setExams] = useState<ProfessorExamRow[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  const [email, setEmail] = useState("");
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isPreviewingCsv, setIsPreviewingCsv] = useState(false);
  const [openPeopleModal, setOpenPeopleModal] = useState(false);
  const [peopleTab, setPeopleTab] = useState<"single" | "csv">("single");
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewResponse | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);
  const [csvMapping, setCsvMapping] = useState<{
    emailIndex: number;
    nameIndex: number | null;
  } | null>(null);
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

  const enrolledEmailSet = useMemo(
    () =>
      new Set(
        students
          .map((student) => student.email?.toLowerCase())
          .filter((emailValue): emailValue is string => Boolean(emailValue))
      ),
    [students]
  );

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
        setExams(examsResp || []);
        setStudents(normalizeStudents(studentsResp || []));
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

  const sortedStudents = students;

  const handleAddStudent = async () => {
    const emailValue = email.trim().toLowerCase();
    if (!emailValue.includes("@")) {
      setError("Please fill a valid email.");
      return;
    }
    if (enrolledEmailSet.has(emailValue)) {
      setEnrolledNotice(emailValue);
      return;
    }

    setIsAddingStudent(true);
    setError("");
    try {
      const fullName = deriveNameFromEmail(emailValue);
      const csvText = `name,email\n${fullName},${emailValue}\n`;
      const file = new File([csvText], "single_student.csv", { type: "text/csv" });
      const result = await mainApi.importCourseStudents(file, {
        courseId: effectiveCourseId,
        hasHeaderRow: true,
        separateNameColumns: false,
        nameColumnIndex: 0,
        emailColumnIndex: 1,
      });
      const refreshed = await mainApi.getCourseStudents(effectiveCourseId);
      setStudents(normalizeStudents(refreshed || []));
      if (result.errorCount > 0) {
        setError(
          `Imported ${result.successCount}, skipped ${result.skippedCount}, errors ${result.errorCount}.`
        );
      }
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

    setCsvFile(file);
    setCsvPreview(null);
    setCsvPreviewRows([]);
    setCsvMapping(null);
    setIsPreviewingCsv(true);
    setError("");
    try {
      const preview = await mainApi.previewCourseStudents(file, {
        hasHeader: true,
        maxRows: 25,
      });
      const normalized = preview.columns.map(normalizeHeaderCell);
      const nameIndex = normalized.indexOf("name");
      const emailIndex = normalized.indexOf("email");

      if (emailIndex < 0) {
        setCsvMapping(null);
        setCsvPreview(preview);
        setCsvPreviewRows([]);
        setError("CSV header must include email (name is optional).");
        return;
      }

      const validRows = preview.sampleRows.filter((row) => {
        if (row.length <= Math.max(nameIndex, emailIndex)) {
          return false;
        }
        const nameValue = nameIndex >= 0 ? row[nameIndex]?.trim() : "";
        const emailValue = row[emailIndex]?.trim();
        return Boolean(emailValue && emailValue.includes("@"));
      });

      setCsvMapping({ nameIndex: nameIndex >= 0 ? nameIndex : null, emailIndex });
      setCsvPreview(preview);
      setCsvPreviewRows(validRows);
    } catch {
      setError("Unable to preview CSV.");
    } finally {
      setIsPreviewingCsv(false);
      event.target.value = "";
    }
  };

  const handleConfirmCsvImport = async () => {
    if (!csvFile || !csvMapping) {
      setError("Please upload a CSV file with a valid header first.");
      return;
    }

    setIsImportingCsv(true);
    setError("");
    try {
      const result = await mainApi.importCourseStudents(csvFile, {
        courseId: effectiveCourseId,
        hasHeaderRow: true,
        separateNameColumns: false,
        ...(csvMapping.nameIndex !== null ? { nameColumnIndex: csvMapping.nameIndex } : {}),
        emailColumnIndex: csvMapping.emailIndex,
      });
      const refreshed = await mainApi.getCourseStudents(effectiveCourseId);
      setStudents(normalizeStudents(refreshed || []));
      setCsvFile(null);
      setCsvPreview(null);
      setCsvPreviewRows([]);
      setCsvMapping(null);
      if (result.errorCount > 0) {
        setError(
          `Imported ${result.successCount}, skipped ${result.skippedCount}, errors ${result.errorCount}.`
        );
      }
    } catch {
      setError("Unable to import CSV.");
    } finally {
      setIsImportingCsv(false);
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
      const created = await mainApi.createCourseExam(effectiveCourseId, payload);
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
      <ProfNav username={username} />

      <main className="main">
        <section className="frame">
          <div className="page-title">Course — {courseTitle}</div>
          {error && <div className={styles.errorText}>{error}</div>}
          {isLoading && (
            <div className={styles.empty}>
              <LoadingState text="Loading course data..." variant="inline" />
            </div>
          )}

          <div className={styles.layout}>
            <section className={styles.examPanel}>
              <div className={styles.examHead}>
                <div className={styles.sectionTitle}>Exams</div>
                {/* <button
                  className={styles.createExamBtn}
                  type="button"
                  onClick={() => setOpenExamModal(true)}
                >
                  + Create exam
                </button> */}
              </div>
              <div className={`table ${styles.courseTable}`}>
                <div className={`table-head ${styles.courseTableHead}`}>
                  <div>Exam name</div>
                  <div>Description</div>
                  <div></div>
                </div>
                {exams.map((exam) => (
                  <div className={`table-row ${styles.courseTableRow}`} key={exam.id}>
                    <div className="strong">{exam.title}</div>
                    <div>{exam.description || "—"}</div>
                    <a
                      className={`primary-btn ${styles.viewExamBtn}`}
                      href={`/prof/exam?courseId=${effectiveCourseId}&examId=${exam.id}`}
                    >
                      View Exam
                    </a>
                  </div>
                ))}
              </div>
            </section>

            <section className={styles.studentPanel}>
              <div className={styles.studentHeadRow}>
                <div className={styles.sectionTitle}>Students</div>
                <button
                  className={styles.addPeopleBtn}
                  type="button"
                  onClick={() => setOpenPeopleModal(true)}
                >
                  + Add people
                </button>
              </div>

              <div className={styles.studentTable}>
                <div className={styles.studentHead}>
                  <div>Name</div>
                  <div>Email</div>
                </div>
                {sortedStudents.map((student) => (
                  <div className={styles.studentRow} key={student.id}>
                    <div>{student.name || "—"}</div>
                    <div className={styles.emailCell}>{student.email}</div>
                  </div>
                ))}
                {!sortedStudents.length && (
                  <div className={styles.empty}>No students yet.</div>
                )}
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

      {openPeopleModal && (
        <div className="modal show">
          <div className={`modal-card ${styles.modalCard}`}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Add people</h3>
              <button
                className={styles.closeBtn}
                type="button"
                aria-label="Close add people"
                onClick={() => {
                  setOpenPeopleModal(false);
                  setPeopleTab("single");
                  setCsvFile(null);
                  setCsvPreview(null);
                  setCsvPreviewRows([]);
                  setCsvMapping(null);
                }}
              >
                ×
              </button>
            </div>

            <div className={styles.tabRow}>
              <button
                className={`${styles.tabBtn} ${peopleTab === "single" ? styles.tabBtnActive : ""}`}
                type="button"
                onClick={() => setPeopleTab("single")}
              >
                Add one
              </button>
              <button
                className={`${styles.tabBtn} ${peopleTab === "csv" ? styles.tabBtnActive : ""}`}
                type="button"
                onClick={() => setPeopleTab("csv")}
              >
                Upload CSV
              </button>
            </div>

            {peopleTab === "single" && (
              <div className={styles.modalSection}>
                <div className={styles.modalSubTitle}>Add one student</div>
                <div className={styles.addRow}>
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
                    {isAddingStudent ? "Adding..." : "Add student"}
                  </button>
                </div>
              </div>
            )}

            {peopleTab === "csv" && (
              <div className={styles.modalSection}>
                <div className={styles.modalSubTitle}>Import CSV</div>
                <div className={styles.csvRow}>
                  <label className={styles.csvLabel}>
                    <input
                      className={styles.fileInput}
                      type="file"
                      accept=".csv,text/csv"
                      onChange={handleCsvUpload}
                      disabled={isImportingCsv || isPreviewingCsv}
                    />
                    {isPreviewingCsv ? "Previewing..." : "Upload CSV"}
                  </label>
                </div>
                <div className={styles.csvHint}>
                  Use columns: <span>email</span> (name optional)
                </div>

                {csvPreview && (
                  <div className={styles.csvPreview}>
                    <div className={styles.csvPreviewHead}>
                      <div>
                        Previewing {csvPreviewRows.length} valid rows
                        {csvPreview.sampleRows.length
                          ? ` (showing up to ${csvPreview.sampleRows.length})`
                          : ""}
                      </div>
                      <button
                        className={`primary-btn ${styles.importBtn}`}
                        type="button"
                        onClick={handleConfirmCsvImport}
                        disabled={isImportingCsv || !csvPreviewRows.length}
                      >
                        {isImportingCsv ? "Importing..." : "Import"}
                      </button>
                    </div>
                    <div className={styles.csvTable}>
                      <div className={styles.csvTableHead}>
                        <div>Name</div>
                        <div>Email</div>
                      </div>
                      {csvPreviewRows.map((row, idx) => (
                        <div className={styles.csvTableRow} key={`csv-row-${idx}`}>
                          <div>
                            {csvMapping?.nameIndex !== null && csvMapping?.nameIndex !== undefined
                              ? row[csvMapping.nameIndex]
                              : deriveNameFromEmail(row[csvMapping?.emailIndex ?? 0] || "")}
                          </div>
                          <div className={styles.emailCell}>
                            {row[csvMapping?.emailIndex ?? 1]}
                            {enrolledEmailSet.has(
                              (row[csvMapping?.emailIndex ?? 1] || "").toLowerCase()
                            ) && <span className={styles.enrolledTag}>Already enrolled</span>}
                          </div>
                        </div>
                      ))}
                      {!csvPreviewRows.length && (
                        <div className={styles.empty}>No valid rows to import.</div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>
        </div>
      )}

      {enrolledNotice && (
        <div className="modal show">
          <div className={`modal-card ${styles.modalCard}`}>
            <h3 className={styles.modalTitle}>Student Already Enrolled</h3>
            <p className={styles.modalText}>
              The student <strong>{enrolledNotice}</strong> is already in this course.
            </p>
            <div className={styles.modalActions}>
              <button
                className={styles.ghostBtn}
                type="button"
                onClick={() => setEnrolledNotice(null)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
