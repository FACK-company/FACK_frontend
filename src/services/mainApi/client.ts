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
  StudentCourseExamsResponse,
  StudentCoursesResponse,
  StudentCurrentExamResponse,
  StudentExamDetailResponse,
  StudentExamSummary,
  StudentProfileResponse,
} from "@/types/api/main";
import { fetchServer } from "./index";

const mainApiBaseUrl = process.env.NEXT_PUBLIC_MAIN_API_URL ?? "";

// PLACEHOLDER ONLY: set to `false` when backend is running in production.
const MOCK_SERVER_TRUE = true;
const PLACEHOLDERS = {
  professorCourses: [
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
  } as Record<string, ProfessorCourseExamsResponse>,
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
  } as Record<string, ProfessorCourseStudent[]>,
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

function buildPlaceholderExamDetails(courseId: string, examId: string): ProfessorExamDetailsResponse {
  const coursePayload =
    PLACEHOLDERS.examsByCourseId[courseId] ?? PLACEHOLDERS.examsByCourseId.cs207;
  const exam =
    coursePayload.exams.find((item) => item.id === examId) ?? coursePayload.exams[0];
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

    return response;
  },

  async getProfessorProfile(): Promise<ProfessorProfileResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when profile backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { username: "prof_username" };
    }

    return fetchServer<ProfessorProfileResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/prof/profile",
      method: "GET",
    });
  },

  async getStudentProfile(): Promise<StudentProfileResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student profile backend is ready.
    if (MOCK_SERVER_TRUE) {
      console.log(PLACEHOLDERS.student.name);
      return { username: PLACEHOLDERS.student.name };
    }

    return fetchServer<StudentProfileResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/student/profile",
      method: "GET",
    });
  },

  async getStudentCourses(): Promise<StudentCoursesResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student courses backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { courses: [...PLACEHOLDERS.student.courses] };
    }

    return fetchServer<StudentCoursesResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/student/courses",
      method: "GET",
    });
  },

  async getStudentCourseExams(courseId: string): Promise<StudentCourseExamsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when student course exams backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        courseId,
        exams: [...(PLACEHOLDERS.student.examsByCourse[courseId] ?? [])],
      };
    }

    return fetchServer<StudentCourseExamsResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/student/courses/${courseId}/exams`,
      method: "GET",
    });
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

    return fetchServer<StudentCurrentExamResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/student/exams/current",
      method: "GET",
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

    return fetchServer<StudentExamDetailResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/student/courses/${courseId}/exams/${examId}`,
      method: "GET",
    });
  },

  async getProfessorCourses(): Promise<ProfessorCoursesResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when courses backend is ready.
    if (MOCK_SERVER_TRUE) {
      return { courses: [...PLACEHOLDERS.professorCourses] };
    }

    return fetchServer<ProfessorCoursesResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/prof/courses",
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

    return fetchServer<ProfessorCourse>({
      baseUrl: mainApiBaseUrl,
      path: "/prof/courses",
      method: "POST",
      body: payload,
    });
  },

  async getCourseStudents(courseId: string): Promise<ProfessorCourseStudentsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when course-students backend is ready.
    if (MOCK_SERVER_TRUE) {
      return {
        students: [...(PLACEHOLDERS.studentsByCourseId[courseId] ?? [])],
      };
    }

    return fetchServer<ProfessorCourseStudentsResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/students`,
      method: "GET",
    });
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

    return fetchServer<ProfessorCourseStudent>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/students`,
      method: "POST",
      body: payload,
    });
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

    return fetchServer<ProfessorCourseStudentsResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/students/import`,
      method: "POST",
      body: { students: payload },
    });
  },

  async getCourseExams(courseId: string): Promise<ProfessorCourseExamsResponse> {
    // PLACEHOLDER ONLY: remove this mock branch when course-exams backend is ready.
    if (MOCK_SERVER_TRUE) {
      return (
        PLACEHOLDERS.examsByCourseId[courseId] ?? PLACEHOLDERS.examsByCourseId.cs207
      );
    }

    return fetchServer<ProfessorCourseExamsResponse>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/exams`,
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

    return fetchServer<ProfessorExamRow>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/exams`,
      method: "POST",
      body: formData,
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
      path: `/prof/courses/${courseId}/exams/${examId}`,
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

    return fetchServer<ProfessorRecordingsResponse>({
      baseUrl: mainApiBaseUrl,
      path: "/prof/recordings",
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

    return fetchServer<ProfessorRecordingComment>({
      baseUrl: mainApiBaseUrl,
      path: `/prof/courses/${courseId}/exams/${examId}/sessions/${sessionId}/comments`,
      method: "POST",
      body: payload,
    });
  },
};
