import {
  Assignment,
  AssignmentGradeStatus,
  AssignmentReceiveStatus,
  AssignmentSubmission,
  Student,
  UserRole,
} from '../../../types';
import { db } from '../../../services/db';

export interface StudentSubmissionRow {
  student: Student;
  submission?: AssignmentSubmission;
  effectiveDueAt: string;
  hasCustomDueOverride: boolean;
  isLate: boolean;
  latenessLabel: string;
  minutesLate: number;
  effectiveGradeStatus: AssignmentGradeStatus;
  isVerified: boolean;
  isOverdueMissing: boolean;
}

export function formatLatenessDuration(
  submittedAtIso: string,
  effectiveDueIso: string
): { isLate: boolean; label: string; minutesLate: number } {
  const subMs = new Date(submittedAtIso).getTime();
  const dueMs = new Date(effectiveDueIso).getTime();
  if (Number.isNaN(subMs) || Number.isNaN(dueMs) || subMs <= dueMs) {
    return { isLate: false, label: 'Đúng hạn', minutesLate: 0 };
  }

  const diffMins = Math.max(1, Math.floor((subMs - dueMs) / 60000));
  const days = Math.floor(diffMins / (60 * 24));
  const hours = Math.floor((diffMins % (60 * 24)) / 60);
  const mins = diffMins % 60;

  const parts: string[] = [];
  if (days > 0) parts.push(`${days} ngày`);
  if (hours > 0) parts.push(`${hours} giờ`);
  if (mins > 0 && days === 0) parts.push(`${mins} phút`);

  return {
    isLate: true,
    label: `Muộn ${parts.join(' ') || '1 phút'}`,
    minutesLate: diffMins,
  };
}

export function getReceiveStatusMeta(status: AssignmentReceiveStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'open':
      return {
        label: 'Đang nhận bài',
        badgeClass: 'bg-[#00F5A0]/12 text-[#00F5A0] border-[#00F5A0]/45',
      };
    case 'scheduled':
      return {
        label: 'Lên lịch mở',
        badgeClass: 'bg-sky-500/15 text-sky-300 border-sky-500/45',
      };
    case 'closed':
      return {
        label: 'Đã đóng nhận',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/45',
      };
    case 'draft':
      return {
        label: 'Bản nháp',
        badgeClass: 'bg-slate-700/40 text-slate-300 border-slate-500/50',
      };
    case 'withdrawn':
      return {
        label: 'Đã thu hồi',
        badgeClass: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/45',
      };
  }
}

export type AssignmentDeadlinePhase =
  | 'in_time'
  | 'grace_period'
  | 'overdue_open'
  | 'closed'
  | 'draft'
  | 'scheduled'
  | 'withdrawn';

export interface AssignmentReceiveDisplayMeta {
  effectiveStatus: AssignmentReceiveStatus;
  deadlinePhase: AssignmentDeadlinePhase;
  label: string;
  shortLabel: string;
  badgeClass: string;
  isOverdueOpen: boolean;
  isInGracePeriod: boolean;
}

export function getAssignmentReceiveDisplayMeta(asg: Assignment): AssignmentReceiveDisplayMeta {
  const effectiveStatus = db.getEffectiveReceiveStatus(asg);
  if (effectiveStatus !== 'open') {
    const base = getReceiveStatusMeta(effectiveStatus);
    return {
      effectiveStatus,
      deadlinePhase: effectiveStatus,
      label: base.label,
      shortLabel: base.label,
      badgeClass: base.badgeClass,
      isOverdueOpen: false,
      isInGracePeriod: false,
    };
  }

  const nowMs = Date.now();
  const dueMs = new Date(asg.dueDate).getTime();
  const graceMs = Math.max(0, Number(asg.allowLateDays || 0)) * 86400000;

  if (!Number.isNaN(dueMs) && nowMs > dueMs + graceMs) {
    return {
      effectiveStatus,
      deadlinePhase: 'overdue_open',
      label: 'Quá hạn · Vẫn mở nhận',
      shortLabel: 'Quá hạn (Mở)',
      badgeClass: 'bg-[#FF4D6D]/15 text-[#FF4D6D] border-[#FF4D6D]/50',
      isOverdueOpen: true,
      isInGracePeriod: false,
    };
  }

  if (!Number.isNaN(dueMs) && nowMs > dueMs && nowMs <= dueMs + graceMs) {
    return {
      effectiveStatus,
      deadlinePhase: 'grace_period',
      label: `Gia hạn trễ (+${asg.allowLateDays}d)`,
      shortLabel: 'Nộp trễ (Mở)',
      badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/50',
      isOverdueOpen: false,
      isInGracePeriod: true,
    };
  }

  return {
    effectiveStatus,
    deadlinePhase: 'in_time',
    label: 'Đang nhận bài',
    shortLabel: 'Đang nhận bài',
    badgeClass: 'bg-[#00F5A0]/12 text-[#00F5A0] border-[#00F5A0]/45',
    isOverdueOpen: false,
    isInGracePeriod: false,
  };
}

export function getGradeStatusMeta(status: AssignmentGradeStatus): {
  label: string;
  badgeClass: string;
} {
  switch (status) {
    case 'published':
      return {
        label: 'Đã trả bài',
        badgeClass: 'bg-[#00F5A0]/15 text-[#00F5A0] border-[#00F5A0]/45',
      };
    case 'graded':
      return {
        label: 'Đã chấm (chờ trả)',
        badgeClass: 'bg-[#00E5FF]/15 text-[#00E5FF] border-[#00E5FF]/45',
      };
    case 'draft_grade':
      return {
        label: 'Chấm nháp',
        badgeClass: 'bg-amber-500/15 text-amber-300 border-amber-500/45',
      };
    default:
      return {
        label: 'Chưa chấm',
        badgeClass: 'bg-slate-800/80 text-slate-300 border-slate-600/60',
      };
  }
}

export function buildStudentRows(
  asg: Assignment,
  recipients: Student[],
  subs: AssignmentSubmission[]
): StudentSubmissionRow[] {
  const subByStudent = new Map(subs.map(s => [s.studentId, s]));
  const nowMs = Date.now();
  const graceMs = (asg.allowLateDays || 0) * 86400000;
  const effReceive = db.getEffectiveReceiveStatus(asg);

  return recipients.map(student => {
    const submission = subByStudent.get(student.id);
    const effectiveDueAt = db.getStudentEffectiveDueDate(asg, student.id);
    const hasCustomDueOverride = Boolean(asg.recipientOverrides?.[student.id]?.dueOverrideAt);

    let isLate = false;
    let latenessLabel = 'Đúng hạn';
    let minutesLate = 0;

    if (submission) {
      const lateness = formatLatenessDuration(submission.submittedAt, effectiveDueAt);
      isLate = lateness.isLate || submission.status === 'late';
      latenessLabel = lateness.isLate ? lateness.label : submission.status === 'late' ? 'Nộp muộn' : 'Đúng hạn';
      minutesLate = lateness.minutesLate;
    }

    const effectiveGradeStatus = db.getSubmissionEffectiveGradeStatus(submission);
    const isVerified = Boolean(
      submission?.isTeacherVerified || asg.completedStudentIds?.includes(student.id)
    );
    const isOverdueMissing =
      !submission &&
      effReceive !== 'draft' &&
      effReceive !== 'withdrawn' &&
      nowMs > new Date(effectiveDueAt).getTime() + graceMs;

    return {
      student,
      submission,
      effectiveDueAt,
      hasCustomDueOverride,
      isLate,
      latenessLabel,
      minutesLate,
      effectiveGradeStatus,
      isVerified,
      isOverdueMissing,
    };
  });
}

export function downloadAssignmentAttachment(
  asg: Assignment,
  actor: { id: string; name: string; role: UserRole }
): { ok: true; filename: string } | { ok: false; error: string } {
  const perm = db.checkAssignmentActorPermission(actor.id, actor.role, asg.classId);
  if (!perm.ok) {
    return { ok: false, error: perm.error };
  }

  const filename = asg.fileName || `De_Bai_${asg.subjectName}_${asg.className}.txt`;
  if (asg.fileUrl && (asg.fileUrl.startsWith('data:') || asg.fileUrl.startsWith('blob:'))) {
    const a = document.createElement('a');
    a.href = asg.fileUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { ok: true, filename };
  }

  const lines = [
    `TRƯỜNG THCS TRƯNG VƯƠNG - ${db.getAssignmentCode(asg)}`,
    `ĐỀ BÀI: ${asg.title}`,
    `Môn: ${asg.subjectName} | Lớp: ${asg.className} | Thang điểm: ${asg.points}`,
    `Hạn nộp: ${new Date(asg.dueDate).toLocaleString('vi-VN')}`,
    '------------------------------------------------------------',
    asg.content || asg.description || '',
  ];

  const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.pdf') ? `${filename}.txt` : filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true, filename };
}

export function downloadStudentSubmissionFile(
  asg: Assignment,
  submission: AssignmentSubmission,
  actor: { id: string; name: string; role: UserRole }
): { ok: true; filename: string } | { ok: false; error: string } {
  const perm = db.checkAssignmentActorPermission(actor.id, actor.role, asg.classId);
  if (!perm.ok) {
    return { ok: false, error: perm.error };
  }

  const rawName = submission.fileName || `BaiLam_${submission.studentName}.txt`;
  if (
    submission.fileUrl &&
    (submission.fileUrl.startsWith('data:') || submission.fileUrl.startsWith('blob:'))
  ) {
    const a = document.createElement('a');
    a.href = submission.fileUrl;
    a.download = rawName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    return { ok: true, filename: rawName };
  }

  const body = [
    `SMART CLASS 4.0 · BÀI LÀM HỌC SINH`,
    `Bài tập: ${asg.title} (${db.getAssignmentCode(asg)})`,
    `Học sinh: ${submission.studentName} (${submission.studentCode || submission.studentId})`,
    `Tệp đính kèm: ${rawName}${submission.fileSize ? ` (${submission.fileSize})` : ''}`,
    `Thời gian nộp: ${new Date(submission.submittedAt).toLocaleString('vi-VN')}`,
    '------------------------------------------------------------',
    submission.content || 'Học sinh nộp bài qua tệp đính kèm (dữ liệu mô phỏng cục bộ).',
  ].join('\n');

  const downloadName = rawName.endsWith('.txt') ? rawName : `${rawName}.txt`;
  const blob = new Blob([body], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = downloadName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return { ok: true, filename: downloadName };
}

function escapeHtml(raw: unknown): string {
  return String(raw ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function printReportViaHiddenIframe(params: {
  title: string;
  subtitle: string;
  summaryItems: { label: string; value: string }[];
  headers: string[];
  rows: (string | number)[][];
}): void {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '0';
  iframe.style.bottom = '0';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.style.border = '0';
  document.body.appendChild(iframe);

  const summaryHtml = params.summaryItems
    .map(
      item => `
      <div style="border:1px solid #cbd5e1;border-radius:6px;padding:8px 12px;background:#f8fafc;">
        <div style="font-size:11px;color:#475569;">${escapeHtml(item.label)}</div>
        <div style="font-size:15px;font-weight:700;color:#0f172a;margin-top:2px;">${escapeHtml(item.value)}</div>
      </div>`
    )
    .join('');

  const theadHtml = `<tr>${params.headers
    .map(h => `<th style="border:1px solid #cbd5e1;padding:7px 8px;background:#0f172a;color:#fff;font-size:11px;text-align:left;">${escapeHtml(h)}</th>`)
    .join('')}</tr>`;

  const tbodyHtml = params.rows
    .map(
      (r, idx) =>
        `<tr style="background:${idx % 2 === 0 ? '#ffffff' : '#f8fafc'};">${r
          .map(c => `<td style="border:1px solid #cbd5e1;padding:6px 8px;font-size:11px;color:#1e293b;">${escapeHtml(c)}</td>`)
          .join('')}</tr>`
    )
    .join('');

  const html = `<!doctype html>
  <html lang="vi">
  <head>
    <meta charset="utf-8" />
    <title>${escapeHtml(params.title)}</title>
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body { font-family: Arial, sans-serif; color: #0f172a; margin: 0; padding: 12px; }
    </style>
  </head>
  <body>
    <div style="border-bottom:2px solid #0284c7;padding-bottom:8px;margin-bottom:12px;">
      <div style="font-size:11px;color:#0284c7;font-weight:700;text-transform:uppercase;">Smart Class 4.0 · THCS Trưng Vương</div>
      <h1 style="margin:4px 0 2px;font-size:18px;">${escapeHtml(params.title)}</h1>
      <div style="font-size:12px;color:#475569;">${escapeHtml(params.subtitle)} · Xuất lúc ${new Date().toLocaleString('vi-VN')}</div>
    </div>
    <div style="display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin-bottom:14px;">${summaryHtml}</div>
    <table style="width:100%;border-collapse:collapse;">
      <thead>${theadHtml}</thead>
      <tbody>${tbodyHtml}</tbody>
    </table>
  </body>
  </html>`;

  const doc = iframe.contentWindow?.document;
  if (doc) {
    doc.open();
    doc.write(html);
    doc.close();
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (iframe.parentNode) document.body.removeChild(iframe);
      }, 1500);
    }, 250);
  }
}
