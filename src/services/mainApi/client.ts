// Main API client for Spring Boot backend

import type {
  AddProfessorExamRequest,
  AddProfessorRecordingCommentRequest,
  AddProfessorCourseRequest,
  AddProfessorCourseStudentRequest,
  ProfessorCourse,
  ProfessorCourseStudent,
  ProfessorCourseStudentsResponse,
  ProfessorCoursesResponse,
  ProfessorExamDetailsResponse,
  ProfessorExamSessionRow,
  ProfessorRecordingComment,
  ProfessorRecordingDetailResponse,
  ProfessorRecordingListItem,
  ProfessorRecordingsResponse,
  ProfessorCourseExamsResponse,
  ProfessorExamRow,
  LoginRequest,
  LoginResponse,
  ProfessorProfileResponse,
} from "@/types/api/main";
import { httpRequest } from "@/utils/http";

const mainApiBaseUrl = process.env.NEXT_PUBLIC_MAIN_API_URL ?? "";

// PLACEHOLDER ONLY: set to `false` when backend is running in production.
const MOCK_SERVER_TRUE = true;
// PLACEHOLDER START: professor courses used when backend is unavailable.
const PLACEHOLDER_PROFESSOR_COURSES: ProfessorCourse[] = [
  {
    id: "cs207",
    title: "CS207 — Data Structures",
    term: "Spring 2026",
    studentCount: 42,
  },
  {
    id: "cs201",
    title: "CS201 — Intro Programming",
    term: "Spring 2026",
    studentCount: 68,
  },
  {
    id: "cs105",
    title: "CS105 — Discrete Math",
    term: "Spring 2026",
    studentCount: 55,
  },
];
// PLACEHOLDER END

// PLACEHOLDER START: recordings list used on professor recordings page.
const PLACEHOLDER_RECORDINGS: ProfessorRecordingListItem[] = [
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
];
// PLACEHOLDER END

// PLACEHOLDER START: exams by course id.
const PLACEHOLDER_EXAMS_BY_COURSE_ID: Record<string, ProfessorCourseExamsResponse> = {
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
      { id: "final-project-check", examName: "Final Project Check", courseCode: "CS201", studentCount: 68 },
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
};

// PLACEHOLDER START: students by course id.
const PLACEHOLDER_STUDENTS_BY_COURSE_ID: Record<string, ProfessorCourseStudent[]> = {
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
};
// PLACEHOLDER END

// PLACEHOLDER START: exam session rows keyed by `courseId:examId`.
const PLACEHOLDER_EXAM_SESSIONS: Record<string, ProfessorExamSessionRow[]> = {
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
};
// PLACEHOLDER END

// PLACEHOLDER START: recording details keyed by `sessionId`.
const PLACEHOLDER_RECORDING_DETAILS: Record<string, ProfessorRecordingDetailResponse> = {
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
};
// PLACEHOLDER END

function buildPlaceholderExamDetails(courseId: string, examId: string): ProfessorExamDetailsResponse {
  const coursePayload =
    PLACEHOLDER_EXAMS_BY_COURSE_ID[courseId] ?? PLACEHOLDER_EXAMS_BY_COURSE_ID.cs207;
  const exam =
    coursePayload.exams.find((item) => item.id === examId) ?? coursePayload.exams[0];
  const sessions =
    PLACEHOLDER_EXAM_SESSIONS[`${courseId}:${exam.id}`] ??
    PLACEHOLDER_EXAM_SESSIONS["cs207:final-exam"] ??
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
      return { success: true };
    }

    return httpRequest<LoginResponse>(mainApiBaseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getProfessorProfile(): Promise<ProfessorProfileResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when profile backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { username: "prof_username" };
    }

    return httpRequest<ProfessorProfileResponse>(mainApiBaseUrl, "/prof/profile", {
      method: "GET",
    });
  },

  async getProfessorCourses(): Promise<ProfessorCoursesResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when courses backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { courses: [...PLACEHOLDER_PROFESSOR_COURSES] };
    }

    return httpRequest<ProfessorCoursesResponse>(mainApiBaseUrl, "/prof/courses", {
      method: "GET",
    });
  },

  async createProfessorCourse(payload: AddProfessorCourseRequest): Promise<ProfessorCourse> {
    // PLACEHOLDER ONLY: remove this mock branch when create-course backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        id: `${payload.courseCode.toLowerCase()}-${Date.now()}`,
        title: `${payload.courseCode.toUpperCase()} — ${payload.courseName}`,
        term: payload.term,
        studentCount: payload.studentCount,
      };
    }

    return httpRequest<ProfessorCourse>(mainApiBaseUrl, "/prof/courses", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  async getCourseStudents(courseId: string): Promise<ProfessorCourseStudentsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when course-students backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        students: [...(PLACEHOLDER_STUDENTS_BY_COURSE_ID[courseId] ?? [])],
      };
    }

    return httpRequest<ProfessorCourseStudentsResponse>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/students`,
      { method: "GET" }
    );
  },

  async addCourseStudent(
    courseId: string,
    payload: AddProfessorCourseStudentRequest
  ): Promise<ProfessorCourseStudent> {
    // PLACEHOLDER ONLY: remove this mock branch when add-student backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        id: `st-${Date.now()}`,
        firstName: payload.firstName,
        lastName: payload.lastName,
        email: payload.email,
      };
    }

    return httpRequest<ProfessorCourseStudent>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/students`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },

  async importCourseStudents(
    courseId: string,
    payload: AddProfessorCourseStudentRequest[]
  ): Promise<ProfessorCourseStudentsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when import-students backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        students: payload.map((item, idx) => ({
          id: `st-import-${Date.now()}-${idx}`,
          firstName: item.firstName,
          lastName: item.lastName,
          email: item.email,
        })),
      };
    }

    return httpRequest<ProfessorCourseStudentsResponse>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/students/import`,
      {
        method: "POST",
        body: JSON.stringify({ students: payload }),
      }
    );
  },

  async getCourseExams(courseId: string): Promise<ProfessorCourseExamsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when course-exams backend is ready.
    if (MOCK_SERVER_TRUE) {
      return (
        PLACEHOLDER_EXAMS_BY_COURSE_ID[courseId] ?? PLACEHOLDER_EXAMS_BY_COURSE_ID.cs207
      );
    }

    return httpRequest<ProfessorCourseExamsResponse>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/exams`,
      {
        method: "GET",
      }
    );
  },

  async createCourseExam(
    courseId: string,
    payload: AddProfessorExamRequest
  ): Promise<ProfessorExamRow> {
    // PLACEHOLDER ONLY: remove this mock branch when create-exam backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        id: `${payload.title.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}`,
        examName: payload.title,
        courseCode: courseId.toUpperCase(),
        studentCount: 0,
      };
    }

    const formData = new FormData();
    formData.append("title", payload.title);
    formData.append("description", payload.description);
    formData.append("duration_minutes", String(payload.durationMinutes));
    formData.append("start_available_at", payload.startAvailableAt);
    formData.append("end_available_at", payload.endAvailableAt);
    if (payload.examFile) {
      formData.append("exam_file", payload.examFile);
    }

    const response = await fetch(`${mainApiBaseUrl}/prof/courses/${courseId}/exams`, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    return (await response.json()) as ProfessorExamRow;
  },

  async getExamDetails(
    courseId: string,
    examId: string
  ): Promise<ProfessorExamDetailsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when exam-details backend is ready.
    if (MOCK_SERVER_TRUE) {
      return buildPlaceholderExamDetails(courseId, examId);
    }

    return httpRequest<ProfessorExamDetailsResponse>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/exams/${examId}`,
      {
        method: "GET",
      }
    );
  },

  async getRecordingDetail(
    courseId: string,
    examId: string,
    sessionId: string
  ): Promise<ProfessorRecordingDetailResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when recording-detail backend is ready.
    if (MOCK_SERVER_TRUE) {
      const fallback = PLACEHOLDER_RECORDING_DETAILS["s-1"];
      const row = PLACEHOLDER_RECORDING_DETAILS[sessionId] ?? fallback;
      return {
        ...row,
        courseCode: row.courseCode || courseId.toUpperCase(),
        examTitle: row.examTitle || examId,
      };
    }

    return httpRequest<ProfessorRecordingDetailResponse>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/exams/${examId}/sessions/${sessionId}`,
      {
        method: "GET",
      }
    );
  },

  async getProfessorRecordings(): Promise<ProfessorRecordingsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when recordings-list backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { recordings: PLACEHOLDER_RECORDINGS };
    }

    return httpRequest<ProfessorRecordingsResponse>(mainApiBaseUrl, "/prof/recordings", {
      method: "GET",
    });
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

    return httpRequest<ProfessorRecordingComment>(
      mainApiBaseUrl,
      `/prof/courses/${courseId}/exams/${examId}/sessions/${sessionId}/comments`,
      {
        method: "POST",
        body: JSON.stringify(payload),
      }
    );
  },
};
