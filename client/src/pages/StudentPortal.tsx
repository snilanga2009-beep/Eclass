import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  CheckCircle2, 
  CreditCard, 
  FileText, 
  FolderDown, 
  QrCode, 
  Clock,
  Award,
  ExternalLink,
  Download
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
    const loadStudent = async () => {
      try {
        if (user?.studentId) {
          const res = await apiRequest(`/students/${user.studentId}`);
          setProfile(res);
          return;
        }
        const students = await apiRequest<any[]>('/students');
        if (students && students.length > 0) {
          const res = await apiRequest(`/students/${students[0].id}`);
          setProfile(res);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    loadStudent();
  }, [user?.studentId]);

  const examResults: any[] = profile?.examResults || [];
  const avgScore = examResults.length > 0
    ? Math.round(examResults.reduce((s, r) => s + (r.percentage ?? r.marks), 0) / examResults.length)
    : 0;

  return (
    <div className="space-y-6 pb-20">
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
            className="px-4 py-2.5 rounded-xl bg-white text-slate-900 hover:bg-slate-100 font-bold text-xs flex items-center gap-2 shadow-lg transition-all shrink-0 cursor-pointer"
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
              <span className="text-[10px] font-bold text-slate-400 uppercase">Exam Average</span>
              <p className="text-xl font-black text-indigo-700 mt-1">
                {examResults.length > 0 ? `${avgScore}%` : `${profile.enrollments?.length || 0} Classes`}
              </p>
              <span className="text-[10px] text-slate-500">{examResults.length} Assessments Graded</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Attendance Recorded</span>
              <p className="text-xl font-black text-emerald-600 mt-1">{profile.attendances?.length || 0} Days</p>
              <span className="text-[10px] text-slate-500">Gate Verified</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Tuition Pending</span>
              <p className="text-xl font-black text-amber-600 mt-1">
                {formatLKR(profile.feeRecords?.filter((f: any) => f.status !== 'PAID')?.reduce((sum: number, f: any) => sum + f.remainingBalance, 0) || 0)}
              </p>
              <span className="text-[10px] text-slate-500">Monthly Balance</span>
            </div>
            <div className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold text-slate-400 uppercase">Course Materials</span>
              <p className="text-xl font-black text-brand-600 mt-1">{profile.learningMaterials?.length || 0} Files</p>
              <span className="text-[10px] text-slate-500">Handouts & Links</span>
            </div>
          </div>

          {/* Student Assessments & Performance */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-slate-900 flex items-center gap-2">
                <Award size={17} className="text-indigo-600" />
                <span>My Assessments & Exam Performance</span>
              </h3>
              <span className="text-xs font-bold text-indigo-600">{examResults.length} Graded</span>
            </div>

            {examResults.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-400">
                No exam marks published yet.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {examResults.map((er: any) => {
                  const total = er.exam?.totalMarks || 100;
                  return (
                    <div key={er.id} className="p-4 rounded-2xl bg-slate-50 border border-slate-200/80 flex items-center justify-between gap-3">
                      <div>
                        <span className="px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 text-[10px] font-bold">
                          {er.exam?.subject?.name || 'Subject'} • {er.exam?.examType}
                        </span>
                        <h4 className="font-bold text-xs text-slate-900 mt-1">{er.exam?.title}</h4>
                        <p className="text-[11px] text-slate-500">{formatDate(er.exam?.date)} • {er.comment || 'Satisfactory'}</p>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="font-black text-base text-slate-900 font-mono">
                          {er.marks}<span className="text-[10px] text-slate-400">/{total}</span>
                        </div>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">
                          Grade {er.grade} • #{er.rank || 1}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
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

          {/* Downloadable Handouts & Google Drive Links */}
          <div className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
            <h3 className="font-bold text-sm text-slate-900">My Study Handouts & Google Drive Links</h3>
            <div className="space-y-2">
              {profile.learningMaterials?.map((m: any) => {
                const isGDrive = m.fileUrl?.includes('drive.google.com') || m.fileUrl?.includes('docs.google.com');
                const isExternal = /^https?:\/\//i.test(m.fileUrl || '');
                return (
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
                      download={!isExternal ? true : undefined}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-700 text-xs font-semibold flex items-center gap-1"
                    >
                      {isExternal ? <ExternalLink size={13} /> : <Download size={13} />}
                      <span>{isGDrive ? 'Open Google Drive' : isExternal ? 'Open Link' : 'Download'}</span>
                    </a>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};
