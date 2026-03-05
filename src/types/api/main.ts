// Type definitions for Main API (Spring Boot)

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success?: boolean;
  accessToken?: string;
  refreshToken?: string;
  tokenType?: string;
  expiresIn?: number;
  userId?: string;
  email?: string;
  name?: string;
  role?: string;
  user?: LoginUser;
}

export interface LoginUser {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
  [key: string]: unknown;
}

export interface ProfessorProfileResponse {
  username: string;
}

export interface ProfessorCourse {
  id: string;
  code: string;
  name: string;
  semester: string;
  studentCount?: number;
}

export interface AddProfessorCourseRequest {
  code: string;
  name: string;
  professorId: string;
  semester: string;
}

export interface ProfessorExamRow {
  id: string;
  title: string;
  description?: string;
  courseCode: string;
  studentCount: number;
}

// export interface ProfessorCourseExamsResponse {
//   courseTitle: string;
//   exams: ProfessorExamRow[];
// }

export interface AddProfessorExamRequest {
  title: string;
  description: string;
  examFile: File | null;
  durationMinutes: number;
  startAvailableAt: string;
  endAvailableAt: string;
}

export interface Student {
  id: string;
  name?: string;
  email: string;
  role?: string;
  firstName?: string;
  lastName?: string;
}


export interface AddProfessorCourseStudentRequest {
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProfessorExamSessionRow {
  id: string;
  studentName: string;
  recordingStatus: "Completed" | "Interrupted" | "Missing";
  startTime: string;
  endTime: string;
  duration: string;
  interruptions: string;
}

export interface ProfessorExamDetailsResponse {
  examTitle: string;
  courseCode: string;
  totalStudents: number;
  completedRecordings: number;
  interruptedRecordings: number;
  missingRecordings: number;
  sessions: ProfessorExamSessionRow[];
}

export interface ProfessorRecordingComment {
  id: string;
  timestampSec: number;
  text: string;
  createdAt: string;
}

export interface ProfessorRecordingDetailResponse {
  sessionId: string;
  examTitle: string;
  courseCode: string;
  studentName: string;
  studentEmail: string;
  status: string;
  duration: string;
  startTime: string;
  endTime: string;
  videoPath: string;
  comments: ProfessorRecordingComment[];
}

export interface AddProfessorRecordingCommentRequest {
  timestampSec: number;
  text: string;
}

export interface ProfessorRecordingListItem {
  sessionId: string;
  courseId: string;
  examId: string;
  studentName: string;
  examName: string;
  classCode: string;
  status: "Completed" | "Interrupted" | "Missing";
  duration: string;
  videoPath: string;
}

export interface ProfessorRecordingsResponse {
  recordings: ProfessorRecordingListItem[];
}

export interface ExamSessionStudent {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

export interface ExamSession {
  id: string;
  examId: string;
  studentId: string;
  startTime: string;
  endTime: string | null;
  status: string;
  screenRecordingPath: string | null;
  ipAddress: string | null;
  deviceInfo: string | null;
  browserInfo: string | null;
  createdAt: string;
  student: ExamSessionStudent;
}

export interface StudentProfileResponse {
  username: string;
}

export interface StudentCourse {
  id: string;
  code: string;
  name: string;
  description?: string;
  semester: string;
}

export interface StudentCoursesResponse {
  courses: StudentCourse[];
}

export interface StudentExamSummary {
  id: string;
  courseId: string;
  courseCode: string;
  title: string;
  status: "Not started" | "In progress" | "Ended" | "Submitted";
  timeWindow: string;
  durationMinutes: number;
  startAvailableAt?: string;
  endAvailableAt?: string;
}

export interface StudentCourseExamsResponse {
  courseId: string;
  exams: StudentExamSummary[];
}

export interface StudentCurrentExamResponse {
  exam: StudentExamSummary | null;
}

export interface StudentExamDetailResponse extends StudentExamSummary {
  description: string;
  examFileUrl: string;
}
