// Main API client for Spring Boot backend

import type {
  AddProfessorExamRequest,
  AddProfessorRecordingCommentRequest,
  AddProfessorCourseRequest,
  CsvBatchEnrollmentResponse,
  CsvImportParams,
  CsvPreviewResponse,
  ProfessorCourse,
  Student,
  ProfessorExamDetailsResponse,
  ProfessorExamSessionRow,
  ProfessorRecordingComment,
  ProfessorRecordingDetailResponse,
  ProfessorRecordingListItem,
  ProfessorRecordingsResponse,
  // ProfessorCourseExamsResponse,
  ProfessorExamRow,
  LoginRequest,
  LoginResponse,
  ProfessorProfileResponse,
  StudentCourseExamsResponse,
  StudentCoursesResponse,
  StudentCurrentExamResponse,
  StudentExamDetailResponse,
  StudentExamSummary,
  StudentProfileResponse,
  StudentExamSession,
  ActiveExamSessionResult,
  ExamSession,
} from "@/types/api/main";
import {
  clearAccessToken,
  clearUserMetadata,
  fetchServer,
  getUserMetadata,
  refreshAccessToken,
  setAccessToken,
  setUserMetadata,
} from "./index";
import { connectSessionSocket, disconnectSessionSocket } from "./sessionSocket";

const mainApiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

// PLACEHOLDER ONLY: set to `true` when backend is unavailable.
const MOCK_SERVER_TRUE = false;
const PLACEHOLDERS = {
  professorCourses: [
    {
      id: "cs207",
      name: "CS207 — Data Structures",
      semester: "Spring 2026",
      studentCount: 42,
    },
    {
      id: "cs201",
      name: "CS201 — Intro Programming",
      semester: "Spring 2026",
      studentCount: 68,
    },
    {
      id: "cs105",
      name: "CS105 — Discrete Math",
      semester: "Spring 2026",
      studentCount: 55,
    },
  ] as ProfessorCourse[],
  recordings: [
    {
      sessionId: "s-1",
      courseId: "cs207",
      examId: "final-exam",
      studentName: "Nguyen Minh",
      examName: "CS207 Final",
      classCode: "CS207",
      status: "Completed",
      duration: "01:28:14",
      videoPath: "/video/video.mp4",
    },
    {
      sessionId: "s-2",
      courseId: "cs207",
      examId: "final-exam",
      studentName: "Tran Anh",
      examName: "CS207 Final",
      classCode: "CS207",
      status: "Interrupted",
      duration: "00:52:43",
      videoPath: "/video/video.mp4",
    },
    {
      sessionId: "s-7",
      courseId: "cs201",
      examId: "midterm-1",
      studentName: "Pham Linh",
      examName: "CS201 Midterm 1",
      classCode: "CS201",
      status: "Completed",
      duration: "01:10:01",
      videoPath: "/video/video.mp4",
    },
  ] as ProfessorRecordingListItem[],
  examsByCourseId: {
    cs207: {
      courseTitle: "CS207 Data Structures",
      exams: [
        { id: "final-exam", examName: "Final Exam", courseCode: "CS207", studentCount: 42 },
        { id: "midterm-2", examName: "Midterm 2", courseCode: "CS207", studentCount: 42 },
        { id: "quiz-5", examName: "Quiz 5", courseCode: "CS207", studentCount: 42 },
      ],
    },
    cs201: {
      courseTitle: "CS201 Intro Programming",
      exams: [
        { id: "lab-practical", examName: "Lab Practical", courseCode: "CS201", studentCount: 68 },
        { id: "midterm-1", examName: "Midterm 1", courseCode: "CS201", studentCount: 68 },
        {
          id: "final-project-check",
          examName: "Final Project Check",
          courseCode: "CS201",
          studentCount: 68,
        },
      ],
    },
    cs105: {
      courseTitle: "CS105 Discrete Math",
      exams: [
        { id: "quiz-3", examName: "Quiz 3", courseCode: "CS105", studentCount: 55 },
        { id: "midterm", examName: "Midterm", courseCode: "CS105", studentCount: 55 },
        { id: "final-exam", examName: "Final Exam", courseCode: "CS105", studentCount: 55 },
      ],
    },
  } as Record<string, any>,
  studentsByCourseId: {
    cs207: [
      {
        id: "st-1",
        firstName: "Nguyen",
        lastName: "Minh",
        email: "nguyen.minh.123456@student.fulbright.edu.vn",
      },
      {
        id: "st-2",
        firstName: "Tran",
        lastName: "Anh",
        email: "tran.anh.234567@student.fulbright.edu.vn",
      },
      {
        id: "st-3",
        firstName: "Le",
        lastName: "Khoa",
        email: "le.khoa.345678@student.fulbright.edu.vn",
      },
    ],
    cs201: [
      {
        id: "st-4",
        firstName: "Pham",
        lastName: "Linh",
        email: "pham.linh.456789@student.fulbright.edu.vn",
      },
    ],
    cs105: [],
  } as Record<string, Student[]>,
  examSessions: {
    "cs207:final-exam": [
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
    "cs207:midterm-2": [
      {
        id: "s-4",
        studentName: "Pham Linh",
        recordingStatus: "Completed",
        startTime: "13:00:00",
        endTime: "14:10:01",
        duration: "01:10:01",
        interruptions: "0",
      },
      {
        id: "s-5",
        studentName: "Vo Anh",
        recordingStatus: "Completed",
        startTime: "13:00:12",
        endTime: "14:09:56",
        duration: "01:09:44",
        interruptions: "1",
      },
      {
        id: "s-6",
        studentName: "Do Nhat",
        recordingStatus: "Interrupted",
        startTime: "13:05:01",
        endTime: "13:45:10",
        duration: "00:40:09",
        interruptions: "3",
      },
    ],
  } as Record<string, ProfessorExamSessionRow[]>,
  recordingDetails: {
    "s-1": {
      sessionId: "s-1",
      examTitle: "Final Exam",
      courseCode: "CS207",
      studentName: "Nguyen Minh",
      studentEmail: "nguyen.minh.123456@student.fulbright.edu.vn",
      status: "Completed",
      duration: "01:28:14",
      startTime: "08:00:00",
      endTime: "09:28:14",
      videoPath: "/video/video.mp4",
      comments: [
        {
          id: "c-1",
          timestampSec: 132,
          text: "Student switched tabs briefly.",
          createdAt: "2026-02-11T08:05:00Z",
        },
        {
          id: "c-2",
          timestampSec: 904,
          text: "Possible pause in activity.",
          createdAt: "2026-02-11T08:19:00Z",
        },
      ],
    },
    "s-2": {
      sessionId: "s-2",
      examTitle: "Final Exam",
      courseCode: "CS207",
      studentName: "Tran Anh",
      studentEmail: "tran.anh.234567@student.fulbright.edu.vn",
      status: "Interrupted",
      duration: "00:52:43",
      startTime: "08:03:10",
      endTime: "08:55:53",
      videoPath: "/video/video.mp4",
      comments: [],
    },
    "s-3": {
      sessionId: "s-3",
      examTitle: "Final Exam",
      courseCode: "CS207",
      studentName: "Le Khoa",
      studentEmail: "le.khoa.345678@student.fulbright.edu.vn",
      status: "Missing",
      duration: "-",
      startTime: "-",
      endTime: "-",
      videoPath: "/video/video.mp4",
      comments: [],
    },
  } as Record<string, ProfessorRecordingDetailResponse>,
  student: {
    name: "student_name",
    courses: [
      {
        id: "cs207",
        code: "CS207",
        name: "Data Structures",
        description: "Core data structures and algorithmic analysis.",
        semester: "Spring 2026",
      },
      {
        id: "cs201",
        code: "CS201",
        name: "Intro Programming",
        description: "Programming fundamentals using problem-solving workflows.",
        semester: "Spring 2026",
      },
      {
        id: "cs105",
        code: "CS105",
        name: "Discrete Math",
        description: "Logic, sets, combinatorics, and proof techniques.",
        semester: "Spring 2026",
      },
    ],
    examsByCourse: {
      cs207: [
        {
          id: "final-exam",
          courseId: "cs207",
          courseCode: "CS207",
          title: "Final Exam",
          status: "In progress",
          timeWindow: "Feb 10, 08:00-10:00",
          durationMinutes: 120,
        },
        {
          id: "midterm-2",
          courseId: "cs207",
          courseCode: "CS207",
          title: "Midterm 2",
          status: "Ended",
          timeWindow: "Feb 12, 13:00-15:00",
          durationMinutes: 120,
        },
      ],
      cs201: [
        {
          id: "midterm-1",
          courseId: "cs201",
          courseCode: "CS201",
          title: "Midterm 1",
          status: "Not started",
          timeWindow: "Feb 20, 09:00-10:30",
          durationMinutes: 90,
        },
      ],
      cs105: [
        {
          id: "quiz-5",
          courseId: "cs105",
          courseCode: "CS105",
          title: "Quiz 5",
          status: "Submitted",
          timeWindow: "Feb 01, 09:00-09:30",
          durationMinutes: 30,
        },
      ],
    } as Record<string, StudentExamSummary[]>,
    examDetails: {
      "cs207:final-exam": {
        id: "final-exam",
        courseId: "cs207",
        courseCode: "CS207",
        title: "Final Exam",
        status: "In progress",
        timeWindow: "Feb 10, 08:00-10:00",
        durationMinutes: 120,
        description: "Complete all coding tasks in the exam sheet and submit before time ends.",
        examFileUrl: "/files/CS201_Spring_2026_HW2.pdf",
      },
      "cs207:midterm-2": {
        id: "midterm-2",
        courseId: "cs207",
        courseCode: "CS207",
        title: "Midterm 2",
        status: "Ended",
        timeWindow: "Feb 12, 13:00-15:00",
        durationMinutes: 120,
        description: "Closed-book written exam with algorithm design questions.",
        examFileUrl: "/files/CS201_Spring_2026_HW2.pdf",
      },
      "cs201:midterm-1": {
        id: "midterm-1",
        courseId: "cs201",
        courseCode: "CS201",
        title: "Midterm 1",
        status: "Not started",
        timeWindow: "Feb 20, 09:00-10:30",
        durationMinutes: 90,
        description: "Programming fundamentals and debugging tasks.",
        examFileUrl: "/files/CS201_Spring_2026_HW2.pdf",
      },
      "cs105:quiz-5": {
        id: "quiz-5",
        courseId: "cs105",
        courseCode: "CS105",
        title: "Quiz 5",
        status: "Submitted",
        timeWindow: "Feb 01, 09:00-09:30",
        durationMinutes: 30,
        description: "Short quiz on combinatorics and proof by induction.",
        examFileUrl: "/files/CS201_Spring_2026_HW2.pdf",
      },
    } as Record<string, StudentExamDetailResponse>,
  },
};

type BackendMeResponse = {
  id: string;
  name: string;
  email: string;
  role?: string;
};

type BackendCourseResponse = {
  id: string;
  code: string;
  name: string;
  description?: string;
  semester?: string;
};

type BackendExamResponse = {
  id: string;
  courseId: string;
  title: string;
  description?: string;
  examFileUrl?: string;
  durationMinutes?: number;
  startAvailableAt?: string;
  endAvailableAt?: string;
};

function mapSessionStatusToRecordingStatus(
  status?: string
): "Completed" | "Interrupted" | "Missing" {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "submitted") return "Completed";
  if (normalized === "terminated") return "Interrupted";
  return "Missing";
}

function formatDurationFromSession(start?: string | null, end?: string | null): string {
  if (!start || !end) return "-";
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs) || endMs <= startMs) return "-";
  const totalSeconds = Math.floor((endMs - startMs) / 1000);
  const hh = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
  const mm = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
  const ss = String(totalSeconds % 60).padStart(2, "0");
  return `${hh}:${mm}:${ss}`;
}

type UploadRecordingChunkPayload = {
  sessionId: string;
  examId: string;
  studentId: string;
  index: number;
  chunk: Blob;
  deviceInfo?: string;
};

type FinalizeRecordingPayload = {
  sessionId: string;
  examId: string;
  studentId: string;
  deviceInfo?: string;
  preview?: boolean;
};

function formatMonthDayTime(dateLike?: string): { monthDay: string; time: string } {
  if (!dateLike) return { monthDay: "-", time: "-" };
  const d = new Date(dateLike);
  if (Number.isNaN(d.getTime())) return { monthDay: "-", time: "-" };
  const month = d.toLocaleString("en-US", { month: "short" });
  const day = d.getDate();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return { monthDay: `${month} ${day}`, time: `${hh}:${mm}` };
}

function formatTimeWindow(start?: string, end?: string): string {
  const s = formatMonthDayTime(start);
  const e = formatMonthDayTime(end);
  if (s.monthDay === "-" || e.monthDay === "-") return "-";
  return `${s.monthDay}, ${s.time}-${e.time}`;
}

function toStudentExamStatus(start?: string, end?: string): StudentExamSummary["status"] {
  if (!start || !end) return "Not started";
  const now = Date.now();
  const startMs = new Date(start).getTime();
  const endMs = new Date(end).getTime();
  if (Number.isNaN(startMs) || Number.isNaN(endMs)) return "Not started";
  if (now < startMs) return "Not started";
  if (now <= endMs) return "In progress";
  return "Ended";
}

function buildPlaceholderExamDetails(courseId: string, examId: string): ProfessorExamDetailsResponse {
  const coursePayload =
    PLACEHOLDERS.examsByCourseId[courseId] ?? PLACEHOLDERS.examsByCourseId.cs207;
  const exam =
    coursePayload.exams.find((item : any) => item.id === examId) ?? coursePayload.exams[0];
  const sessions =
    PLACEHOLDERS.examSessions[`${courseId}:${exam.id}`] ??
    PLACEHOLDERS.examSessions["cs207:final-exam"] ??
    [];

  const completedRecordings = sessions.filter(
    (row) => row.recordingStatus === "Completed"
  ).length;
  const interruptedRecordings = sessions.filter(
    (row) => row.recordingStatus === "Interrupted"
  ).length;
  const missingRecordings = sessions.filter(
    (row) => row.recordingStatus === "Missing"
  ).length;

  return {
    examTitle: exam.examName,
    courseCode: exam.courseCode,
    totalStudents: exam.studentCount,
    completedRecordings,
    interruptedRecordings,
    missingRecordings,
    sessions,
  };
}

export const mainApi = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when auth backend is ready.
    if (MOCK_SERVER_TRUE) {
      const response: LoginResponse = {
        success: true,
        accessToken: "mock-access-token",
        refreshToken: "mock-refresh-token",
        tokenType: "Bearer",
        expiresIn: 3600,
        user: { email: payload.email },
      };
      return response;
    }
    const response = await fetchServer<LoginResponse>({
      path: "/auth/login",
      method: "POST",
      body: payload,
    });
    if (response?.accessToken) {
      setAccessToken(response.accessToken);
    }
    setUserMetadata({
      id: response.userId || response.user?.id,
      name: response.name || response.user?.name,
      role: response.role || response.user?.role,
    });
    const role = String(response.role ?? response.user?.role ?? "").toLowerCase();
    if (role === "student" && response.accessToken) {
      connectSessionSocket(response.accessToken);
    }

    return response;
  },

  async checkAuthSession(): Promise<boolean> {
    try {
      await fetchServer<BackendMeResponse>({
        baseUrl: mainApiBaseUrl,
        path: "/auth/me",
        method: "GET",
        retryOnAuthFailure: false,
        suppressAuthRedirect: true,
      });
      return true;
    } catch {
      return false;
    }
  },

  async refreshAccessToken(): Promise<LoginResponse | null> {
    const token = await refreshAccessToken(mainApiBaseUrl, Number(process.env.NEXT_PUBLIC_API_TIMEOUT ?? 30000));
    if (!token) return null;
    return { accessToken: token, tokenType: "Bearer" };
  },

  async logout(): Promise<void> {
    try {
      await fetchServer<void>({
        path: "/auth/logout",
        method: "POST",
      });
    } finally {
      disconnectSessionSocket();
      clearAccessToken();
      clearUserMetadata();
    }
  },

  async bootstrapAuth(): Promise<LoginResponse | null> {
    return this.refreshAccessToken();
  },

  async getProfessorProfile(): Promise<ProfessorProfileResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when profile backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { username: "prof_username" };
    }

    const metadata = getUserMetadata();
    return { username: metadata?.name?.trim() || "prof_username" };
  },

  async getStudentProfile(): Promise<StudentProfileResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student profile backend is ready.
    if (MOCK_SERVER_TRUE) {
      console.log(PLACEHOLDERS.student.name);
      return { username: PLACEHOLDERS.student.name };
    }

    const metadata = getUserMetadata();
    return { username: metadata?.name?.trim() || PLACEHOLDERS.student.name };
  },

  async getCourseById(courseId: string): Promise<ProfessorCourse> {
    // PLACEHOLDER ONLY: remove this mock branch when course detail backend is ready.
    if (MOCK_SERVER_TRUE) {
      return (
        PLACEHOLDERS.professorCourses.find((course) => course.id === courseId) ||
        PLACEHOLDERS.professorCourses[0]
      );
    }

    return fetchServer<ProfessorCourse>({
      baseUrl: mainApiBaseUrl,
      path: `/courses/${courseId}`,
      method: "GET",
    });
  },

  async getStudentCourses(): Promise<StudentCoursesResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student courses backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { courses: [...PLACEHOLDERS.student.courses] };
    }

    const metadata = getUserMetadata();
    if (!metadata?.id) {
      return { courses: [] };
    }

    const courses = await fetchServer<BackendCourseResponse[]>({
      baseUrl: mainApiBaseUrl,
      path: `/students/${metadata.id}/courses`,
      method: "GET",
    });

    return {
      courses: (courses ?? []).map((course) => ({
        id: course.id,
        code: course.code || course.id,
        name: course.name,
        description: course.description || "",
        semester: course.semester || "N/A",
      })),
    };
  },

  async getStudentCourseExams(courseId: string): Promise<StudentCourseExamsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student course exams backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        courseId,
        exams: [...(PLACEHOLDERS.student.examsByCourse[courseId] ?? [])],
      };
    }

    const exams = await fetchServer<BackendExamResponse[]>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/by-course/${courseId}`,
      method: "GET",
    });

    return {
      courseId,
      exams: (exams ?? []).map((exam) => ({
        id: exam.id,
        courseId: exam.courseId || courseId,
        courseCode: (exam.courseId || courseId).toUpperCase(),
        title: exam.title,
        status: toStudentExamStatus(exam.startAvailableAt, exam.endAvailableAt),
        timeWindow: formatTimeWindow(exam.startAvailableAt, exam.endAvailableAt),
        durationMinutes: exam.durationMinutes || 0,
        startAvailableAt: exam.startAvailableAt,
        endAvailableAt: exam.endAvailableAt,
      })),
    };
  },

  async getStudentCurrentExam(): Promise<StudentCurrentExamResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student current exam backend is ready.
    if (MOCK_SERVER_TRUE) {
      const current =
        Object.values(PLACEHOLDERS.student.examsByCourse)
          .flat()
          .find((exam) => exam.status === "In progress") ?? null;
      return { exam: current };
    }

    const metadata = getUserMetadata();
    if (!metadata?.id) {
      return { exam: null };
    }

    try {
      const exam = await fetchServer<BackendExamResponse>({
        baseUrl: mainApiBaseUrl,
        path: `/students/${metadata.id}/exams/current`,
        method: "GET",
      });
      return {
        exam: {
          id: exam.id,
          courseId: exam.courseId,
          courseCode: exam.courseId.toUpperCase(),
          title: exam.title,
          status: toStudentExamStatus(exam.startAvailableAt, exam.endAvailableAt),
          timeWindow: formatTimeWindow(exam.startAvailableAt, exam.endAvailableAt),
          durationMinutes: exam.durationMinutes || 0,
          startAvailableAt: exam.startAvailableAt,
          endAvailableAt: exam.endAvailableAt,
        },
      };
    } catch {
      return { exam: null };
    }
  },

  async getActiveExamSession(
    deviceInfo?: string,
    accessTokenOverride?: string,
    verifyDevice?: boolean
  ): Promise<ActiveExamSessionResult> {
    const headers: HeadersInit = {};
    if (deviceInfo) {
      headers["X-Device-Info"] = deviceInfo;
    }
    if (accessTokenOverride) {
      headers["Authorization"] = `Bearer ${accessTokenOverride}`;
    }
    const query = verifyDevice ? "?verifyDevice=true" : "";
    try {
      const session = await fetchServer<StudentExamSession | null>({
        baseUrl: mainApiBaseUrl,
        path: `/exam-sessions/active${query}`,
        method: "GET",
        headers,
        retryOnAuthFailure: false,
        suppressAuthRedirect: true,
      });
      return { session: session ?? null };
    } catch (error) {
      const message = error instanceof Error ? error.message : "";
      if (message.includes("HTTP 409")) {
        return { session: null, conflict: true };
      }
      return { session: null };
    }
  },

  async uploadRecordingChunk(payload: UploadRecordingChunkPayload): Promise<void> {
    const formData = new FormData();
    formData.append("sessionId", payload.sessionId);
    formData.append("examId", payload.examId);
    formData.append("studentId", payload.studentId);
    formData.append("index", String(payload.index));
    formData.append("chunk", payload.chunk, `chunk_${String(payload.index).padStart(6, "0")}.webm`);
    if (payload.deviceInfo) {
      formData.append("deviceInfo", payload.deviceInfo);
    }
    await fetchServer({
      baseUrl: mainApiBaseUrl,
      path: "/recordings/chunk",
      method: "POST",
      body: formData,
    });
  },

  async finalizeRecording(payload: FinalizeRecordingPayload): Promise<void> {
    await fetchServer({
      baseUrl: mainApiBaseUrl,
      path: "/recordings/finalize",
      method: "POST",
      body: payload,
    });
  },

   async previewRecording(payload: FinalizeRecordingPayload): Promise<void> {
    await fetchServer({
      baseUrl: mainApiBaseUrl,
      path: "/recordings/finalize?preview=true",
      method: "POST",
      body: payload,
    });
  },

  async getStudentExamDetail(
    courseId: string,
    examId: string
  ): Promise<StudentExamDetailResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student exam-detail backend is ready.
    if (MOCK_SERVER_TRUE) {
      const key = `${courseId}:${examId}`;
      const direct = PLACEHOLDERS.student.examDetails[key];
      if (direct) return direct;

      const summary =
        (PLACEHOLDERS.student.examsByCourse[courseId] || []).find(
          (item) => item.id === examId
        ) ||
        Object.values(PLACEHOLDERS.student.examDetails)[0];

      return {
        ...summary,
        description:
          "Exam details are running on placeholder mode until backend APIs are connected.",
        examFileUrl: "/files/CS201_Spring_2026_HW2.pdf",
      };
    }

    const exam = await fetchServer<BackendExamResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/${examId}`,
      method: "GET",
    });

    const normalizedCourseId = exam.courseId || courseId;
    return {
      id: exam.id,
      courseId: normalizedCourseId,
      courseCode: normalizedCourseId.toUpperCase(),
      title: exam.title,
      status: toStudentExamStatus(exam.startAvailableAt, exam.endAvailableAt),
      timeWindow: formatTimeWindow(exam.startAvailableAt, exam.endAvailableAt),
      durationMinutes: exam.durationMinutes || 0,
      description: exam.description || "",
      examFileUrl: exam.examFileUrl || "/files/CS201_Spring_2026_HW2.pdf",
      startAvailableAt: exam.startAvailableAt,
      endAvailableAt: exam.endAvailableAt,
    };
  },

  async getExamById(examId: string): Promise<BackendExamResponse> {
    return fetchServer<BackendExamResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/${examId}`,
      method: "GET",
    });
  },

  async getProfessorCourses(prof_id: string): Promise<ProfessorCourse[]> {
    // PLACEHOLDER ONLY: remove this mock branch when courses backend is ready.
    // if (MOCK_SERVER_TRUE) {
    //   return { courses: [...PLACEHOLDERS.professorCourses] };
    // }

    try {
      console.log("getProfessorCourses: Fetching from /prof/courses...");
      const response = await fetchServer<ProfessorCourse[]>({
        baseUrl: mainApiBaseUrl,
        path: `/courses/professor/${prof_id}`,
        method: "GET",
      });
      console.log("getProfessorCourses: Received response:", response);

      return response;
    } catch (error) {
      console.error(
        "getProfessorCourses: Error fetching /prof/courses:",
        error instanceof Error ? error.message : String(error)
      );
      throw error;
    }
  },

  async createProfessorCourse(payload: AddProfessorCourseRequest): Promise<ProfessorCourse> {
    // PLACEHOLDER ONLY: remove this mock branch when create-course backend is ready.
    // if (MOCK_SERVER_TRUE) {
    //   return {
    //     id: `${payload.courseCode.toLowerCase()}-${Date.now()}`,
    //     title: `${payload.courseCode.toUpperCase()} — ${payload.courseName}`,
    //     term: payload.term,
    //     studentCount: 0,
    //   };
    // }

    return fetchServer<ProfessorCourse>({
      baseUrl: mainApiBaseUrl,
      path: "/courses",
      method: "POST",
      body: payload,
    });
  },

  async updateCourse(courseId: string, payload: AddProfessorCourseRequest): Promise<ProfessorCourse> {
    return fetchServer<ProfessorCourse>({
      baseUrl: mainApiBaseUrl,
      path: `/courses/${courseId}`,
      method: "PUT",
      body: payload,
    });
  },

  async getCourseStudents(courseId: string): Promise<Student[]> {
    // PLACEHOLDER ONLY: remove this mock branch when course-students backend is ready.
    if (MOCK_SERVER_TRUE) {
      return [...(PLACEHOLDERS.studentsByCourseId[courseId] ?? [])];
    }

    return fetchServer<Student[]>({
      baseUrl: mainApiBaseUrl,
      path: `/course-enrollments/by-course/${courseId}`,
      method: "GET",
    });
  },

  async removeStudentFromCourse(courseId: string, studentId: string): Promise<void> {
    await fetchServer<void>({
      baseUrl: mainApiBaseUrl,
      path: `/enrollments/course/${courseId}/student/${studentId}`,
      method: "DELETE",
    });
  },

  async previewCourseStudents(
    file: File,
    params: { hasHeader?: boolean; maxRows?: number }
  ): Promise<CsvPreviewResponse> {
    if (MOCK_SERVER_TRUE) {
      return {
        columns: ["first_name", "last_name", "email"],
        sampleRows: [],
        totalRows: 0,
        hasHeader: params.hasHeader ?? true,
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    if (params.hasHeader !== undefined) {
      formData.append("hasHeader", String(params.hasHeader));
    }
    if (params.maxRows !== undefined) {
      formData.append("maxRows", String(params.maxRows));
    }

    return fetchServer<CsvPreviewResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/enrollments/batch-csv/preview",
      method: "POST",
      body: formData,
    });
  },

  async importCourseStudents(
    file: File,
    params: CsvImportParams
  ): Promise<CsvBatchEnrollmentResponse> {
    if (MOCK_SERVER_TRUE) {
      return {
        courseId: params.courseId,
        totalRecords: 0,
        successCount: 0,
        skippedCount: 0,
        errorCount: 0,
        results: [],
        timestamp: new Date().toISOString(),
      };
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("courseId", params.courseId);
    formData.append("emailColumnIndex", String(params.emailColumnIndex));
    if (params.nameColumnIndex !== undefined) {
      formData.append("nameColumnIndex", String(params.nameColumnIndex));
    }
    if (params.hasHeaderRow !== undefined) {
      formData.append("hasHeader", String(params.hasHeaderRow));
    }
    if (params.separateNameColumns !== undefined) {
      formData.append("separateNameColumns", String(params.separateNameColumns));
    }
    if (params.firstNameColumnIndex !== undefined) {
      formData.append("firstNameColumnIndex", String(params.firstNameColumnIndex));
    }
    if (params.lastNameColumnIndex !== undefined) {
      formData.append("lastNameColumnIndex", String(params.lastNameColumnIndex));
    }

    return fetchServer<CsvBatchEnrollmentResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/enrollments/batch-csv/import",
      method: "POST",
      body: formData,
    });
  },

  async getCourseExams(courseId: string): Promise<ProfessorExamRow[]> {
    // PLACEHOLDER ONLY: remove this mock branch when course-exams backend is ready.
    if (MOCK_SERVER_TRUE) {
      return (
        PLACEHOLDERS.examsByCourseId[courseId] ?? PLACEHOLDERS.examsByCourseId.cs207
      );
    }

    return fetchServer<ProfessorExamRow[]>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/by-course/${courseId}`,
      method: "GET",
    });
  },

  async createCourseExam(
    courseId: string,
    payload: AddProfessorExamRequest
  ): Promise<ProfessorExamRow> {
    // PLACEHOLDER ONLY: remove this mock branch when create-exam backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        id: `${payload.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        title: payload.title,
        courseCode: courseId.toUpperCase(),
        studentCount: 0,
      };
    }

    const metadata = getUserMetadata();
    const created = await fetchServer<BackendExamResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/exams",
      method: "POST",
      body: {
        courseId,
        title: payload.title,
        description: payload.description,
        professorId: metadata?.id || "",
        examFileUrl: "",
        durationMinutes: payload.durationMinutes,
        startAvailableAt: payload.startAvailableAt,
        endAvailableAt: payload.endAvailableAt,
        recordingRequired: true,
      },
    });

    return {
      id: created.id,
      title: created.title,
      description: created.description,
      courseCode: created.courseId?.toUpperCase?.() || courseId.toUpperCase(),
      studentCount: 0,
    };
  },

  async updateCourseExam(
    courseId: string,
    examId: string,
    payload: AddProfessorExamRequest
  ): Promise<void> {
    // PLACEHOLDER ONLY: remove this mock branch when update-exam backend is ready.
    if (MOCK_SERVER_TRUE) {
      return;
    }

    const hasFile = Boolean(payload.examFile);

    if (hasFile) {
      const formData = new FormData();
      formData.append("title", payload.title);
      formData.append("description", payload.description);
      formData.append("durationMinutes", String(payload.durationMinutes));
      formData.append("startAvailableAt", payload.startAvailableAt);
      formData.append("endAvailableAt", payload.endAvailableAt);
      formData.append("examFileUrl", payload.examFile as File);
      console.log('form data entries:');
      formData.forEach((value, key) => {
        console.log(`  ${key}:`, value instanceof File ? value.name : value);
      });
      await fetchServer<void>({
        baseUrl: mainApiBaseUrl,
        path: `/exams/${examId}`,
        method: "PUT",
        body: formData,
      });
      return;
    }

    await fetchServer<void>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/${examId}`,
      method: "PUT",
      body: {
        title: payload.title,
        description: payload.description,
        durationMinutes: payload.durationMinutes,
        startAvailableAt: payload.startAvailableAt,
        endAvailableAt: payload.endAvailableAt,
      },
    });
  },

  async deleteExam(examId: string): Promise<void> {
    await fetchServer<void>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/${examId}`,
      method: "DELETE",
    });
  },

  async getExamDetails(
    courseId: string,
    examId: string
  ): Promise<ProfessorExamDetailsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when exam-details backend is ready.
    if (MOCK_SERVER_TRUE) {
      return buildPlaceholderExamDetails(courseId, examId);
    }

    return fetchServer<ProfessorExamDetailsResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/exams/${examId}`,
      method: "GET",
    });
  },

  async getRecordingDetail(
    courseId: string,
    examId: string,
    sessionId: string
  ): Promise<ProfessorRecordingDetailResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when recording-detail backend is ready.
    if (MOCK_SERVER_TRUE) {
      const fallback = PLACEHOLDERS.recordingDetails["s-1"];
      const row = PLACEHOLDERS.recordingDetails[sessionId] ?? fallback;
      return {
        ...row,
        courseCode: row.courseCode || courseId.toUpperCase(),
        examTitle: row.examTitle || examId,
      };
    }

    return fetchServer<ProfessorRecordingDetailResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/exams/${examId}/sessions/${sessionId}`,
      method: "GET",
    });
  },

  async getProfessorRecordings(): Promise<ProfessorRecordingsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when recordings-list backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { recordings: PLACEHOLDERS.recordings };
    }
    const exams = await fetchServer<BackendExamResponse[]>({
      baseUrl: mainApiBaseUrl,
      path: "/exams",
      method: "GET",
    });

    const sessionsByExam = await Promise.all(
      (exams ?? []).map(async (exam) => {
        try {
          const sessions = await fetchServer<ExamSession[]>({
            baseUrl: mainApiBaseUrl,
            path: `/exam-sessions/by-exam/${exam.id}`,
            method: "GET",
          });
          return { exam, sessions: sessions ?? [] };
        } catch {
          return { exam, sessions: [] as ExamSession[] };
        }
      })
    );

    const recordings: ProfessorRecordingListItem[] = sessionsByExam
      .flatMap(({ exam, sessions }) =>
        sessions
          .filter((s) => Boolean(s.screenRecordingPath))
          .map((s) => ({
            sessionId: s.id,
            courseId: exam.courseId,
            examId: exam.id,
            studentName: s.student?.name || s.studentId || "Unknown Student",
            examName: exam.title || exam.id,
            classCode: (exam.courseId || "").toUpperCase(),
            status: mapSessionStatusToRecordingStatus(s.status),
            duration: formatDurationFromSession(s.startTime, s.endTime),
            videoPath: `${mainApiBaseUrl}/recordings/stream/${s.id}`,
          }))
      )
      .sort((a, b) => b.sessionId.localeCompare(a.sessionId));

    return { recordings };
  },

  async getExamSessions(examId: string): Promise<ExamSession[]> {
    return fetchServer<ExamSession[]>({
      baseUrl: mainApiBaseUrl,
      path: `/exam-sessions/by-exam/${examId}`,
      method: "GET",
    });
  },

  async getExamSessionMetadata(sessionId: string): Promise<ExamSession> {
    return fetchServer<ExamSession>({
      baseUrl: mainApiBaseUrl,
      path: `/exam-sessions/${sessionId}`,
      method: "GET",
    });
  },

  getSessionRecordingUrl(sessionId: string): string {
    return `${mainApiBaseUrl}/recordings/stream/${sessionId}`;
  },

  async addRecordingComment(
    courseId: string,
    examId: string,
    sessionId: string,
    payload: AddProfessorRecordingCommentRequest
  ): Promise<ProfessorRecordingComment> {
    // PLACEHOLDER ONLY: remove this mock branch when comment backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        id: `c-${Date.now()}`,
        timestampSec: payload.timestampSec,
        text: payload.text,
        createdAt: new Date().toISOString(),
      };
    }

    return fetchServer<ProfessorRecordingComment>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/exams/${examId}/sessions/${sessionId}/comments`,
      method: "POST",
      body: payload,
    });
  },
};
