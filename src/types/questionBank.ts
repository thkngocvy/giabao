export type QuestionType =
  | 'single' // Trắc nghiệm một đáp án
  | 'multiple' // Trắc nghiệm nhiều đáp án
  | 'true_false' // Đúng/Sai theo từng ý (chuẩn GDPT 2018)
  | 'matching' // Ghép đôi
  | 'ordering' // Sắp xếp thứ tự
  | 'fill_blank' // Điền khuyết
  | 'short_answer' // Trả lời ngắn
  | 'essay' // Tự luận
  | 'passage_based'; // Câu hỏi theo đoạn văn / tình huống

export type DifficultyLevel = 'easy' | 'medium' | 'hard' | 'very_hard';

export type QuestionStatus =
  | 'draft' // Bản nháp
  | 'generated' // Do AI vừa tạo
  | 'needs_review' // Chờ duyệt
  | 'approved' // Đã duyệt
  | 'rejected' // Bị từ chối
  | 'archived'; // Đã lưu trữ

export interface QuestionOption {
  id: string; // 'A', 'B', 'C', 'D'...
  text: string;
  isCorrect?: boolean;
}

export interface TrueFalseSubQuestion {
  id: string; // 'a', 'b', 'c', 'd'
  statement: string;
  isCorrect: boolean;
  explanation?: string;
}

export interface MatchingPair {
  left: string;
  right: string;
}

export interface QualityWarning {
  code: 'MISSING_ANSWER' | 'DUPLICATE' | 'EMPTY_OPTION' | 'SHORT_EXPLANATION' | 'NO_TAGS' | 'NO_SOURCE';
  message: string;
  severity: 'error' | 'warning';
}

export interface QuestionRevision {
  id: string;
  timestamp: string;
  editorName: string;
  note: string;
  previousContent: string;
}

export interface BankQuestion {
  id: string;
  code: string; // Mã câu hỏi ví dụ "TV-TOAN9-001"
  subject: string;
  grade: number;
  chapter?: string;
  lesson?: string;
  topic: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  content: string;
  passage?: string; // Đoạn văn / ngữ cảnh tình huống chung
  options?: QuestionOption[];
  correctAnswer: string | string[]; // 'A' hoặc ['A', 'C'] hoặc text
  subQuestions?: TrueFalseSubQuestion[]; // Cho đúng/sai 4 ý
  matchingPairs?: MatchingPair[]; // Cho dạng ghép đôi
  orderingItems?: string[]; // Cho dạng sắp xếp
  fillBlanksAnswers?: string[]; // Cho dạng điền khuyết
  rubricGuide?: string; // Tiêu chí chấm cho câu tự luận
  explanation: string;
  points: number; // Điểm số gợi ý (VD: 0.25, 0.5, 1.0, 2.0)
  tags: string[];
  sourceRef?: string; // Nguồn tham chiếu (SGK Kết nối tri thức, KNTT, Cánh diều...)
  status: QuestionStatus;
  qualityWarnings?: QualityWarning[];
  bankId?: string; // Tên ngân hàng hoặc nhóm
  revisions?: QuestionRevision[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionBankStats {
  total: number;
  approved: number;
  needsReview: number;
  draft: number;
  hasWarnings: number;
}
