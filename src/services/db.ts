import {
  UserProfile,
  School,
  AcademicYear,
  Classroom,
  Student,
  Parent,
  AttendanceSession,
  ScheduleItem,
  Assignment,
  AssignmentTopic,
  AssignmentSubmission,
  AppNotification,
  NotificationType,
  Question,
  Quiz,
  QuizAttempt,
  LearningResource,
  StudentGradeRecord,
  BehaviorRecord,
  SmartAlert,
  Announcement,
  ChatMessage,
  AuditLog,
  TeacherStats,
  QuestionType,
  UserRole,
  AssignmentReceiveStatus,
  AssignmentGradeStatus,
  AssignmentAuditEvent,
  SubmissionGradeRevision,
  ReminderDeliveryRecord,
  AssignmentComputedStats
} from '../types';
import {
  SEED_USERS,
  SEED_SCHOOL,
  SEED_ACADEMIC_YEARS,
  SEED_CLASSES,
  SEED_STUDENTS,
  SEED_PARENTS,
  SEED_ATTENDANCE_SESSIONS,
  SEED_SCHEDULE,
  SEED_ASSIGNMENTS,
  SEED_SUBMISSIONS,
  SEED_QUESTIONS,
  SEED_QUIZZES,
  SEED_RESOURCES,
  SEED_GRADES,
  SEED_BEHAVIORS,
  SEED_ALERTS,
  SEED_ANNOUNCEMENTS,
  SEED_MESSAGES,
  SEED_AUDIT_LOGS
} from '../data/seedData';

const STORAGE_KEY = 'smartclass_db_v3_trungvuong';

const DEFAULT_NOTIFICATIONS: AppNotification[] = [
  {
    id: 'notif_01',
    type: 'assignment_new',
    title: 'BTVN Mới môn Toán học: Chuyên đề Vi-ét',
    message: 'Cô Lê Thu Hà đã giao bài tập mới cho lớp 9A1. Hạn nộp: 25/02/2025 (Cho phép nộp trễ 2 ngày). Các em tải file đề bài hoặc copy đề bài để làm và bấm "Nộp BTVN".',
    targetRole: 'STUDENT',
    targetClassId: 'class_10a1',
    targetStudentId: 'std_01',
    assignmentId: 'asg_01',
    isRead: false,
    createdAt: '2025-02-18T09:00:00Z',
    meta: {
      assignmentTitle: 'Chuyên đề: Phương trình bậc hai & Hệ thức Vi-ét ứng dụng',
      className: '9A1',
      subjectName: 'Toán học',
      topic: 'Hệ thức Vi-ét & Định lý Vi-ét',
      dueDate: '2025-02-25T23:59:00Z',
      allowLateDays: 2,
      fileName: 'Phieu_Bai_Tap_He_Thuc_Viet.pdf',
      fileSize: '1.2 MB',
      content: 'Bài 1: Cho phương trình x^2 - 5x + 6 = 0. Không giải phương trình, hãy tính x1 + x2 và x1.x2.\nBài 2: Tìm m để phương trình x^2 - 2(m-1)x + m^2 - 3 = 0 có hai nghiệm phân biệt x1, x2 thỏa mãn x1^2 + x2^2 = 10.'
    }
  },
  {
    id: 'notif_02',
    type: 'assignment_new',
    title: 'Thông báo BTVN mới cho con Phạm Minh Nhật',
    message: 'Cô Lê Thu Hà vừa giao BTVN môn Toán: "Chuyên đề: Phương trình bậc hai & Hệ thức Vi-ét ứng dụng" cho lớp 9A1. Hạn nộp: 25/02/2025 (cho phép trễ 2 ngày). Kính nhờ Phụ huynh nhắc nhở con làm bài và nộp bài đầy đủ!',
    targetRole: 'PARENT',
    targetClassId: 'class_10a1',
    targetStudentId: 'std_01',
    assignmentId: 'asg_01',
    isRead: false,
    createdAt: '2025-02-18T09:05:00Z',
    meta: {
      assignmentTitle: 'Chuyên đề: Phương trình bậc hai & Hệ thức Vi-ét ứng dụng',
      className: '9A1',
      subjectName: 'Toán học',
      studentName: 'Phạm Minh Nhật',
      dueDate: '2025-02-25T23:59:00Z',
      allowLateDays: 2
    }
  },
  {
    id: 'notif_03',
    type: 'submission_new',
    title: 'Bài nộp BTVN mới: Phạm Minh Nhật (Lớp 9A1)',
    message: 'Học sinh Phạm Minh Nhật đã nộp bài tập "Chuyên đề: Phương trình bậc hai & Hệ thức Vi-ét ứng dụng". Chủ đề: "Giải bài tập Vi-ét nâng cao". Đính kèm: PhamMinhNhat_BaitapToan.pdf',
    targetRole: 'TEACHER',
    targetUserId: 'user_teacher_1',
    targetClassId: 'class_10a1',
    targetStudentId: 'std_01',
    assignmentId: 'asg_01',
    submissionId: 'sub_01',
    isRead: false,
    isCompletedTick: true,
    createdAt: '2025-02-21T15:30:00Z',
    meta: {
      assignmentTitle: 'Chuyên đề: Phương trình bậc hai & Hệ thức Vi-ét ứng dụng',
      studentName: 'Phạm Minh Nhật',
      studentId: 'std_01',
      className: '9A1',
      topic: 'Giải bài tập Vi-ét nâng cao',
      fileName: 'PhamMinhNhat_BaitapToan.pdf',
      fileSize: '1.5 MB',
      content: 'Bài 1:\nx^2 - 5x + 6 = 0 có a = 1, b = -5, c = 6.\nTheo định lý Vi-ét: x1 + x2 = 5; x1.x2 = 6.\nBài 2:\nDelta\' = (m-1)^2 - (m^2 - 3) = -2m + 4 > 0 <=> m < 2.\nx1^2 + x2^2 = (x1+x2)^2 - 2x1.x2 = 4(m-1)^2 - 2(m^2 - 3) = 2m^2 - 8m + 10 = 10 => 2m(m - 4) = 0 => m = 0 (thỏa mãn m < 2).'
    }
  }
];

const DEFAULT_TOPICS: AssignmentTopic[] = [
  {
    id: 'top_01',
    title: 'Hệ thức Vi-ét & Phương trình bậc hai một ẩn',
    name: 'Hệ thức Vi-ét & Phương trình bậc hai một ẩn',
    classId: 'class_10a1',
    className: '9A1',
    subjectId: 'sub_math',
    subjectName: 'Toán học',
    gradeLevel: 9,
    academicYearId: 'ay_2024_2025',
    lessonDate: 'Buổi 12',
    period: 1,
    sessionType: 'current',
    description: 'Ứng dụng định lý Vi-ét tìm nghiệm, xét dấu, giải bài toán tìm tham số m và toán thực tế.',
    content: `I. MỤC TIÊU BÀI HỌC
1. Kiến thức:
- Nắm vững định lý Vi-ét thuận và định lý Vi-ét đảo đối với phương trình bậc hai ax² + bx + c = 0 (a ≠ 0).
- Vận dụng tính nhẩm nghiệm trong hai trường hợp đặc biệt: a + b + c = 0 (x₁ = 1, x₂ = c/a) và a - b + c = 0 (x₁ = -1, x₂ = -c/a).
- Tìm hai số khi biết tổng S và tích P: Hai số đó là nghiệm của phương trình X² - SX + P = 0 (điều kiện S² - 4P ≥ 0).

2. Kỹ năng trọng tâm:
- Biến đổi các biểu thức đối xứng giữa hai nghiệm như: x₁² + x₂² = (x₁ + x₂)² - 2x₁x₂; 1/x₁ + 1/x₂ = (x₁ + x₂)/(x₁x₂).
- Giải các bài toán thực tế hình học, năng suất đưa về hệ thức Vi-ét.
- Tìm điều kiện tham số m để phương trình có hai nghiệm thỏa mãn biểu thức cho trước.

II. HƯỚNG DẪN ÔN TẬP VÀ GIAO BÀI TẬP VỀ NHÀ
- Học sinh làm đầy đủ phần trắc nghiệm nhận biết (4 câu) và tự luận vận dụng (2 câu).
- Chú ý luôn tìm điều kiện để phương trình có hai nghiệm phân biệt (Δ hoặc Δ' > 0) trước khi áp dụng định lý Vi-ét.`,
    status: 'ready',
    questionIds: ['q_01', 'q_04', 'q_31', 'q_32', 'q_37', 'q_38', 'q_39'],
    color: '#06b6d4',
    createdBy: 'user_teacher_1',
    createdByName: 'Cô Lê Thu Hà',
    createdAt: '2025-02-20T08:00:00Z',
    updatedAt: '2025-02-24T09:30:00Z',
  },
  {
    id: 'top_02',
    title: 'Hệ hai phương trình bậc nhất hai ẩn & Giải bài toán thực tế',
    name: 'Hệ hai phương trình bậc nhất hai ẩn & Giải bài toán thực tế',
    classId: 'class_10a1',
    className: '9A1',
    subjectId: 'sub_math',
    subjectName: 'Toán học',
    gradeLevel: 9,
    academicYearId: 'ay_2024_2025',
    lessonDate: 'Buổi 11',
    period: 2,
    sessionType: 'previous',
    description: 'Phương pháp thế, cộng đại số và giải toán năng suất, chuyển động bằng cách lập hệ phương trình.',
    content: `I. KIẾN THỨC CẦN NHỚ
1. Khái niệm hệ hai phương trình bậc nhất hai ẩn dạng:
   { a1*x + b1*y = c1
   { a2*x + b2*y = c2

2. Các phương pháp giải cơ bản:
- Phương pháp thế: Biểu diễn một ẩn theo ẩn kia từ một phương trình rồi thế vào phương trình còn lại.
- Phương pháp cộng đại số: Nhân các hệ số để làm triệt tiêu một ẩn khi cộng hoặc trừ vế theo vế.
- Phương pháp đặt ẩn phụ: Dành cho các hệ phương trình phân thức hoặc chứa căn.

3. Các bước giải bài toán bằng cách lập hệ phương trình:
- Bước 1: Lập hệ phương trình (chọn 2 ẩn, đặt đơn vị và điều kiện; biểu diễn đại lượng chưa biết; lập 2 phương trình).
- Bước 2: Giải hệ phương trình.
- Bước 3: Đối chiếu điều kiện và trả lời.`,
    status: 'ready',
    questionIds: ['q_33', 'q_06'],
    color: '#3b82f6',
    createdBy: 'user_teacher_1',
    createdByName: 'Cô Lê Thu Hà',
    createdAt: '2025-02-12T08:00:00Z',
    updatedAt: '2025-02-17T10:15:00Z',
  },
  {
    id: 'top_03',
    title: 'Hình học: Góc với đường tròn & Tứ giác nội tiếp',
    name: 'Hình học: Góc với đường tròn & Tứ giác nội tiếp',
    classId: 'class_10a1',
    className: '9A1',
    subjectId: 'sub_math',
    subjectName: 'Toán học',
    gradeLevel: 9,
    academicYearId: 'ay_2024_2025',
    lessonDate: 'Buổi 10',
    period: 1,
    sessionType: 'current',
    description: 'Định lý góc nội tiếp, góc tạo bởi tiếp tuyến và dây cung, dấu hiệu nhận biết tứ giác nội tiếp.',
    content: `I. NỘI DUNG TRỌNG TÂM
1. Góc ở tâm và góc nội tiếp:
- Góc ở tâm có đỉnh trùng với tâm đường tròn. Số đo bằng số đo cung bị chắn.
- Góc nội tiếp có đỉnh nằm trên đường tròn và hai cạnh chứa hai dây cung. Số đo bằng nửa số đo cung bị chắn.
- Hệ quả: Các góc nội tiếp cùng chắn một cung hoặc chắn hai cung bằng nhau thì bằng nhau; Góc nội tiếp chắn nửa đường tròn là góc vuông (90°).

2. Tứ giác nội tiếp:
- Định nghĩa: Tứ giác có bốn đỉnh cùng nằm trên một đường tròn.
- Định lý: Trong một tứ giác nội tiếp, tổng số đo hai góc đối diện bằng 180°.
- Các dấu hiệu nhận biết thường dùng:
  + Dấu hiệu 1: Tứ giác có tổng hai góc đối diện bằng 180°.
  + Dấu hiệu 2: Tứ giác có góc ngoài tại một đỉnh bằng góc trong tại đỉnh đối của đỉnh đó.
  + Dấu hiệu 3: Tứ giác có hai đỉnh kề nhau cùng nhìn cạnh chứa hai đỉnh còn lại dưới một góc bằng nhau (cùng chắn một cung).
  + Dấu hiệu 4: Tứ giác có bốn đỉnh cách đều một điểm xác định.`,
    status: 'ready',
    questionIds: ['q_03', 'q_05', 'q_34', 'q_35', 'q_40'],
    color: '#10b981',
    createdBy: 'user_teacher_1',
    createdByName: 'Cô Lê Thu Hà',
    createdAt: '2025-02-15T08:00:00Z',
    updatedAt: '2025-02-21T09:00:00Z',
  },
  {
    id: 'top_04',
    title: 'Unit 6: Viet Nam: Then and Now - Grammar & Writing',
    name: 'Unit 6: Viet Nam: Then and Now - Grammar & Writing',
    classId: 'class_10a1',
    className: '9A1',
    subjectId: 'sub_eng',
    subjectName: 'Tiếng Anh',
    gradeLevel: 9,
    academicYearId: 'ay_2024_2025',
    lessonDate: 'Buổi 9',
    period: 4,
    sessionType: 'current',
    description: 'Structures with "used to + V", past habits, comparative structures, and transport changes writing.',
    content: `GRAMMAR & SKILLS FOCUS:
1. "used to" + bare infinitive:
- Express past habits or states that are no longer true today.
- Affirmative: S + used to + V
- Negative: S + didn't use to + V
- Question: Did + S + use to + V?

2. Contrast past vs present:
- Past simple and Past continuous for ongoing historical changes.
- Connectors: however, although, on the contrary, nowadays, back then.

3. Writing assignment:
- Write an 80-100 word essay detailing urban transportation in Hanoi ten years ago vs present day.`,
    status: 'ready',
    questionIds: ['q_20', 'q_36'],
    color: '#f59e0b',
    createdBy: 'tch_eng',
    createdByName: 'Cô Hồng Hạnh',
    createdAt: '2025-02-18T08:00:00Z',
    updatedAt: '2025-02-20T11:00:00Z',
  },
  {
    id: 'top_05',
    title: 'Chủ đề Ngữ văn: Ánh trăng & Tiếng Việt nghệ thuật',
    name: 'Chủ đề Ngữ văn: Ánh trăng & Tiếng Việt nghệ thuật',
    classId: 'class_10a1',
    className: '9A1',
    subjectId: 'sub_lit',
    subjectName: 'Ngữ văn',
    gradeLevel: 9,
    academicYearId: 'ay_2024_2025',
    lessonDate: 'Buổi 8',
    period: 1,
    sessionType: 'previous',
    description: 'Phân tích hình tượng vầng trăng, đạo lý uống nước nhớ nguồn và các biện pháp tu từ nghệ thuật.',
    content: `I. NỘI DUNG BÀI HỌC
1. Tác phẩm "Ánh trăng" (Nguyễn Duy):
- Hình tượng vầng trăng qua các thời điểm: Thuở nhỏ nơi đồng quê nghèo -> Thời chiến tranh trong rừng sâu -> Hòa bình về thành phố với ánh điện cửa gương.
- Tình huống bất ngờ: Mất điện, mở tung cửa sổ bắt gặp vầng trăng tròn vành vạnh.
- Ý nghĩa biểu tượng: Vầng trăng im phăng phắc, là lời nhắc nhở nghiêm khắc mà bao dung về lẽ sống ân nghĩa, thủy chung cùng quá khứ.

2. Tiếng Việt:
- Biện pháp tu từ so sánh, ẩn dụ, nhân hóa.
- Viết đoạn văn nghị luận xã hội 200 chữ về thái độ của tuổi trẻ với quá khứ lịch sử.`,
    status: 'ready',
    questionIds: ['q_22', 'q_23'],
    color: '#ec4899',
    createdBy: 'tch_lit',
    createdByName: 'Cô Mai Anh',
    createdAt: '2025-02-14T08:00:00Z',
    updatedAt: '2025-02-18T08:30:00Z',
  },
  {
    id: 'top_06',
    title: 'Vật lý 9: Định luật Ôm & Công suất điện trong mạch nối tiếp',
    name: 'Vật lý 9: Định luật Ôm & Công suất điện trong mạch nối tiếp',
    classId: 'class_10a2',
    className: '9A2',
    subjectId: 'sub_phys',
    subjectName: 'Vật lý',
    gradeLevel: 9,
    academicYearId: 'ay_2024_2025',
    lessonDate: '2025-02-21',
    period: 2,
    sessionType: 'current',
    description: 'Mạch điện nối tiếp và song song, công suất tiêu thụ và ứng dụng an toàn điện.',
    content: `I. KIẾN THỨC TRỌNG TÂM
1. Định luật Ôm: I = U / R.
2. Đoạn mạch gồm hai điện trở mắc nối tiếp:
- Cường độ dòng điện: I = I1 = I2.
- Hiệu điện thế: U = U1 + U2.
- Điện trở tương đương: Rtd = R1 + R2.
3. Công suất điện: P = U.I = I²R = U²/R.`,
    status: 'draft',
    questionIds: [],
    color: '#8b5cf6',
    createdBy: 'user_teacher_2',
    createdByName: 'Thầy Phạm Quang Minh',
    createdAt: '2025-02-19T08:00:00Z',
    updatedAt: '2025-02-21T09:00:00Z',
  },
];

interface DatabaseState {
  users: UserProfile[];
  schools: School[];
  academicYears: AcademicYear[];
  classes: Classroom[];
  students: Student[];
  parents: Parent[];
  attendanceSessions: AttendanceSession[];
  schedules: ScheduleItem[];
  assignments: Assignment[];
  topics: AssignmentTopic[];
  submissions: AssignmentSubmission[];
  notifications: AppNotification[];
  questions: Question[];
  quizzes: Quiz[];
  quizAttempts: QuizAttempt[];
  resources: LearningResource[];
  grades: StudentGradeRecord[];
  behaviors: BehaviorRecord[];
  alerts: SmartAlert[];
  announcements: Announcement[];
  messages: ChatMessage[];
  auditLogs: AuditLog[];
}

function loadInitialState(): DatabaseState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      // Ensure state is updated to THCS Trưng Vương
      if (parsed.schools?.[0]?.name?.includes('Trưng Vương') && parsed.students?.[0]?.fullName === 'Phạm Minh Nhật') {
        if (!parsed.notifications || parsed.notifications.length === 0) {
          parsed.notifications = DEFAULT_NOTIFICATIONS;
        }
        if (!parsed.topics || parsed.topics.length === 0) {
          parsed.topics = DEFAULT_TOPICS;
        }
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse state from localStorage, falling back to seed', e);
  }
  return {
    users: SEED_USERS,
    schools: [SEED_SCHOOL],
    academicYears: SEED_ACADEMIC_YEARS,
    classes: SEED_CLASSES,
    students: SEED_STUDENTS,
    parents: SEED_PARENTS,
    attendanceSessions: SEED_ATTENDANCE_SESSIONS,
    schedules: SEED_SCHEDULE,
    assignments: SEED_ASSIGNMENTS,
    topics: DEFAULT_TOPICS,
    submissions: SEED_SUBMISSIONS,
    notifications: DEFAULT_NOTIFICATIONS,
    questions: SEED_QUESTIONS,
    quizzes: SEED_QUIZZES,
    quizAttempts: [],
    resources: SEED_RESOURCES,
    grades: SEED_GRADES,
    behaviors: SEED_BEHAVIORS,
    alerts: SEED_ALERTS,
    announcements: SEED_ANNOUNCEMENTS,
    messages: SEED_MESSAGES,
    auditLogs: SEED_AUDIT_LOGS,
  };
}

class SmartClassDatabase {
  private state: DatabaseState;
  private listeners: (() => void)[] = [];

  constructor() {
    this.state = loadInitialState();
    // Ensure schedule has sample items if it's lacking afternoon/saturday
    if (this.state.schedules && this.state.schedules.length > 0) {
      const hasSaturdayOrAfternoon = this.state.schedules.some(s => s.dayOfWeek === 7 || s.period >= 6);
      if (!hasSaturdayOrAfternoon) {
        const extraSeeds = SEED_SCHEDULE.filter(s => s.dayOfWeek === 7 || s.period >= 6);
        this.state.schedules.push(...extraSeeds);
        this.persist();
      }
    }
    // Ensure rich multiple choice questions from SEED_QUESTIONS are populated
    if (this.state.questions) {
      const existingIds = new Set(this.state.questions.map(q => q.id));
      const newSeeds = SEED_QUESTIONS.filter(q => !existingIds.has(q.id));
      if (newSeeds.length > 0) {
        this.state.questions.push(...newSeeds);
        this.persist();
      }
    }
  }

  private persist() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.state));
    } catch (e) {
      console.error('Failed to save to localStorage', e);
    }
    this.notifyListeners();
  }

  public subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(l => l());
  }

  public resetToDefault() {
    localStorage.removeItem(STORAGE_KEY);
    this.state = {
      users: SEED_USERS,
      schools: [SEED_SCHOOL],
      academicYears: SEED_ACADEMIC_YEARS,
      classes: SEED_CLASSES,
      students: SEED_STUDENTS,
      parents: SEED_PARENTS,
      attendanceSessions: SEED_ATTENDANCE_SESSIONS,
      schedules: SEED_SCHEDULE,
      assignments: SEED_ASSIGNMENTS,
      topics: DEFAULT_TOPICS,
      submissions: SEED_SUBMISSIONS,
      notifications: DEFAULT_NOTIFICATIONS,
      questions: SEED_QUESTIONS,
      quizzes: SEED_QUIZZES,
      quizAttempts: [],
      resources: SEED_RESOURCES,
      grades: SEED_GRADES,
      behaviors: SEED_BEHAVIORS,
      alerts: SEED_ALERTS,
      announcements: SEED_ANNOUNCEMENTS,
      messages: SEED_MESSAGES,
      auditLogs: SEED_AUDIT_LOGS,
    };
    this.persist();
  }

  public recordAuditLog(log: Omit<AuditLog, 'id' | 'timestamp'>) {
    const newLog: AuditLog = {
      ...log,
      id: `audit_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      timestamp: new Date().toISOString(),
    };
    this.state.auditLogs.unshift(newLog);
    this.persist();
  }

  /**
   * Phân quyền giáo viên theo lớp & môn phân công:
   * - Admin: truy cập toàn bộ lớp và môn học
   * - Giáo viên: chỉ lớp và môn được phân công (GVCN hoặc lịch dạy TKB)
   */
  public getTeacherPermissions(teacherId: string, role: string): {
    classes: Classroom[];
    classSubjectsMap: Record<string, string[]>;
  } {
    const allClasses = this.getClasses();
    if (role === 'ADMIN') {
      const allSubjects = ['Toán học', 'Ngữ văn', 'Tiếng Anh', 'Vật lý', 'Hóa học', 'Sinh học', 'Lịch sử', 'Địa lí', 'Tin học', 'Công nghệ', 'GDCD'];
      const map: Record<string, string[]> = {};
      allClasses.forEach(c => {
        map[c.id] = allSubjects;
      });
      return { classes: allClasses, classSubjectsMap: map };
    }

    if (role !== 'TEACHER') {
      return { classes: [], classSubjectsMap: {} };
    }

    const allowedClasses = allClasses.filter(c => {
      const isHomeroom = c.homeroomTeacherId === teacherId;
      const isSubjectTeacher = (c.subjectTeachers || []).some(st => st.teacherId === teacherId);
      const inSchedule = this.state.schedules?.some(s => s.classId === c.id && s.teacherId === teacherId);
      return isHomeroom || isSubjectTeacher || inSchedule;
    });

    const map: Record<string, string[]> = {};

    allowedClasses.forEach(c => {
      const subjects = new Set<string>();
      if (c.homeroomTeacherId === teacherId) {
        subjects.add('Toán học');
      }
      (c.subjectTeachers || []).forEach(st => {
        if (st.teacherId === teacherId && st.subjectName) {
          subjects.add(st.subjectName);
        }
      });
      this.state.schedules?.forEach(s => {
        if (s.classId === c.id && s.teacherId === teacherId) {
          subjects.add(s.subjectName);
        }
      });
      if (subjects.size === 0) {
        subjects.add('Toán học');
      }
      map[c.id] = Array.from(subjects);
    });

    return { classes: allowedClasses, classSubjectsMap: map };
  }

  // --- Users / Auth ---
  public getUsers(): UserProfile[] {
    return this.state.users;
  }

  public getUserById(id: string): UserProfile | undefined {
    return this.state.users.find(u => u.id === id);
  }

  public getUserByEmail(email: string): UserProfile | undefined {
    return this.state.users.find(u => u.email.toLowerCase() === email.toLowerCase());
  }

  // --- School ---
  public getSchool(): School {
    return this.state.schools?.[0] || SEED_SCHOOL;
  }

  public getSchools(): School[] {
    return this.state.schools;
  }

  // --- Academic Years ---
  public getAcademicYears(): AcademicYear[] {
    return this.state.academicYears;
  }

  public getCurrentAcademicYear(): AcademicYear {
    const current = this.state.academicYears.find(ay => ay.isCurrent);
    if (current) return current;
    if (this.state.academicYears.length > 0) return this.state.academicYears[0];
    const defaultYear: AcademicYear = {
      id: 'ay_2024_2025',
      name: '2024 - 2025',
      startDate: '2024-09-05',
      endDate: '2025-05-31',
      isCurrent: true,
    };
    this.state.academicYears.push(defaultYear);
    this.persist();
    return defaultYear;
  }

  public updateCurrentAcademicYearName(newName: string): AcademicYear {
    const current = this.getCurrentAcademicYear();
    current.name = newName.trim();
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'UPDATE_ACADEMIC_YEAR',
      targetEntity: `AcademicYear (${current.name})`,
      details: `Đã cập nhật tên năm học thành: ${current.name}`,
    });
    this.persist();
    return current;
  }

  // --- Classes ---
  public getClasses(includeArchived = false): Classroom[] {
    return includeArchived ? this.state.classes : this.state.classes.filter(c => !c.isArchived);
  }

  public getClassById(id: string): Classroom | undefined {
    return this.state.classes.find(c => c.id === id);
  }

  public createClass(cls: Omit<Classroom, 'id' | 'createdAt' | 'isArchived' | 'joinCode' | 'studentCount'>): Classroom {
    const newClass: Classroom = {
      ...cls,
      id: `class_${Date.now()}`,
      joinCode: `CLS-${cls.name}-${Math.floor(100 + Math.random() * 900)}`,
      isArchived: false,
      studentCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.state.classes.unshift(newClass);
    this.recordAuditLog({
      userId: cls.homeroomTeacherId,
      userName: cls.homeroomTeacherName,
      userRole: 'TEACHER',
      action: 'CREATE_CLASS',
      targetEntity: `Classroom (${newClass.name})`,
      details: `Đã tạo lớp học mới ${newClass.name} - Khối ${newClass.gradeLevel} tại phòng ${newClass.roomNumber}`,
    });
    this.persist();
    return newClass;
  }

  public updateClass(id: string, updates: Partial<Classroom>): Classroom | null {
    const idx = this.state.classes.findIndex(c => c.id === id);
    if (idx === -1) return null;
    this.state.classes[idx] = { ...this.state.classes[idx], ...updates };
    this.persist();
    return this.state.classes[idx];
  }

  public archiveClass(id: string, archived = true): boolean {
    const cls = this.getClassById(id);
    if (!cls) return false;
    cls.isArchived = archived;
    this.persist();
    return true;
  }

  public deleteClass(id: string): boolean {
    this.state.classes = this.state.classes.filter(c => c.id !== id);
    this.state.students = this.state.students.filter(s => s.classId !== id);
    this.persist();
    return true;
  }

  // --- Students ---
  private ensureStudentParent(s: Student): Student {
    if (!s.parentName || !s.parentPhone) {
      const seedMatch = SEED_STUDENTS.find(seed => seed.id === s.id || seed.studentCode === s.studentCode);
      if (seedMatch && seedMatch.parentName) {
        return {
          ...s,
          parentName: s.parentName || seedMatch.parentName,
          parentPhone: s.parentPhone || seedMatch.parentPhone,
          parentEmail: s.parentEmail || seedMatch.parentEmail,
          parentRelationship: s.parentRelationship || seedMatch.parentRelationship || 'Bố',
          parentJob: s.parentJob || seedMatch.parentJob || 'Kinh doanh',
          parentNotes: s.parentNotes || seedMatch.parentNotes || 'Phụ huynh kết nối thường xuyên',
          parentAppStatus: s.parentAppStatus || seedMatch.parentAppStatus || 'active',
        };
      }
      const familyName = s.fullName.split(' ')[0] || 'Nguyễn';
      return {
        ...s,
        parentName: s.parentName || `${familyName} Văn An`,
        parentPhone: s.parentPhone || '0912 345 678',
        parentEmail: s.parentEmail || `phuhuynh.${s.studentCode.toLowerCase()}@smartclass.edu.vn`,
        parentRelationship: s.parentRelationship || 'Bố',
        parentJob: s.parentJob || 'Cán bộ công chức',
        parentNotes: s.parentNotes || 'Người liên hệ chính của học sinh',
        parentAppStatus: s.parentAppStatus || 'active',
      };
    }
    return s;
  }

  public getStudents(classId?: string): Student[] {
    let list = classId
      ? this.state.students.filter(s => s.classId === classId)
      : this.state.students;
    return list.map(s => this.ensureStudentParent(s));
  }

  public getStudentById(id: string): Student | undefined {
    const s = this.state.students.find(s => s.id === id);
    return s ? this.ensureStudentParent(s) : undefined;
  }

  public createStudent(studentData: Omit<Student, 'id' | 'gpa' | 'conduct' | 'attendanceRate' | 'behaviorPoints'>): Student {
    const newStudent: Student = {
      ...studentData,
      id: `std_${Date.now()}`,
      gpa: 8.0,
      conduct: 'Tốt',
      attendanceRate: 100,
      behaviorPoints: 20,
      parentAppStatus: studentData.parentAppStatus || 'active',
      parentRelationship: studentData.parentRelationship || 'Bố',
    };
    this.state.students.push(newStudent);
    // update class count
    const cls = this.getClassById(studentData.classId);
    if (cls) {
      cls.studentCount = this.state.students.filter(s => s.classId === cls.id).length;
    }
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'CREATE_STUDENT',
      targetEntity: `Student (${newStudent.fullName})`,
      details: `Thêm học sinh ${newStudent.fullName} (${newStudent.studentCode}) vào lớp ${newStudent.className}`,
    });
    this.persist();
    return newStudent;
  }

  public updateStudent(id: string, updates: Partial<Student>): Student | null {
    const idx = this.state.students.findIndex(s => s.id === id);
    if (idx === -1) return null;
    this.state.students[idx] = { ...this.state.students[idx], ...updates };
    this.persist();
    return this.state.students[idx];
  }

  public updateStudentParentInfo(
    studentId: string,
    parentData: {
      parentName: string;
      parentPhone: string;
      parentEmail?: string;
      parentRelationship?: 'Bố' | 'Mẹ' | 'Người giám hộ' | string;
      parentJob?: string;
      parentNotes?: string;
      parentAppStatus?: 'active' | 'pending' | 'not_registered';
      address?: string;
    }
  ): Student | null {
    const student = this.getStudentById(studentId);
    if (!student) return null;
    const updated = this.updateStudent(studentId, {
      parentName: parentData.parentName,
      parentPhone: parentData.parentPhone,
      parentEmail: parentData.parentEmail,
      parentRelationship: parentData.parentRelationship,
      parentJob: parentData.parentJob,
      parentNotes: parentData.parentNotes,
      parentAppStatus: parentData.parentAppStatus || student.parentAppStatus || 'active',
      address: parentData.address || student.address,
    });
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'UPDATE_PARENT',
      targetEntity: `Parent (${parentData.parentName} - Con: ${student.fullName})`,
      details: `Cập nhật thông tin phụ huynh cho học sinh ${student.fullName} (${student.className})`,
    });
    return updated;
  }

  public canDeleteStudent(id: string): { canDelete: boolean; reason?: string } {
    const s = this.getStudentById(id);
    if (!s) return { canDelete: false, reason: 'Không tìm thấy học sinh trong hệ thống.' };

    // Ràng buộc nghiệp vụ: Nếu học sinh đang theo học ('active') và có lớp học, không được xóa!
    if (s.status === 'active' && s.classId) {
      return {
        canDelete: false,
        reason: `Học sinh ${s.fullName} hiện đang trong trạng thái "Đang theo học" tại lớp ${s.className}. Theo quy định nghiệp vụ, không được xóa học sinh đang trong biên chế lớp học để bảo đảm toàn vẹn dữ liệu sổ điểm và điểm danh. Vui lòng chuyển trạng thái học sinh sang "Đã thôi học / Chuyển trường" trước khi xóa.`
      };
    }

    return { canDelete: true };
  }

  public deleteStudent(id: string, force = false): { success: boolean; message?: string } {
    const s = this.getStudentById(id);
    if (!s) return { success: false, message: 'Học sinh không tồn tại' };

    if (!force) {
      const check = this.canDeleteStudent(id);
      if (!check.canDelete) {
        return { success: false, message: check.reason };
      }
    }

    this.state.students = this.state.students.filter(item => item.id !== id);
    const cls = this.getClassById(s.classId);
    if (cls) {
      cls.studentCount = this.state.students.filter(item => item.classId === cls.id).length;
    }
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'DELETE_STUDENT',
      targetEntity: `Student (${s.fullName})`,
      details: `Đã xóa học sinh ${s.fullName} (${s.studentCode}) khỏi hệ thống`,
    });
    this.persist();
    return { success: true };
  }

  public batchImportStudents(classId: string, students: Array<Omit<Student, 'id' | 'classId' | 'className' | 'gpa' | 'conduct' | 'attendanceRate' | 'behaviorPoints'>>): { successCount: number; errors: string[] } {
    const cls = this.getClassById(classId);
    if (!cls) return { successCount: 0, errors: ['Không tìm thấy lớp học hợp lệ'] };

    let count = 0;
    students.forEach((data, index) => {
      const student: Student = {
        ...data,
        id: `std_import_${Date.now()}_${index}`,
        classId: cls.id,
        className: cls.name,
        rollNumber: data.rollNumber || (this.state.students.filter(s => s.classId === cls.id).length + 1),
        gpa: 8.0,
        conduct: 'Tốt',
        attendanceRate: 100,
        behaviorPoints: 20,
      };
      this.state.students.push(student);
      count++;
    });

    cls.studentCount = this.state.students.filter(s => s.classId === cls.id).length;
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'IMPORT_STUDENTS',
      targetEntity: `Classroom (${cls.name})`,
      details: `Đã import thành công ${count} học sinh vào lớp ${cls.name}`,
    });
    this.persist();
    return { successCount: count, errors: [] };
  }

  // --- Attendance ---
  public getAttendanceSessions(classId?: string): AttendanceSession[] {
    if (classId) {
      return this.state.attendanceSessions.filter(a => a.classId === classId);
    }
    return this.state.attendanceSessions;
  }

  public getAttendanceSessionByDate(classId: string, date: string): AttendanceSession | undefined {
    return this.state.attendanceSessions.find(a => a.classId === classId && a.date === date);
  }

  public saveAttendanceSession(session: Omit<AttendanceSession, 'id' | 'createdAt' | 'updatedAt'>): AttendanceSession {
    const existingIdx = this.state.attendanceSessions.findIndex(
      a => a.classId === session.classId && a.date === session.date && a.period === session.period
    );

    const now = new Date().toISOString();
    let savedSession: AttendanceSession;

    if (existingIdx >= 0) {
      savedSession = {
        ...this.state.attendanceSessions[existingIdx],
        ...session,
        updatedAt: now,
      };
      this.state.attendanceSessions[existingIdx] = savedSession;
    } else {
      savedSession = {
        ...session,
        id: `att_${Date.now()}`,
        createdAt: now,
        updatedAt: now,
      };
      this.state.attendanceSessions.unshift(savedSession);
    }

    this.recordAuditLog({
      userId: session.takenByTeacherId,
      userName: session.takenByTeacherName,
      userRole: 'TEACHER',
      action: 'RECORD_ATTENDANCE',
      targetEntity: `AttendanceSession (${session.className} - ${session.date})`,
      details: `Lưu điểm danh ngày ${session.date}: Có mặt ${session.summary.present}/${session.summary.total}, Vắng CP: ${session.summary.absentExcused}, Vắng KP: ${session.summary.absentUnexcused}, Muộn: ${session.summary.late}`,
    });

    this.persist();
    return savedSession;
  }

  // --- Schedule ---
  public getSchedule(classId: string): ScheduleItem[] {
    return this.state.schedules.filter(s => s.classId === classId);
  }

  public saveScheduleItem(item: Omit<ScheduleItem, 'id'>): ScheduleItem {
    const newItem: ScheduleItem = {
      ...item,
      id: `sch_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    };
    this.state.schedules.push(newItem);
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'CREATE_SCHEDULE',
      targetEntity: `Schedule (${newItem.subjectName})`,
      details: `Thêm môn ${newItem.subjectName} vào Thứ ${newItem.dayOfWeek} Tiết ${newItem.period} (${newItem.room})`,
    });
    this.persist();
    return newItem;
  }

  public updateScheduleItem(id: string, updates: Partial<ScheduleItem>): ScheduleItem | null {
    const idx = this.state.schedules.findIndex(s => s.id === id);
    if (idx === -1) return null;
    const old = this.state.schedules[idx];
    this.state.schedules[idx] = { ...old, ...updates };
    const updated = this.state.schedules[idx];
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'UPDATE_SCHEDULE',
      targetEntity: `Schedule (${updated.subjectName})`,
      details: `Cập nhật môn ${updated.subjectName} Thứ ${updated.dayOfWeek} Tiết ${updated.period} - GV: ${updated.teacherName} - Phòng: ${updated.room}`,
    });
    this.persist();
    return updated;
  }

  public upsertScheduleItem(data: {
    id?: string;
    classId: string;
    dayOfWeek: 2 | 3 | 4 | 5 | 6 | 7;
    period: number;
    subjectId?: string;
    subjectName: string;
    teacherId?: string;
    teacherName: string;
    room: string;
    startTime: string;
    endTime: string;
  }): ScheduleItem {
    if (data.id) {
      const updated = this.updateScheduleItem(data.id, data);
      if (updated) return updated;
    }
    const existing = this.state.schedules.find(
      s => s.classId === data.classId && s.dayOfWeek === data.dayOfWeek && s.period === data.period
    );
    if (existing) {
      return this.updateScheduleItem(existing.id, data)!;
    }
    return this.saveScheduleItem({
      classId: data.classId,
      dayOfWeek: data.dayOfWeek,
      period: data.period,
      subjectId: data.subjectId || 'sub_general',
      subjectName: data.subjectName,
      teacherId: data.teacherId || 'user_teacher_1',
      teacherName: data.teacherName,
      room: data.room,
      startTime: data.startTime,
      endTime: data.endTime,
    });
  }

  public deleteScheduleItem(id: string): boolean {
    const item = this.state.schedules.find(s => s.id === id);
    if (item) {
      this.recordAuditLog({
        userId: 'user_teacher_1',
        userName: 'Giáo viên',
        userRole: 'TEACHER',
        action: 'DELETE_SCHEDULE',
        targetEntity: `Schedule (${item.subjectName})`,
        details: `Đã xóa môn ${item.subjectName} khỏi Thứ ${item.dayOfWeek} Tiết ${item.period}`,
      });
    }
    this.state.schedules = this.state.schedules.filter(s => s.id !== id);
    this.persist();
    return true;
  }

  public resetScheduleToSeed(classId: string): void {
    this.state.schedules = this.state.schedules.filter(s => s.classId !== classId);
    const defaults = SEED_SCHEDULE.filter(s => s.classId === classId);
    this.state.schedules.push(...defaults);
    this.persist();
  }

  // --- Assignments ---
  public getAssignments(classId?: string): Assignment[] {
    if (classId) {
      return this.state.assignments.filter(a => a.classId === classId);
    }
    return this.state.assignments;
  }

  public getAssignmentById(id: string): Assignment | undefined {
    return this.state.assignments.find(a => a.id === id);
  }

  public createAssignment(data: Omit<Assignment, 'id' | 'createdAt' | 'submissionCount' | 'gradedCount'>): Assignment {
    const newAsg: Assignment = {
      ...data,
      id: `asg_${Date.now()}`,
      allowLateDays: Number(data.allowLateDays ?? 0),
      topic: data.topic || '',
      content: data.content || '',
      fileName: data.fileName || '',
      fileUrl: data.fileUrl || '',
      fileSize: data.fileSize || '',
      submissionCount: 0,
      gradedCount: 0,
      completedStudentIds: [],
      createdAt: new Date().toISOString(),
    };
    this.state.assignments.unshift(newAsg);

    // 2. Cách giao btvn:
    // a) Tự động giao hết cho tất cả học sinh có trong lớp học
    const studentsInClass = this.getStudents(data.classId);
    const dueFormatted = new Date(data.dueDate).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const now = new Date().toISOString();

    studentsInClass.forEach(st => {
      const studentNotif: AppNotification = {
        id: `notif_${Date.now()}_st_${st.id}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'assignment_new',
        title: `BTVN Mới môn ${data.subjectName}: ${data.title}`,
        message: `Cô ${data.createdByTeacherName || 'Lê Thu Hà'} vừa giao bài tập mới cho lớp ${data.className}. Hạn nộp: ${dueFormatted}${(newAsg.allowLateDays || 0) > 0 ? ` (Cho phép nộp trễ ${newAsg.allowLateDays} ngày)` : ''}. Em có thể tải file hoặc sao chép đề bài để làm và bấm "Nộp BTVN".`,
        targetRole: 'STUDENT',
        targetClassId: data.classId,
        targetStudentId: st.id,
        assignmentId: newAsg.id,
        isRead: false,
        createdAt: now,
        meta: {
          assignmentTitle: newAsg.title,
          studentName: st.fullName,
          studentId: st.id,
          className: newAsg.className,
          subjectName: newAsg.subjectName,
          topic: newAsg.topic,
          dueDate: newAsg.dueDate,
          allowLateDays: newAsg.allowLateDays,
          fileName: newAsg.fileName,
          fileUrl: newAsg.fileUrl,
          fileSize: newAsg.fileSize,
          content: newAsg.content,
        }
      };
      this.state.notifications.unshift(studentNotif);

      // b) Giao cho tất cả phụ huynh có trong lớp đó để phụ huynh nhắc nhở hs làm bài
      const parentNotif: AppNotification = {
        id: `notif_${Date.now()}_pr_${st.id}_${Math.random().toString(36).substring(2, 6)}`,
        type: 'assignment_new',
        title: `Thông báo BTVN mới cho con ${st.fullName}`,
        message: `Cô ${data.createdByTeacherName || 'Lê Thu Hà'} vừa giao BTVN môn ${data.subjectName}: "${data.title}" cho lớp ${data.className}. Hạn nộp: ${dueFormatted}${(newAsg.allowLateDays || 0) > 0 ? ` (Cho phép nộp trễ ${newAsg.allowLateDays} ngày)` : ''}. Kính nhờ Phụ huynh nhắc nhở con làm bài và nộp bài đầy đủ!`,
        targetRole: 'PARENT',
        targetClassId: data.classId,
        targetStudentId: st.id,
        targetUserId: st.parentId || 'user_parent_1',
        assignmentId: newAsg.id,
        isRead: false,
        createdAt: now,
        meta: {
          assignmentTitle: newAsg.title,
          studentName: st.fullName,
          studentId: st.id,
          className: newAsg.className,
          subjectName: newAsg.subjectName,
          topic: newAsg.topic,
          dueDate: newAsg.dueDate,
          allowLateDays: newAsg.allowLateDays,
          fileName: newAsg.fileName,
          fileUrl: newAsg.fileUrl,
          fileSize: newAsg.fileSize,
          content: newAsg.content,
        }
      };
      this.state.notifications.unshift(parentNotif);
    });

    this.recordAuditLog({
      userId: data.createdByTeacherId,
      userName: data.createdByTeacherName || 'Giáo viên',
      userRole: 'TEACHER',
      action: 'CREATE_ASSIGNMENT',
      targetEntity: `Assignment (${newAsg.title})`,
      details: `Giao bài tập "${newAsg.title}" cho toàn bộ ${studentsInClass.length} học sinh lớp ${newAsg.className} và phụ huynh, hạn: ${dueFormatted}`,
    });

    this.persist();
    return newAsg;
  }

  public updateAssignment(id: string, updates: Partial<Assignment>): Assignment | null {
    const idx = this.state.assignments.findIndex(a => a.id === id);
    if (idx === -1) return null;
    this.state.assignments[idx] = { ...this.state.assignments[idx], ...updates };
    this.persist();
    return this.state.assignments[idx];
  }

  public deleteAssignment(id: string): boolean {
    this.state.assignments = this.state.assignments.filter(a => a.id !== id);
    this.state.submissions = this.state.submissions.filter(s => s.assignmentId !== id);
    this.state.notifications = this.state.notifications.filter(n => n.assignmentId !== id);
    this.persist();
    return true;
  }

  // =========================================================================
  // --- MÀN HÌNH 111 & GIAO BÀI TẬP TỪ NGÂN HÀNG CÂU HỎI ---
  // =========================================================================

  /**
   * Kiểm tra câu hỏi ngân hàng có đủ điều kiện ra đề (Eligible):
   * - Có nội dung hợp lệ
   * - Trạng thái hoạt động (không bị vô hiệu/lưu trữ/từ chối)
   * - Có đáp án bắt buộc hoặc barem chấm
   */
  public isQuestionEligible(q: Question): boolean {
    if (!q || !q.content || q.content.trim().length === 0) return false;
    if (q.status === 'flagged' || (q as any).status === 'archived' || (q as any).status === 'rejected') return false;
    if (q.type === 'essay') {
      return true; // Tự luận hợp lệ khi có nội dung câu hỏi
    }
    // Trắc nghiệm một hoặc nhiều đáp án
    if (q.type === 'single' || q.type === 'multiple') {
      return Boolean(q.options && q.options.length >= 2 && q.correctAnswer);
    }
    // Đúng/Sai từng ý
    if (q.type === 'true_false') {
      return Boolean(q.subQuestions && q.subQuestions.length > 0);
    }
    // Ghép đôi
    if (q.type === 'matching') {
      return Boolean(q.matchingPairs && q.matchingPairs.length > 0);
    }
    return Boolean(q.correctAnswer);
  }

  /**
   * Phân loại câu hỏi: Trắc nghiệm (mcq) hoặc Tự luận (essay)
   */
  public getQuestionCategory(type: QuestionType): 'mcq' | 'essay' {
    return type === 'essay' ? 'essay' : 'mcq';
  }

  /**
   * Lấy danh sách câu hỏi đủ điều kiện từ nhiều chủ đề (Deduplication - không tính trùng)
   */
  public getEligibleQuestionsForTopics(
    topicIds: string[],
    filters?: {
      difficulty?: string; // 'all' | 'easy' | 'medium' | 'hard' | 'very_hard'
      format?: 'all' | 'mcq' | 'essay';
    }
  ): {
    questions: Question[];
    mcqQuestions: Question[];
    essayQuestions: Question[];
    mcqCount: number;
    essayCount: number;
    totalEligible: number;
  } {
    if (!this.state.topics) this.state.topics = DEFAULT_TOPICS;
    const selectedTopics = this.state.topics.filter(t => topicIds.includes(t.id));

    // Deduplicate question IDs across all selected topics
    const uniqueQuestionIds = new Set<string>();
    selectedTopics.forEach(t => {
      (t.questionIds || []).forEach(qid => uniqueQuestionIds.add(qid));
    });

    const allQuestions = this.getQuestions();
    const candidateQuestions = allQuestions.filter(q => uniqueQuestionIds.has(q.id));

    // Filter by eligibility
    const eligiblePool = candidateQuestions.filter(q => this.isQuestionEligible(q));

    // Apply difficulty filter
    const difficultyFiltered = eligiblePool.filter(q => {
      if (!filters?.difficulty || filters.difficulty === 'all') return true;
      return q.difficulty === filters.difficulty;
    });

    const mcqQuestions = difficultyFiltered.filter(q => this.getQuestionCategory(q.type) === 'mcq');
    const essayQuestions = difficultyFiltered.filter(q => this.getQuestionCategory(q.type) === 'essay');

    let finalQuestions = difficultyFiltered;
    if (filters?.format === 'mcq') {
      finalQuestions = mcqQuestions;
    } else if (filters?.format === 'essay') {
      finalQuestions = essayQuestions;
    }

    return {
      questions: finalQuestions,
      mcqQuestions,
      essayQuestions,
      mcqCount: mcqQuestions.length,
      essayCount: essayQuestions.length,
      totalEligible: difficultyFiltered.length,
    };
  }

  /**
   * Thống kê chi tiết câu hỏi và sử dụng của một chủ đề
   */
  public getTopicStats(topicId: string): {
    totalQuestions: number;
    eligibleMcqCount: number;
    eligibleEssayCount: number;
    totalEligibleCount: number;
    usedInAssignmentsCount: number;
  } {
    const topic = this.getTopicById(topicId);
    if (!topic || !topic.questionIds) {
      return {
        totalQuestions: 0,
        eligibleMcqCount: 0,
        eligibleEssayCount: 0,
        totalEligibleCount: 0,
        usedInAssignmentsCount: 0,
      };
    }

    const allQuestions = this.getQuestions();
    const linkedQuestions = allQuestions.filter(q => topic.questionIds?.includes(q.id));
    const eligible = linkedQuestions.filter(q => this.isQuestionEligible(q));
    const eligibleMcq = eligible.filter(q => this.getQuestionCategory(q.type) === 'mcq');
    const eligibleEssay = eligible.filter(q => this.getQuestionCategory(q.type) === 'essay');

    const usedInAssignments = this.state.assignments.filter(
      a => (a.topicIds && a.topicIds.includes(topicId)) || a.topic === topic.title || a.topic === topic.name
    ).length;

    return {
      totalQuestions: linkedQuestions.length,
      eligibleMcqCount: eligibleMcq.length,
      eligibleEssayCount: eligibleEssay.length,
      totalEligibleCount: eligible.length,
      usedInAssignmentsCount: usedInAssignments,
    };
  }

  /**
   * Danh sách chủ đề theo bộ lọc Screen 111
   */
  public getTopics(filters?: string | {
    classId?: string;
    subjectName?: string;
    status?: string;
    sessionType?: string;
    search?: string;
    academicYearId?: string;
  }): AssignmentTopic[] {
    const filterObj = typeof filters === 'string' ? { classId: filters } : (filters || {});
    if (!this.state.topics) {
      this.state.topics = DEFAULT_TOPICS;
    }

    // Normalize existing topics for backwards compatibility
    this.state.topics = this.state.topics.map(t => ({
      ...t,
      title: t.title || t.name,
      name: t.name || t.title || 'Chủ đề bài học',
      classId: t.classId || 'class_10a1',
      className: t.className || '9A1',
      subjectName: t.subjectName || 'Toán học',
      status: t.status || 'ready',
      questionIds: t.questionIds || [],
      lessonDate: t.lessonDate || 'Buổi 1',
      sessionType: t.sessionType || 'current',
    }));

    let result = [...this.state.topics];

    if (filterObj.classId && filterObj.classId !== 'all') {
      result = result.filter(t => t.classId === filterObj.classId);
    }
    if (filterObj.subjectName && filterObj.subjectName !== 'all' && filterObj.subjectName !== 'Tất cả môn') {
      result = result.filter(t => t.subjectName.toLowerCase() === filterObj.subjectName?.toLowerCase());
    }
    if (filterObj.status && filterObj.status !== 'all') {
      result = result.filter(t => t.status === filterObj.status);
    }
    if (filterObj.sessionType && filterObj.sessionType !== 'all') {
      result = result.filter(t => t.sessionType === filterObj.sessionType);
    }
    if (filterObj.academicYearId && filterObj.academicYearId !== 'all') {
      result = result.filter(t => !t.academicYearId || t.academicYearId === filterObj.academicYearId);
    }
    if (filterObj.search && filterObj.search.trim()) {
      const q = filterObj.search.toLowerCase().trim();
      result = result.filter(
        t =>
          (t.title && t.title.toLowerCase().includes(q)) ||
          (t.name && t.name.toLowerCase().includes(q)) ||
          (t.description && t.description.toLowerCase().includes(q)) ||
          (t.content && t.content.toLowerCase().includes(q))
      );
    }

    // Sort: newest first
    return result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }

  public getTopicById(id: string): AssignmentTopic | undefined {
    if (!this.state.topics) this.state.topics = DEFAULT_TOPICS;
    return this.state.topics.find(t => t.id === id);
  }

  /**
   * Tạo chủ đề mới (Form thêm chủ đề - Màn hình 111):
   * - Tên bắt buộc, tối đa 200 ký tự
   * - Nội dung tối đa 8.000 ký tự
   * - Kiểm tra trùng tên theo lớp - môn - buổi (cảnh báo)
   */
  public createTopic(
    topic: Omit<AssignmentTopic, 'id' | 'createdAt'>,
    options?: { allowDuplicateWarning?: boolean }
  ): {
    success: boolean;
    topic?: AssignmentTopic;
    error?: string;
    isDuplicateWarning?: boolean;
  } {
    if (!this.state.topics) this.state.topics = DEFAULT_TOPICS;

    const title = (topic.title || topic.name || '').trim();
    if (!title) {
      return { success: false, error: 'Tên chủ đề là trường bắt buộc (tối đa 200 ký tự).' };
    }
    if (title.length > 200) {
      return { success: false, error: `Tên chủ đề vượt quá 200 ký tự (${title.length}/200). Vui lòng rút gọn.` };
    }

    const content = topic.content || '';
    if (content.length > 8000) {
      return { success: false, error: `Nội dung chủ đề vượt quá giới hạn 8.000 ký tự (${content.length}/8.000).` };
    }

    // Check duplicate by classId + subjectName + lessonDate + title
    const isDuplicate = this.state.topics.some(
      t =>
        t.classId === topic.classId &&
        t.subjectName.toLowerCase() === topic.subjectName.toLowerCase() &&
        t.lessonDate === topic.lessonDate &&
        ((t.title || t.name || '').toLowerCase() === title.toLowerCase())
    );

    if (isDuplicate && !options?.allowDuplicateWarning) {
      return {
        success: false,
        isDuplicateWarning: true,
        error: `Đã có chủ đề "${title}" trong cùng lớp, môn và buổi học này. Vui lòng xác nhận để tiếp tục lưu.`,
      };
    }

    const newTopic: AssignmentTopic = {
      ...topic,
      id: `top_${Date.now()}`,
      title,
      name: title,
      content,
      description: topic.description || title,
      status: topic.status || 'draft',
      questionIds: topic.questionIds || [],
      color: topic.color || '#06b6d4',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.topics.unshift(newTopic);
    this.recordAuditLog({
      userId: topic.createdBy || 'user_teacher_1',
      userName: topic.createdByName || 'Giáo viên',
      userRole: 'TEACHER',
      action: 'CREATE_TOPIC',
      targetEntity: `Topic (${newTopic.title})`,
      details: `Tạo chủ đề bài học mới: ${newTopic.title} - Lớp: ${newTopic.className || newTopic.classId} - Môn: ${newTopic.subjectName}`,
    });
    this.persist();
    return { success: true, topic: newTopic };
  }

  /**
   * Cập nhật chủ đề
   */
  public updateTopic(
    id: string,
    updates: Partial<AssignmentTopic>
  ): { success: boolean; topic?: AssignmentTopic; error?: string } {
    if (!this.state.topics) this.state.topics = DEFAULT_TOPICS;
    const idx = this.state.topics.findIndex(t => t.id === id);
    if (idx === -1) return { success: false, error: 'Không tìm thấy chủ đề cần cập nhật.' };

    if (updates.title !== undefined) {
      const title = updates.title.trim();
      if (!title) return { success: false, error: 'Tên chủ đề không được để trống.' };
      if (title.length > 200) return { success: false, error: 'Tên chủ đề tối đa 200 ký tự.' };
      updates.title = title;
      updates.name = title;
    }

    if (updates.content !== undefined && updates.content.length > 8000) {
      return { success: false, error: 'Nội dung chủ đề vượt quá 8.000 ký tự.' };
    }

    const updated: AssignmentTopic = {
      ...this.state.topics[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.state.topics[idx] = updated;
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'UPDATE_TOPIC',
      targetEntity: `Topic (${updated.title})`,
      details: `Cập nhật thông tin chủ đề bài học: ${updated.title}`,
    });
    this.persist();
    return { success: true, topic: updated };
  }

  /**
   * Sao chép chủ đề (Clone Topic)
   */
  public cloneTopic(
    id: string,
    teacherId: string = 'user_teacher_1',
    teacherName: string = 'Cô Lê Thu Hà'
  ): { success: boolean; topic?: AssignmentTopic; error?: string } {
    const original = this.getTopicById(id);
    if (!original) return { success: false, error: 'Chủ đề gốc không tồn tại.' };

    const clonedTitle = `(Bản sao) ${original.title || original.name}`.slice(0, 200);
    const newTopic: AssignmentTopic = {
      ...original,
      id: `top_${Date.now()}`,
      title: clonedTitle,
      name: clonedTitle,
      status: 'draft', // Bản sao mặc định để nháp để GV hiệu chỉnh
      createdBy: teacherId,
      createdByName: teacherName,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.topics.unshift(newTopic);
    this.recordAuditLog({
      userId: teacherId,
      userName: teacherName,
      userRole: 'TEACHER',
      action: 'CLONE_TOPIC',
      targetEntity: `Topic (${newTopic.title})`,
      details: `Nhân bản từ chủ đề: ${original.title}`,
    });
    this.persist();
    return { success: true, topic: newTopic };
  }

  /**
   * Xóa chủ đề: kiểm tra nếu đã được bài tập sử dụng thì chặn hoặc lưu trữ
   */
  public deleteTopic(id: string): { success: boolean; error?: string; archivedInstead?: boolean } {
    if (!this.state.topics) return { success: false, error: 'Không có dữ liệu chủ đề.' };
    const topic = this.getTopicById(id);
    if (!topic) return { success: false, error: 'Chủ đề không tồn tại.' };

    const stats = this.getTopicStats(id);
    if (stats.usedInAssignmentsCount > 0) {
      // Chặn xóa trực tiếp và lưu trữ để bảo toàn dữ liệu bài tập
      topic.status = 'archived';
      topic.updatedAt = new Date().toISOString();
      this.persist();
      return {
        success: true,
        archivedInstead: true,
        error: `Chủ đề này đã được sử dụng trong ${stats.usedInAssignmentsCount} bài tập đã giao. Hệ thống đã tự động chuyển sang trạng thái "Đã lưu trữ" thay vì xóa bỏ để bảo toàn dữ liệu.`,
      };
    }

    this.state.topics = this.state.topics.filter(t => t.id !== id);
    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'DELETE_TOPIC',
      targetEntity: `Topic (${topic.title})`,
      details: `Đã xóa chủ đề: ${topic.title}`,
    });
    this.persist();
    return { success: true };
  }

  /**
   * Gắn câu hỏi từ ngân hàng vào chủ đề
   */
  public linkQuestionsToTopic(topicId: string, questionIds: string[]): boolean {
    const topic = this.getTopicById(topicId);
    if (!topic) return false;
    const current = new Set(topic.questionIds || []);
    questionIds.forEach(qid => current.add(qid));
    topic.questionIds = Array.from(current);
    topic.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  /**
   * Gỡ câu hỏi khỏi chủ đề (không xóa câu hỏi gốc)
   */
  public unlinkQuestionFromTopic(topicId: string, questionId: string): boolean {
    const topic = this.getTopicById(topicId);
    if (!topic || !topic.questionIds) return false;
    topic.questionIds = topic.questionIds.filter(id => id !== questionId);
    topic.updatedAt = new Date().toISOString();
    this.persist();
    return true;
  }

  /**
   * Tạo bài tập / bài kiểm tra từ ngân hàng câu hỏi (Quy trình 5 bước):
   * - Lưu snapshot câu hỏi/đáp án bảo toàn đề
   * - Tự động phát thông báo cho toàn bộ học sinh và phụ huynh trong lớp
   */
  public createAssignmentFromBank(data: {
    title: string;
    classId: string;
    className: string;
    subjectId: string;
    subjectName: string;
    type: 'homework' | 'exam';
    assignmentFormat: 'mixed' | 'mcq_only' | 'essay_only';
    topicIds: string[];
    topicNames?: string[];
    dueDate: string;
    allowLateDays: number;
    points: number;
    selectedQuestions: { questionId: string; points: number; type: QuestionType }[];
    timeLimitMinutes?: number;
    maxAttempts?: number;
    shuffleQuestions?: boolean;
    shuffleOptions?: boolean;
    showAnswersPolicy?: 'after_submit' | 'after_deadline' | 'manual';
    instructions?: string;
    status: 'published' | 'draft';
    createdByTeacherId: string;
    createdByTeacherName: string;
  }): Assignment {
    const allQuestions = this.getQuestions();
    const questionsMap = new Map(allQuestions.map(q => [q.id, q]));

    // Build question snapshots with orderIndex
    const selectedWithSnapshots = data.selectedQuestions.map((item, index) => {
      const q = questionsMap.get(item.questionId);
      return {
        questionId: item.questionId,
        orderIndex: index + 1,
        points: item.points,
        type: item.type,
        snapshot: q ? JSON.parse(JSON.stringify(q)) : undefined,
      };
    });

    const topicSummary = (data.topicNames || []).join(', ') || 'Chủ đề từ Ngân hàng câu hỏi';

    const newAsg: Assignment = {
      id: `asg_${Date.now()}`,
      title: data.title,
      classId: data.classId,
      className: data.className,
      subjectId: data.subjectId,
      subjectName: data.subjectName,
      topic: topicSummary,
      topicIds: data.topicIds,
      type: data.type,
      assignmentFormat: data.assignmentFormat,
      questionSelectionMode: 'manual',
      selectedQuestions: selectedWithSnapshots,
      timeLimitMinutes: data.timeLimitMinutes,
      maxAttempts: data.maxAttempts || 1,
      shuffleQuestions: data.shuffleQuestions ?? true,
      shuffleOptions: data.shuffleOptions ?? true,
      showAnswersPolicy: data.showAnswersPolicy || 'after_deadline',
      instructions: data.instructions || '',
      description: `${data.type === 'exam' ? 'Bài kiểm tra' : 'Bài tập về nhà'} gồm ${selectedWithSnapshots.length} câu hỏi (${selectedWithSnapshots.filter(q => q.type !== 'essay').length} câu trắc nghiệm, ${selectedWithSnapshots.filter(q => q.type === 'essay').length} câu tự luận). Chủ đề: ${topicSummary}.`,
      dueDate: data.dueDate,
      allowLateDays: Number(data.allowLateDays || 0),
      points: Number(data.points || 10),
      status: data.status,
      createdByTeacherId: data.createdByTeacherId,
      createdByTeacherName: data.createdByTeacherName,
      target: 'all',
      submissionCount: 0,
      totalStudents: this.getStudents(data.classId).length,
      gradedCount: 0,
      completedStudentIds: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    this.state.assignments.unshift(newAsg);

    // Gửi thông báo cho toàn bộ học sinh và phụ huynh nếu bài tập được phát hành
    if (data.status === 'published') {
      const studentsInClass = this.getStudents(data.classId);
      const dueFormatted = new Date(data.dueDate).toLocaleString('vi-VN', {
        hour: '2-digit',
        minute: '2-digit',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
      const now = new Date().toISOString();

      studentsInClass.forEach(student => {
        // Thông báo học sinh
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_std_${student.id}`,
          type: 'assignment_new',
          title: `Đề bài mới môn ${data.subjectName}: ${data.title}`,
          message: `${data.createdByTeacherName} đã giao ${data.type === 'exam' ? 'bài kiểm tra' : 'bài tập'} mới cho lớp ${data.className}. Hạn nộp: ${dueFormatted}${data.allowLateDays > 0 ? ` (Cho phép nộp trễ ${data.allowLateDays} ngày)` : ''}. Đề gồm ${selectedWithSnapshots.length} câu hỏi từ ngân hàng.`,
          targetRole: 'STUDENT',
          targetClassId: data.classId,
          targetStudentId: student.id,
          assignmentId: newAsg.id,
          isRead: false,
          allowLateDays: data.allowLateDays,
          createdAt: now,
          meta: {
            assignmentTitle: data.title,
            className: data.className,
            subjectName: data.subjectName,
            topic: topicSummary,
            dueDate: data.dueDate,
            allowLateDays: data.allowLateDays,
          },
        });

        // Thông báo phụ huynh
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_par_${student.id}`,
          type: 'assignment_new',
          title: `Thông báo ${data.type === 'exam' ? 'Bài kiểm tra' : 'BTVN'} môn ${data.subjectName} của con ${student.fullName}`,
          message: `${data.createdByTeacherName} vừa giao ${data.type === 'exam' ? 'bài kiểm tra' : 'bài tập'} "${data.title}" cho lớp ${data.className}. Hạn nộp: ${dueFormatted}${data.allowLateDays > 0 ? ` (cho phép trễ ${data.allowLateDays} ngày)` : ''}. Kính nhờ Phụ huynh nhắc nhở con làm bài và nộp bài đầy đủ!`,
          targetRole: 'PARENT',
          targetClassId: data.classId,
          targetStudentId: student.id,
          assignmentId: newAsg.id,
          isRead: false,
          allowLateDays: data.allowLateDays,
          createdAt: now,
          meta: {
            assignmentTitle: data.title,
            className: data.className,
            subjectName: data.subjectName,
            studentName: student.fullName,
            dueDate: data.dueDate,
            allowLateDays: data.allowLateDays,
          },
        });
      });
    }

    this.recordAuditLog({
      userId: data.createdByTeacherId,
      userName: data.createdByTeacherName,
      userRole: 'TEACHER',
      action: 'CREATE_ASSIGNMENT_FROM_BANK',
      targetEntity: `Assignment (${data.title})`,
      details: `Giao ${data.type === 'exam' ? 'bài kiểm tra' : 'bài tập'} từ ngân hàng câu hỏi: ${data.title} (${selectedWithSnapshots.length} câu) cho lớp ${data.className}`,
    });

    this.persist();
    return newAsg;
  }

  // --- Submissions ---
  public getSubmissions(assignmentId: string): AssignmentSubmission[] {
    return this.state.submissions.filter(s => s.assignmentId === assignmentId);
  }

  public getStudentSubmission(assignmentId: string, studentId: string): AssignmentSubmission | undefined {
    return this.state.submissions.find(s => s.assignmentId === assignmentId && s.studentId === studentId);
  }

  public submitAssignment(submission: Omit<AssignmentSubmission, 'id' | 'submittedAt'>): AssignmentSubmission {
    const existingIdx = this.state.submissions.findIndex(
      s => s.assignmentId === submission.assignmentId && s.studentId === submission.studentId
    );

    const now = new Date().toISOString();
    const asg = this.getAssignmentById(submission.assignmentId);

    // TC-07: Chặn nộp mới nếu bài đã đóng nhận bài hoặc thu hồi
    if (asg) {
      const effReceive = this.getEffectiveReceiveStatus(asg);
      if (effReceive === 'closed' || effReceive === 'withdrawn') {
        throw new Error('Bài tập đã đóng nhận bài hoặc đã thu hồi, hệ thống không tiếp nhận bài nộp mới.');
      }
      if (effReceive === 'scheduled' || effReceive === 'draft') {
        throw new Error('Bài tập chưa mở nhận bài.');
      }
    }

    // Check if late based on student effective dueDate (individual override or class dueDate)
    let status = submission.status || 'submitted';
    if (asg) {
      const effectiveDueIso = this.getStudentEffectiveDueDate(asg, submission.studentId);
      const dueTime = new Date(effectiveDueIso).getTime();
      const nowTime = new Date(now).getTime();
      if (nowTime > dueTime) {
        status = 'late';
      }
    }

    let saved: AssignmentSubmission;

    // Check attempt limits on resubmit
    if (existingIdx >= 0) {
      const prev = this.state.submissions[existingIdx];
      const maxAtt = asg?.maxAttempts || 3;
      if ((prev.attemptNo || 1) >= maxAtt) {
        throw new Error(`Em đã dùng hết ${maxAtt} lượt nộp cho phép đối với bài tập này.`);
      }
      saved = {
        ...prev,
        ...submission,
        attemptNo: (prev.attemptNo || 1) + 1,
        status,
        gradeStatus: 'ungraded',
        score: undefined,
        questionScores: undefined,
        feedback: undefined,
        publishedAt: undefined,
        version: (prev.version || 1) + 1,
        submittedAt: now,
      };
      this.state.submissions[existingIdx] = saved;
    } else {
      saved = {
        ...submission,
        attemptNo: 1,
        gradeStatus: 'ungraded',
        version: 1,
        status,
        id: `sub_${Date.now()}`,
        submittedAt: now,
      };
      this.state.submissions.push(saved);
    }

    // update assignment submission count
    if (asg) {
      asg.submissionCount = this.getSubmissions(asg.id).length;
    }

    // 3. Học sinh nộp bài -> khi đó cô giáo sẽ nhận được tin.
    // Lúc đó khi gv nhận đc tin, sẽ có 1 button ở trong cái thông báo đó là tick hs đã làm.
    const teacherNotif: AppNotification = {
      id: `notif_${Date.now()}_sub_${saved.id}`,
      type: 'submission_new',
      title: `Bài nộp BTVN mới: ${submission.studentName} (${asg?.className || ''})`,
      message: `Học sinh ${submission.studentName} đã nộp bài tập "${asg?.title}". Chủ đề: "${submission.topic || 'Bài làm học sinh'}". ${submission.fileName ? `Đính kèm: ${submission.fileName}` : ''}`,
      targetRole: 'TEACHER',
      targetUserId: asg?.createdByTeacherId || 'user_teacher_1',
      targetStudentId: submission.studentId,
      targetClassId: asg?.classId,
      assignmentId: submission.assignmentId,
      submissionId: saved.id,
      isRead: false,
      isCompletedTick: false, // Cô giáo có thể bấm tick "Đã làm" trực tiếp từ thông báo
      createdAt: now,
      meta: {
        assignmentTitle: asg?.title,
        studentName: submission.studentName,
        studentId: submission.studentId,
        className: asg?.className,
        subjectName: asg?.subjectName,
        topic: submission.topic,
        fileName: submission.fileName,
        fileUrl: submission.fileUrl,
        fileSize: submission.fileSize,
        content: submission.content,
      }
    };
    this.state.notifications.unshift(teacherNotif);

    this.persist();
    return saved;
  }

  // Giáo viên tick xác nhận học sinh đã làm bài tập (từ thông báo hoặc từ danh sách bài nộp)
  public tickStudentCompleted(assignmentId: string, studentId: string, isCompleted: boolean = true): boolean {
    const asg = this.getAssignmentById(assignmentId);
    if (!asg) return false;
    const effReceive = this.getEffectiveReceiveStatus(asg);
    if (effReceive === 'draft' || effReceive === 'withdrawn') {
      return false;
    }

    if (!asg.completedStudentIds) {
      asg.completedStudentIds = [];
    }

    const st = this.getStudentById(studentId);
    const studentName = st ? st.fullName : 'Học sinh';

    if (isCompleted) {
      if (!asg.completedStudentIds.includes(studentId)) {
        asg.completedStudentIds.push(studentId);
      }
    } else {
      asg.completedStudentIds = asg.completedStudentIds.filter(id => id !== studentId);
    }

    // Update submission record if exists, or create a verified marker submission
    let sub = this.getStudentSubmission(assignmentId, studentId);
    const now = new Date().toISOString();

    if (sub) {
      const isPureOfflineMarker =
        !isCompleted &&
        !sub.fileName &&
        sub.score === undefined &&
        sub.gradeStatus === undefined &&
        sub.content === 'Giáo viên đã trực tiếp kiểm tra và xác nhận hoàn thành bài tập.';

      if (isPureOfflineMarker) {
        this.state.submissions = this.state.submissions.filter(s => s.id !== sub!.id);
        asg.submissionCount = this.getSubmissions(asg.id).length;
      } else {
        sub.isTeacherVerified = isCompleted;
        sub.verifiedAt = isCompleted ? now : undefined;
      }
    } else if (isCompleted) {
      sub = {
        id: `sub_${Date.now()}_ver`,
        assignmentId,
        studentId,
        studentName,
        submittedAt: now,
        isTeacherVerified: true,
        verifiedAt: now,
        status: 'submitted',
        content: 'Giáo viên đã trực tiếp kiểm tra và xác nhận hoàn thành bài tập.',
        topic: asg.topic || asg.title,
      };
      this.state.submissions.push(sub);
      asg.submissionCount = this.getSubmissions(asg.id).length;
    }

    // Update notifications relating to this submission to reflect isCompletedTick
    this.state.notifications.forEach(n => {
      if (n.assignmentId === assignmentId && n.targetStudentId === studentId && n.type === 'submission_new') {
        n.isCompletedTick = isCompleted;
      }
    });

    if (isCompleted) {
      // Send verified notice to student
      this.state.notifications.unshift({
        id: `notif_${Date.now()}_ver_st_${studentId}`,
        type: 'submission_verified',
        title: `✓ Cô giáo đã xác nhận BTVN`,
        message: `Cô giáo đã tick xác nhận em ${studentName} đã hoàn thành bài tập "${asg.title}".`,
        targetRole: 'STUDENT',
        targetClassId: asg.classId,
        targetStudentId: studentId,
        assignmentId,
        isRead: false,
        createdAt: now,
        meta: {
          assignmentTitle: asg.title,
          studentName,
          className: asg.className,
          subjectName: asg.subjectName,
        }
      });

      // Send verified notice to parent
      this.state.notifications.unshift({
        id: `notif_${Date.now()}_ver_pr_${studentId}`,
        type: 'submission_verified',
        title: `✓ Con đã hoàn thành BTVN`,
        message: `Cô giáo đã tick xác nhận con ${studentName} đã hoàn thành bài tập "${asg.title}" môn ${asg.subjectName}.`,
        targetRole: 'PARENT',
        targetClassId: asg.classId,
        targetStudentId: studentId,
        targetUserId: st?.parentId || 'user_parent_1',
        assignmentId,
        isRead: false,
        createdAt: now,
        meta: {
          assignmentTitle: asg.title,
          studentName,
          className: asg.className,
          subjectName: asg.subjectName,
        }
      });
    }

    this.persist();
    return true;
  }

  // Giáo viên gửi thông báo cho phụ huynh của học sinh để phụ huynh nhắc hs làm BTVN
  public sendParentReminder(assignmentId: string, studentId: string, customMessage?: string): boolean {
    const asg = this.getAssignmentById(assignmentId);
    if (!asg) return false;

    const student = this.getStudentById(studentId);
    if (!student) return false;

    const dueFormatted = new Date(asg.dueDate).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });

    const now = new Date().toISOString();
    const reminderNotif: AppNotification = {
      id: `notif_${Date.now()}_remind_${studentId}`,
      type: 'parent_homework_reminder',
      title: `🔔 Nhắc nhở BTVN: Em ${student.fullName} chưa nộp bài`,
      message: customMessage || `Kính gửi Phụ huynh: Em ${student.fullName} (Lớp ${asg.className}) hiện chưa nộp bài tập môn ${asg.subjectName}: "${asg.title}". Hạn nộp là ${dueFormatted}. Kính nhờ Phụ huynh đôn đốc con khẩn trương làm bài và nộp cho cô giáo!`,
      targetRole: 'PARENT',
      targetClassId: asg.classId,
      targetStudentId: studentId,
      targetUserId: student.parentId || 'user_parent_1',
      assignmentId,
      isRead: false,
      createdAt: now,
      meta: {
        assignmentTitle: asg.title,
        studentName: student.fullName,
        studentId,
        className: asg.className,
        subjectName: asg.subjectName,
        dueDate: asg.dueDate,
        allowLateDays: asg.allowLateDays,
      }
    };

    // Also send an urgent alert to the student
    const studentAlert: AppNotification = {
      id: `notif_${Date.now()}_remind_st_${studentId}`,
      type: 'assignment_reminder',
      title: `🔔 Nhắc nhở: Em hãy hoàn thành BTVN môn ${asg.subjectName}`,
      message: `Cô giáo nhắc em ${student.fullName} mau chóng hoàn thành bài tập "${asg.title}". Hạn nộp: ${dueFormatted}. Đừng để bị trừ điểm chuyên cần nhé!`,
      targetRole: 'STUDENT',
      targetClassId: asg.classId,
      targetStudentId: studentId,
      assignmentId,
      isRead: false,
      createdAt: now,
      meta: {
        assignmentTitle: asg.title,
        studentName: student.fullName,
        className: asg.className,
        subjectName: asg.subjectName,
        dueDate: asg.dueDate,
      }
    };

    this.state.notifications.unshift(reminderNotif);
    this.state.notifications.unshift(studentAlert);
    this.persist();
    return true;
  }

  // Giáo viên gửi nhắc nhở đồng loạt tới tất cả phụ huynh của học sinh chưa nộp bài
  public sendBatchParentReminders(assignmentId: string): number {
    const asg = this.getAssignmentById(assignmentId);
    if (!asg) return 0;

    const students = this.getStudents(asg.classId);
    let count = 0;

    students.forEach(st => {
      const sub = this.getStudentSubmission(assignmentId, st.id);
      const isDone = sub?.isTeacherVerified || asg.completedStudentIds?.includes(st.id);
      if (!sub || !isDone) {
        this.sendParentReminder(assignmentId, st.id);
        count++;
      }
    });

    return count;
  }

  // Tự động kiểm tra và nhắc nhở học sinh + phụ huynh khi hết hạn làm bài
  public checkAndTriggerOverdueReminders(): void {
    const now = Date.now();
    let added = false;

    this.state.assignments.forEach(asg => {
      if (this.getEffectiveReceiveStatus(asg) !== 'open') return;

      const dueTime = new Date(asg.dueDate).getTime();
      const graceMs = (asg.allowLateDays || 0) * 24 * 60 * 60 * 1000;
      const totalDeadline = dueTime + graceMs;

      // If overdue past deadline + grace period
      if (now > totalDeadline) {
        const students = this.getStudents(asg.classId);
        students.forEach(st => {
          const sub = this.getStudentSubmission(asg.id, st.id);
          const isDone = sub?.isTeacherVerified || asg.completedStudentIds?.includes(st.id);

          if (!sub || !isDone) {
            // Check if overdue alert was already sent in last 24h
            const alreadyAlerted = this.state.notifications.some(
              n => n.assignmentId === asg.id && n.targetStudentId === st.id && n.type === 'assignment_overdue_alert'
            );

            if (!alreadyAlerted) {
              const nowIso = new Date().toISOString();
              // Student overdue alert
              this.state.notifications.unshift({
                id: `notif_${Date.now()}_overdue_st_${st.id}`,
                type: 'assignment_overdue_alert',
                title: `⚠️ Cảnh báo BTVN quá hạn: Môn ${asg.subjectName}`,
                message: `Bài tập "${asg.title}" đã quá hạn nộp (đã hết cả thời gian gia hạn ${asg.allowLateDays || 0} ngày). Em hãy hoàn thành ngay và nộp bài để cô giáo kiểm tra!`,
                targetRole: 'STUDENT',
                targetClassId: asg.classId,
                targetStudentId: st.id,
                assignmentId: asg.id,
                isRead: false,
                createdAt: nowIso,
                meta: {
                  assignmentTitle: asg.title,
                  studentName: st.fullName,
                  className: asg.className,
                  subjectName: asg.subjectName,
                  dueDate: asg.dueDate,
                }
              });

              // Parent overdue alert
              this.state.notifications.unshift({
                id: `notif_${Date.now()}_overdue_pr_${st.id}`,
                type: 'parent_homework_reminder',
                title: `⚠️ BTVN Quá hạn: Em ${st.fullName} chưa hoàn thành bài tập`,
                message: `Bài tập môn ${asg.subjectName}: "${asg.title}" của con đã quá hạn nộp. Kính nhờ Phụ huynh nhắc nhở con làm ngay để cô giáo ghi nhận.`,
                targetRole: 'PARENT',
                targetClassId: asg.classId,
                targetStudentId: st.id,
                targetUserId: st.parentId || 'user_parent_1',
                assignmentId: asg.id,
                isRead: false,
                createdAt: nowIso,
                meta: {
                  assignmentTitle: asg.title,
                  studentName: st.fullName,
                  className: asg.className,
                  subjectName: asg.subjectName,
                  dueDate: asg.dueDate,
                }
              });
              added = true;
            }
          }
        });
      }
    });

    if (added) {
      this.persist();
    }
  }

  // --- Notifications Query & Management ---
  public getNotifications(role?: string, targetId?: string, classId?: string): AppNotification[] {
    if (!this.state.notifications) {
      this.state.notifications = DEFAULT_NOTIFICATIONS;
    }

    if (!role) return this.state.notifications;

    return this.state.notifications.filter(n => {
      // Role match
      if (n.targetRole !== 'ALL' && n.targetRole !== role) {
        return false;
      }
      // Student specific match
      if (role === 'STUDENT' && targetId && n.targetStudentId && n.targetStudentId !== targetId) {
        return false;
      }
      // Parent specific match
      if (role === 'PARENT' && targetId && n.targetStudentId && n.targetStudentId !== targetId && n.targetUserId !== targetId) {
        return false;
      }
      return true;
    });
  }

  public markNotificationRead(id: string): void {
    const notif = this.state.notifications.find(n => n.id === id);
    if (notif) {
      notif.isRead = true;
      this.persist();
    }
  }

  public markAllNotificationsRead(role?: string, targetId?: string): void {
    this.state.notifications.forEach(n => {
      if (!role || n.targetRole === role || n.targetRole === 'ALL') {
        n.isRead = true;
      }
    });
    this.persist();
  }

  public tickNotificationCompleted(notificationId: string): boolean {
    const notif = this.state.notifications.find(n => n.id === notificationId);
    if (!notif || !notif.assignmentId || !notif.targetStudentId) return false;

    notif.isCompletedTick = true;
    notif.isRead = true;
    this.tickStudentCompleted(notif.assignmentId, notif.targetStudentId, true);
    return true;
  }

  public gradeSubmission(submissionId: string, score: number, feedback: string): AssignmentSubmission | null {
    const sub = this.state.submissions.find(s => s.id === submissionId);
    if (!sub) return null;
    sub.score = score;
    sub.feedback = feedback;
    sub.gradedAt = new Date().toISOString();
    sub.status = 'graded';
    sub.isTeacherVerified = true;

    // update assignment graded count & verified student
    const asg = this.getAssignmentById(sub.assignmentId);
    if (asg) {
      asg.gradedCount = this.state.submissions.filter(s => s.assignmentId === asg.id && s.status === 'graded').length;
      if (!asg.completedStudentIds) asg.completedStudentIds = [];
      if (!asg.completedStudentIds.includes(sub.studentId)) {
        asg.completedStudentIds.push(sub.studentId);
      }
    }

    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'GRADE_SUBMISSION',
      targetEntity: `Submission (${sub.studentName})`,
      details: `Chấm điểm bài tập cho học sinh ${sub.studentName}: ${score}/10 điểm`,
    });

    this.persist();
    return sub;
  }

  // --- Quizzes & Questions ---
  public getQuestions(): Question[] {
    return this.state.questions;
  }

  public createQuestion(q: Omit<Question, 'id'>): Question {
    const newQ: Question = { ...q, id: `q_${Date.now()}` };
    this.state.questions.unshift(newQ);
    this.persist();
    return newQ;
  }

  public addBatchQuestions(questions: Omit<Question, 'id'>[]): Question[] {
    const newItems: Question[] = questions.map((q, i) => ({
      ...q,
      id: `q_${Date.now()}_${i}_${Math.random().toString(36).substring(2, 6)}`,
    }));
    this.state.questions.unshift(...newItems);
    this.persist();
    return newItems;
  }

  public updateQuestion(id: string, updates: Partial<Question>): Question | null {
    const idx = this.state.questions.findIndex(q => q.id === id);
    if (idx === -1) return null;
    const updated = {
      ...this.state.questions[idx],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    this.state.questions[idx] = updated;
    this.persist();
    return updated;
  }

  public deleteQuestion(id: string): boolean {
    const initialLen = this.state.questions.length;
    this.state.questions = this.state.questions.filter(q => q.id !== id);
    const deleted = this.state.questions.length < initialLen;
    if (deleted) this.persist();
    return deleted;
  }

  public deleteQuestions(ids: string[]): number {
    const idSet = new Set(ids);
    const before = this.state.questions.length;
    this.state.questions = this.state.questions.filter(q => !idSet.has(q.id));
    const count = before - this.state.questions.length;
    if (count > 0) this.persist();
    return count;
  }

  public bulkUpdateQuestionStatus(ids: string[], status: Question['status']): number {
    const idSet = new Set(ids);
    let count = 0;
    this.state.questions = this.state.questions.map(q => {
      if (idSet.has(q.id)) {
        count++;
        return { ...q, status, updatedAt: new Date().toISOString() };
      }
      return q;
    });
    if (count > 0) this.persist();
    return count;
  }

  public resetQuestionsToSeed(): void {
    this.state.questions = [...SEED_QUESTIONS];
    this.persist();
  }

  public getQuizzes(classId?: string): Quiz[] {
    if (classId) {
      return this.state.quizzes.filter(q => q.classId === classId);
    }
    return this.state.quizzes;
  }

  public createQuiz(quiz: Omit<Quiz, 'id' | 'attemptsCount'>): Quiz {
    const newQuiz: Quiz = {
      ...quiz,
      id: `quiz_${Date.now()}`,
      attemptsCount: 0,
    };
    this.state.quizzes.unshift(newQuiz);
    this.persist();
    return newQuiz;
  }

  public submitQuizAttempt(attempt: Omit<QuizAttempt, 'id' | 'submittedAt'>): QuizAttempt {
    const newAttempt: QuizAttempt = {
      ...attempt,
      id: `att_quiz_${Date.now()}`,
      submittedAt: new Date().toISOString(),
    };
    this.state.quizAttempts.push(newAttempt);
    const quiz = this.state.quizzes.find(q => q.id === attempt.quizId);
    if (quiz) {
      quiz.attemptsCount++;
    }
    this.persist();
    return newAttempt;
  }

  // --- Learning Resources ---
  public getResources(grade?: number): LearningResource[] {
    if (grade) {
      return this.state.resources.filter(r => r.gradeLevel === grade);
    }
    return this.state.resources;
  }

  public addResource(res: Omit<LearningResource, 'id' | 'createdAt' | 'downloadCount'>): LearningResource {
    const newRes: LearningResource = {
      ...res,
      id: `res_${Date.now()}`,
      downloadCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.state.resources.unshift(newRes);
    this.persist();
    return newRes;
  }

  public deleteResource(id: string): boolean {
    this.state.resources = this.state.resources.filter(r => r.id !== id);
    this.persist();
    return true;
  }

  // --- Gradebook ---
  public getGrades(classId: string, semester: 1 | 2 = 2): StudentGradeRecord[] {
    let records = this.state.grades.filter(g => g.classId === classId && g.semester === semester);
    // If some students in class don't have record yet, seed blank records
    const students = this.getStudents(classId);
    const existingStudentIds = new Set(records.map(r => r.studentId));

    let addedNew = false;
    students.forEach(st => {
      if (!existingStudentIds.has(st.id)) {
        const newRecord: StudentGradeRecord = {
          id: `gr_${Date.now()}_${st.id}`,
          studentId: st.id,
          studentName: st.fullName,
          studentCode: st.studentCode,
          classId: classId,
          subjectId: 'sub_math',
          semester: semester,
        };
        records.push(newRecord);
        this.state.grades.push(newRecord);
        addedNew = true;
      }
    });

    if (addedNew) {
      this.persist();
    }

    return records;
  }

  public batchSaveGrades(records: StudentGradeRecord[]) {
    records.forEach(updated => {
      // Calculate weighted average score: (oral1 + oral2 + 15m1 + 15m2 + midterm*2 + final*3) / 9
      const scores = [
        updated.oral1,
        updated.oral2,
        updated.test15m1,
        updated.test15m2,
        updated.midterm !== undefined ? updated.midterm * 2 : undefined,
        updated.finalTerm !== undefined ? updated.finalTerm * 3 : undefined,
      ].filter((s): s is number => s !== undefined && s !== null);

      const weights = [
        updated.oral1 !== undefined ? 1 : 0,
        updated.oral2 !== undefined ? 1 : 0,
        updated.test15m1 !== undefined ? 1 : 0,
        updated.test15m2 !== undefined ? 1 : 0,
        updated.midterm !== undefined ? 2 : 0,
        updated.finalTerm !== undefined ? 3 : 0,
      ].reduce((a, b) => a + b, 0);

      if (weights > 0 && scores.length > 0) {
        const sum = scores.reduce((a, b) => a + b, 0);
        updated.averageScore = parseFloat((sum / weights).toFixed(1));
      }

      const idx = this.state.grades.findIndex(g => g.id === updated.id);
      if (idx >= 0) {
        this.state.grades[idx] = updated;
      } else {
        this.state.grades.push(updated);
      }
    });

    this.recordAuditLog({
      userId: 'user_teacher_1',
      userName: 'Giáo viên',
      userRole: 'TEACHER',
      action: 'UPDATE_GRADES',
      targetEntity: `Gradebook`,
      details: `Đã lưu cập nhật bảng điểm cho ${records.length} học sinh`,
    });

    this.persist();
  }

  // --- Behavior & Rewards ---
  public getBehaviors(classId?: string): BehaviorRecord[] {
    if (classId) {
      return this.state.behaviors.filter(b => b.classId === classId);
    }
    return this.state.behaviors;
  }

  public addBehavior(b: Omit<BehaviorRecord, 'id'>): BehaviorRecord {
    const newRecord: BehaviorRecord = {
      ...b,
      id: `bh_${Date.now()}`,
    };
    this.state.behaviors.unshift(newRecord);
    // adjust student behavior points
    const student = this.getStudentById(b.studentId);
    if (student) {
      student.behaviorPoints = Math.max(0, student.behaviorPoints + b.pointsDelta);
    }
    this.persist();
    return newRecord;
  }

  // --- Smart Alerts ---
  public getAlerts(classId?: string): SmartAlert[] {
    if (classId) {
      return this.state.alerts.filter(a => a.classId === classId);
    }
    return this.state.alerts;
  }

  public updateAlertStatus(alertId: string, status: SmartAlert['status']): boolean {
    const alert = this.state.alerts.find(a => a.id === alertId);
    if (!alert) return false;
    alert.status = status;
    if (status === 'resolved') {
      alert.resolvedAt = new Date().toISOString();
    }
    this.persist();
    return true;
  }

  // --- Announcements ---
  public getAnnouncements(): Announcement[] {
    return this.state.announcements;
  }

  public createAnnouncement(anc: Omit<Announcement, 'id' | 'createdAt' | 'readCount'>): Announcement {
    const newAnc: Announcement = {
      ...anc,
      id: `anc_${Date.now()}`,
      readCount: 0,
      createdAt: new Date().toISOString(),
    };
    this.state.announcements.unshift(newAnc);
    this.recordAuditLog({
      userId: anc.authorId,
      userName: anc.authorName,
      userRole: anc.authorRole,
      action: 'POST_ANNOUNCEMENT',
      targetEntity: `Announcement (${newAnc.title})`,
      details: `Đăng thông báo mới mức độ ${newAnc.priority}: ${newAnc.title}`,
    });
    this.persist();
    return newAnc;
  }

  public markAnnouncementRead(id: string) {
    const anc = this.state.announcements.find(a => a.id === id);
    if (anc) {
      anc.readCount = Math.min(anc.totalRecipients, anc.readCount + 1);
      this.persist();
    }
  }

  // --- Direct Messages ---
  public getMessages(userId1: string, userId2: string): ChatMessage[] {
    return this.state.messages.filter(
      m => (m.senderId === userId1 && m.receiverId === userId2) || (m.senderId === userId2 && m.receiverId === userId1)
    );
  }

  public sendMessage(msg: Omit<ChatMessage, 'id' | 'timestamp' | 'isRead'>): ChatMessage {
    const newMsg: ChatMessage = {
      ...msg,
      id: `msg_${Date.now()}`,
      timestamp: new Date().toISOString(),
      isRead: false,
    };
    this.state.messages.push(newMsg);
    this.persist();
    return newMsg;
  }

  // --- Audit Logs ---
  public getAuditLogs(): AuditLog[] {
    return this.state.auditLogs;
  }

  // --- Statistics for Teacher Dashboard ---
  public getTeacherStats(teacherId = 'user_teacher_1'): TeacherStats {
    const classes = this.getClasses().filter(c => c.homeroomTeacherId === teacherId);
    const totalStudents = classes.reduce((acc, c) => acc + c.studentCount, 0);

    // Today's attendance session
    const todayStr = '2025-02-20'; // Reference date in seed
    const todaySessions = this.state.attendanceSessions.filter(a => a.date === todayStr);

    let present = 0;
    let absent = 0;
    let late = 0;

    todaySessions.forEach(s => {
      present += s.summary.present;
      absent += (s.summary.absentExcused + s.summary.absentUnexcused);
      late += s.summary.late;
    });

    const pendingGradingCount = this.state.submissions.filter(s => s.status === 'submitted' || s.status === 'late').length;
    const activeAlertsCount = this.state.alerts.filter(a => a.status !== 'resolved').length;

    return {
      totalStudents: totalStudents || 32,
      presentToday: present || 30,
      absentToday: absent || 1,
      lateToday: late || 1,
      pendingGradingCount,
      missingSubmissionsCount: 4,
      activeAlertsCount,
      todayClassesCount: 4,
    };
  }

  // =========================================================================
  // --- QUẢN LÝ DANH SÁCH BÀI TẬP ĐÃ GIAO (SPEC V1.0) ---
  // =========================================================================

  private appendAssignmentEvent(
    asg: Assignment,
    eventType: AssignmentAuditEvent['eventType'],
    summary: string,
    actorId: string,
    actorName: string,
    payload?: Record<string, any>
  ) {
    if (!asg.events) asg.events = [];
    asg.events.unshift({
      id: `evt_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      assignmentId: asg.id,
      actorId,
      actorName,
      eventType,
      summary,
      payload,
      createdAt: new Date().toISOString(),
    });
  }

  public getAssignmentCode(asg: Assignment): string {
    if (asg.code) return asg.code;
    const suffix = asg.id.replace(/\D/g, '').slice(-4).padStart(4, '0');
    return `BT-${new Date(asg.createdAt || Date.now()).getFullYear()}-${suffix}`;
  }

  public getEffectiveReceiveStatus(asg: Assignment): AssignmentReceiveStatus {
    if (asg.withdrawnAt || asg.receiveStatus === 'withdrawn') return 'withdrawn';
    if (asg.receiveStatus === 'closed' || asg.status === 'closed') return 'closed';
    if (asg.receiveStatus === 'draft' || asg.status === 'draft') return 'draft';
    if (asg.opensAt && new Date(asg.opensAt).getTime() > Date.now()) return 'scheduled';
    return 'open';
  }

  public getSubmissionEffectiveGradeStatus(sub?: AssignmentSubmission): AssignmentGradeStatus {
    if (!sub) return 'ungraded';
    if (sub.gradeStatus) return sub.gradeStatus;
    if (sub.status === 'graded' || sub.score !== undefined) return 'published';
    return 'ungraded';
  }

  public getAssignmentOverallGradeStatus(asg: Assignment, subs?: AssignmentSubmission[]): AssignmentGradeStatus {
    const list = subs || this.getSubmissions(asg.id);
    if (list.length === 0) return 'ungraded';
    const statuses = list.map(s => this.getSubmissionEffectiveGradeStatus(s));
    if (statuses.every(st => st === 'published')) return 'published';
    if (statuses.some(st => st === 'graded' || st === 'published')) {
      return statuses.some(st => st === 'ungraded' || st === 'draft_grade') ? 'draft_grade' : 'graded';
    }
    if (statuses.some(st => st === 'draft_grade')) return 'draft_grade';
    return 'ungraded';
  }

  public getStudentEffectiveDueDate(asg: Assignment, studentId: string): string {
    return asg.recipientOverrides?.[studentId]?.dueOverrideAt || asg.dueDate;
  }

  public getAssignmentRecipients(asg: Assignment): Student[] {
    const classStudents = this.getStudents(asg.classId);
    if ((asg.target === 'group' || asg.target === 'individual') && asg.targetStudentIds && asg.targetStudentIds.length > 0) {
      const idSet = new Set(asg.targetStudentIds);
      return classStudents.filter(s => idSet.has(s.id));
    }
    return classStudents;
  }

  /**
   * Thống nhất nguồn sự thật từ bản ghi bài nộp thực tế (không dùng cache sai lệch)
   */
  public getAssignmentStats(asg: Assignment): AssignmentComputedStats {
    const recipients = this.getAssignmentRecipients(asg);
    const recipientIdSet = new Set(recipients.map(r => r.id));
    const allSubs = this.getSubmissions(asg.id);
    const subs =
      recipients.length > 0
        ? allSubs.filter(s => recipientIdSet.has(s.studentId))
        : allSubs;
    const subByStudent = new Map(subs.map(s => [s.studentId, s]));
    const nowMs = Date.now();
    const graceMs = (asg.allowLateDays || 0) * 86400000;
    const effReceive = this.getEffectiveReceiveStatus(asg);

    let gradedCount = 0;
    let ungradedCount = 0;
    let draftGradeCount = 0;
    let publishedCount = 0;
    let lateCount = 0;
    let resubmitCount = 0;
    let verifiedCount = 0;

    subs.forEach(s => {
      const gStatus = this.getSubmissionEffectiveGradeStatus(s);
      if (gStatus === 'graded' || gStatus === 'published') gradedCount++;
      else ungradedCount++;
      if (gStatus === 'draft_grade') draftGradeCount++;
      if (gStatus === 'published') publishedCount++;

      const effDueMs = new Date(this.getStudentEffectiveDueDate(asg, s.studentId)).getTime();
      if (s.status === 'late' || new Date(s.submittedAt).getTime() > effDueMs) {
        lateCount++;
      }
      if (s.status === 'resubmit_required') resubmitCount++;
      if (s.isTeacherVerified || asg.completedStudentIds?.includes(s.studentId)) {
        verifiedCount++;
      }
    });

    let overdueMissingCount = 0;
    if (effReceive !== 'draft' && effReceive !== 'withdrawn') {
      recipients.forEach(st => {
        if (!subByStudent.has(st.id)) {
          const effDueMs = new Date(this.getStudentEffectiveDueDate(asg, st.id)).getTime();
          if (nowMs > effDueMs + graceMs) {
            overdueMissingCount++;
          }
        }
      });
    }

    const totalRecipients = recipients.length > 0 ? recipients.length : (asg.totalStudents || 0);
    const submittedCount = subs.length;
    const unsubmittedCount = Math.max(0, totalRecipients - submittedCount);

    return {
      totalRecipients,
      submittedCount,
      unsubmittedCount,
      ungradedCount,
      draftGradeCount,
      gradedCount,
      publishedCount,
      lateCount,
      overdueMissingCount,
      resubmitCount,
      verifiedCount,
      hasCountMismatch: (asg.submissionCount !== submittedCount) || (asg.gradedCount !== gradedCount),
      cachedSubmissionCount: asg.submissionCount,
      cachedGradedCount: asg.gradedCount,
      isDraftWithSubmissions: effReceive === 'draft' && submittedCount > 0,
    };
  }

  public reconcileAssignmentCachedCounts(params: {
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): number {
    let fixed = 0;
    this.state.assignments.forEach(asg => {
      const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
      if (!perm.ok) return;
      const stats = this.getAssignmentStats(asg);
      if (stats.hasCountMismatch || asg.totalStudents !== stats.totalRecipients) {
        const oldSub = asg.submissionCount;
        const oldGraded = asg.gradedCount;
        asg.submissionCount = stats.submittedCount;
        asg.gradedCount = stats.gradedCount;
        asg.totalStudents = stats.totalRecipients;
        this.appendAssignmentEvent(
          asg,
          'METADATA_UPDATED',
          `Đồng bộ bộ đếm cache theo bản ghi thực tế: Đã nộp ${oldSub} → ${stats.submittedCount}, Đã chấm ${oldGraded} → ${stats.gradedCount}.`,
          params.actorId,
          params.actorName
        );
        fixed++;
      }
    });
    if (fixed > 0) {
      this.recordAuditLog({
        userId: params.actorId,
        userName: params.actorName,
        userRole: params.actorRole,
        action: 'RECONCILE_ASSIGNMENT_COUNTS',
        targetEntity: 'Assignments',
        details: `Đồng bộ bộ đếm cache khớp bản ghi thực tế cho ${fixed} lượt giao bài tập.`,
      });
      this.persist();
    }
    return fixed;
  }

  public getVisibleAssignmentsForStudent(studentId: string, classId: string): Assignment[] {
    return this.getAssignments(classId).filter(asg => {
      const eff = this.getEffectiveReceiveStatus(asg);
      if (eff === 'draft' || eff === 'scheduled' || eff === 'withdrawn') return false;
      if ((asg.target === 'group' || asg.target === 'individual') && asg.targetStudentIds && asg.targetStudentIds.length > 0) {
        return asg.targetStudentIds.includes(studentId);
      }
      return true;
    });
  }

  public getSubmissionVisibleToStudentOrParent(
    assignmentId: string,
    studentId: string
  ): { submission: AssignmentSubmission; isGradePublished: boolean } | undefined {
    const sub = this.getStudentSubmission(assignmentId, studentId);
    if (!sub) return undefined;
    const isGradePublished = this.getSubmissionEffectiveGradeStatus(sub) === 'published';
    if (isGradePublished) {
      return { submission: sub, isGradePublished: true };
    }
    return {
      submission: {
        ...sub,
        score: undefined,
        questionScores: undefined,
        feedback: undefined,
      },
      isGradePublished: false,
    };
  }

  public checkAssignmentActorPermission(actorId: string, actorRole: UserRole, classId: string): { ok: true } | { ok: false; code: number; error: string } {
    if (actorRole === 'ADMIN') return { ok: true };
    if (actorRole !== 'TEACHER') {
      return { ok: false, code: 403, error: 'Tài khoản của bạn không có quyền thực hiện thao tác quản lý bài tập.' };
    }
    const perms = this.getTeacherPermissions(actorId, actorRole);
    const hasClass = perms.classes.some(c => c.id === classId);
    if (!hasClass) {
      return { ok: false, code: 403, error: 'Bạn không được phân công giảng dạy lớp học này (403 Forbidden).' };
    }
    return { ok: true };
  }

  public getAssignmentsByPermission(actorId: string, actorRole: UserRole): Assignment[] {
    if (actorRole === 'ADMIN') return this.getAssignments();
    if (actorRole === 'TEACHER') {
      const perms = this.getTeacherPermissions(actorId, actorRole);
      const allowedIds = new Set(perms.classes.map(c => c.id));
      return this.getAssignments().filter(a => allowedIds.has(a.classId));
    }
    return [];
  }

  // MOD-01: Gia hạn hạn nộp (Toàn lớp hoặc danh sách học sinh cụ thể)
  public extendAssignmentDeadline(params: {
    assignmentId: string;
    recipientIds?: string[]; // rỗng hoặc undefined = toàn lớp
    newDueAt: string;
    reason: string;
    expectedVersion?: number;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; assignment: Assignment } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    if (this.getEffectiveReceiveStatus(asg) === 'withdrawn') {
      return { ok: false, code: 422, error: 'Bài tập đã bị thu hồi, không thể gia hạn.' };
    }

    const reason = params.reason.trim();
    if (reason.length < 10 || reason.length > 500) {
      return { ok: false, code: 400, error: 'Lý do gia hạn phải từ 10 đến 500 ký tự.' };
    }

    const newDueMs = new Date(params.newDueAt).getTime();
    if (Number.isNaN(newDueMs) || newDueMs <= Date.now()) {
      return { ok: false, code: 400, error: 'Hạn nộp mới phải sau thời điểm hiện tại.' };
    }

    const currentVersion = asg.version || 1;
    if (params.expectedVersion !== undefined && params.expectedVersion !== currentVersion) {
      return { ok: false, code: 409, error: 'Dữ liệu bài tập đã thay đổi ở phiên khác (409 Conflict). Vui lòng tải lại.' };
    }

    const nowIso = new Date().toISOString();
    const dueFormatted = new Date(params.newDueAt).toLocaleString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });

    const targetStudents =
      params.recipientIds && params.recipientIds.length > 0
        ? this.getStudents(asg.classId).filter(s => params.recipientIds!.includes(s.id))
        : [];

    if (targetStudents.length > 0) {
      if (!asg.recipientOverrides) asg.recipientOverrides = {};
      targetStudents.forEach(st => {
        asg.recipientOverrides![st.id] = {
          dueOverrideAt: params.newDueAt,
          reason,
          updatedAt: nowIso,
          updatedBy: params.actorName,
        };
      });
      this.appendAssignmentEvent(
        asg,
        'EXTEND_DEADLINE',
        `Gia hạn riêng cho ${targetStudents.length} học sinh đến ${dueFormatted}. Lý do: ${reason}`,
        params.actorId,
        params.actorName,
        { recipientIds: targetStudents.map(s => s.id), newDueAt: params.newDueAt, reason }
      );
    } else {
      asg.dueDate = params.newDueAt;
      this.appendAssignmentEvent(
        asg,
        'EXTEND_DEADLINE',
        `Gia hạn toàn lớp ${asg.className} đến ${dueFormatted}. Lý do: ${reason}`,
        params.actorId,
        params.actorName,
        { scope: 'all', newDueAt: params.newDueAt, reason }
      );
    }

    asg.version = currentVersion + 1;
    asg.updatedAt = nowIso;

    const notifyList = targetStudents.length > 0 ? targetStudents : this.getStudents(asg.classId);
    notifyList.forEach(st => {
      this.state.notifications.unshift({
        id: `notif_${Date.now()}_ext_st_${st.id}_${Math.random().toString(36).substring(2, 5)}`,
        type: 'assignment_reminder',
        title: `Gia hạn hạn nộp: ${asg.title}`,
        message: `${params.actorName} đã gia hạn nộp bài "${asg.title}" đến ${dueFormatted}. Lý do: ${reason}`,
        targetRole: 'STUDENT',
        targetClassId: asg.classId,
        targetStudentId: st.id,
        assignmentId: asg.id,
        isRead: false,
        createdAt: nowIso,
      });
    });

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: 'EXTEND_ASSIGNMENT_DEADLINE',
      targetEntity: `Assignment (${asg.title})`,
      details: `Gia hạn ${targetStudents.length > 0 ? `${targetStudents.length} HS` : 'toàn lớp'} đến ${dueFormatted}: ${reason}`,
    });

    this.persist();
    return { ok: true, assignment: asg };
  }

  // MOD-02: Nhắc nộp bài có chọn đối tượng + chống spam gửi trùng
  public sendTargetedReminders(params: {
    assignmentId: string;
    studentIds: string[];
    channel: 'app_and_parent' | 'student_only' | 'parent_only';
    message: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; sentCount: number; skippedNames: string[]; parentSkippedCount: number } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    const effReceive = this.getEffectiveReceiveStatus(asg);
    if (effReceive === 'draft' || effReceive === 'withdrawn') {
      return { ok: false, code: 422, error: 'Không thể gửi nhắc nộp cho bài tập ở trạng thái Bản nháp hoặc Đã thu hồi.' };
    }

    const msg = params.message.trim();
    if (!msg || msg.length > 1000) {
      return { ok: false, code: 400, error: 'Nội dung nhắc nhở không được để trống và tối đa 1000 ký tự.' };
    }
    if (params.studentIds.length === 0) {
      return { ok: false, code: 400, error: 'Vui lòng chọn ít nhất 1 học sinh để gửi nhắc nộp.' };
    }

    const students = this.getStudents(asg.classId).filter(s => params.studentIds.includes(s.id));
    const cooldownMs = 5 * 60 * 1000; // Chống gửi trùng trong 5 phút
    const nowMs = Date.now();
    const nowIso = new Date(nowMs).toISOString();
    let sentCount = 0;
    let parentSkippedCount = 0;
    const skippedNames: string[] = [];

    students.forEach(st => {
      const sub = this.getStudentSubmission(asg.id, st.id);
      const alreadyVerified = sub?.isTeacherVerified || asg.completedStudentIds?.includes(st.id);
      if (sub && sub.status !== 'resubmit_required' && alreadyVerified) {
        skippedNames.push(`${st.fullName} (đã hoàn thành)`);
        return;
      }

      // Kiểm tra chống trùng trong 5 phút gần nhất
      const recentNotif = this.state.notifications.find(
        n =>
          n.assignmentId === asg.id &&
          n.targetStudentId === st.id &&
          (n.type === 'assignment_reminder' || n.type === 'parent_homework_reminder') &&
          nowMs - new Date(n.createdAt).getTime() < cooldownMs
      );
      if (recentNotif) {
        skippedNames.push(`${st.fullName} (vừa nhắc < 5 phút)`);
        return;
      }

      const parentConfigured = st.parentAppStatus !== 'not_registered' && Boolean(st.parentId || st.parentPhone);
      if (params.channel === 'parent_only' && !parentConfigured) {
        parentSkippedCount++;
        skippedNames.push(`${st.fullName} (PH chưa cấu hình nhận thông báo)`);
        return;
      }

      let deliveredForStudent = false;

      if (params.channel === 'app_and_parent' || params.channel === 'student_only') {
        this.state.notifications.unshift({
          id: `notif_${nowMs}_rem_st_${st.id}_${Math.random().toString(36).substring(2, 5)}`,
          type: 'assignment_reminder',
          title: `Nhắc nộp bài tập: ${asg.title}`,
          message: msg.replace(/\{ten_hoc_sinh\}/g, st.fullName),
          targetRole: 'STUDENT',
          targetClassId: asg.classId,
          targetStudentId: st.id,
          assignmentId: asg.id,
          isRead: false,
          createdAt: nowIso,
        });
        deliveredForStudent = true;
      }

      if (params.channel === 'app_and_parent' || params.channel === 'parent_only') {
        if (parentConfigured) {
          this.state.notifications.unshift({
            id: `notif_${nowMs}_rem_pr_${st.id}_${Math.random().toString(36).substring(2, 5)}`,
            type: 'parent_homework_reminder',
            title: `Nhắc nhở phụ huynh: Em ${st.fullName} chưa hoàn thành "${asg.title}"`,
            message: msg.replace(/\{ten_hoc_sinh\}/g, st.fullName),
            targetRole: 'PARENT',
            targetClassId: asg.classId,
            targetStudentId: st.id,
            targetUserId: st.parentId || 'user_parent_1',
            assignmentId: asg.id,
            isRead: false,
            createdAt: nowIso,
          });
          deliveredForStudent = true;
        } else {
          parentSkippedCount++;
        }
      }

      if (sub && deliveredForStudent) {
        if (!sub.reminderHistory) sub.reminderHistory = [];
        sub.reminderHistory.unshift({
          id: `rem_${nowMs}_${st.id}`,
          sentAt: nowIso,
          channel: params.channel,
          message: msg,
          sentBy: params.actorName,
        });
      }

      if (deliveredForStudent) sentCount++;
    });

    if (sentCount > 0) {
      this.appendAssignmentEvent(
        asg,
        'REMIND_SENT',
        `Gửi nhắc nộp (${params.channel}) tới ${sentCount} học sinh${skippedNames.length > 0 ? `, bỏ qua ${skippedNames.length}` : ''}.`,
        params.actorId,
        params.actorName,
        { sentCount, skippedNames, channel: params.channel }
      );
      this.recordAuditLog({
        userId: params.actorId,
        userName: params.actorName,
        userRole: params.actorRole,
        action: 'REMIND_UNSUBMITTED_STUDENTS',
        targetEntity: `Assignment (${asg.title})`,
        details: `Gửi nhắc nộp cho ${sentCount} HS (${params.channel})`,
      });
      this.persist();
    }

    return { ok: true, sentCount, skippedNames, parentSkippedCount };
  }

  // ACT-12 & ACT-13 (MOD-03): Lưu chấm nháp / Hoàn tất chấm / Sửa điểm có lịch sử revision
  public saveSubmissionGrade(params: {
    submissionId: string;
    score: number;
    questionScores?: Record<string, number>;
    feedback: string;
    gradeStatus: 'draft_grade' | 'graded' | 'published';
    revisionReason?: string;
    expectedVersion?: number;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; submission: AssignmentSubmission } | { ok: false; code: number; error: string } {
    const sub = this.state.submissions.find(s => s.id === params.submissionId);
    if (!sub) return { ok: false, code: 404, error: 'Không tìm thấy bài nộp của học sinh.' };

    const asg = this.getAssignmentById(sub.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập tương ứng.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    const maxScore = Number(asg.points || 10);
    if (Number.isNaN(params.score) || params.score < 0 || params.score > maxScore) {
      return { ok: false, code: 400, error: `Điểm số phải nằm trong khoảng 0 đến ${maxScore}.` };
    }

    const currentVersion = sub.version || 1;
    if (params.expectedVersion !== undefined && params.expectedVersion !== currentVersion) {
      return { ok: false, code: 409, error: 'Bài chấm đã được cập nhật ở nơi khác (409 Conflict). Vui lòng tải lại.' };
    }

    const prevGradeStatus = this.getSubmissionEffectiveGradeStatus(sub);
    const isRevisingExistingScore =
      (prevGradeStatus === 'graded' || prevGradeStatus === 'published') && sub.score !== undefined;

    if (isRevisingExistingScore && (!params.revisionReason || params.revisionReason.trim().length < 5)) {
      return { ok: false, code: 400, error: 'Sửa điểm đã chấm bắt buộc phải nhập lý do tối thiểu 5 ký tự.' };
    }

    const nowIso = new Date().toISOString();

    if (isRevisingExistingScore) {
      if (!sub.revisions) sub.revisions = [];
      sub.revisions.unshift({
        id: `rev_${Date.now()}`,
        oldScore: sub.score,
        newScore: params.score,
        reason: params.revisionReason!.trim(),
        changedBy: params.actorName,
        changedAt: nowIso,
      });
    }

    if (params.questionScores && asg.selectedQuestions && asg.selectedQuestions.length > 0) {
      for (const sq of asg.selectedQuestions) {
        const qVal = params.questionScores[sq.questionId];
        if (qVal !== undefined && (Number.isNaN(qVal) || qVal < 0 || qVal > sq.points)) {
          return {
            ok: false,
            code: 400,
            error: `Điểm câu ${sq.orderIndex} phải nằm trong khoảng 0 đến ${sq.points} điểm.`,
          };
        }
      }
      sub.questionScores = { ...params.questionScores };
    }

    sub.score = params.score;
    sub.feedback = params.feedback;
    sub.gradeStatus = params.gradeStatus;
    sub.gradedBy = params.actorName;
    sub.gradedAt = nowIso;
    sub.version = currentVersion + 1;
    if (params.gradeStatus === 'published') {
      sub.publishedAt = nowIso;
    }
    if (params.gradeStatus === 'graded' || params.gradeStatus === 'published') {
      sub.status = 'graded';
      sub.isTeacherVerified = true;
      if (!asg.completedStudentIds) asg.completedStudentIds = [];
      if (!asg.completedStudentIds.includes(sub.studentId)) {
        asg.completedStudentIds.push(sub.studentId);
      }
    }

    asg.gradedCount = this.state.submissions.filter(
      s => s.assignmentId === asg.id && (s.gradeStatus === 'graded' || s.gradeStatus === 'published' || s.status === 'graded')
    ).length;

    if (isRevisingExistingScore) {
      this.appendAssignmentEvent(
        asg,
        'GRADE_REVISED',
        `Sửa điểm của em ${sub.studentName}: ${sub.revisions![0].oldScore} → ${params.score}/${maxScore}. Lý do: ${params.revisionReason!.trim()}`,
        params.actorId,
        params.actorName,
        { submissionId: sub.id, studentId: sub.studentId, newScore: params.score }
      );
      if (params.gradeStatus === 'published') {
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_rev_${sub.studentId}`,
          type: 'submission_verified',
          title: `Cập nhật điểm bài tập: ${asg.title}`,
          message: `Cô ${params.actorName} đã điều chỉnh điểm bài "${asg.title}" của em ${sub.studentName} thành ${params.score}/${maxScore} điểm. Lý do: ${params.revisionReason!.trim()}`,
          targetRole: 'STUDENT',
          targetClassId: asg.classId,
          targetStudentId: sub.studentId,
          assignmentId: asg.id,
          isRead: false,
          createdAt: nowIso,
        });
      }
    } else {
      this.appendAssignmentEvent(
        asg,
        'GRADED',
        `${params.gradeStatus === 'draft_grade' ? 'Lưu chấm nháp' : 'Hoàn tất chấm'} bài của em ${sub.studentName}: ${params.score}/${maxScore} điểm.`,
        params.actorId,
        params.actorName
      );
    }

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: isRevisingExistingScore ? 'REVISE_SUBMISSION_GRADE' : 'GRADE_SUBMISSION',
      targetEntity: `Submission (${sub.studentName})`,
      details: `${params.gradeStatus === 'draft_grade' ? '[Nháp] ' : ''}Chấm em ${sub.studentName}: ${params.score}/${maxScore}đ`,
    });

    this.persist();
    return { ok: true, submission: sub };
  }

  // ACT-14 & MOD-04: Trả bài (Công bố điểm & nhận xét cho học sinh và phụ huynh)
  public publishAssignmentGrades(params: {
    assignmentId: string;
    submissionIds: string[];
    notify: boolean;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; publishedCount: number } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    const selectedSubs = this.state.submissions.filter(
      s => s.assignmentId === asg.id && params.submissionIds.includes(s.id)
    );
    const hasDraftGrade = selectedSubs.some(s => this.getSubmissionEffectiveGradeStatus(s) === 'draft_grade');
    const targetSubs = selectedSubs.filter(s => {
      const eff = this.getSubmissionEffectiveGradeStatus(s);
      return (eff === 'graded' || eff === 'published') && s.score !== undefined;
    });

    if (targetSubs.length === 0) {
      return {
        ok: false,
        code: 422,
        error: hasDraftGrade
          ? 'Không thể công bố bài đang ở trạng thái "Chấm nháp". Vui lòng bấm "Hoàn tất chấm" trước khi trả bài.'
          : 'Không có bài nộp nào đã hoàn tất chấm điểm để công bố.',
      };
    }

    const nowIso = new Date().toISOString();
    targetSubs.forEach(sub => {
      sub.gradeStatus = 'published';
      sub.publishedAt = nowIso;
      sub.status = 'graded';
      sub.version = (sub.version || 1) + 1;

      if (params.notify) {
        const st = this.getStudentById(sub.studentId);
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_pub_st_${sub.studentId}_${Math.random().toString(36).substring(2, 5)}`,
          type: 'submission_verified',
          title: `Đã trả bài & công bố điểm: ${asg.title}`,
          message: `Bài "${asg.title}" môn ${asg.subjectName} đã được chấm: ${sub.score}/${asg.points || 10} điểm. Nhận xét: "${sub.feedback || 'Hoàn thành tốt'}"`,
          targetRole: 'STUDENT',
          targetClassId: asg.classId,
          targetStudentId: sub.studentId,
          assignmentId: asg.id,
          isRead: false,
          createdAt: nowIso,
          meta: {
            assignmentTitle: asg.title,
            studentName: sub.studentName,
            score: sub.score,
          },
        });
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_pub_pr_${sub.studentId}_${Math.random().toString(36).substring(2, 5)}`,
          type: 'submission_verified',
          title: `Kết quả bài tập của con ${sub.studentName}: ${sub.score}/${asg.points || 10}đ`,
          message: `${params.actorName} đã trả bài "${asg.title}" môn ${asg.subjectName} của con ${sub.studentName}. Điểm: ${sub.score}/${asg.points || 10}.`,
          targetRole: 'PARENT',
          targetClassId: asg.classId,
          targetStudentId: sub.studentId,
          targetUserId: st?.parentId || 'user_parent_1',
          assignmentId: asg.id,
          isRead: false,
          createdAt: nowIso,
        });
      }
    });

    this.appendAssignmentEvent(
      asg,
      'GRADES_PUBLISHED',
      `Công bố điểm & trả bài cho ${targetSubs.length} học sinh${params.notify ? ' (đã gửi thông báo)' : ''}.`,
      params.actorId,
      params.actorName,
      { publishedCount: targetSubs.length, notify: params.notify }
    );

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: 'PUBLISH_ASSIGNMENT_GRADES',
      targetEntity: `Assignment (${asg.title})`,
      details: `Trả bài cho ${targetSubs.length} học sinh lớp ${asg.className}`,
    });

    this.persist();
    return { ok: true, publishedCount: targetSubs.length };
  }

  // ACT-08 / ACT-09 (MOD-05): Đóng hoặc mở lại nhận bài
  public toggleAssignmentReceiving(params: {
    assignmentId: string;
    targetStatus: 'open' | 'closed';
    reason: string;
    expectedVersion?: number;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; assignment: Assignment } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    if (this.getEffectiveReceiveStatus(asg) === 'withdrawn') {
      return { ok: false, code: 422, error: 'Bài tập đã thu hồi, không thể đóng/mở lại.' };
    }

    const reason = params.reason.trim();
    if (reason.length < 5) {
      return { ok: false, code: 400, error: 'Vui lòng nhập lý do tối thiểu 5 ký tự.' };
    }

    const currentVersion = asg.version || 1;
    if (params.expectedVersion !== undefined && params.expectedVersion !== currentVersion) {
      return { ok: false, code: 409, error: 'Trạng thái bài tập đã thay đổi ở phiên khác (409 Conflict). Vui lòng tải lại.' };
    }

    asg.receiveStatus = params.targetStatus;
    asg.status = params.targetStatus === 'closed' ? 'closed' : 'published';
    asg.version = currentVersion + 1;
    asg.updatedAt = new Date().toISOString();

    this.appendAssignmentEvent(
      asg,
      params.targetStatus === 'closed' ? 'CLOSED' : 'REOPENED',
      `${params.targetStatus === 'closed' ? 'Đóng nhận bài' : 'Mở lại nhận bài'}. Lý do: ${reason}`,
      params.actorId,
      params.actorName,
      { reason }
    );

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: params.targetStatus === 'closed' ? 'CLOSE_ASSIGNMENT' : 'REOPEN_ASSIGNMENT',
      targetEntity: `Assignment (${asg.title})`,
      details: `${params.targetStatus === 'closed' ? 'Đóng' : 'Mở lại'} nhận bài: ${reason}`,
    });

    this.persist();
    return { ok: true, assignment: asg };
  }

  // ACT-10 (MOD-06): Thu hồi bài tập (Soft-delete — bảo toàn điểm & bài nộp)
  public withdrawAssignment(params: {
    assignmentId: string;
    reason: string;
    confirmationText: string;
    expectedVersion?: number;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; assignment: Assignment } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    if (params.confirmationText.trim().toUpperCase() !== 'THU HOI' && params.confirmationText.trim() !== asg.title.trim()) {
      return { ok: false, code: 400, error: 'Vui lòng gõ chính xác "THU HOI" hoặc tên bài tập để xác nhận thu hồi.' };
    }
    if (params.reason.trim().length < 5) {
      return { ok: false, code: 400, error: 'Vui lòng nhập lý do thu hồi (tối thiểu 5 ký tự).' };
    }

    const currentVersion = asg.version || 1;
    if (params.expectedVersion !== undefined && params.expectedVersion !== currentVersion) {
      return { ok: false, code: 409, error: 'Dữ liệu đã thay đổi ở phiên khác (409 Conflict).' };
    }

    const nowIso = new Date().toISOString();
    asg.receiveStatus = 'withdrawn';
    asg.status = 'closed';
    asg.withdrawnAt = nowIso;
    asg.withdrawReason = params.reason.trim();
    asg.version = currentVersion + 1;
    asg.updatedAt = nowIso;

    this.appendAssignmentEvent(
      asg,
      'WITHDRAWN',
      `Thu hồi bài tập (soft-delete, bảo toàn bài nộp & điểm). Lý do: ${params.reason.trim()}`,
      params.actorId,
      params.actorName,
      { reason: params.reason.trim() }
    );

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: 'WITHDRAW_ASSIGNMENT',
      targetEntity: `Assignment (${asg.title})`,
      details: `Thu hồi bài tập "${asg.title}" (giữ nguyên dữ liệu bài nộp/điểm): ${params.reason.trim()}`,
    });

    this.persist();
    return { ok: true, assignment: asg };
  }

  // ACT-05 & ACT-06 (MOD-07): Sao chép thành bản nháp hoặc Giao lại cho lớp khác
  public duplicateOrReassignAssignment(params: {
    sourceAssignmentId: string;
    mode: 'duplicate_draft' | 'reassign';
    targetClassId: string;
    newDueDate: string;
    newTitle?: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; assignment: Assignment } | { ok: false; code: number; error: string } {
    const src = this.getAssignmentById(params.sourceAssignmentId);
    if (!src) return { ok: false, code: 404, error: 'Không tìm thấy bài tập nguồn.' };

    const targetClass = this.getClassById(params.targetClassId);
    if (!targetClass) return { ok: false, code: 404, error: 'Không tìm thấy lớp học đích.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, params.targetClassId);
    if (!perm.ok) return perm;

    if (params.mode === 'reassign' && new Date(params.newDueDate).getTime() <= Date.now()) {
      return { ok: false, code: 400, error: 'Hạn nộp khi giao lại phải sau thời điểm hiện tại.' };
    }

    const nowIso = new Date().toISOString();
    const isDraft = params.mode === 'duplicate_draft';
    const targetStudents = this.getStudents(targetClass.id);

    const cloned: Assignment = {
      ...JSON.parse(JSON.stringify(src)),
      id: `asg_${Date.now()}_${Math.random().toString(36).substring(2, 5)}`,
      code: undefined,
      classId: targetClass.id,
      className: targetClass.name,
      title: params.newTitle?.trim() || (isDraft ? `[Bản sao] ${src.title}` : src.title),
      dueDate: params.newDueDate || src.dueDate,
      status: isDraft ? 'draft' : 'published',
      receiveStatus: isDraft ? 'draft' : 'open',
      withdrawnAt: undefined,
      withdrawReason: undefined,
      recipientOverrides: {},
      events: [],
      version: 1,
      submissionCount: 0,
      gradedCount: 0,
      totalStudents: targetStudents.length,
      completedStudentIds: [],
      createdByTeacherId: params.actorId,
      createdByTeacherName: params.actorName,
      createdAt: nowIso,
      updatedAt: nowIso,
    };

    this.appendAssignmentEvent(
      cloned,
      isDraft ? 'DUPLICATED' : 'REASSIGNED',
      isDraft
        ? `Sao chép thành bản nháp từ "${src.title}" (không sao chép bài nộp/điểm).`
        : `Giao lại từ "${src.title}" cho Lớp ${targetClass.name}.`,
      params.actorId,
      params.actorName
    );

    this.state.assignments.unshift(cloned);

    if (!isDraft) {
      targetStudents.forEach(st => {
        this.state.notifications.unshift({
          id: `notif_${Date.now()}_re_${st.id}_${Math.random().toString(36).substring(2, 5)}`,
          type: 'assignment_new',
          title: `Bài tập mới môn ${cloned.subjectName}: ${cloned.title}`,
          message: `${params.actorName} đã giao bài "${cloned.title}" cho lớp ${targetClass.name}. Hạn nộp: ${new Date(cloned.dueDate).toLocaleString('vi-VN')}.`,
          targetRole: 'STUDENT',
          targetClassId: targetClass.id,
          targetStudentId: st.id,
          assignmentId: cloned.id,
          isRead: false,
          createdAt: nowIso,
        });
      });
    }

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: isDraft ? 'DUPLICATE_ASSIGNMENT' : 'REASSIGN_ASSIGNMENT',
      targetEntity: `Assignment (${cloned.title})`,
      details: isDraft ? `Tạo bản nháp sao chép từ "${src.title}"` : `Giao lại "${cloned.title}" cho lớp ${targetClass.name}`,
    });

    this.persist();
    return { ok: true, assignment: cloned };
  }

  // ACT-16 (MOD-08): Yêu cầu học sinh làm lại
  public requestStudentResubmit(params: {
    assignmentId: string;
    studentId: string;
    newDueAt: string;
    reason: string;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; submission: AssignmentSubmission } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    const sub = this.getStudentSubmission(asg.id, params.studentId);
    if (!sub) return { ok: false, code: 404, error: 'Học sinh chưa có bài nộp để yêu cầu làm lại.' };

    const maxAttempts = asg.maxAttempts || 3;
    const currentAttempt = sub.attemptNo || 1;
    if (currentAttempt >= maxAttempts) {
      return { ok: false, code: 422, error: `Học sinh đã dùng hết ${currentAttempt}/${maxAttempts} lượt nộp cho phép.` };
    }

    if (new Date(params.newDueAt).getTime() <= Date.now()) {
      return { ok: false, code: 400, error: 'Hạn nộp lại phải sau thời điểm hiện tại.' };
    }
    if (params.reason.trim().length < 5) {
      return { ok: false, code: 400, error: 'Vui lòng nhập nhận xét / hướng dẫn làm lại (tối thiểu 5 ký tự).' };
    }

    const nowIso = new Date().toISOString();
    sub.status = 'resubmit_required';
    sub.resubmitDueAt = params.newDueAt;
    sub.resubmitNote = params.reason.trim();
    sub.isTeacherVerified = false;
    sub.version = (sub.version || 1) + 1;

    if (!asg.recipientOverrides) asg.recipientOverrides = {};
    asg.recipientOverrides[params.studentId] = {
      dueOverrideAt: params.newDueAt,
      reason: `Yêu cầu làm lại: ${params.reason.trim()}`,
      updatedAt: nowIso,
      updatedBy: params.actorName,
    };

    asg.completedStudentIds = (asg.completedStudentIds || []).filter(id => id !== params.studentId);

    this.appendAssignmentEvent(
      asg,
      'RESUBMIT_REQUESTED',
      `Yêu cầu em ${sub.studentName} làm lại (lượt ${currentAttempt + 1}/${maxAttempts}), hạn mới ${new Date(params.newDueAt).toLocaleString('vi-VN')}.`,
      params.actorId,
      params.actorName
    );

    const st = this.getStudentById(params.studentId);
    this.state.notifications.unshift({
      id: `notif_${Date.now()}_resub_st_${params.studentId}`,
      type: 'assignment_reminder',
      title: `Yêu cầu nộp lại bài: ${asg.title}`,
      message: `${params.actorName} yêu cầu em nộp lại bài "${asg.title}". Hướng dẫn: ${params.reason.trim()}. Hạn mới: ${new Date(params.newDueAt).toLocaleString('vi-VN')}.`,
      targetRole: 'STUDENT',
      targetClassId: asg.classId,
      targetStudentId: params.studentId,
      assignmentId: asg.id,
      isRead: false,
      createdAt: nowIso,
    });
    this.state.notifications.unshift({
      id: `notif_${Date.now()}_resub_pr_${params.studentId}`,
      type: 'parent_homework_reminder',
      title: `Nhắc phụ huynh: Con ${sub.studentName} cần làm lại bài "${asg.title}"`,
      message: `${params.actorName} đề nghị con ${sub.studentName} làm lại bài "${asg.title}" trước ${new Date(params.newDueAt).toLocaleString('vi-VN')}. Lý do: ${params.reason.trim()}`,
      targetRole: 'PARENT',
      targetClassId: asg.classId,
      targetStudentId: params.studentId,
      targetUserId: st?.parentId || 'user_parent_1',
      assignmentId: asg.id,
      isRead: false,
      createdAt: nowIso,
    });

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: 'REQUEST_RESUBMIT',
      targetEntity: `Submission (${sub.studentName})`,
      details: `Yêu cầu em ${sub.studentName} làm lại "${asg.title}": ${params.reason.trim()}`,
    });

    this.persist();
    return { ok: true, submission: sub };
  }

  // ACT-04: Chỉnh sửa metadata an toàn (không làm hỏng snapshot câu hỏi đã nộp)
  public updateAssignmentMetadata(params: {
    assignmentId: string;
    title: string;
    instructions: string;
    allowLateDays: number;
    gradingPolicy?: 'latest' | 'highest';
    expectedVersion?: number;
    actorId: string;
    actorName: string;
    actorRole: UserRole;
  }): { ok: true; assignment: Assignment } | { ok: false; code: number; error: string } {
    const asg = this.getAssignmentById(params.assignmentId);
    if (!asg) return { ok: false, code: 404, error: 'Không tìm thấy bài tập.' };

    const perm = this.checkAssignmentActorPermission(params.actorId, params.actorRole, asg.classId);
    if (!perm.ok) return perm;

    if (!params.title.trim()) {
      return { ok: false, code: 400, error: 'Tên bài tập không được để trống.' };
    }

    const currentVersion = asg.version || 1;
    if (params.expectedVersion !== undefined && params.expectedVersion !== currentVersion) {
      return { ok: false, code: 409, error: 'Bài tập đã được chỉnh sửa ở phiên khác (409 Conflict).' };
    }

    const subs = this.getSubmissions(asg.id);
    if (params.gradingPolicy && subs.length > 0 && params.gradingPolicy !== (asg.gradingPolicy || 'latest')) {
      return { ok: false, code: 422, error: 'Không thể thay đổi quy tắc tính điểm nộp lại sau khi đã có học sinh nộp bài.' };
    }

    asg.title = params.title.trim();
    asg.instructions = params.instructions.trim();
    asg.allowLateDays = Math.max(0, Number(params.allowLateDays || 0));
    if (params.gradingPolicy) asg.gradingPolicy = params.gradingPolicy;
    asg.version = currentVersion + 1;
    asg.updatedAt = new Date().toISOString();

    this.appendAssignmentEvent(
      asg,
      'METADATA_UPDATED',
      `Cập nhật thông tin bài tập (Tên/Hướng dẫn/Gia hạn trễ ${asg.allowLateDays} ngày).`,
      params.actorId,
      params.actorName
    );

    this.recordAuditLog({
      userId: params.actorId,
      userName: params.actorName,
      userRole: params.actorRole,
      action: 'UPDATE_ASSIGNMENT_METADATA',
      targetEntity: `Assignment (${asg.title})`,
      details: `Cập nhật metadata bài tập "${asg.title}"`,
    });

    this.persist();
    return { ok: true, assignment: asg };
  }
}

export const db = new SmartClassDatabase();
