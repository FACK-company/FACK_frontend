"use client";

import { useEffect, useState } from "react";
import { mainApi } from "@/services";
import StudentNav from "../StudentNav";
import styles from "./page.module.css";

const DEFAULT_USERNAME = "student_name";

export default function StudentHomePage() {
  const [username, setUsername] = useState(DEFAULT_USERNAME);
  const [courses, setCourses] = useState<
    { id: string; code: string; name: string; semester: string }[]
  >([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      try {
        const [profile, coursesResp] = await Promise.all([
          mainApi.getStudentProfile(),
          mainApi.getStudentCourses(),
        ]);

        if (!mounted) return;
        setUsername(profile.username || DEFAULT_USERNAME);
        setCourses(coursesResp.courses || []);
      } catch {
        if (!mounted) return;
        setUsername(DEFAULT_USERNAME);
        setCourses([]);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  return (
    <div className="page bg-grad">
      <StudentNav username={username} />

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
          </div>
        </section>
      </main>
    </div>
  );
}
