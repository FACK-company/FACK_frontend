import ProfExamClient from "./profExamClient";

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

  return (
    <ProfExamClient
      courseId={courseId}
      examId={examId}
    />
  );
}
