"use client";

import { useEffect, useState } from "react";
import { getUserMetadata, mainApi } from "@/services";
import ProfNav from "../ProfNav";
import type { ProfessorCourse } from "@/types/api/main";
import styles from "./page.module.css";

const DEFAULT_PROF_USERNAME = "prof_username";

export default function ProfHome() {
  const [username, setUsername] = useState(DEFAULT_PROF_USERNAME);
  const [profId, setProfId] = useState('');
  const [courses, setCourses] = useState<ProfessorCourse[]>([]);

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

  return (
    <div className={`page ${styles.pageBg}`}>
      <ProfNav username={username} active="home" />

      <main className="main">
        <section className="frame">
          <div className={styles.frameHead}>
            <div className="page-title">Courses</div>
            <a className={styles.createTrigger} href="/prof/course/create">
              <span className={styles.addBtn} aria-hidden="true">
                +
              </span>
              <span>Create new course</span>
            </a>
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
    </div>
  );
}
