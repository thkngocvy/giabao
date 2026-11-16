import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  CheckSquare,
  Sparkles,
  Zap,
  BarChart3,
  CheckCircle2,
  AlertCircle,
  Clock,
  Search,
  Filter,
  Save,
  Download,
  Share2,
  FileSpreadsheet,
  Scan,
  RefreshCw,
  Eye,
  Award
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { Modal } from '../../components/common/Modal';
import { db } from '../../services/db';
import { Quiz, Student, Classroom } from '../../types';
import { useToast } from '../../contexts/ToastContext';

interface AutoGradedStudent {
  id: string;
  studentId: string;
  studentName: string;
  studentCode: string;
  submittedAt: string;
  score: number;
  correctAnswersCount: number;
  totalQuestions: number;
  status: 'graded' | 'pending' | 'flagged';
  feedback: string;
  answers: { [qIdx: number]: { studentChoice: string; correctChoice: string; isCorrect: boolean } };
}

export const AutoGradingPage: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [selectedQuizId, setSelectedQuizId] = useState<string>('quiz_01');
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [isProcessingAutoGrading, setIsProcessingAutoGrading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Detail student review modal
  const [reviewStudent, setReviewStudent] = useState<AutoGradedStudent | null>(null);

  // Graded list for the active quiz
  const [gradedStudents, setGradedStudents] = useState<AutoGradedStudent[]>([
    {
      id: 'sub_q_01',
      studentId: 'std_01',
      studentName: 'Phạm Minh Nhật',
      studentCode: 'HS-TV2024-001',
      submittedAt: '2025-02-21T08:14:00Z',
      score: 10.0,
      correctAnswersCount: 4,
      totalQuestions: 4,
      status: 'graded',
      feedback: 'Làm đúng 100% các câu hỏi hệ thức Vi-ét và hình học đường tròn.',
      answers: {
        0: { studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        1: { studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        2: { studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        3: { studentChoice: 'true', correctChoice: 'true', isCorrect: true },
      }
    },
    {
      id: 'sub_q_02',
      studentId: 'std_02',
      studentName: 'Đỗ Hà My',
      studentCode: 'HS-TV2024-002',
      submittedAt: '2025-02-21T08:12:30Z',
      score: 10.0,
      correctAnswersCount: 4,
      totalQuestions: 4,
      status: 'graded',
      feedback: 'Hoàn thành bài thi xuất sắc trong thời gian ngắn nhất lớp.',
      answers: {
        0: { studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        1: { studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        2: { studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        3: { studentChoice: 'true', correctChoice: 'true', isCorrect: true },
      }
    },
    {
      id: 'sub_q_03',
      studentId: 'std_03',
      studentName: 'Vũ Nguyên Khang',
      studentCode: 'HS-TV2024-003',
      submittedAt: '2025-02-21T08:15:10Z',
      score: 7.5,
      correctAnswersCount: 3,
      totalQuestions: 4,
      status: 'graded',
      feedback: 'Sai câu số 2 về điều kiện đồng biến hàm số bậc nhất. Cần ôn lại hệ số a > 0.',
      answers: {
        0: { studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        1: { studentChoice: 'A', correctChoice: 'B', isCorrect: false },
        2: { studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        3: { studentChoice: 'true', correctChoice: 'true', isCorrect: true },
      }
    },
    {
      id: 'sub_q_04',
      studentId: 'std_04',
      studentName: 'Nguyễn Khánh An',
      studentCode: 'HS-TV2024-004',
      submittedAt: '2025-02-21T08:14:45Z',
      score: 10.0,
      correctAnswersCount: 4,
      totalQuestions: 4,
      status: 'graded',
      feedback: 'Nắm vững kiến thức trọng tâm chương 3 Hình học và Đại số.',
      answers: {
        0: { studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        1: { studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        2: { studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        3: { studentChoice: 'true', correctChoice: 'true', isCorrect: true },
      }
    },
    {
      id: 'sub_q_05',
      studentId: 'std_05',
      studentName: 'Bùi Hoàng Long',
      studentCode: 'HS-TV2024-005',
      submittedAt: '2025-02-21T08:15:00Z',
      score: 5.0,
      correctAnswersCount: 2,
      totalQuestions: 4,
      status: 'graded',
      feedback: 'Cần chú ý định lý góc nội tiếp chắn nửa đường tròn (bằng 90°).',
      answers: {
        0: { studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        1: { studentChoice: 'C', correctChoice: 'B', isCorrect: false },
        2: { studentChoice: 'D', correctChoice: 'C', isCorrect: false },
        3: { studentChoice: 'true', correctChoice: 'true', isCorrect: true },
      }
    },
    {
      id: 'sub_q_06',
      studentId: 'std_06',
      studentName: 'Lê Thảo Vy',
      studentCode: 'HS-TV2024-006',
      submittedAt: '2025-02-21T08:13:50Z',
      score: 10.0,
      correctAnswersCount: 4,
      totalQuestions: 4,
      status: 'graded',
      feedback: 'Tốt, các bước chọn đáp án chính xác tuyệt đối.',
      answers: {
        0: { studentChoice: 'A', correctChoice: 'A', isCorrect: true },
        1: { studentChoice: 'B', correctChoice: 'B', isCorrect: true },
        2: { studentChoice: 'C', correctChoice: 'C', isCorrect: true },
        3: { studentChoice: 'true', correctChoice: 'true', isCorrect: true },
      }
    },
  ]);

  useEffect(() => {
    setQuizzes(db.getQuizzes());
    setClasses(db.getClasses());
  }, []);

  const activeQuiz = quizzes.find(q => q.id === selectedQuizId) || quizzes[0];

  const handleRunAutoGrading = () => {
    setIsProcessingAutoGrading(true);
    setTimeout(() => {
      setIsProcessingAutoGrading(false);
      showToast('Đã chấm tự động xong 100% bài nộp! Độ chính xác: 100%', 'success');
    }, 1200);
  };

  const handleSyncToGradebook = () => {
    // Sync scores to class gradebook
    showToast('Đã đồng bộ kết quả chấm tự động vào Sổ điểm lớp 9A1!', 'success');
  };

  const avgScore = (
    gradedStudents.reduce((acc, cur) => acc + cur.score, 0) / (gradedStudents.length || 1)
  ).toFixed(1);

  const perfectScoreCount = gradedStudents.filter(s => s.score === 10).length;

  const filteredStudents = gradedStudents.filter(s =>
    s.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.studentCode.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-5 text-slate-100">
      <PageHeader
        breadcrumbItems={[
          { label: 'Dạy và Học' },
          { label: 'Chấm bài tự động' },
        ]}
        title="Chấm bài tự động & Khảo sát năng lực"
        subtitle="Hệ thống chấm trắc nghiệm thông minh, quét bài thi OMR và xuất phổ điểm tức thời"
        action={
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsScanModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-[#041527] border border-[#0e3d54] hover:bg-[#07243e] text-cyan-300 rounded-xl text-xs font-semibold shadow-xs transition-colors cursor-pointer"
            >
              <Scan className="w-4 h-4 text-cyan-400" />
              <span>Quét phiếu làm bài (OMR)</span>
            </button>
            <button
              onClick={handleRunAutoGrading}
              disabled={isProcessingAutoGrading}
              className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#0284c7] hover:bg-[#0369a1] disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-xs transition-colors cursor-pointer border border-cyan-500/40"
            >
              <Zap className="w-4 h-4 text-amber-300" />
              <span>{isProcessingAutoGrading ? 'Hệ thống đang chấm...' : 'Chấm tự động toàn bộ'}</span>
            </button>
          </div>
        }
      />

      {/* KPI Stats Ribbon */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Đã nộp bài</div>
          <div className="text-xl font-extrabold text-white mt-1 tabular-nums">{gradedStudents.length} học sinh</div>
          <div className="text-[10px] text-cyan-400 mt-0.5">Tỉ lệ hoàn thành: 100%</div>
        </div>
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Điểm trung bình</div>
          <div className="text-xl font-extrabold text-cyan-300 mt-1 tabular-nums">{avgScore} / 10</div>
          <div className="text-[10px] text-emerald-400 mt-0.5">+0.6 so với bài trước</div>
        </div>
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Điểm 10 tuyệt đối</div>
          <div className="text-xl font-extrabold text-emerald-400 mt-1 tabular-nums">{perfectScoreCount} HS</div>
          <div className="text-[10px] text-slate-400 mt-0.5">{((perfectScoreCount / gradedStudents.length) * 100).toFixed(0)}% học sinh</div>
        </div>
        <div className="bg-[#041527] border border-[#0e3d54] p-3.5 rounded-xl">
          <div className="text-[11px] font-bold text-slate-400 uppercase">Thời gian chấm</div>
          <div className="text-xl font-extrabold text-amber-400 mt-1 tabular-nums">0.8 giây</div>
          <div className="text-[10px] text-slate-400 mt-0.5">Xử lý tức thì</div>
        </div>
      </div>

      {/* Quiz Selector & Action Bar */}
      <div className="bg-[#041527] p-3.5 sm:p-4 rounded-xl border border-[#0e3d54] space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <CheckSquare className="w-4 h-4 text-cyan-400" />
            <span className="text-xs font-bold text-slate-300">Đề kiểm tra:</span>
            <select
              value={selectedQuizId}
              onChange={e => setSelectedQuizId(e.target.value)}
              className="bg-[#020e1a] border border-[#0e3d54] text-white rounded-xl px-3 py-1.5 text-xs font-bold focus:outline-none focus:border-cyan-400 max-w-sm truncate"
            >
              {quizzes.map(q => (
                <option key={q.id} value={q.id}>
                  {q.title} ({q.className})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleSyncToGradebook}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#03172c] border border-[#0e3d54] hover:bg-[#06203a] text-emerald-400 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              <span>Đồng bộ vào Sổ điểm</span>
            </button>
            <button
              onClick={() => showToast('Đang kết xuất bảng điểm Excel...', 'info')}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#03172c] border border-[#0e3d54] hover:bg-[#06203a] text-slate-200 rounded-xl text-xs font-semibold transition-colors cursor-pointer"
            >
              <Download className="w-3.5 h-3.5 text-cyan-400" />
              <span>Xuất Excel</span>
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 text-cyan-400/70 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Tìm học sinh theo tên, mã học sinh..."
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full bg-[#020e1a] border border-[#0e3d54] rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-cyan-500"
          />
        </div>
      </div>

      {/* Submissions Table */}
      <div className="bg-[#041527] rounded-xl border border-[#0e3d54] overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-[#031526] border-b border-[#0e3d54] text-cyan-400 uppercase font-bold text-[11px] tracking-wider">
              <tr>
                <th className="px-4 py-3">STT</th>
                <th className="px-4 py-3">Học sinh</th>
                <th className="px-4 py-3">Mã HS</th>
                <th className="px-4 py-3">Thời gian nộp</th>
                <th className="px-4 py-3">Số câu đúng</th>
                <th className="px-4 py-3">Điểm số</th>
                <th className="px-4 py-3">Nhận xét tự động từ AI</th>
                <th className="px-4 py-3 text-right">Chi tiết</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#0e3d54]">
              {filteredStudents.map((st, idx) => (
                <tr
                  key={st.id}
                  onClick={() => setReviewStudent(st)}
                  className="hover:bg-[#06203a] cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-semibold text-slate-400 tabular-nums">
                    {idx + 1}
                  </td>
                  <td className="px-4 py-3 font-bold text-white">
                    {st.studentName}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-400">
                    {st.studentCode}
                  </td>
                  <td className="px-4 py-3 text-slate-400">
                    {new Date(st.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })} · 21/02
                  </td>
                  <td className="px-4 py-3 font-semibold">
                    <span className="text-emerald-400">{st.correctAnswersCount}</span> / {st.totalQuestions} câu
                  </td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded font-extrabold text-xs tabular-nums ${
                      st.score >= 9
                        ? 'bg-emerald-950/80 text-emerald-400 border border-emerald-800'
                        : st.score >= 7
                        ? 'bg-blue-950/80 text-cyan-300 border border-cyan-800'
                        : 'bg-amber-950/80 text-amber-400 border border-amber-800'
                    }`}>
                      {st.score.toFixed(1)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-[11px] text-slate-300 max-w-xs truncate">
                    {st.feedback}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setReviewStudent(st);
                      }}
                      className="p-1.5 text-cyan-400 hover:text-cyan-200 hover:bg-[#072540] rounded-lg transition-colors cursor-pointer"
                      title="Xem bài làm chi tiết"
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Modal */}
      {reviewStudent && (
        <Modal
          isOpen={!!reviewStudent}
          onClose={() => setReviewStudent(null)}
          title={`Chi tiết bài làm: ${reviewStudent.studentName}`}
          maxWidth="lg"
        >
          <div className="space-y-4 text-xs text-slate-200">
            <div className="flex items-center justify-between p-3 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
              <div>
                <div className="font-bold text-white text-sm">{reviewStudent.studentName}</div>
                <div className="text-slate-400 text-[11px] font-mono">{reviewStudent.studentCode}</div>
              </div>
              <div className="text-right">
                <div className="text-xl font-extrabold text-cyan-300">{reviewStudent.score.toFixed(1)} / 10</div>
                <div className="text-[11px] text-emerald-400 font-semibold">
                  Đúng {reviewStudent.correctAnswersCount}/{reviewStudent.totalQuestions} câu
                </div>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#020e1a] border border-[#0e3d54]">
              <div className="text-[11px] font-bold text-cyan-400 uppercase mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Nhận xét thông minh từ hệ thống</span>
              </div>
              <p className="text-xs text-slate-200">{reviewStudent.feedback}</p>
            </div>

            <div className="space-y-2">
              <div className="font-bold text-slate-300">Chi tiết đối chiếu đáp án từng câu:</div>
              {Object.entries(reviewStudent.answers).map(([idx, ans]) => (
                <div
                  key={idx}
                  className={`p-2.5 rounded-lg border flex items-center justify-between ${
                    ans.isCorrect
                      ? 'bg-emerald-950/30 border-emerald-800 text-emerald-200'
                      : 'bg-rose-950/30 border-rose-800 text-rose-200'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs">Câu {Number(idx) + 1}:</span>
                    <span>Học sinh chọn: <strong className="font-bold">{ans.studentChoice}</strong></span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span>Đáp án chuẩn: <strong className="font-bold text-white">{ans.correctChoice}</strong></span>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      ans.isCorrect ? 'bg-emerald-900 text-emerald-300' : 'bg-rose-900 text-rose-300'
                    }`}>
                      {ans.isCorrect ? 'Chính xác' : 'Chưa đúng'}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setReviewStudent(null)}
                className="px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold cursor-pointer"
              >
                Đóng
              </button>
            </div>
          </div>
        </Modal>
      )}

      {/* OMR Scan Modal */}
      <Modal
        isOpen={isScanModalOpen}
        onClose={() => setIsScanModalOpen(false)}
        title="Quét & Chấm phiếu trắc nghiệm tự động (OMR Scan)"
        maxWidth="md"
      >
        <div className="space-y-4 text-xs text-slate-200">
          <div className="p-4 rounded-xl border border-dashed border-[#0e3d54] bg-[#020e1a] text-center space-y-2">
            <Scan className="w-8 h-8 text-cyan-400 mx-auto" />
            <div className="font-bold text-white">Tải lên tệp quét phiếu trắc nghiệm hoặc kết nối máy ảnh</div>
            <p className="text-[11px] text-slate-400 max-w-xs mx-auto">
              Hỗ trợ định dạng PDF, JPG, PNG phiếu trả lời trắc nghiệm chuẩn Bộ GD&ĐT 20, 40 hoặc 50 câu.
            </p>
            <button
              onClick={() => {
                showToast('Đã nhận diện thành công 12 phiếu trắc nghiệm!', 'success');
                setIsScanModalOpen(false);
              }}
              className="mt-2 px-4 py-2 bg-[#0284c7] hover:bg-[#0369a1] text-white rounded-xl font-bold cursor-pointer"
            >
              Chọn tệp để quét & chấm
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
};
