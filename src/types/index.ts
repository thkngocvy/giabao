export type UserRole = 'ADMIN' | 'TEACHER' | 'STUDENT' | 'PARENT';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  role: UserRole;
  avatarUrl: string;
  phone?: string;
  schoolId: string;
  schoolName: string;
  title?: string;
  createdAt: string;
}

export interface School {
  id: string;
  name: string;
  code: string;
  address: string;
  phone: string;
  email: string;
  logoUrl?: string;
  activeAcademicYearId: string;
}

export interface AcademicYear {
  id: string;
  name: string; // e.g. "2024-2025"
  startDate: string;
  endDate: string;
  isCurrent: boolean;
}

export interface GradeLevel {
  id: string;
  level: number; // 1 đến 12 (Tiểu học, THCS, THPT)
  name: string; // "Khối 1" ... "Khối 12"
}

export const GRADE_LEVELS = [
  { level: 1, name: 'Khối 1', category: 'Tiểu học', label: 'Khối 1 (Tiểu học)' },
  { level: 2, name: 'Khối 2', category: 'Tiểu học', label: 'Khối 2 (Tiểu học)' },
  { level: 3, name: 'Khối 3', category: 'Tiểu học', label: 'Khối 3 (Tiểu học)' },
  { level: 4, name: 'Khối 4', category: 'Tiểu học', label: 'Khối 4 (Tiểu học)' },
  { level: 5, name: 'Khối 5', category: 'Tiểu học', label: 'Khối 5 (Tiểu học)' },
  { level: 6, name: 'Khối 6', category: 'THCS', label: 'Khối 6 (Cấp THCS)' },
  { level: 7, name: 'Khối 7', category: 'THCS', label: 'Khối 7 (Cấp THCS)' },
  { level: 8, name: 'Khối 8', category: 'THCS', label: 'Khối 8 (Cấp THCS)' },
  { level: 9, name: 'Khối 9', category: 'THCS', label: 'Khối 9 (Cấp THCS)' },
  { level: 10, name: 'Khối 10', category: 'THPT', label: 'Khối 10 (Cấp THPT)' },
  { level: 11, name: 'Khối 11', category: 'THPT', label: 'Khối 11 (Cấp THPT)' },
  { level: 12, name: 'Khối 12', category: 'THPT', label: 'Khối 12 (Cấp THPT)' },
] as const;

export interface Subject {
  id: string;
  code: string;
  name: string;
  gradeLevelId: string;
  icon?: string;
}

export interface Classroom {
  id: string;
  name: string; // "10A1"
  code: string;
  gradeLevel: number;
  academicYearId: string;
  roomNumber: string;
  homeroomTeacherId: string;
  homeroomTeacherName: string;
  subjectTeachers?: { subjectId: string; subjectName: string; teacherId: string; teacherName: string }[];
  studentCount: number;
  color: string;
  joinCode: string;
  isArchived: boolean;
  createdAt: string;
}

export interface Student {
  id: string;
  studentCode: string; // "HS2024-001"
  fullName: string;
  dob: string;
  gender: 'Nam' | 'Nữ';
  classId: string;
  className: string;
  rollNumber: number; // STT
  team: string; // "Tổ 1"
  avatarUrl: string;
  address: string;
  phone?: string;
  parentId?: string;
  parentName?: string;
  parentPhone?: string;
  parentEmail?: string;
  parentRelationship?: 'Bố' | 'Mẹ' | 'Người giám hộ' | string;
  parentJob?: string;
  parentNotes?: string;
  parentAppStatus?: 'active' | 'pending' | 'not_registered';
  status: 'active' | 'leave' | 'suspended';
  // Aggregate stats
  gpa: number;
  conduct: 'Tốt' | 'Khá' | 'Trung bình';
  attendanceRate: number; // percentage
  behaviorPoints: number; // thi đua / nề nếp
}

export interface Parent {
  id: string;
  fullName: string;
  phone: string;
  email: string;
  relationship: 'Bố' | 'Mẹ' | 'Người giám hộ';
  job?: string;
  address: string;
  avatarUrl: string;
  childrenIds: string[];
  appStatus?: 'active' | 'pending' | 'not_registered';
  notes?: string;
}

export type AttendanceStatus = 'present' | 'absent_excused' | 'absent_unexcused' | 'late' | 'early_leave';

export interface AttendanceRecord {
  id: string;
  studentId: string;
  studentName: string;
  rollNumber: number;
  status: AttendanceStatus;
  note?: string;
}

export interface AttendanceSession {
  id: string;
  classId: string;
  className: string;
  date: string; // YYYY-MM-DD
  period: number; // Tiết 1, 2, ... or Buổi sáng / Chiều
  sessionType: 'morning' | 'afternoon' | 'full_day' | 'period';
  takenByTeacherId: string;
  takenByTeacherName: string;
  records: AttendanceRecord[];
  summary: {
    total: number;
    present: number;
    absentExcused: number;
    absentUnexcused: number;
    late: number;
    earlyLeave: number;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ScheduleItem {
  id: string;
  classId: string;
  dayOfWeek: 2 | 3 | 4 | 5 | 6 | 7; // Thứ 2 -> Thứ 7
  period: number; // 1-5 (sáng), 6-9 (chiều)
  subjectId: string;
  subjectName: string;
  teacherId: string;
  teacherName: string;
  room: string;
  startTime: string; // "07:30"
  endTime: string; // "08:15"
}

export type AssignmentStatus = 'published' | 'draft' | 'closed';
export type AssignmentReceiveStatus = 'draft' | 'scheduled' | 'open' | 'closed' | 'withdrawn';
export type AssignmentGradeStatus = 'ungraded' | 'draft_grade' | 'graded' | 'published';

export type TopicStatus = 'draft' | 'ready' | 'archived';

export interface AssignmentTopic {
  id: string;
  name: string; // Tên chủ đề (tương thích ngược)
  title?: string; // Tên chủ đề chính thức (tối đa 200 ký tự)
  classId?: string;
  className?: string;
  subjectId?: string;
  subjectName: string;
  gradeLevel?: number;
  academicYearId?: string;
  lessonDate?: string; // Buổi học / ngày học (VD: 2025-02-24 hoặc Buổi 12)
  period?: number; // Tiết học (1-5 sáng, 6-9 chiều)
  sessionType?: 'current' | 'previous'; // "Buổi hiện tại" | "Các buổi trước"
  description?: string;
  content?: string; // Nội dung chủ đề tối đa 8.000 ký tự
  status?: TopicStatus; // 'draft' | 'ready' | 'archived'
  questionIds?: string[]; // Danh sách IDs câu hỏi thuộc chủ đề
  color?: string;
  createdBy?: string;
  createdByName?: string;
  createdAt: string;
  updatedAt?: string;
}

export type AssignmentType = 'homework' | 'exam';
export type AssignmentFormat = 'mixed' | 'mcq_only' | 'essay_only'; // (1) Trắc nghiệm + tự luận, (2) Trắc nghiệm, (3) Tự luận

export interface AssignmentSelectedQuestion {
  questionId: string;
  orderIndex: number;
  points: number;
  type: QuestionType;
  snapshot?: Question;
}

export interface AssignmentRecipientOverride {
  dueOverrideAt: string;
  reason: string;
  updatedAt: string;
  updatedBy: string;
}

export interface AssignmentAuditEvent {
  id: string;
  assignmentId: string;
  actorId: string;
  actorName: string;
  eventType:
    | 'CREATED'
    | 'EXTEND_DEADLINE'
    | 'REMIND_SENT'
    | 'CLOSED'
    | 'REOPENED'
    | 'WITHDRAWN'
    | 'DUPLICATED'
    | 'REASSIGNED'
    | 'METADATA_UPDATED'
    | 'GRADED'
    | 'GRADE_REVISED'
    | 'GRADES_PUBLISHED'
    | 'RESUBMIT_REQUESTED';
  summary: string;
  payload?: Record<string, any>;
  createdAt: string;
}

export interface SubmissionGradeRevision {
  id: string;
  oldScore?: number;
  newScore: number;
  reason: string;
  changedBy: string;
  changedAt: string;
}

export interface ReminderDeliveryRecord {
  id: string;
  sentAt: string;
  channel: 'app_and_parent' | 'student_only' | 'parent_only';
  message: string;
  sentBy: string;
}

export interface Assignment {
  id: string;
  code?: string; // Mã lượt giao e.g. BT-2026-001
  classId: string;
  className: string;
  subjectId: string;
  subjectName: string;
  title: string;
  topic?: string; // Chủ đề / chuyên đề BTVN (không bắt buộc)
  topicIds?: string[]; // Danh sách IDs chủ đề bài học gắn với bài tập (Màn hình 111)
  type?: AssignmentType; // 'homework' (BTVN) | 'exam' (Bài kiểm tra)
  assignmentFormat?: AssignmentFormat;
  questionSelectionMode?: 'auto' | 'manual';
  selectedQuestions?: AssignmentSelectedQuestion[];
  timeLimitMinutes?: number; // Thời gian làm bài (phút, ví dụ 15, 45, 90)
  maxAttempts?: number; // Số lần làm bài
  shuffleQuestions?: boolean;
  shuffleOptions?: boolean;
  showAnswersPolicy?: 'after_submit' | 'after_deadline' | 'manual';
  gradingPolicy?: 'latest' | 'highest'; // Quy tắc tính điểm khi nộp nhiều lần
  instructions?: string; // Hướng dẫn nâng cao
  description: string;
  content?: string; // Nội dung bài tập nhập bằng copy + paste
  fileName?: string; // Tên file đính kèm (pdf, docx...)
  fileUrl?: string; // Đường dẫn tải hoặc data file
  fileSize?: string;
  opensAt?: string; // Thời điểm mở bài (scheduled)
  dueDate: string; // ISO string hạn chót nộp bài
  allowLateDays?: number; // Cho phép nộp trễ mấy ngày tùy ý (0, 1, 2, 3...)
  points: number; // Thang điểm e.g. 10
  status: AssignmentStatus;
  receiveStatus?: AssignmentReceiveStatus; // Trạng thái nhận bài tách biệt (draft|scheduled|open|closed|withdrawn)
  withdrawnAt?: string;
  withdrawReason?: string;
  version?: number; // Optimistic locking version
  recipientOverrides?: Record<string, AssignmentRecipientOverride>; // Gia hạn riêng theo học sinh
  events?: AssignmentAuditEvent[]; // Nhật ký thay đổi bất biến
  createdByTeacherId: string;
  createdByTeacherName?: string;
  attachments?: { name: string; url: string; size: string }[];
  target: 'all' | 'group' | 'individual';
  targetStudentIds?: string[];
  submissionCount: number;
  totalStudents: number;
  gradedCount: number;
  completedStudentIds?: string[]; // Danh sách ID học sinh cô giáo đã tick xác nhận "Đã làm"
  createdAt: string;
  updatedAt?: string;
}

export interface AssignmentSubmission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName: string;
  studentCode?: string;
  attemptNo?: number;
  submittedAt: string;
  topic?: string; // Chủ đề bài nộp học sinh gửi lại cho cô giáo
  content?: string; // Lời giải nhập bằng copy + paste
  fileUrl?: string; // File đính kèm học sinh nộp
  fileName?: string;
  fileSize?: string;
  score?: number;
  questionScores?: Record<string, number>; // Điểm từng câu theo questionId
  feedback?: string;
  gradeStatus?: AssignmentGradeStatus; // ungraded | draft_grade | graded | published
  gradedBy?: string;
  gradedAt?: string;
  publishedAt?: string;
  version?: number;
  revisions?: SubmissionGradeRevision[];
  resubmitDueAt?: string;
  resubmitNote?: string;
  reminderHistory?: ReminderDeliveryRecord[];
  isTeacherVerified?: boolean; // Giáo viên tick xác nhận đã làm
  verifiedAt?: string;
  status: 'submitted' | 'late' | 'graded' | 'resubmit_required';
}

export type StudentTabKey = 'all' | 'submitted' | 'unsubmitted' | 'ungraded' | 'graded' | 'late';

export interface AssignmentComputedStats {
  totalRecipients: number;
  submittedCount: number;
  unsubmittedCount: number;
  ungradedCount: number;
  draftGradeCount: number;
  gradedCount: number;
  publishedCount: number;
  lateCount: number;
  overdueMissingCount: number;
  resubmitCount: number;
  verifiedCount: number;
  hasCountMismatch: boolean;
  cachedSubmissionCount: number;
  cachedGradedCount: number;
  isDraftWithSubmissions: boolean;
}

export type NotificationType =
  | 'assignment_new'           // Giáo viên vừa giao BTVN cho lớp -> học sinh & phụ huynh nhận
  | 'assignment_overdue_alert' // Quá hạn làm bài -> tự động nhắc nhở học sinh & thông báo phụ huynh
  | 'assignment_reminder'      // Nhắc nhở làm bài tập
  | 'submission_new'           // Học sinh nộp bài -> giáo viên nhận, có nút tick đã làm
  | 'submission_verified'      // Giáo viên tick xác nhận bài tập của học sinh
  | 'parent_homework_reminder' // Giáo viên hoặc hệ thống gửi nhắc nhở phụ huynh đôn đốc con
  | 'system';

export interface AppNotification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  targetRole: UserRole | 'ALL';
  targetUserId?: string;
  targetStudentId?: string;
  targetClassId?: string;
  assignmentId?: string;
  submissionId?: string;
  isRead: boolean;
  isCompletedTick?: boolean; // Giáo viên tick "Đã làm" trực tiếp từ thông báo
  allowLateDays?: number;
  createdAt: string;
  meta?: {
    assignmentTitle?: string;
    studentName?: string;
    studentId?: string;
    className?: string;
    subjectName?: string;
    topic?: string;
    dueDate?: string;
    allowLateDays?: number;
    score?: number;
    fileUrl?: string;
    fileName?: string;
    fileSize?: string;
    content?: string;
  };
}

export type QuestionType =
  | 'single' // Trắc nghiệm 1 đáp án
  | 'multiple' // Trắc nghiệm nhiều đáp án
  | 'true_false' // Đúng/sai từng ý (chuẩn GDPT 2018)
  | 'matching' // Ghép đôi
  | 'ordering' // Sắp xếp thứ tự
  | 'fill_blank' // Điền khuyết
  | 'short_answer' // Trả lời ngắn
  | 'essay' // Tự luận
  | 'passage_based'; // Đọc hiểu / Tình huống

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'very_hard';
export type QuestionStatus = 'approved' | 'pending' | 'draft' | 'flagged';

export interface Question {
  id: string;
  subject: string;
  grade: number;
  chapter?: string;
  lesson?: string;
  topic: string;
  type: QuestionType;
  content: string;
  passage?: string; // Đoạn văn / ngữ cảnh tình huống
  options?: { id: string; text: string }[];
  correctAnswer: string | string[];
  subQuestions?: { id: string; statement: string; isCorrect: boolean }[]; // Đúng/sai các ý a, b, c, d
  matchingPairs?: { left: string; right: string }[]; // Cặp ghép đôi
  orderingItems?: string[]; // Danh sách sắp xếp
  explanation: string;
  whyCorrect?: string; // Giải thích tại sao đáp án đúng
  rubric?: string; // Hướng dẫn / barem chấm tự luận
  difficulty: DifficultyLevel;
  tags: string[];
  points?: number;
  status?: QuestionStatus; // 'approved' | 'pending' | 'draft' | 'flagged'
  qualityScore?: number; // 0 - 100
  qualityWarning?: string; // Cảnh báo chất lượng nếu có
  createdAt?: string;
  updatedAt?: string;
}

export interface Quiz {
  id: string;
  title: string;
  classId: string;
  className: string;
  subjectName: string;
  durationMinutes: number;
  totalQuestions: number;
  questions: Question[];
  openDate: string;
  closeDate: string;
  shuffleQuestions: boolean;
  status: 'active' | 'upcoming' | 'closed';
  attemptsCount: number;
}

export interface QuizAttempt {
  id: string;
  quizId: string;
  studentId: string;
  studentName: string;
  score: number;
  maxScore: number;
  submittedAt: string;
  timeSpentSeconds: number;
  answers: { questionId: string; answer: any; isCorrect: boolean }[];
}

export interface LearningResource {
  id: string;
  title: string;
  type: 'pdf' | 'docx' | 'pptx' | 'video' | 'link' | 'image';
  gradeLevel: number;
  subjectName: string;
  unit: string;
  fileUrl: string;
  fileSize: string;
  uploadedBy: string;
  downloadCount: number;
  isPinned: boolean;
  createdAt: string;
}

export interface StudentGradeRecord {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  classId: string;
  subjectId: string;
  semester: 1 | 2;
  // Specific score columns
  oral1?: number; // Miệng 1
  oral2?: number; // Miệng 2
  test15m1?: number; // 15 phút 1
  test15m2?: number; // 15 phút 2
  midterm?: number; // Giữa kỳ (hệ số 2)
  finalTerm?: number; // Cuối kỳ (hệ số 3)
  averageScore?: number; // Điểm trung bình môn
  note?: string;
}

export interface BehaviorRecord {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: 'positive' | 'negative';
  category: string; // e.g. "Phát biểu tích cực", "Đi muộn", "Không thuộc bài"
  pointsDelta: number; // e.g. +5 or -2
  note: string;
  recordedByTeacherName: string;
  date: string;
}

export interface SmartAlert {
  id: string;
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  type: 'attendance_risk' | 'low_grades' | 'missing_homework' | 'behavior_issue';
  level: 'warning' | 'critical' | 'info';
  title: string;
  description: string;
  status: 'new' | 'investigating' | 'resolved';
  createdAt: string;
  resolvedAt?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  targetScope: 'all' | 'class' | 'parents' | 'teachers';
  targetClassId?: string;
  priority: 'normal' | 'important' | 'urgent';
  createdAt: string;
  readCount: number;
  totalRecipients: number;
  attachments?: { name: string; url: string; size: string }[];
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  receiverName: string;
  studentId?: string;
  studentName?: string;
  content: string;
  timestamp: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string; // e.g. "UPDATE_GRADE", "MARK_ATTENDANCE", "DELETE_CLASS"
  targetEntity: string;
  details: string;
  ipAddress?: string;
  timestamp: string;
}

export interface TeacherStats {
  totalStudents: number;
  presentToday: number;
  absentToday: number;
  lateToday: number;
  pendingGradingCount: number;
  missingSubmissionsCount: number;
  activeAlertsCount: number;
  todayClassesCount: number;
}
