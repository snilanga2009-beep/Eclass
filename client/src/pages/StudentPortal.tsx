import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  CreditCard, 
  FileText, 
  FolderDown, 
  QrCode, 
  Clock,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { apiRequest, formatLKR, formatDate } from '../api';

interface StudentPortalProps {
  onOpenReceipt: (receiptNo: string) => void;
  onOpenIDCard: (studentId: string) => void;
}

export const StudentPortal: React.FC<StudentPortalProps> = ({ onOpenReceipt, onOpenIDCard }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Pick the first student as the demo student account (Kasun Kalhara)
    apiRequest<any[]>('/students').then(students => {
      if (students && students.length > 0) {
        apiRequest(`/students/${students[0].id}`).then(res => {
          setProfile(res);
          setLoading(false);
        });
      }
    });
  }, []);

  return (
    <div className="space-y-6">
      {/* Hero Welcome */}
      <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-r from-brand-900 via-indigo-950 to-slate-900 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold text-brand-300 uppercase tracking-wider">Student Self-Service Portal</span>
          <h1 className="text-2xl sm:text-3xl font-black text-white mt-1">
            Hello, {profile?.fullName || user?.name}!
          </h1>
          <p className="text-xs text-slate-300 mt-0.5">
            {profile?.studentIdNumber} • {profile?.grade} • {profile?.school || 'Apex Higher Education'}
          </p>
        </div>

        {profile && (
          <button
            onClick={() => onOpenIDCard(profile.id)}
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0"
          >
            <QrCode size={16} className="text-brand-600" />
            <span>My Smart ID Pass</span>
          </button>
        )}
      </div>

      {loading ? (
        <div className="py-20 text-center text-xs text-slate-400">Loading student portal...</div>
      ) : profile ? (
        <div className="space-y-6">
          {/* Quick Metrics */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">My Classes</span>
              <p className="text-xl font-black text-slate-900 mt-1">{profile.enrollments?.length || 0}</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Recorded</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{profile.attendances?.length || 0} Days</p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tuition Pending</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {formatLKR(profile.feeRecords?.filter((f: any) => f.status !== 'PAID')?.reduce((sum: number, f: any) => sum + f.remainingBalance, 0) || 0)}
              </p>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Course Materials</span>
              <p className="text-xl font-black text-brand-600 mt-1">{profile.learningMaterials?.length || 0} Files</p>
            </div>
          </div>

          {/* Schedule */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">My Class Schedule</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {profile.enrollments?.map((en: any) => (
                <div key={en.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 space-y-1.5">
                  <span className="px-2 py-0.5 rounded bg-brand-50 text-brand-700 text-[10px] font-mono font-bold">
                    {en.class?.classCode}
                  </span>
                  <h4 className="font-bold text-xs text-slate-900">{en.class?.name}</h4>
                  <p className="text-xs text-slate-600">Lecturer: {en.class?.teacher?.name}</p>
                  <p className="text-[11px] text-slate-500">{en.class?.dayOfWeek} ({en.class?.startTime} - {en.class?.endTime}) • Room: {en.class?.room || 'Hall A'}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Downloadable Handouts */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">My Study Handouts & Lecture Notes</h3>
            <div className="space-y-2">
              {profile.learningMaterials?.map((m: any) => (
                <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:border-brand-300 transition-all">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-xl bg-brand-50 text-brand-600">
                      <FolderDown size={18} />
                    </div>
                    <div>
                      <h5 className="font-bold text-xs text-slate-900">{m.title}</h5>
                      <p className="text-[10px] text-slate-500">{m.fileType} • {m.fileSize} • Uploaded {m.uploadDate}</p>
                    </div>
                  </div>
                  <a
                    href={m.fileUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-700 text-xs font-semibold"
                  >
                    Download
                  </a>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
