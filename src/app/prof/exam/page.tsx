import { mainApi } from "@/services";
import ProfExamClient from "./profExamClient";
import type { ProfessorExamDetailsResponse } from "@/types/api/main";

type ProfExamDetails = {
  id: string;
  courseId: string;
  professorId: string;
  title: string;
  description: string;
  durationMinutes: number;
  startAvailableAt: string;
  endAvailableAt: string;
  examFileUrl: string;
  recordingRequired: boolean;
  createdAt: string;
};

function normalizeExamDetails(
  payload: ProfessorExamDetailsResponse | ProfExamDetails,
  courseId: string,
  examId: string
): ProfExamDetails {
  const source = payload as Partial<ProfExamDetails> & Partial<ProfessorExamDetailsResponse>;

  if (typeof source.title === "string") {
    return {
      id: source.id || examId,
      courseId: source.courseId || courseId,
      professorId: source.professorId || "",
      title: source.title || "Exam",
      description: source.description || "",
      durationMinutes: Number(source.durationMinutes ?? 0),
      startAvailableAt: source.startAvailableAt || "",
      endAvailableAt: source.endAvailableAt || "",
      examFileUrl: source.examFileUrl || "",
      recordingRequired: Boolean(source.recordingRequired),
      createdAt: source.createdAt || "",
    };
  }

  return {
    id: examId,
    courseId,
    professorId: "",
    title: source.examTitle || "Exam",
    description: "",
    durationMinutes: 0,
    startAvailableAt: "",
    endAvailableAt: "",
    examFileUrl: "",
    recordingRequired: false,
    createdAt: "",
  };
}

// PLACEHOLDER START: fallback exam data while backend is unavailable.
const DEFAULT_EXAM_DETAILS: ProfExamDetails = {
  id: "336cb68e-ec3d-4d69-a470-bf87299321b6",
  courseId: "a66833c2-718e-4364-b808-cdaa3869501c",
  professorId: "8e218b8d-5388-468a-9f2d-473172014e74",
  title: "Midterm Exam - Data Structures",
  description:
    "Comprehensive exam covering arrays, linked lists, trees, and graphs",
  durationMinutes: 120,
  startAvailableAt: "2024-03-15T09:00:00",
  endAvailableAt: "2024-03-15T11:30:00",
  examFileUrl: "https://storage.example.com/exams/midterm_ds.pdf",
  recordingRequired: true,
  createdAt: "2026-02-23T11:47:31",
};
// PLACEHOLDER END

async function getExamDetails(courseId: string, examId: string) {
  try {
    const response = await mainApi.getExamDetails(courseId, examId);
    return normalizeExamDetails(response, courseId, examId);
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
  const examDetails = await getExamDetails(courseId, examId);

  return (
    <ProfExamClient
      examDetails={examDetails}
    />
  );
}
