import { mainApi } from "@/services";
import type {
  ProfessorCourse,
  Student,
  ProfessorExamRow,
} from "@/types/api/main";
import ProfCourseClient from "./prof-course-client";

const DEFAULT_COURSE_ID = "cs207";
const DEFAULT_COURSE_TITLE = "CS207 Data Structures";

type ProfCoursePageProps = {
  searchParams?: Promise<{
    courseId?: string;
  }>;
};

export default async function ProfCoursePage({ searchParams }: ProfCoursePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const courseId = resolvedSearchParams?.courseId || DEFAULT_COURSE_ID;

  let courseTitle = DEFAULT_COURSE_TITLE;
  let courseData: ProfessorCourse = null as any;
  let students: Student[] = [];
  let exams: ProfessorExamRow[] = [];
  let initialError = "";

  try {
    const [courseResp, examsResp, studentsResp] = await Promise.all([
      mainApi.getCourseById(courseId),
      mainApi.getCourseExams(courseId),
      mainApi.getCourseStudents(courseId),
    ]);
    // console.log("Fetched course exams: ", examsResp);
    // console.log("Fetched course students: ", studentsResp);
    courseData = courseResp;
    exams = examsResp || [];
    students = studentsResp || [];
  } catch (error) {
    console.error("Error loading course page data:", error);
  }

  return (
    <ProfCourseClient
      courseData={courseData}
      initialCourseTitle={courseTitle}
      initialStudents={students}
      initialExams={exams}
      initialError={initialError}
    />
  );
}
