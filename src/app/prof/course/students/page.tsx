"use client";

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../../ProfNav";
import type { CsvPreviewResponse, Student } from "@/types/api/main";
import styles from "./page.module.css";

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

function CourseStudentsPageContent() {
  const searchParams = useSearchParams();
  const courseId = searchParams.get("courseId") || "cs207";
  const [username, setUsername] = useState("prof_username");
  const [courseName, setCourseName] = useState("Course");
  const [students, setStudents] = useState<Student[]>([]);
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [isImportingCsv, setIsImportingCsv] = useState(false);
  const [isPreviewingCsv, setIsPreviewingCsv] = useState(false);
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [csvPreview, setCsvPreview] = useState<CsvPreviewResponse | null>(null);
  const [csvPreviewRows, setCsvPreviewRows] = useState<string[][]>([]);
  const [csvMapping, setCsvMapping] = useState<{ emailIndex: number; nameIndex: number | null } | null>(null);
  const [enrolledNotice, setEnrolledNotice] = useState<string | null>(null);

  useEffect(() => {
    const metadata = getUserMetadata();
    setUsername(metadata?.name?.trim() || "prof_username");
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      setIsLoading(true);
      setError("");
      try {
        const [courseResp, studentsResp] = await Promise.all([
          mainApi.getCourseById(courseId),
          mainApi.getCourseStudents(courseId),
        ]);
        if (!active) return;
        setCourseName(courseResp?.name || "Course");
        setStudents(normalizeStudents(studentsResp || []));
      } catch {
        if (!active) return;
        setError("Unable to load students.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, [courseId]);

  const enrolledEmailSet = useMemo(
    () =>
      new Set(
        students
          .map((student) => student.email?.toLowerCase())
          .filter((emailValue): emailValue is string => Boolean(emailValue))
      ),
    [students]
  );

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
      await mainApi.importCourseStudents(file, {
        courseId,
        hasHeaderRow: true,
        separateNameColumns: false,
        nameColumnIndex: 0,
        emailColumnIndex: 1,
      });
      const refreshed = await mainApi.getCourseStudents(courseId);
      setStudents(normalizeStudents(refreshed || []));
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
      await mainApi.importCourseStudents(csvFile, {
        courseId,
        hasHeaderRow: true,
        separateNameColumns: false,
        ...(csvMapping.nameIndex !== null ? { nameColumnIndex: csvMapping.nameIndex } : {}),
        emailColumnIndex: csvMapping.emailIndex,
      });
      const refreshed = await mainApi.getCourseStudents(courseId);
      setStudents(normalizeStudents(refreshed || []));
      setCsvFile(null);
      setCsvPreview(null);
      setCsvPreviewRows([]);
      setCsvMapping(null);
    } catch {
      setError("Unable to import CSV.");
    } finally {
      setIsImportingCsv(false);
    }
  };

  const handleRemoveStudent = async (student: Student) => {
    if (!student.id) {
      setError("Cannot remove student: missing student id.");
      return;
    }
    if (!window.confirm(`Remove ${student.name || student.email} from this course?`)) {
      return;
    }
    setError("");
    try {
      await mainApi.removeStudentFromCourse(courseId, student.id);
      setStudents((prev) => prev.filter((item) => item.id !== student.id));
    } catch {
      setError("Unable to remove student from course.");
    }
  };

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} />
      <main className="main">
        <section className="frame">
          <div className={styles.headerRow}>
            <div>
              <div className={styles.eyebrow}>Course roster</div>
              <div className="page-title">Students - {courseName}</div>
            </div>
            <a className={styles.backBtn} href={`/prof/course?courseId=${courseId}`}>
              Back to course
            </a>
          </div>

          {error && <div className={styles.errorText}>{error}</div>}

          <div className={styles.layout}>
            <section className={styles.actionCard}>
              <div className={styles.sectionTitle}>Add student</div>
              <div className={styles.addRow}>
                <input
                  className={styles.textInput}
                  placeholder="Student email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                <button className="primary-btn" type="button" onClick={handleAddStudent} disabled={isAddingStudent}>
                  {isAddingStudent ? "Adding..." : "Add student"}
                </button>
              </div>
            </section>

            <section className={styles.actionCard}>
              <div className={styles.sectionTitle}>Import students</div>
              <div className={styles.csvRow}>
                <label className={styles.csvLabel}>
                  <input
                    className={styles.fileInput}
                    type="file"
                    accept=".csv,text/csv"
                    onChange={handleCsvUpload}
                    disabled={isImportingCsv || isPreviewingCsv}
                  />
                  {isPreviewingCsv ? "Previewing..." : "Choose CSV"}
                </label>
                <button
                  className="primary-btn"
                  type="button"
                  onClick={handleConfirmCsvImport}
                  disabled={isImportingCsv || !csvPreviewRows.length}
                >
                  {isImportingCsv ? "Importing..." : "Import students"}
                </button>
              </div>
              <div className={styles.csvHint}>Use columns: <span>email</span> (name optional)</div>
              {csvPreview && (
                <div className={styles.csvPreview}>
                  <div className={styles.csvPreviewHead}>
                    Previewing {csvPreviewRows.length} valid rows
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
                          {enrolledEmailSet.has((row[csvMapping?.emailIndex ?? 1] || "").toLowerCase()) && (
                            <span className={styles.enrolledTag}>Already enrolled</span>
                          )}
                        </div>
                      </div>
                    ))}
                    {!csvPreviewRows.length && <div className={styles.empty}>No valid rows to import.</div>}
                  </div>
                </div>
              )}
            </section>
          </div>

          <section className={styles.listCard}>
            <div className={styles.listHeadRow}>
              <div className={styles.sectionTitle}>Student list</div>
              <div className={styles.countPill}>{students.length} students</div>
            </div>

            {isLoading ? (
              <div className={styles.empty}>Loading students...</div>
            ) : (
              <div className={styles.studentTable}>
                <div className={styles.studentHead}>
                  <div>Name</div>
                  <div>Email</div>
                  <div></div>
                </div>
                {students.map((student) => (
                  <div className={styles.studentRow} key={student.id}>
                    <div>{student.name || "-"}</div>
                    <div className={styles.emailCell}>{student.email}</div>
                    <button
                      className={styles.removeStudentBtn}
                      type="button"
                      onClick={() => void handleRemoveStudent(student)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                {!students.length && <div className={styles.empty}>No students yet.</div>}
              </div>
            )}
          </section>
        </section>
      </main>

      {enrolledNotice && (
        <div className="modal show">
          <div className={`modal-card ${styles.modalCard}`}>
            <h3 className={styles.modalTitle}>Student Already Enrolled</h3>
            <p className={styles.modalText}>
              The student <strong>{enrolledNotice}</strong> is already in this course.
            </p>
            <div className={styles.modalActions}>
              <button className={styles.ghostBtn} type="button" onClick={() => setEnrolledNotice(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function CourseStudentsPage() {
  return (
    <Suspense fallback={<div className="page" />}>
      <CourseStudentsPageContent />
    </Suspense>
  );
}
