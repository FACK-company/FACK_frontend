import ProfRecordingViewClient from "./profRecordingViewClient";

type ProfRecordingViewPageProps = {
  searchParams?: Promise<{
    courseId?: string;
    examId?: string;
    sessionId?: string;
  }>;
};

export default async function ProfRecordingViewPage({
  searchParams,
}: ProfRecordingViewPageProps) {
  const resolvedSearchParams = searchParams ? await searchParams : undefined;
  const courseId = resolvedSearchParams?.courseId || "cs207";
  const examId = resolvedSearchParams?.examId || "final-exam";
  const sessionId = resolvedSearchParams?.sessionId || "s-1";

  return (
    <ProfRecordingViewClient
      courseId={courseId}
      examId={examId}
      sessionId={sessionId}
    />
  );
}
