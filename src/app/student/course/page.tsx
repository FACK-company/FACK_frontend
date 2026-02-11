import { mainApi } from "@/services";
import styles from "./page.module.css";

type StudentCoursePageProps = {
  searchParams?: Promise<{
    courseId?: string;
  }>;
};

export default async function StudentCoursePage({ searchParams }: StudentCoursePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const courseId = resolvedSearchParams?.courseId || "cs207";

  const [profile, coursesResp, courseExamsResp] = await Promise.all([
    mainApi.getStudentProfile(),
    mainApi.getStudentCourses(),
    mainApi.getStudentCourseExams(courseId),
  ]);

  const username = profile.username || "student_name";
  const exams = courseExamsResp.exams || [];
  const course = (coursesResp.courses || []).find((item) => item.id === courseId);
  const courseTitle = course ? `${course.code} — ${course.name}` : "Course Exams";

  return (
    <div className={`page ${styles.pageBg}`}>
      <header className="nav">
        <a className="brand" href="/student/home">
          Fulbright AntiCheat Knight
        </a>
        <nav className="nav-links" aria-hidden="true"></nav>
        <div className="user">
          <span className="user-name">{username}</span>
          <span className="avatar" aria-hidden="true"></span>
        </div>
      </header>

      <main className="main">
        <section className="frame">
          <div className={styles.pageTitle}>{courseTitle}</div>
          <div className={styles.list}>
            {exams.map((exam) => (
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
            {!exams.length && <div className={styles.empty}>No exams available.</div>}
          </div>
        </section>
      </main>
    </div>
  );
}
