"use client";

import { useEffect, useState } from "react";
import { mainApi } from "@/services";
import styles from "./page.module.css";

const DEFAULT_USERNAME = "student_name";

function formatStartEnd(timeWindow: string): string {
  const fullMatch = timeWindow.match(
    /^([A-Za-z]{3})\s+(\d{1,2}),\s*(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})$/
  );
  if (fullMatch) {
    const [, monthText, dayText, startText, endText] = fullMatch;
    return `${monthText} ${Number(dayText)} ${startText} - ${monthText} ${Number(dayText)} ${endText}`;
  }

  const timeOnlyMatch = timeWindow.match(/(\d{1,2}:\d{2})\s*[-–]\s*(\d{1,2}:\d{2})/);
  if (timeOnlyMatch) {
    return `${timeOnlyMatch[1]} - ${timeOnlyMatch[2]}`;
  }

  return timeWindow;
}

export default function StudentHomePage() {
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [courses, setCourses] = useState<
    { id: string; code: string; name: string; semester: string }[]
  >([]);
  const [happeningNow, setHappeningNow] = useState<
    {
      id: string;
      courseId: string;
      courseName: string;
      examTitle: string;
      timeWindow: string;
    }[]
  >([]);
  const [currentExam, setCurrentExam] = useState<{
    id: string;
    courseId: string;
    courseCode: string;
    title: string;
    timeWindow: string;
  } | null>(null);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [profile, coursesResp, currentExamResp] = await Promise.all([
          mainApi.getStudentProfile(),
          mainApi.getStudentCourses(),
          mainApi.getStudentCurrentExam(),
        ]);

        if (!mounted) return;
        setUsername(profile.username || DEFAULT_USERNAME);
        const loadedCourses = coursesResp.courses || [];
        setCourses(loadedCourses);
        setCurrentExam(currentExamResp.exam);

        const examsByCourse = await Promise.all(
          loadedCourses.map((course) => mainApi.getStudentCourseExams(course.id))
        );
        if (!mounted) return;

        const inProgressExams = examsByCourse.flatMap((entry) => {
          const course = loadedCourses.find((item) => item.id === entry.courseId);
          const courseName = course ? `${course.code} - ${course.name}` : entry.courseId;
          return (entry.exams || [])
            .filter((exam) => exam.status === "In progress")
            .map((exam) => ({
              id: exam.id,
              courseId: exam.courseId,
              courseName,
              examTitle: exam.title,
              timeWindow: exam.timeWindow,
            }));
        });

        const withCurrent =
          currentExamResp.exam &&
          !inProgressExams.some(
            (item) =>
              item.id === currentExamResp.exam?.id &&
              item.courseId === currentExamResp.exam?.courseId
          )
            ? [
                {
                  id: currentExamResp.exam.id,
                  courseId: currentExamResp.exam.courseId,
                  courseName: `${currentExamResp.exam.courseCode}`,
                  examTitle: currentExamResp.exam.title,
                  timeWindow: currentExamResp.exam.timeWindow,
                },
                ...inProgressExams,
              ]
            : inProgressExams;

        const placeholderMore = [
          {
            id: "placeholder-now-1",
            courseId: loadedCourses[0]?.id || "cs207",
            courseName: loadedCourses[0]
              ? `${loadedCourses[0].code} - ${loadedCourses[0].name}`
              : "CS207 - Data Structures",
            examTitle: "Lab Practical",
            timeWindow: "Feb 13, 14:00-15:00",
          },
          {
            id: "placeholder-now-2",
            courseId: loadedCourses[1]?.id || "cs201",
            courseName: loadedCourses[1]
              ? `${loadedCourses[1].code} - ${loadedCourses[1].name}`
              : "CS201 - Intro Programming",
            examTitle: "Quiz 2",
            timeWindow: "Feb 14, 09:00-09:45",
          },
        ];

        const merged = [...withCurrent];
        for (const fakeExam of placeholderMore) {
          if (merged.length >= 3) break;
          merged.push(fakeExam);
        }
        setHappeningNow(merged);
      } catch {
        if (!mounted) return;
        setUsername(DEFAULT_USERNAME);
        setCourses([]);
        setHappeningNow([]);
        setCurrentExam(null);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page bg-grad">
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
        <div className="welcome">
          Welcome Student, <span className={styles.name}>{username}</span>.
        </div>

        <section className="frame">
          <div className={styles.layout}>
            <section className={styles.coursesPanel}>
              <div className={styles.sectionHead}>
                <div className={styles.sectionTitle}>Your Courses</div>
              </div>
              <div className={styles.courseCards}>
                {courses.map((course) => (
                  <article className={styles.courseCard} key={course.id}>
                    <div className={styles.courseTitle}>
                      {course.code} - {course.name}
                    </div>
                    <div className={styles.courseInfo}>{course.semester}</div>
                    <a className="primary-btn" href={`/student/course?courseId=${course.id}`}>
                      View Course
                    </a>
                  </article>
                ))}
                {!courses.length && (
                  <div className={styles.emptyState}>No courses available right now.</div>
                )}
              </div>
            </section>

            <aside className={styles.nowPanel}>
              <div className={styles.sectionTitle}>Happening Now</div>
              {happeningNow.length ? (
                <div className={styles.nowList}>
                  {happeningNow.map((item) => (
                    <div className={styles.nowCard} key={`${item.courseId}-${item.id}`}>
                      <div className={styles.nowLabel}>Exam</div>
                      <div className={styles.nowTitle}>{item.examTitle}</div>
                      <div className={styles.nowExamTitle}>{item.courseName}</div>
                      <div className={styles.nowMeta}>{formatStartEnd(item.timeWindow)}</div>
                      <div className={styles.nowActions}>
                        <a
                          className="primary-btn"
                          href={`/student/record?courseId=${item.courseId}&examId=${item.id}`}
                        >
                          Enter Exam
                        </a>
                      </div>
                    </div>
                  ))}
                  {!currentExam && (
                    <div className={styles.placeholderNote}>
                      Showing placeholders for preview.
                    </div>
                  )}
                </div>
              ) : (
                <div className={styles.nowEmpty}>No active exam right now.</div>
              )}
            </aside>
          </div>
        </section>
      </main>
    </div>
  );
}
