import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

  app.use(express.json({ limit: '15mb' }));

  // Check Gemini API Key
  const apiKey = process.env.GEMINI_API_KEY;
  const isApiKeyConfigured = Boolean(apiKey && apiKey !== 'MY_GEMINI_API_KEY' && apiKey.trim().length > 0);

  const ai = isApiKeyConfigured
    ? new GoogleGenAI({
        apiKey: apiKey!,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      })
    : null;

  // AI Health / Config check
  app.get('/api/ai/status', (req, res) => {
    res.json({
      configured: isApiKeyConfigured,
      model: 'gemini-3.8-flash',
      school: 'THCS Trưng Vương - Hoàn Kiếm',
    });
  });

  // AI Question Generation Endpoint
  app.post('/api/ai/generate-questions', async (req, res) => {
    if (!isApiKeyConfigured || !ai) {
      return res.status(400).json({
        error: 'MISSING_API_KEY',
        message: 'Chưa cấu hình API Key. Vui lòng cấu hình biến môi trường GEMINI_API_KEY để sử dụng tính năng tạo câu hỏi bằng AI.',
      });
    }

    const {
      topic = 'Tổng hợp kiến thức',
      lessonContent = '',
      subject = 'Toán học',
      grade = 9,
      chapter = '',
      lesson = '',
      questionTypes = ['single', 'multiple', 'true_false', 'matching', 'fill_blank', 'short_answer', 'essay'],
      difficulty = 'mixed',
      count = 5,
      includeAnswer = true,
      includeExplanation = true,
      includeWhyCorrect = true,
      includeRubric = true,
    } = req.body;

    try {
      const typesStr = Array.isArray(questionTypes) ? questionTypes.join(', ') : 'single, true_false, essay';
      const prompt = `Bạn là chuyên gia sư phạm hàng đầu của Bộ Giáo dục và Đào tạo Việt Nam, am hiểu sâu sắc chương trình GDPT 2018 môn ${subject} cấp THCS.
Nhiệm vụ: Phân tích kiến thức trọng tâm và tạo ra chính xác ${count} câu hỏi chất lượng cao, đúng chuẩn cấu trúc kiểm tra đánh giá định kỳ và thường xuyên.

THÔNG TIN PHÂN LOẠI:
- Môn học: ${subject}
- Khối lớp: ${grade}
- Chương: ${chapter || 'Kiến thức trọng tâm'}
- Bài học: ${lesson || topic}
- Chủ đề: ${topic}
${lessonContent ? `- TÀI LIỆU/NỘI DUNG BÀI HỌC CUNG CẤP:\n"""\n${lessonContent.slice(0, 4500)}\n"""\n` : ''}
- Dạng câu hỏi yêu cầu (phân bổ đa dạng các dạng sau): ${typesStr}
- Mức độ nhận thức: ${difficulty === 'mixed' ? 'Phân bổ theo ma trận đề: Nhận biết, Thông hiểu, Vận dụng, Vận dụng cao' : difficulty}

YÊU CẦU NỘI DUNG:
1. Ngôn ngữ: 100% tiếng Việt chuẩn sư phạm.
2. ${includeAnswer ? 'Bắt buộc có đáp án chính xác.' : 'Không kèm đáp án.'}
3. ${includeExplanation ? 'Có lời giải chi tiết, rõ ràng từng bước.' : ''}
4. ${includeWhyCorrect ? 'Có giải thích tại sao đáp án đó là đúng và tại sao các phương án khác chưa chính xác.' : ''}
5. ${includeRubric ? 'Với câu hỏi tự luận (essay), bắt buộc có hướng dẫn chấm (rubric) phân bổ điểm từng ý.' : ''}

ĐỊNH DẠNG TRẢ VỀ:
Trả về duy nhất 1 JSON Array hợp lệ (không kèm bất kỳ văn bản giải thích nào ngoài JSON), mỗi phần tử là 1 câu hỏi có cấu trúc:
[
  {
    "type": "single" | "multiple" | "true_false" | "matching" | "ordering" | "fill_blank" | "short_answer" | "essay" | "passage_based",
    "difficulty": "easy" | "medium" | "hard" | "very_hard",
    "content": "Nội dung câu hỏi...",
    "passage": "Đoạn văn đọc hiểu hoặc tình huống thực tế nếu là dạng passage_based (hoặc để trống)",
    "chapter": "${chapter || ''}",
    "lesson": "${lesson || ''}",
    "topic": "${topic}",
    "options": [
      {"id": "A", "text": "Phương án A"},
      {"id": "B", "text": "Phương án B"},
      {"id": "C", "text": "Phương án C"},
      {"id": "D", "text": "Phương án D"}
    ],
    "correctAnswer": "A",
    "subQuestions": [
      {"id": "a", "statement": "Mệnh đề a", "isCorrect": true},
      {"id": "b", "statement": "Mệnh đề b", "isCorrect": false},
      {"id": "c", "statement": "Mệnh đề c", "isCorrect": true},
      {"id": "d", "statement": "Mệnh đề d", "isCorrect": false}
    ],
    "matchingPairs": [
      {"left": "Khái niệm 1", "right": "Định nghĩa 1"},
      {"left": "Khái niệm 2", "right": "Định nghĩa 2"}
    ],
    "orderingItems": ["Bước 1...", "Bước 2...", "Bước 3..."],
    "explanation": "Lời giải chi tiết từng bước...",
    "whyCorrect": "Phương án A đúng vì... Các phương án B, C, D sai vì...",
    "rubric": "Thang điểm: Nêu điều kiện (0.25đ), Lập phương trình (0.5đ), Giải tìm nghiệm (0.5đ), Kết luận (0.25đ)",
    "qualityScore": 95,
    "qualityWarning": "",
    "tags": ["${subject}", "Khối ${grade}", "${topic}"]
  }
]`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: prompt,
        config: {
          responseMimeType: 'application/json',
          temperature: 0.3,
        },
      });

      if (!response.text) {
        throw new Error('AI không phản hồi nội dung.');
      }

      const parsed = JSON.parse(response.text);
      if (!Array.isArray(parsed)) {
        throw new Error('Định dạng dữ liệu trả về từ AI không phải mảng danh sách.');
      }

      // Validate & normalize questions
      const validatedQuestions = parsed.map((q: any, idx: number) => {
        let qualityScore = typeof q.qualityScore === 'number' ? q.qualityScore : 92;
        let qualityWarning = q.qualityWarning || '';

        // Validation rules
        if (!q.content || q.content.trim().length < 5) {
          qualityScore -= 30;
          qualityWarning = 'Nội dung câu hỏi quá ngắn hoặc thiếu thông tin.';
        }
        if (q.type === 'single' && (!q.options || q.options.length < 2)) {
          qualityScore -= 25;
          qualityWarning = 'Câu hỏi trắc nghiệm thiếu các phương án lựa chọn.';
        }
        if (!q.correctAnswer && q.type !== 'essay') {
          qualityScore -= 20;
          qualityWarning = 'Chưa xác định đáp án đúng chính xác.';
        }
        if (!q.explanation || q.explanation.trim().length < 10) {
          qualityScore -= 15;
          if (!qualityWarning) qualityWarning = 'Lời giải chi tiết còn sơ sài.';
        }

        return {
          id: `ai_gen_${Date.now()}_${idx}`,
          subject: q.subject || subject,
          grade: Number(q.grade || grade),
          chapter: q.chapter || chapter || '',
          lesson: q.lesson || lesson || '',
          topic: q.topic || topic,
          type: q.type || 'single',
          content: q.content,
          passage: q.passage || '',
          options: q.options || [],
          correctAnswer: q.correctAnswer || 'A',
          subQuestions: q.subQuestions || [],
          matchingPairs: q.matchingPairs || [],
          orderingItems: q.orderingItems || [],
          explanation: q.explanation || 'Đang cập nhật lời giải.',
          whyCorrect: q.whyCorrect || '',
          rubric: q.rubric || '',
          difficulty: q.difficulty || 'medium',
          status: 'pending',
          qualityScore: Math.max(50, Math.min(100, qualityScore)),
          qualityWarning,
          tags: Array.isArray(q.tags) ? q.tags : [subject, `Khối ${grade}`, topic],
        };
      });

      return res.json({
        success: true,
        count: validatedQuestions.length,
        questions: validatedQuestions,
      });
    } catch (error: any) {
      console.error('Lỗi khi gọi Gemini AI:', error);
      return res.status(500).json({
        error: 'AI_GENERATION_FAILED',
        message: error?.message || 'Quá trình phân tích và sinh câu hỏi bằng AI gặp sự cố. Vui lòng thử lại.',
      });
    }
  });

  // Backend Validation API for Assignment / Exam Generation (Mục 6 Đặc tả)
  app.post('/api/assignments/validate', (req, res) => {
    const {
      title,
      classId,
      subjectName,
      userRole = 'TEACHER',
      selectedQuestions = [],
      maxScore = 10,
      dueDate,
      startDate,
    } = req.body;

    const errors: string[] = [];

    // 1. Role validation
    if (userRole !== 'TEACHER' && userRole !== 'ADMIN') {
      errors.push('Chỉ giáo viên và quản trị viên mới có quyền tạo và phát hành bài tập/bài kiểm tra.');
    }

    // 2. Title validation
    if (!title || !title.trim()) {
      errors.push('Tên bài tập hoặc bài kiểm tra không được để trống.');
    } else if (title.trim().length > 200) {
      errors.push('Tên bài tập vượt quá giới hạn 200 ký tự.');
    }

    // 3. Questions and Deduplication
    if (!Array.isArray(selectedQuestions) || selectedQuestions.length === 0) {
      errors.push('Đề bài phải có ít nhất 1 câu hỏi hợp lệ.');
    } else {
      const qidSet = new Set<string>();
      let pointsSum = 0;

      selectedQuestions.forEach((q: any, i: number) => {
        if (!q.questionId) {
          errors.push(`Câu hỏi thứ ${i + 1} thiếu ID định danh.`);
        } else if (qidSet.has(q.questionId)) {
          errors.push(`Phát hiện câu hỏi trùng lặp: ID ${q.questionId}.`);
        } else {
          qidSet.add(q.questionId);
        }
        pointsSum += Number(q.points || 0);
      });

      // 4. Points sum matching max score
      if (Math.abs(pointsSum - Number(maxScore)) > 0.05) {
        errors.push(`Tổng điểm các câu (${pointsSum.toFixed(2)}đ) không khớp với thang điểm tối đa (${maxScore}đ).`);
      }
    }

    // 5. Dates
    if (dueDate && startDate && new Date(dueDate) <= new Date(startDate)) {
      errors.push('Hạn nộp bài phải sau thời điểm bắt đầu giao bài.');
    }

    if (errors.length > 0) {
      return res.status(400).json({
        valid: false,
        errors,
      });
    }

    return res.json({
      valid: true,
      message: 'Cấu hình đề bài hoàn toàn hợp lệ, sẵn sàng phát hành.',
    });
  });

  // Backend Validation API for Assigned Assignment Actions (Extend, Grade Revision, Toggle Receiving, Withdraw)
  app.post('/api/assignments/validate-action', (req, res) => {
    const { action, userRole, actorRole, payload = {} } = req.body || {};
    const resolvedRole = actorRole || userRole;
    const errors: string[] = [];

    if (resolvedRole !== 'TEACHER' && resolvedRole !== 'ADMIN') {
      return res.status(403).json({
        valid: false,
        errors: ['Chỉ giáo viên phụ trách hoặc quản trị viên mới có quyền thao tác quản lý bài tập.'],
      });
    }

    if (action === 'extend') {
      const { newDueAt, reason } = payload;
      if (!newDueAt || Number.isNaN(new Date(newDueAt).getTime()) || new Date(newDueAt).getTime() <= Date.now()) {
        errors.push('Hạn nộp mới phải sau thời điểm hiện tại.');
      }
      if (!reason || String(reason).trim().length < 10 || String(reason).trim().length > 500) {
        errors.push('Lý do gia hạn bắt buộc từ 10 đến 500 ký tự.');
      }
    } else if (action === 'grade_revision') {
      const { score, maxScore = 10, isRevising, revisionReason } = payload;
      const numScore = Number(score);
      if (score === undefined || score === null || Number.isNaN(numScore) || numScore < 0 || numScore > Number(maxScore)) {
        errors.push(`Điểm số phải hợp lệ trong khoảng từ 0 đến ${maxScore}.`);
      }
      if (isRevising && (!revisionReason || String(revisionReason).trim().length < 5)) {
        errors.push('Sửa điểm bài đã chấm bắt buộc nhập lý do tối thiểu 5 ký tự.');
      }
    } else if (action === 'withdraw') {
      const { reason, confirmationText, assignmentTitle } = payload;
      if (!reason || String(reason).trim().length < 5) {
        errors.push('Vui lòng nhập lý do thu hồi tối thiểu 5 ký tự.');
      }
      const conf = String(confirmationText || '').trim();
      if (conf.toUpperCase() !== 'THU HOI' && conf !== String(assignmentTitle || '').trim()) {
        errors.push('Mã xác nhận thu hồi phải là "THU HOI" hoặc tên chính xác của bài tập.');
      }
    } else if (action === 'toggle_receiving') {
      const { reason } = payload;
      if (!reason || String(reason).trim().length < 5) {
        errors.push('Vui lòng nhập lý do đóng/mở nhận bài tối thiểu 5 ký tự.');
      }
    } else {
      errors.push('Loại thao tác kiểm tra không hợp lệ (hỗ trợ: extend, grade_revision, withdraw, toggle_receiving).');
    }

    if (errors.length > 0) {
      return res.status(400).json({ valid: false, errors });
    }
    return res.json({ valid: true });
  });

  // Mount Vite or static dist
  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Class Server is running at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
