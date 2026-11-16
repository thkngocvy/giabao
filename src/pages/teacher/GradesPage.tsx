import React, { useState, useEffect } from 'react';
import {
  Award,
  BookOpen,
} from 'lucide-react';
import { PageHeader } from '../../components/common/PageHeader';
import { db } from '../../services/db';
import { Classroom } from '../../types';
import { useAuth } from '../../contexts/AuthContext';
import { ClassGradebookSection } from '../../components/grades/ClassGradebookSection';

export const GradesPage: React.FC = () => {
  const { activeClassId, setActiveClassId } = useAuth();
  const [classes, setClasses] = useState<Classroom[]>([]);
  const [selectedClassId, setSelectedClassId] = useState(activeClassId || 'class_10a1');

  useEffect(() => {
    const list = db.getClasses();
    setClasses(list);
    if (!list.some(c => c.id === selectedClassId) && list.length > 0) {
      setSelectedClassId(list[0].id);
    }
  }, []);

  const handleSelectClass = (cId: string) => {
    setSelectedClassId(cId);
    setActiveClassId(cId);
  };

  const selectedClass = classes.find(c => c.id === selectedClassId);

  return (
    <div className="space-y-4 text-slate-100">
      <PageHeader
        breadcrumbItems={[
          { label: 'Theo dõi & Đánh giá' },
          { label: 'Điểm kiểm tra & Sổ điểm' },
        ]}
        title="Sổ Điểm Kiểm Tra Điện Tử"
        subtitle="Quản lý điểm Đánh giá thường xuyên (KTTX), Giữa kì (ĐĐGgk), Cuối kì (ĐĐGck) và tính Điểm trung bình môn THCS Trưng Vương"
        action={
          <div className="flex items-center gap-2 p-1 bg-[#041527] border border-[#0e3d54] rounded-xl shadow-xs">
            <span className="text-xs font-semibold text-slate-400 pl-2 flex items-center gap-1.5">
              <BookOpen className="w-3.5 h-3.5 text-cyan-400" />
              <span>Chọn lớp:</span>
            </span>
            <select
              value={selectedClassId}
              onChange={e => handleSelectClass(e.target.value)}
              className="px-2.5 py-1 text-xs font-bold text-cyan-300 bg-transparent border-0 focus:outline-none cursor-pointer"
            >
              {classes.map(c => (
                <option key={c.id} value={c.id} className="bg-[#03172c] text-white">
                  Lớp {c.name} ({c.studentCount} HS)
                </option>
              ))}
            </select>
          </div>
        }
      />

      {/* Gradebook Section */}
      <ClassGradebookSection
        classId={selectedClassId}
        classNameProp={selectedClass?.name}
        isStandalone={true}
      />
    </div>
  );
};
