import ProfCourseClient from "./prof-course-client";

const DEFAULT_COURSE_ID = "cs207";

type ProfCoursePageProps = {
  searchParams?: Promise<{
    courseId?: string;
  }>;
};

export default async function ProfCoursePage({ searchParams }: ProfCoursePageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const courseId = resolvedSearchParams?.courseId || DEFAULT_COURSE_ID;

  return <ProfCourseClient courseId={courseId} />;
}
