import React, { useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  Edit3,
  Eye,
  FileImage,
  FileText,
  Paperclip,
} from 'lucide-react';
import { Modal } from '../../common/Modal';
import { db } from '../../../services/db';
import { Assignment, AssignmentSubmission, UserRole } from '../../../types';
import {
  downloadStudentSubmissionFile,
  formatLatenessDuration,
  getGradeStatusMeta,
} from './utils';

interface ActorInfo {
  id: string;
  name: string;
  role: UserRole;
}

interface SubmissionAttachmentPreviewProps {
  assignment: Assignment;
  submission: AssignmentSubmission;
  actor: ActorInfo;
  onError?: (msg: string) => void;
  onDownloaded?: (filename: string) => void;
}

export const SubmissionAttachmentPreview: React.FC<SubmissionAttachmentPreviewProps> = ({
  assignment,
  submission,
  actor,
  onError,
  onDownloaded,
}) => {
  const [previewExpanded, setPreviewExpanded] = useState(true);
  const fileName = submission.fileName;
  if (!fileName) return null;

  const url = submission.fileUrl || '';
  const isImageData = url.startsWith('data:image/') || /\.(png|jpe?g|gif|webp)$/i.test(url);
  const isPdfData = url.startsWith('data:application/pdf');
  const isImageByName = /\.(png|jpe?g|gif|webp)$/i.test(fileName);
  const isPdfByName = /\.pdf$/i.test(fileName);
  const isLocalPlaceholder = !url || url === '#';

  const handleDownload = () => {
    const res = downloadStudentSubmissionFile(assignment, submission, actor);
    if (!res.ok) {
      onError?.(res.error);
      return;
    }
    onDownloaded?.(res.filename);
  };

  return (
    <div className="rounded-xl bg-[#0A1B2D] border border-[#00E5FF]/25 overflow-hidden">
      <div className="p-2.5 flex flex-wrap items-center justify-between gap-2 bg-[#071525] border-b border-[#00E5FF]/15">
        <div className="flex items-center gap-2 min-w-0">
          {isImageByName ? (
            <FileImage className="w-4 h-4 text-[#00E5FF] shrink-0" />
          ) : (
            <Paperclip className="w-4 h-4 text-[#00E5FF] shrink-0" />
          )}
          <span className="font-semibold text-[#EAFBFF] truncate">{fileName}</span>
          {submission.fileSize && (
            <span className="text-[11px] text-[#8BA9BC] shrink-0">({submission.fileSize})</span>
          )}
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => setPreviewExpanded(prev => !prev)}
            className="px-2.5 py-1 rounded-lg bg-[#03172c] hover:bg-[#062c52] text-[#EAFBFF] border border-[#0e3d54] font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Eye className="w-3 h-3 text-[#00E5FF]" />
            <span>{previewExpanded ? 'Thu gọn xem' : 'Xem tệp'}</span>
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="px-2.5 py-1 rounded-lg bg-[#00E5FF]/15 hover:bg-[#00E5FF]/25 text-[#00E5FF] border border-[#00E5FF]/40 font-semibold flex items-center gap-1 cursor-pointer"
          >
            <Download className="w-3 h-3" />
            <span>Tải tệp (kiểm quyền)</span>
          </button>
        </div>
      </div>

      {previewExpanded && (
        <div className="p-3 bg-[#030B16] space-y-2">
          {isImageData ? (
            <div className="flex justify-center bg-[#020812] rounded-lg border border-[#0e3d54] p-2">
              <img
                src={url}
                alt={`Bài làm của ${submission.studentName}`}
                className="max-h-72 object-contain rounded"
              />
            </div>
          ) : isPdfData ? (
            <iframe
              title={`Xem trước ${fileName}`}
              src={url}
              className="w-full h-72 rounded-lg border border-[#0e3d54] bg-white"
            />
          ) : (
            <div className="p-3.5 rounded-lg border border-dashed border-[#00E5FF]/30 bg-[#041527]/70 space-y-2">
              <div className="flex items-center justify-between gap-2 text-[11px]">
                <span className="font-bold text-[#00E5FF] flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  <span>
                    {isPdfByName
                      ? 'Xem trước tài liệu PDF (bản mô phỏng cục bộ)'
                      : isImageByName
                      ? 'Xem trước ảnh bài làm (bản mô phỏng cục bộ)'
                      : 'Xem trước tệp đính kèm'}
                  </span>
                </span>
                {isLocalPlaceholder && (
                  <span className="px-2 py-0.5 rounded bg-amber-500/15 border border-amber-500/40 text-amber-300 text-[10px] font-semibold">
                    Tệp mẫu cục bộ
                  </span>
                )}
              </div>
              <div className="p-3 rounded bg-[#020a14] border border-[#0e3d54] text-[11.5px] text-slate-200 font-mono whitespace-pre-wrap leading-relaxed max-h-48 overflow-y-auto">
                {[
                  `Tệp: ${fileName}${submission.fileSize ? ` (${submission.fileSize})` : ''}`,
                  `Học sinh: ${submission.studentName} · Lớp ${assignment.className}`,
                  `Nộp lúc: ${new Date(submission.submittedAt).toLocaleString('vi-VN')}`,
                  '--- NỘI DUNG TRÍCH XUẤT BÀI LÀM ---',
                  submission.content || 'Học sinh đính kèm tệp trực tiếp (chưa có nội dung mô tả văn bản kèm theo).',
                ].join('\n')}
              </div>
              <div className="text-[10.5px] text-[#8BA9BC]">
                Lưu ý: Tệp mẫu sẵn dùng trong dữ liệu demo không chứa nhị phân PDF/JPG gốc; khi học sinh tải tệp thật lên (DataURL), hệ thống hiển thị trực tiếp ảnh hoặc PDF đầy đủ.
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SubmissionFilePreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment;
  submission: AssignmentSubmission;
  actor: ActorInfo;
  onOpenGrading: (sub: AssignmentSubmission) => void;
  onToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SubmissionFilePreviewModal: React.FC<SubmissionFilePreviewModalProps> = ({
  isOpen,
  onClose,
  assignment,
  submission,
  actor,
  onOpenGrading,
  onToast,
}) => {
  const [error, setError] = useState<string | null>(null);
  const effGrade = db.getSubmissionEffectiveGradeStatus(submission);
  const gradeMeta = getGradeStatusMeta(effGrade);
  const effectiveDue = db.getStudentEffectiveDueDate(assignment, submission.studentId);
  const lateness = formatLatenessDuration(submission.submittedAt, effectiveDue);
  const maxScore = Number(assignment.points || 10);
  const perm = db.checkAssignmentActorPermission(actor.id, actor.role, assignment.classId);

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Xem Bài Làm Học Sinh · ${submission.studentName}`}
      subtitle={`${db.getAssignmentCode(assignment)} · ${assignment.title}`}
      maxWidth="3xl"
    >
      <div className="space-y-4 text-xs">
        {error && (
          <div className="p-3 rounded-xl bg-[#FF4D6D]/15 border border-[#FF4D6D]/50 text-[#FF4D6D] flex items-start gap-2 font-medium">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* Summary Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Học sinh</span>
            <strong className="text-[#EAFBFF]">{submission.studentName}</strong>
            <div className="text-[10.5px] text-[#8BA9BC]">Lượt nộp #{submission.attemptNo || 1}</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Thời gian nộp</span>
            <strong className="text-[#EAFBFF] tabular-nums">
              {new Date(submission.submittedAt).toLocaleString('vi-VN')}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Đúng hạn / Muộn</span>
            <strong className={lateness.isLate ? 'text-amber-300' : 'text-[#00F5A0]'}>
              {lateness.isLate ? lateness.label : 'Đúng hạn'}
            </strong>
          </div>
          <div className="p-2.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20">
            <span className="text-[10.5px] text-[#8BA9BC] block">Điểm & Trạng thái</span>
            <div className="flex items-center gap-1.5 flex-wrap mt-0.5">
              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${gradeMeta.badgeClass}`}>
                {gradeMeta.label}
              </span>
              {submission.score !== undefined && (
                <strong className="text-[#00E5FF] tabular-nums">
                  {submission.score}/{maxScore}đ
                </strong>
              )}
            </div>
          </div>
        </div>

        {/* Written submission text */}
        <div className="p-3.5 rounded-xl bg-[#071525] border border-[#00E5FF]/20 space-y-2">
          <div className="font-bold text-[#00E5FF] flex items-center gap-1.5">
            <FileText className="w-4 h-4" />
            <span>Lời giải / Nội dung văn bản học sinh gửi lên</span>
          </div>
          <div className="p-3 rounded-lg bg-[#030B16] border border-[#0e3d54] text-[#EAFBFF] font-mono text-[11.5px] whitespace-pre-wrap max-h-56 overflow-y-auto leading-relaxed">
            {submission.content || 'Không có phần nội dung văn bản bổ sung.'}
          </div>
        </div>

        {/* Attachment Preview */}
        {submission.fileName && (
          <SubmissionAttachmentPreview
            assignment={assignment}
            submission={submission}
            actor={actor}
            onError={msg => setError(msg)}
            onDownloaded={filename => onToast(`Đang tải xuống "${filename}"...`, 'info')}
          />
        )}

        {/* Existing teacher feedback */}
        {submission.feedback && (
          <div className="p-3 rounded-xl bg-[#00F5A0]/5 border border-[#00F5A0]/30 space-y-1">
            <div className="font-bold text-[#00F5A0] flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Nhận xét của giáo viên</span>
            </div>
            <p className="text-[#EAFBFF]">{submission.feedback}</p>
          </div>
        )}

        {/* Footer */}
        <div className="pt-3 border-t border-[#00E5FF]/20 flex flex-wrap items-center justify-between gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-[#071525] border border-[#00E5FF]/25 text-[#8BA9BC] hover:text-[#EAFBFF] font-semibold cursor-pointer"
          >
            Đóng
          </button>

          <button
            type="button"
            disabled={!perm.ok}
            onClick={() => {
              onClose();
              onOpenGrading(submission);
            }}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#00E5FF] to-[#087CFF] text-[#030B16] font-bold flex items-center gap-1.5 cursor-pointer hover:brightness-110 disabled:opacity-40"
          >
            <Edit3 className="w-3.5 h-3.5" />
            <span>
              {submission.score !== undefined && ['graded', 'published'].includes(effGrade)
                ? 'Sửa điểm & Nhận xét'
                : 'Chấm điểm bài này'}
            </span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
