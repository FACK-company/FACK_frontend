import { mainApi } from "@/services";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";
// PLACEHOLDER START: fallback exam data while backend is unavailable.
const DEFAULT_EXAM_DETAILS = {
  examTitle: "Final Exam",
  courseCode: "CS207",
  totalStudents: 42,
  completedRecordings: 38,
  interruptedRecordings: 3,
  missingRecordings: 1,
  sessions: [
    {
      id: "s-1",
      studentName: "Nguyen Minh",
      recordingStatus: "Completed",
      startTime: "08:00:00",
      endTime: "09:28:14",
      duration: "01:28:14",
      interruptions: "0",
    },
    {
      id: "s-2",
      studentName: "Tran Anh",
      recordingStatus: "Interrupted",
      startTime: "08:03:10",
      endTime: "08:55:53",
      duration: "00:52:43",
      interruptions: "2",
    },
    {
      id: "s-3",
      studentName: "Le Khoa",
      recordingStatus: "Missing",
      startTime: "-",
      endTime: "-",
      duration: "-",
      interruptions: "-",
    },
  ],
};
// PLACEHOLDER END

async function getProfessorUsername(): Promise<string> {
  try {
    const profile = await mainApi.getProfessorProfile();
    return profile.username || DEFAULT_PROF_USERNAME;
  } catch {
    return DEFAULT_PROF_USERNAME;
  }
}

async function getExamDetails(courseId: string, examId: string) {
  try {
    return await mainApi.getExamDetails(courseId, examId);
  } catch {
    return DEFAULT_EXAM_DETAILS;
  }
}

type ProfExamPageProps = {
  searchParams?: Promise<{
    courseId?: string;
    examId?: string;
  }>;
};

export default async function ProfExam({ searchParams }: ProfExamPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const courseId = resolvedSearchParams?.courseId || "cs207";
  const examId = resolvedSearchParams?.examId || "final-exam";
  const username = await getProfessorUsername();
  const examDetails = await getExamDetails(courseId, examId);

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
          <div className="page-title">
            Exam — {examDetails.courseCode} {examDetails.examTitle}
          </div>
          <div className="stats">
            <div className="stat-card">
              <div className="stat-label">Total students</div>
              <div className="stat-value">{examDetails.totalStudents}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Completed recordings</div>
              <div className="stat-value">{examDetails.completedRecordings}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Interrupted recordings</div>
              <div className="stat-value">{examDetails.interruptedRecordings}</div>
            </div>
            <div className="stat-card">
              <div className="stat-label">Missing recordings</div>
              <div className="stat-value">{examDetails.missingRecordings}</div>
            </div>
          </div>

          <div className={`table table-5 ${styles.examTable}`}>
            <div className={`table-head ${styles.examTableHead}`}>
              <div>Student name</div>
              <div>Recording status</div>
              <div>Start time</div>
              <div>End time</div>
              <div>Duration</div>
              <div>Interruptions</div>
              <div></div>
            </div>
            {examDetails.sessions.map((session) => (
              <div className={`table-row ${styles.examTableRow}`} key={session.id}>
                <div className="strong">{session.studentName}</div>
                <div
                  className={`status-pill ${
                    session.recordingStatus === "Completed"
                      ? "complete"
                      : session.recordingStatus === "Interrupted"
                      ? "interrupted"
                      : "missing"
                  }`}
                >
                  {session.recordingStatus}
                </div>
                <div>{session.startTime}</div>
                <div>{session.endTime}</div>
                <div>{session.duration}</div>
                <div>{session.interruptions}</div>
                <a
                  className={`primary-btn ${styles.viewBtn}`}
                  href={`/prof/recordings/view?courseId=${courseId}&examId=${examId}&sessionId=${session.id}`}
                >
                  View
                </a>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
