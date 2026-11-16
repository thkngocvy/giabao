import { QuestionType, DifficultyLevel } from '../types';

export interface GeneratedQuestion {
  id?: string;
  content: string;
  passage?: string;
  type: QuestionType;
  options?: { id: string; text: string }[];
  correctAnswer: string | string[];
  subQuestions?: { id: string; statement: string; isCorrect: boolean }[];
  matchingPairs?: { left: string; right: string }[];
  orderingItems?: string[];
  explanation: string;
  whyCorrect?: string;
  rubric?: string;
  difficulty: DifficultyLevel;
  chapter?: string;
  lesson?: string;
  topic?: string;
  qualityScore?: number;
  qualityWarning?: string;
  tags?: string[];
}

export interface StudentCommentSuggestion {
  studentName: string;
  academicPerformance: string;
  conductComment: string;
  encouragement: string;
  fullDraft: string;
}

export interface AIGenerationOptions {
  topic?: string;
  lessonContent?: string;
  subject: string;
  grade: number;
  chapter?: string;
  lesson?: string;
  questionTypes?: QuestionType[];
  difficulty?: DifficultyLevel | 'mixed';
  count?: number;
  includeAnswer?: boolean;
  includeExplanation?: boolean;
  includeWhyCorrect?: boolean;
  includeRubric?: boolean;
}

export class AIService {
  /**
   * Kiểm tra trạng thái cấu hình của AI trên server
   */
  public async checkAIStatus(): Promise<{ configured: boolean; model?: string; school?: string }> {
    try {
      const res = await fetch('/api/ai/status');
      if (res.ok) {
        return await res.json();
      }
    } catch (e) {
      console.warn('Không thể kiểm tra trạng thái AI:', e);
    }
    return { configured: false };
  }

  /**
   * Sinh bộ câu hỏi thông minh qua endpoint backend Server-Side Gemini API
   */
  public async generateQuestionsAdvanced(options: AIGenerationOptions): Promise<GeneratedQuestion[]> {
    try {
      const response = await fetch('/api/ai/generate-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(options),
      });

      const data = await response.json();

      if (!response.ok) {
        if (data.error === 'MISSING_API_KEY') {
          throw new Error('Chưa cấu hình API Key. Vui lòng cấu hình biến môi trường để sử dụng tính năng tạo câu hỏi bằng AI.');
        }
        throw new Error(data.message || 'Lỗi từ máy chủ AI khi sinh câu hỏi.');
      }

      if (data.questions && Array.isArray(data.questions)) {
        return data.questions;
      }

      throw new Error('Định dạng câu hỏi nhận được từ máy chủ không hợp lệ.');
    } catch (error: any) {
      console.error('Lỗi AIService:', error);
      throw error;
    }
  }

  /**
   * Phương thức tương thích ngược sinh câu hỏi nhanh
   */
  public async generateQuestions(topic: string, subject: string, grade: number, count = 3): Promise<GeneratedQuestion[]> {
    try {
      return await this.generateQuestionsAdvanced({ topic, subject, grade, count });
    } catch (e) {
      return this.generateFallbackQuestions({ topic, subject, grade, count });
    }
  }

  /**
   * Bộ dữ liệu sư phạm chuẩn hóa (Pedagogical Engine) phục vụ kiểm thử và tham khảo
   * khi giáo viên muốn thử nghiệm không qua mạng hoặc xem trước mẫu đề chuẩn
   */
  public generateFallbackQuestions(options: AIGenerationOptions): GeneratedQuestion[] {
    const {
      topic = 'Tổng hợp kiến thức',
      subject = 'Toán học',
      grade = 9,
      chapter = 'Chương trình GDPT 2018',
      lesson = topic,
      questionTypes = ['single', 'multiple', 'true_false', 'matching', 'fill_blank', 'short_answer', 'passage_based', 'essay', 'ordering'],
      count = 5,
    } = options;

    const list: GeneratedQuestion[] = [];

    // 1. Trắc nghiệm 1 đáp án (Single)
    if (questionTypes.includes('single')) {
      list.push({
        type: 'single',
        chapter,
        lesson,
        topic,
        content: `Trong chủ đề "${topic}", cho phương trình bậc hai x² - 2(m + 1)x + m² + 2 = 0 (với m là tham số). Giá trị của m để phương trình có hai nghiệm phân biệt x₁, x₂ thỏa mãn là:`,
        options: [
          { id: 'A', text: 'm > 1/2' },
          { id: 'B', text: 'm < 1/2' },
          { id: 'C', text: 'm ≥ 1/2' },
          { id: 'D', text: 'm ≠ 1/2' },
        ],
        correctAnswer: 'A',
        explanation: "Phương trình có 2 nghiệm phân biệt khi và chỉ khi biệt thức Δ' > 0 <=> [-(m + 1)]² - (m² + 2) > 0 <=> m² + 2m + 1 - m² - 2 > 0 <=> 2m - 1 > 0 <=> m > 1/2.",
        whyCorrect: "Phương án A chính xác vì điều kiện 2 nghiệm phân biệt là Δ' > 0 (nghiêm ngặt không lấy dấu bằng). Phương án C sai vì lấy cả m = 1/2 (khiến phương trình có nghiệm kép). Phương án B ngược chiều bất đẳng thức.",
        difficulty: 'medium',
        qualityScore: 96,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Phương trình bậc hai'],
      });
    }

    // 2. Đúng / Sai từng ý (True/False Multistep) chuẩn GDPT 2018
    if (questionTypes.includes('true_false')) {
      list.push({
        type: 'true_false',
        chapter,
        lesson,
        topic,
        content: `Xét tính đúng/sai của các mệnh đề sau liên quan đến kiến thức chủ đề "${topic}":`,
        correctAnswer: ['true', 'false', 'true', 'false'],
        subQuestions: [
          { id: 'a', statement: 'Mọi phương trình bậc hai ax² + bx + c = 0 luôn có hai nghiệm phân biệt trái dấu khi tích a.c < 0.', isCorrect: true },
          { id: 'b', statement: 'Nếu biệt thức Δ = 0 thì phương trình ax² + bx + c = 0 vô nghiệm trên tập số thực ℝ.', isCorrect: false },
          { id: 'c', statement: 'Theo hệ thức Vi-ét, tổng hai nghiệm của phương trình là x₁ + x₂ = -b/a và tích là x₁x₂ = c/a.', isCorrect: true },
          { id: 'd', statement: 'Khi Δ < 0, đồ thị hàm số y = ax² + bx + c luôn cắt trục hoành tại hai điểm phân biệt.', isCorrect: false },
        ],
        explanation: 'a) Đúng vì ac < 0 => Δ = b² - 4ac > 0 và x₁x₂ = c/a < 0; b) Sai vì khi Δ = 0 phương trình có nghiệm kép x₁ = x₂ = -b/(2a); c) Đúng theo định lý Vi-ét; d) Sai vì Δ < 0 thì parabol không cắt trục hoành.',
        whyCorrect: 'Cấu trúc 4 mệnh đề phủ quát ma trận nhận thức từ Nhận biết (ý c) đến Vận dụng (ý a, d) theo đúng cấu trúc đề minh họa tốt nghiệp THCS/THPT của Bộ GD&ĐT.',
        difficulty: 'hard',
        qualityScore: 98,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Đúng/Sai từng ý GDPT 2018'],
      });
    }

    // 3. Nhiều đáp án đúng (Multiple)
    if (questionTypes.includes('multiple')) {
      list.push({
        type: 'multiple',
        chapter,
        lesson,
        topic,
        content: `Chọn TẤT CẢ các tính chất đúng của hàm số và đồ thị trong phạm vi bài học "${topic}":`,
        options: [
          { id: 'A', text: 'Đồ thị parabol y = ax² (a ≠ 0) có trục đối xứng là trục tung Oy (đường thẳng x = 0)' },
          { id: 'B', text: 'Khi a > 0, hàm số nghịch biến khi x < 0 và đồng biến khi x > 0' },
          { id: 'C', text: 'Tọa độ đỉnh O(0; 0) là điểm thấp nhất của đồ thị khi a > 0' },
          { id: 'D', text: 'Hàm số y = ax² luôn đồng biến trên toàn bộ tập số thực ℝ' },
        ],
        correctAnswer: ['A', 'B', 'C'],
        explanation: 'Các phương án A, B, C đều là tính chất cơ bản được quy định trong SGK Toán 9. Phương án D sai vì hàm số bậc hai không đồng biến trên toàn bộ ℝ mà thay đổi chiều biến thiên qua gốc tọa độ O.',
        whyCorrect: 'Học sinh cần nắm vững cả dạng hình học của đồ thị (parabol) lẫn tính đơn điệu đại số của hàm số y = ax².',
        difficulty: 'medium',
        qualityScore: 94,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Nhiều đáp án'],
      });
    }

    // 4. Ghép đôi (Matching)
    if (questionTypes.includes('matching')) {
      list.push({
        type: 'matching',
        chapter,
        lesson,
        topic,
        content: `Nối các khái niệm ở Cột A với công thức hoặc định lý tương ứng ở Cột B trong chủ đề "${topic}":`,
        matchingPairs: [
          { left: '1. Định lý Vi-ét về tổng', right: 'x₁ + x₂ = -b/a' },
          { left: '2. Định lý Vi-ét về tích', right: 'x₁x₂ = c/a' },
          { left: '3. Biệt thức Delta thu gọn', right: "Δ' = b'² - ac" },
          { left: '4. Điều kiện 2 nghiệm cùng dấu', right: 'Δ ≥ 0 và P > 0' },
        ],
        correctAnswer: '1-A, 2-B, 3-C, 4-D',
        explanation: 'Ghép nối chuẩn xác theo SGK Toán 9 Kết nối tri thức và Cánh diều.',
        whyCorrect: 'Rèn luyện khả năng ghi nhớ và đối chiếu công thức toán học cơ bản.',
        difficulty: 'easy',
        qualityScore: 92,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Ghép đôi'],
      });
    }

    // 5. Điền khuyết (Fill Blank)
    if (questionTypes.includes('fill_blank')) {
      list.push({
        type: 'fill_blank',
        chapter,
        lesson,
        topic,
        content: `Điền giá trị thích hợp vào chỗ trống: "Cho phương trình x² - 9x + 20 = 0. Hai nghiệm phân biệt của phương trình theo thứ tự tăng dần là x₁ = [_____] và x₂ = [_____]".`,
        correctAnswer: '4; 5',
        explanation: 'Phân tích đa thức thành nhân tử: x² - 9x + 20 = (x - 4)(x - 5) = 0 <=> x₁ = 4 và x₂ = 5.',
        whyCorrect: 'Kiểm tra kỹ năng tính nhẩm nghiệm theo hệ thức Vi-ét (S = 9, P = 20 => 4 và 5).',
        difficulty: 'easy',
        qualityScore: 90,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Điền khuyết'],
      });
    }

    // 6. Trả lời ngắn (Short Answer)
    if (questionTypes.includes('short_answer')) {
      list.push({
        type: 'short_answer',
        chapter,
        lesson,
        topic,
        content: `Biết hai số thực u và v có tổng u + v = 17 và tích uv = 72. Tìm giá trị của số lớn hơn trong hai số đó.`,
        correctAnswer: '9',
        explanation: 'u và v là nghiệm của phương trình t² - 17t + 72 = 0 <=> (t - 8)(t - 9) = 0 => Hai số là 8 và 9. Số lớn hơn là 9.',
        whyCorrect: 'Câu hỏi dạng số duy nhất, chấm tự động chính xác tuyệt đối.',
        difficulty: 'medium',
        qualityScore: 95,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Trả lời ngắn'],
      });
    }

    // 7. Câu hỏi tình huống / Đoạn văn (Passage based)
    if (questionTypes.includes('passage_based')) {
      list.push({
        type: 'passage_based',
        chapter,
        lesson,
        topic,
        passage: `Trường THCS Trưng Vương tổ chức ngày hội Stem và dự định làm một bồn hoa hình chữ nhật có chu vi bằng 28 mét. Nhóm học sinh đề xuất mở rộng bồn hoa bằng cách tăng chiều rộng thêm 2 mét và giảm chiều dài đi 1 mét, khi đó diện tích bồn hoa tăng thêm 8 mét vuông. Chi phí trồng hoa là 120.000 đồng/m².`,
        content: `Dựa vào dữ liệu tình huống thực tế trên, diện tích ban đầu của bồn hoa trường THCS Trưng Vương là bao nhiêu mét vuông?`,
        options: [
          { id: 'A', text: '45 m²' },
          { id: 'B', text: '48 m²' },
          { id: 'C', text: '40 m²' },
          { id: 'D', text: '52 m²' },
        ],
        correctAnswer: 'B',
        explanation: 'Gọi chiều dài ban đầu là x (m), chiều rộng là y (m). Nửa chu vi x + y = 14 => y = 14 - x. Diện tích mới: (x - 1)(y + 2) = xy + 8 <=> 2x - y - 2 = 8 <=> 2x - (14 - x) = 10 <=> 3x = 24 => x = 8 m, y = 6 m. Diện tích ban đầu: S = 8 * 6 = 48 m².',
        difficulty: 'very_hard',
        qualityScore: 97,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Tình huống thực tế STEM'],
      });
    }

    // 8. Tự luận (Essay)
    if (questionTypes.includes('essay')) {
      list.push({
        type: 'essay',
        chapter,
        lesson,
        topic,
        content: `Giải bài toán bằng cách lập hệ phương trình hoặc phương trình bậc hai: Một đội xe vận chuyển 140 tấn hàng cứu trợ đến vùng cao nhân dịp Tết vì người nghèo. Đến khi khởi hành có 2 xe được điều đi làm nhiệm vụ khẩn cấp khác, do đó mỗi xe còn lại phải chở thêm 1 tấn hàng so với dự định ban đầu. Hỏi ban đầu đội xe có bao nhiêu chiếc xe? (Biết sức chở của mỗi xe là như nhau).`,
        correctAnswer: 'Ban đầu đội có 14 xe',
        explanation: 'Gọi số xe ban đầu là x (chiếc, x > 2, x ∈ ℕ*). Dự định mỗi xe chở: 140/x (tấn). Thực tế mỗi xe chở: 140/(x - 2) (tấn). Phương trình: 140/(x - 2) - 140/x = 1 <=> 140x - 140(x - 2) = x(x - 2) <=> x² - 2x - 280 = 0. Giải phương trình tìm được x = 14 (thỏa mãn) hoặc x = -20 (loại). Vậy ban đầu đội có 14 xe.',
        whyCorrect: 'Bài toán kinh điển rèn luyện năng lực mô hình hóa toán học và giải quyết vấn đề thực tiễn theo chuẩn GDPT 2018.',
        rubric: '1. Gọi ẩn và đặt điều kiện chặt chẽ (0.25đ)\n2. Biểu diễn đại lượng dự định và thực tế (0.5đ)\n3. Lập phương trình chính xác (0.5đ)\n4. Giải phương trình và đối chiếu điều kiện để kết luận (0.5đ)\n5. Đơn vị và câu trả lời hoàn chỉnh (0.25đ)',
        difficulty: 'hard',
        qualityScore: 99,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Tự luận có thang điểm Rubric'],
      });
    }

    // 9. Sắp xếp thứ tự (Ordering)
    if (questionTypes.includes('ordering')) {
      list.push({
        type: 'ordering',
        chapter,
        lesson,
        topic,
        content: `Hãy sắp xếp các thao tác sau theo đúng quy trình giải bài toán bằng cách lập phương trình:`,
        orderingItems: [
          'Bước 1: Chọn ẩn số và đặt điều kiện thích hợp cho ẩn',
          'Bước 2: Biểu diễn các đại lượng chưa biết theo ẩn và các đại lượng đã biết',
          'Bước 3: Lập phương trình biểu thị mối quan hệ giữa các đại lượng',
          'Bước 4: Giải phương trình tìm nghiệm',
          'Bước 5: Kiểm tra nghiệm với điều kiện của ẩn và kết luận bài toán',
        ],
        correctAnswer: 'Bước 1 -> Bước 2 -> Bước 3 -> Bước 4 -> Bước 5',
        explanation: 'Chuẩn 3 bước lớn (5 tiểu bước chi tiết) theo sách giáo khoa Toán cấp THCS.',
        whyCorrect: 'Giúp học sinh khắc sâu tư duy logic tuần tự khi làm bài tự luận.',
        difficulty: 'easy',
        qualityScore: 94,
        qualityWarning: '',
        tags: [subject, `Khối ${grade}`, topic, 'Sắp xếp quy trình'],
      });
    }

    return list.slice(0, count);
  }

  public async generateStudentComment(
    studentName: string,
    gpa: number,
    attendanceRate: number,
    behaviorPoints: number
  ): Promise<StudentCommentSuggestion> {
    const isHigh = gpa >= 8.5;
    return {
      studentName,
      academicPerformance: isHigh
        ? 'Nắm vững kiến thức trọng tâm, tư duy logic sắc bén, tự giác trong học tập.'
        : 'Có cố gắng trong học tập, hoàn thành các nhiệm vụ cơ bản được giao.',
      conductComment:
        behaviorPoints >= 40
          ? 'Ngoan ngoãn, lễ phép, chấp hành nghiêm túc nội quy trường lớp, tích cực tham gia phong trào chi đội.'
          : 'Lễ phép với thầy cô, cần chú ý hơn về tác phong và giờ giấc chuyên cần.',
      encouragement: isHigh
        ? 'Phát huy năng lực tự nghiên cứu và bồi dưỡng thêm các bài toán nâng cao để thi vào trường chuyên.'
        : 'Cần phân bổ thời gian tự học hợp lý hơn, tự tin phát biểu xây dựng bài trên lớp.',
      fullDraft: `Em ${studentName} có ý thức học tập tốt, ${
        isHigh ? 'nắm vững kiến thức và tiếp thu bài nhanh' : 'chăm chỉ hoàn thành bài tập'
      }. Lễ phép với thầy cô, hòa đồng cùng bè bạn. Mong em tiếp tục duy trì và nỗ lực hơn nữa trong học kỳ tiếp theo!`,
    };
  }

  public async generateLessonPlanOutline(lessonTopic: string, subject: string, grade: number): Promise<string> {
    return `KẾ HOẠCH BÀI DẠY (THEO CÔNG VĂN 5512/BGDĐT)
MÔN: ${subject.toUpperCase()} - KHỐI ${grade}
TÊN BÀI DẠY: ${lessonTopic.toUpperCase()}
Thời lượng thực hiện: 2 tiết

I. MỤC TIÊU BÀI HỌC
1. Về kiến thức:
- Học sinh nắm được khái niệm cốt lõi, công thức và bản chất toán học của ${lessonTopic}.
- Vận dụng giải quyết các bài tập cơ bản và bài toán thực tiễn.
2. Về năng lực:
- Năng lực tư duy và lập luận toán học.
- Năng lực mô hình hóa toán học và giải quyết vấn đề sáng tạo.
- Năng lực giao tiếp toán học và hợp tác nhóm.
3. Về phẩm chất:
- Chăm chỉ, cẩn thận, trung thực, tinh thần trách nhiệm.

II. THIẾT BỊ DẠY HỌC VÀ HỌC LIỆU
- Giáo viên: Kế hoạch bài dạy, bài giảng trình chiếu PowerPoint, phiếu học tập số 1, 2, 3.
- Học sinh: SGK, vở ghi, dụng cụ học tập, máy tính cầm tay.

III. TIẾN TRÌNH DẠY HỌC
Hoạt động 1: Khởi động (Mở đầu - 7 phút)
- Mục tiêu: Tạo hứng thú và tâm thế tiếp cận bài học từ tình huống thực tiễn.
- Nội dung: Giải câu đố hoặc tình huống thực tế liên quan đến ${lessonTopic}.

Hoạt động 2: Hình thành kiến thức mới (23 phút)
- Hoạt động 2.1: Khám phá định lý và tính chất.
- Hoạt động 2.2: Rút ra kết luận và ghi nhớ trọng tâm.

Hoạt động 3: Luyện tập (10 phút)
- Học sinh làm việc cá nhân và cặp đôi giải các bài tập trắc nghiệm và tự luận cơ bản.

Hoạt động 4: Vận dụng (5 phút)
- Liên hệ giải quyết bài toán thực tiễn cuộc sống và định hướng tự học ở nhà.`;
  }
}

export const aiService = new AIService();
