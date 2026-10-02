import React, { useState, useEffect, useRef } from 'react';
import { 
  X, 
  User as UserIcon, 
  BookOpen, 
  CheckSquare, 
  CreditCard, 
  AlertCircle, 
  FileText, 
  FolderDown, 
  MessageSquare, 
  Paperclip, 
  History,
  Phone,
  Mail,
  MapPin,
  Calendar,
  Building,
  QrCode,
  Radio,
  Smartphone,
  Copy,
  Check,
  ExternalLink,
  Edit3,
  Camera,
  Plus,
  Trash2
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';
import { AssignRFIDModal } from './AssignRFIDModal';
import { EditStudentModal } from './EditStudentModal';
import { 
  MALE_STUDENT_AVATAR, 
  FEMALE_STUDENT_AVATAR, 
  getStudentAvatar 
} from '../utils/studentAvatars';

interface StudentProfileModalProps {
  studentId: string | null;
  onClose: () => void;
  onOpenReceipt: (receiptNo: string) => void;
  onOpenIDCard: (id: string) => void;
  onOpenPayFee: (studentId: string, feeRecordId: string) => void;
}

export const StudentProfileModal: React.FC<StudentProfileModalProps> = ({
  studentId,
  onClose,
  onOpenReceipt,
  onOpenIDCard,
  onOpenPayFee
}) => {
  const [activeTab, setActiveTab] = useState('overview');
  const [student, setStudent] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [isAssignRfidOpen, setIsAssignRfidOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [sendingParentLink, setSendingParentLink] = useState(false);
  const [parentLinkSuccess, setParentLinkSuccess] = useState<{ url: string; msg: string } | null>(null);
  const [updatingAvatar, setUpdatingAvatar] = useState(false);
  const profileFileInputRef = useRef<HTMLInputElement>(null);

  const handleUpdateProfileAvatar = async (newPhoto: string) => {
    if (!student?.id) return;
    setUpdatingAvatar(true);
    try {
      await apiRequest(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ photo: newPhoto })
      });
      setStudent((prev: any) => ({ ...prev, photo: newPhoto }));
    } catch (err: any) {
      alert(err.message || 'Failed to update avatar');
    } finally {
      setUpdatingAvatar(false);
    }
  };

  const handleProfileImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      alert('Photo must be smaller than 2MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        handleUpdateProfileAvatar(reader.result);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleUnenrollClass = async (classId: string, className?: string) => {
    if (!classId || !student?.id) return;
    if (!confirm(`Are you sure you want to unenroll ${student.fullName} from ${className || 'this class'}?`)) {
      return;
    }

    try {
      const activeIds = (student.enrollments || [])
        .filter((en: any) => en.status !== 'INACTIVE')
        .map((en: any) => en.classId || en.class?.id)
        .filter((cid: string) => cid && cid !== classId);

      const updated = await apiRequest<any>(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify({ enrolledClassIds: activeIds })
      });

      setStudent((prev: any) => ({
        ...prev,
        enrollments: updated.enrollments || prev.enrollments.filter((en: any) => (en.classId || en.class?.id) !== classId)
      }));
    } catch (err: any) {
      alert(err.message || 'Failed to unenroll student from class');
    }
  };

  const handleSendParentLink = async () => {
    if (!student?.id) return;
    setSendingParentLink(true);
    try {
      const res = await apiRequest<{ success: boolean; parentPortalUrl: string; smsMessage: string }>(
        `/students/${student.id}/send-parent-link`,
        { method: 'POST' }
      );
      setParentLinkSuccess({ url: res.parentPortalUrl, msg: res.smsMessage });
    } catch (err: any) {
      alert(err.message || 'Failed to send parent link');
    } finally {
      setSendingParentLink(false);
    }
  };

  useEffect(() => {
    if (!studentId) return;
    setLoading(true);
    setParentLinkSuccess(null);
    apiRequest(`/students/${studentId}`)
      .then(res => setStudent(res))
      .catch(err => console.error('Failed to load profile:', err))
      .finally(() => setLoading(false));
  }, [studentId]);

  if (!studentId) return null;

  const tabs = [
    { id: 'overview', label: 'Overview', icon: UserIcon },
    { id: 'classes', label: 'Classes', icon: BookOpen, count: student?.enrollments?.length },
    { id: 'attendance', label: 'Attendance', icon: CheckSquare, count: student?.attendances?.length },
    { id: 'payments', label: 'Payments', icon: CreditCard, count: student?.payments?.length },
    { id: 'pending-fees', label: 'Pending Fees', icon: AlertCircle, count: student?.feeRecords?.filter((f: any) => f.status !== 'PAID')?.length },
    { id: 'exams', label: 'Exams & Results', icon: FileText, count: student?.examResults?.length },
    { id: 'materials', label: 'Materials', icon: FolderDown, count: student?.learningMaterials?.length },
    { id: 'messages', label: 'SMS & WhatsApp', icon: MessageSquare, count: (student?.messages?.length || 0) + (student?.whatsappLogs?.length || 0) },
    { id: 'documents', label: 'Documents', icon: Paperclip, count: student?.documents?.length },
    { id: 'activity', label: 'Activity History', icon: History }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col h-[90vh]">
        {/* Profile Header */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 relative shrink-0">
          <button 
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
          >
            <X size={18} />
          </button>

          {loading ? (
            <div className="py-6 text-xs text-slate-400">Loading student details...</div>
          ) : student ? (
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start sm:items-center space-x-4">
                {/* Profile Image & Quick Avatar Controls */}
                <div className="relative group shrink-0">
                  <img 
                    src={getStudentAvatar(student)} 
                    alt={student.fullName} 
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl object-cover ring-4 ring-white/20 shrink-0 shadow-xl bg-slate-800"
                  />
                  {updatingAvatar && (
                    <div className="absolute inset-0 bg-slate-900/70 rounded-2xl flex items-center justify-center">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    </div>
                  )}
                  <button
                    onClick={() => profileFileInputRef.current?.click()}
                    title="Upload Custom Student Photo"
                    className="absolute -bottom-1 -right-1 p-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 text-white shadow-md border-2 border-slate-900 transition-transform active:scale-95"
                  >
                    <Camera size={12} />
                  </button>
                  <input
                    type="file"
                    ref={profileFileInputRef}
                    onChange={handleProfileImageUpload}
                    accept="image/*"
                    className="hidden"
                  />
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <h2 className="text-lg sm:text-xl font-bold text-white tracking-tight">{student.fullName}</h2>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[10px] font-bold">
                      {student.status}
                    </span>
                  </div>
                  <p className="text-xs text-brand-300 font-mono font-medium mt-0.5">
                    {student.studentIdNumber} • {student.grade} • {student.school || 'Private Candidate'}
                  </p>
                  <p className="text-xs text-slate-400 mt-1 flex items-center gap-3">
                    {student.phone && <span className="flex items-center gap-1"><Phone size={12} /> {student.phone}</span>}
                    {student.parentPhone && <span className="flex items-center gap-1">Guardian: {student.parentPhone}</span>}
                  </p>

                  {/* 2 Selectable Avatar Icon Quick Toggle (Male / Female) */}
                  <div className="flex items-center gap-1.5 mt-2">
                    <span className="text-[10px] text-slate-400 font-semibold">Avatar Icon:</span>
                    <button
                      type="button"
                      onClick={() => handleUpdateProfileAvatar(MALE_STUDENT_AVATAR)}
                      disabled={updatingAvatar}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
                        student.photo === MALE_STUDENT_AVATAR || (!student.photo && student.gender === 'Male')
                          ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-300 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                      title="Set Male Student Avatar Icon"
                    >
                      <span>👦</span>
                      <span>Male Icon</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleUpdateProfileAvatar(FEMALE_STUDENT_AVATAR)}
                      disabled={updatingAvatar}
                      className={`px-2 py-0.5 rounded-md text-[11px] font-medium flex items-center gap-1 transition-all ${
                        student.photo === FEMALE_STUDENT_AVATAR || (!student.photo && student.gender === 'Female')
                          ? 'bg-pink-600 text-white shadow-sm ring-1 ring-pink-300 font-bold'
                          : 'bg-white/10 hover:bg-white/20 text-slate-300'
                      }`}
                      title="Set Female Student Avatar Icon"
                    >
                      <span>👧</span>
                      <span>Female Icon</span>
                    </button>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="flex items-center space-x-2 shrink-0">
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-brand-500/30 hover:bg-brand-500/40 text-brand-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-brand-400/30 shadow-sm"
                  title="Add or Change Enrolled Classes"
                >
                  <BookOpen size={14} />
                  <span>Classes ({student.enrollments?.length || 0})</span>
                </button>
                <button
                  onClick={() => setIsEditModalOpen(true)}
                  className="px-3 py-2 rounded-xl bg-amber-500/30 hover:bg-amber-500/40 text-amber-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-amber-400/30 shadow-sm"
                  title="Edit Student Details & Parent Phone"
                >
                  <Edit3 size={14} />
                  <span>Edit Student</span>
                </button>
                <button
                  onClick={() => setIsAssignRfidOpen(true)}
                  className="px-3 py-2 rounded-xl bg-indigo-500/30 hover:bg-indigo-500/40 text-indigo-200 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-indigo-400/30 shadow-sm"
                  title={student.rfidTag ? `Current RFID: ${student.rfidTag}` : 'Assign 125kHz RFID Card'}
                >
                  <Radio size={14} className={student.rfidTag ? 'text-emerald-400' : 'text-slate-300'} />
                  <span>{student.rfidTag ? `RFID: ${student.rfidTag}` : 'Assign RFID'}</span>
                </button>
                <button
                  onClick={() => onOpenIDCard(student.id)}
                  className="px-3 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold flex items-center gap-1.5 transition-all border border-white/10"
                >
                  <QrCode size={14} />
                  <span>Student ID Card</span>
                </button>
              </div>
            </div>
          ) : null}
        </div>

        {/* Tab Navigation Strip */}
        <div className="flex items-center space-x-1 px-4 py-2 border-b border-slate-200 bg-slate-50 overflow-x-auto scrollbar-none shrink-0">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`
                  flex items-center space-x-2 px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all
                  ${isActive 
                    ? 'bg-white text-brand-700 shadow-sm border border-slate-200' 
                    : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'}
                `}
              >
                <Icon size={14} className={isActive ? 'text-brand-600' : 'text-slate-400'} />
                <span>{tab.label}</span>
                {tab.count !== undefined && tab.count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    isActive ? 'bg-brand-50 text-brand-700' : 'bg-slate-200 text-slate-600'
                  }`}>
                    {tab.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 text-slate-800">
          {student && (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Personal Information</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Full Name</span>
                          <span className="font-semibold text-slate-800">{student.fullName}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Gender</span>
                          <span className="font-semibold text-slate-800">{student.gender || 'Not specified'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Date of Birth</span>
                          <span className="font-semibold text-slate-800">{formatDate(student.dateOfBirth)}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Grade</span>
                          <span className="font-semibold text-slate-800">{student.grade}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">School</span>
                          <span className="font-semibold text-slate-800">{student.school || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Registered Date</span>
                          <span className="font-semibold text-slate-800">{formatDate(student.registrationDate)}</span>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block text-[11px]">125kHz HID RFID Card UID</span>
                            {student.rfidTag ? (
                              <span className="font-mono font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200 inline-flex items-center gap-1 mt-0.5">
                                <Radio size={12} className="text-indigo-600" />
                                <span>{student.rfidTag}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 italic text-xs">No RFID Card Assigned</span>
                            )}
                          </div>
                          <button
                            onClick={() => setIsAssignRfidOpen(true)}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] flex items-center gap-1 transition-all"
                          >
                            <Radio size={12} />
                            <span>{student.rfidTag ? 'Reassign Card' : 'Assign Card'}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Guardian & Emergency Contacts</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-slate-400 block text-[11px]">Guardian Name</span>
                          <span className="font-semibold text-slate-800">{student.parentName || student.parent?.name || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Relationship</span>
                          <span className="font-semibold text-slate-800">{student.parent?.relationship || 'Parent'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">Parent Phone</span>
                          <span className="font-semibold text-slate-800">{student.parentPhone || student.parent?.phone || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-slate-400 block text-[11px]">WhatsApp</span>
                          <span className="font-semibold text-slate-800">{student.whatsapp || student.parent?.whatsapp || 'N/A'}</span>
                        </div>
                        <div className="col-span-2">
                          <span className="text-slate-400 block text-[11px]">Address</span>
                          <span className="font-semibold text-slate-800">{student.address || student.parent?.address || 'N/A'}</span>
                        </div>
                        <div className="col-span-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-slate-400 block text-[11px]">Parent & Guardian Portal PWA</span>
                            <span className="text-teal-700 font-bold text-xs inline-flex items-center gap-1 mt-0.5">
                              <Smartphone size={13} className="text-teal-600" />
                              <span>1-Time Phone Login</span>
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleSendParentLink}
                            disabled={sendingParentLink || (!student.parentPhone && !student.phone)}
                            className="px-2.5 py-1 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-[11px] flex items-center gap-1 transition-all disabled:opacity-50"
                          >
                            <Smartphone size={12} />
                            <span>{sendingParentLink ? 'Sending...' : 'Send Portal SMS'}</span>
                          </button>
                        </div>
                        {parentLinkSuccess && (
                          <div className="col-span-2 p-2.5 rounded-xl bg-teal-50 border border-teal-200 text-teal-900 text-xs space-y-1">
                            <div className="flex items-center justify-between">
                              <span className="font-bold text-teal-800 flex items-center gap-1">
                                <Check size={12} className="text-teal-600" />
                                <span>SMS Link Generated & Dispatched!</span>
                              </span>
                              <a
                                href={parentLinkSuccess.url}
                                target="_blank"
                                rel="noreferrer"
                                className="text-teal-700 font-bold hover:underline flex items-center gap-0.5 text-[10px]"
                              >
                                <span>Test Link</span>
                                <ExternalLink size={10} />
                              </a>
                            </div>
                            <input
                              type="text"
                              readOnly
                              value={parentLinkSuccess.url}
                              className="w-full px-2 py-1 rounded bg-white border border-teal-200 text-[10px] font-mono text-slate-700 select-all"
                            />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {student.notes && (
                    <div className="bg-amber-50/60 p-4 rounded-2xl border border-amber-200 text-xs">
                      <span className="font-bold text-amber-800 uppercase tracking-wider text-[10px] block mb-1">Administrative Notes</span>
                      <p className="text-amber-900">{student.notes}</p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ENROLLED CLASSES */}
              {activeTab === 'classes' && (
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-slate-50 p-3.5 rounded-2xl border border-slate-200">
                    <div>
                      <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <BookOpen size={15} className="text-brand-600" />
                        <span>Enrolled Classes ({student.enrollments?.length || 0})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Total Monthly Tuition: <span className="font-bold text-slate-800 font-mono">{formatLKR((student.enrollments || []).reduce((acc: number, en: any) => acc + (en.class?.monthlyFee || 0), 0))}/mo</span>
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsEditModalOpen(true)}
                      className="px-3.5 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm shadow-brand-600/30 transition-all self-start sm:self-auto"
                    >
                      <Plus size={14} />
                      <span>Add or Change Classes</span>
                    </button>
                  </div>

                  {(!student.enrollments || student.enrollments.length === 0) ? (
                    <div className="p-8 text-center border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50/50 space-y-3">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
                        <BookOpen size={24} />
                      </div>
                      <div>
                        <h5 className="font-bold text-sm text-slate-800">No Classes Enrolled Yet</h5>
                        <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                          Enroll {student.fullName} into tuition batches to start tracking attendance, timetable schedules, and fee records.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsEditModalOpen(true)}
                        className="px-4 py-2 rounded-xl bg-brand-600 text-white font-bold text-xs shadow-md shadow-brand-600/30 hover:bg-brand-500 transition-all inline-flex items-center gap-1.5"
                      >
                        <Plus size={14} />
                        <span>Enroll into Classes Now</span>
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {student.enrollments.map((en: any) => (
                        <div key={en.id} className="p-4 rounded-2xl border border-slate-200 hover:border-brand-300 transition-all bg-white shadow-xs space-y-2 relative group">
                          <div className="flex items-center justify-between">
                            <span className="px-2 py-0.5 rounded-md bg-brand-50 text-brand-700 font-mono text-[10px] font-bold">
                              {en.class?.classCode || en.class?.grade || 'Class'}
                            </span>
                            <div className="flex items-center gap-2">
                              <span className="text-[11px] text-brand-700 font-mono font-bold">{formatLKR(en.class?.monthlyFee)}/mo</span>
                              <button
                                type="button"
                                onClick={() => handleUnenrollClass(en.classId || en.class?.id, en.class?.name)}
                                title="Unenroll from this class"
                                className="p-1 rounded-lg text-slate-300 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                          <h5 className="font-bold text-sm text-slate-900 leading-snug">{en.class?.name}</h5>
                          {en.class?.subject?.name && (
                            <p className="text-xs text-slate-600 font-medium">
                              Subject: <span className="text-slate-800">{en.class.subject.name}</span>
                            </p>
                          )}
                          <p className="text-xs text-slate-500">
                            Teacher: <span className="font-semibold text-slate-700">{en.class?.teacher?.name || 'Assigned Faculty'}</span>
                          </p>
                          <p className="text-xs text-slate-500">
                            Schedule: <span className="font-medium text-slate-700">{en.class?.dayOfWeek} ({en.class?.startTime} - {en.class?.endTime})</span>
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: ATTENDANCE */}
              {activeTab === 'attendance' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attendance History</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Date</th>
                          <th className="p-3">Class</th>
                          <th className="p-3">Time</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Status</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {student.attendances?.map((att: any) => (
                          <tr key={att.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-medium">{formatDate(att.date)}</td>
                            <td className="p-3 font-semibold text-slate-800">{att.class?.name || 'Class Session'}</td>
                            <td className="p-3 text-slate-500 font-mono">{new Date(att.scannedAt).toLocaleTimeString()}</td>
                            <td className="p-3">
                              <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-mono">
                                {att.method}
                              </span>
                            </td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                att.status === 'PRESENT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {att.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 4: PAYMENTS */}
              {activeTab === 'payments' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Payment Transactions</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Receipt No</th>
                          <th className="p-3">Date</th>
                          <th className="p-3">Amount</th>
                          <th className="p-3">Method</th>
                          <th className="p-3">Cashier</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {student.payments?.map((pay: any) => (
                          <tr key={pay.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-mono font-bold text-brand-600">{pay.receiptNumber}</td>
                            <td className="p-3 text-slate-500">{formatDate(pay.paymentDate)}</td>
                            <td className="p-3 font-bold text-slate-900">{formatLKR(pay.totalAmount)}</td>
                            <td className="p-3 text-slate-600">{pay.paymentMethod}</td>
                            <td className="p-3 text-slate-500">{pay.cashier}</td>
                            <td className="p-3 text-right">
                              <button
                                onClick={() => onOpenReceipt(pay.receiptNumber)}
                                className="px-2 py-1 rounded bg-slate-100 hover:bg-brand-50 text-brand-700 text-[10px] font-semibold transition-colors"
                              >
                                View Receipt
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 5: PENDING FEES */}
              {activeTab === 'pending-fees' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Monthly Fee Breakdown</h4>
                  <div className="border border-slate-200 rounded-2xl overflow-hidden shadow-sm">
                    <table className="w-full text-xs text-left">
                      <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                        <tr>
                          <th className="p-3">Class</th>
                          <th className="p-3">Month</th>
                          <th className="p-3">Total Due</th>
                          <th className="p-3">Paid Amount</th>
                          <th className="p-3">Balance</th>
                          <th className="p-3">Status</th>
                          <th className="p-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {student.feeRecords?.map((f: any) => (
                          <tr key={f.id} className="hover:bg-slate-50/50">
                            <td className="p-3 font-semibold text-slate-800">{f.class?.name}</td>
                            <td className="p-3 text-slate-600">{f.month}</td>
                            <td className="p-3">{formatLKR(f.totalDue)}</td>
                            <td className="p-3 text-emerald-700 font-medium">{formatLKR(f.paidAmount)}</td>
                            <td className="p-3 font-bold text-amber-700">{formatLKR(f.remainingBalance)}</td>
                            <td className="p-3">
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                f.status === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                                f.status === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                              }`}>
                                {f.status}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              {f.remainingBalance > 0 && (
                                <button
                                  onClick={() => onOpenPayFee(student.id, f.id)}
                                  className="px-2.5 py-1 rounded-lg bg-brand-600 hover:bg-brand-700 text-white text-[10px] font-semibold transition-colors shadow-sm"
                                >
                                  Pay Now
                                </button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* TAB 6: EXAMS & RESULTS */}
              {activeTab === 'exams' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Exam Marks & Academic Performance</h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {student.examResults?.map((res: any) => (
                      <div key={res.id} className="p-4 rounded-2xl border border-slate-200 bg-white shadow-sm space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-bold text-slate-400 uppercase">{res.exam?.subject?.name}</span>
                          <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                            res.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            res.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            res.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-800'
                          }`}>
                            Grade {res.grade}
                          </span>
                        </div>
                        <h5 className="font-bold text-sm text-slate-900">{res.exam?.title}</h5>
                        <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                          <span className="text-slate-500">Score: <strong className="text-slate-900">{res.marks}/100</strong></span>
                          {res.rank && <span className="text-slate-500">Rank: <strong className="text-brand-600">#{res.rank}</strong></span>}
                        </div>
                        {res.comment && (
                          <p className="text-[11px] text-slate-500 italic mt-1 bg-slate-50 p-2 rounded-lg">"{res.comment}"</p>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 7: LEARNING MATERIALS */}
              {activeTab === 'materials' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Accessible Course Notes & Materials</h4>
                  <div className="space-y-2">
                    {student.learningMaterials?.map((m: any) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 hover:border-brand-300 bg-white transition-all shadow-sm">
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
                          className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-brand-50 text-brand-700 text-xs font-semibold transition-colors"
                        >
                          Download
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 8: MESSAGES */}
              {activeTab === 'messages' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">SMS & WhatsApp Communication Log</h4>
                  <div className="space-y-2">
                    {student.messages?.map((m: any) => (
                      <div key={m.id} className="p-3 rounded-2xl border border-slate-200 bg-white text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-brand-700 text-[11px]">SMS: {m.type}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(m.sentAt)}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{m.message}</p>
                      </div>
                    ))}
                    {student.whatsappLogs?.map((w: any) => (
                      <div key={w.id} className="p-3 rounded-2xl border border-emerald-200 bg-emerald-50/30 text-xs space-y-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-emerald-700 text-[11px]">WhatsApp: {w.templateName}</span>
                          <span className="text-[10px] text-slate-400">{formatDate(w.sentAt)}</span>
                        </div>
                        <p className="text-slate-700 text-xs">{w.message}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 9: DOCUMENTS */}
              {activeTab === 'documents' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Attached Student Documents</h4>
                  <div className="p-6 rounded-2xl border border-dashed border-slate-300 text-center text-xs text-slate-400">
                    <Paperclip size={24} className="mx-auto mb-2 text-slate-300" />
                    <p>No external scanned certificates uploaded for this student yet.</p>
                  </div>
                </div>
              )}

              {/* TAB 10: ACTIVITY HISTORY */}
              {activeTab === 'activity' && (
                <div className="space-y-3">
                  <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider">System Audit Trail</h4>
                  <div className="space-y-2">
                    {student.activityHistory?.map((act: any) => (
                      <div key={act.id} className="p-3 rounded-2xl border border-slate-200 bg-white text-xs flex items-center justify-between">
                        <div>
                          <p className="font-semibold text-slate-800">{act.action}</p>
                          <p className="text-[11px] text-slate-500">{act.details}</p>
                        </div>
                        <span className="text-[10px] text-slate-400 font-mono">{formatDate(act.createdAt)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Assign 125kHz RFID Card Modal */}
      {isAssignRfidOpen && student && (
        <AssignRFIDModal
          student={student}
          isOpen={isAssignRfidOpen}
          onClose={() => setIsAssignRfidOpen(false)}
          onSuccess={(updatedStudent) => {
            setStudent((prev: any) => ({ ...prev, rfidTag: updatedStudent.rfidTag }));
          }}
        />
      )}

      {/* Edit Student Profile Modal */}
      {isEditModalOpen && student && (
        <EditStudentModal
          student={student}
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSuccess={(updatedStudent) => {
            setStudent((prev: any) => ({ ...prev, ...updatedStudent }));
          }}
        />
      )}
    </div>
  );
};
