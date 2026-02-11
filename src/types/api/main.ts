// Type definitions for Main API (Spring Boot)

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  success: boolean;
}

export interface ProfessorProfileResponse {
  username: string;
}

export interface ProfessorCourse {
  id: string;
  title: string;
  term: string;
  studentCount: number;
}

export interface ProfessorCoursesResponse {
  courses: ProfessorCourse[];
}

export interface AddProfessorCourseRequest {
  courseCode: string;
  courseName: string;
  term: string;
  studentCount: number;
}

export interface ProfessorExamRow {
  id: string;
  examName: string;
  courseCode: string;
  studentCount: number;
}

export interface ProfessorCourseExamsResponse {
  courseTitle: string;
  exams: ProfessorExamRow[];
}

export interface AddProfessorExamRequest {
  title: string;
  description: string;
  examFile: File | null;
  durationMinutes: number;
  startAvailableAt: string;
  endAvailableAt: string;
}

export interface ProfessorCourseStudent {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
}

export interface ProfessorCourseStudentsResponse {
  students: ProfessorCourseStudent[];
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
