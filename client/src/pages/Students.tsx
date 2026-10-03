import React, { useState, useEffect } from 'react';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  Download, 
  Printer, 
  QrCode, 
  Eye, 
  Edit3, 
  Trash2,
  CheckCircle2,
  AlertCircle,
  X,
  Phone,
  GraduationCap,
  MessageCircle,
  Radio,
  Share2,
  Copy,
  ExternalLink,
  Smartphone,
  Check,
  BookOpen,
  Clock,
  RefreshCw,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { apiRequest, formatLKR, formatDate } from '../api';
import { Student } from '../types';
import { AssignRFIDModal } from '../components/AssignRFIDModal';
import { EditStudentModal } from '../components/EditStudentModal';
import { useRFIDReader } from '../utils/useRFIDReader';
import { 
  MALE_STUDENT_AVATAR, 
  FEMALE_STUDENT_AVATAR, 
  MALE_STUDENT_PHOTO, 
  FEMALE_STUDENT_PHOTO,
  getStudentAvatar 
} from '../utils/studentAvatars';

interface StudentsProps {
  onOpenProfile: (studentId: string) => void;
  onOpenIDCard: (studentId: string) => void;
}

export const Students: React.FC<StudentsProps> = ({ onOpenProfile, onOpenIDCard }) => {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [classFilter, setClassFilter] = useState('ALL');

  // Edit Student Modal State
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  // Assign RFID Modal State
  const [assignRfidStudent, setAssignRfidStudent] = useState<Student | null>(null);

  // Add Student Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    grade: 'Grade 12',
    school: '',
    gender: 'Male',
    dateOfBirth: '',
    phone: '',
    whatsapp: '',
    email: '',
    address: '',
    city: 'Colombo',
    parentName: '',
    parentPhone: '',
    emergencyContact: '',
    notes: '',
    rfidTag: '',
    photo: MALE_STUDENT_AVATAR,
    enrolledClassIds: [] as string[]
  });
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  // Class Enrollment picker state for Register Modal
  const [classesLoading, setClassesLoading] = useState(false);
  const [classSearch, setClassSearch] = useState('');
  const [classGradeFilter, setClassGradeFilter] = useState('ALL');

  // Parent Portal SMS Link Confirmation Modal State
  const [portalSmsInfo, setPortalSmsInfo] = useState<{
    studentName: string;
    studentIdNumber: string;
    recipient: string;
    parentPortalUrl: string;
    smsMessage: string;
  } | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedSms, setCopiedSms] = useState(false);
  const [sendingLinkId, setSendingLinkId] = useState<string | null>(null);

  const handleSendParentLink = async (student: Student) => {
    setSendingLinkId(student.id);
    try {
      const res = await apiRequest<{
        success: boolean;
        recipient: string;
        parentPortalUrl: string;
        smsMessage: string;
      }>(`/students/${student.id}/send-parent-link`, { method: 'POST' });

      setPortalSmsInfo({
        studentName: student.fullName,
        studentIdNumber: student.studentIdNumber,
        recipient: res.recipient,
        parentPortalUrl: res.parentPortalUrl,
        smsMessage: res.smsMessage
      });
    } catch (err: any) {
      alert(err.message || 'Failed to dispatch parent portal link');
    } finally {
      setSendingLinkId(null);
    }
  };

  // Auto-fill RFID tag if reader scans while Add Modal is active
  useRFIDReader({
    enabled: isAddModalOpen,
    onScan: (tag) => {
      setFormData(prev => ({ ...prev, rfidTag: tag }));
    }
  });

  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const fetchStudents = async (overrideFilters?: { search?: string; grade?: string; status?: string; classId?: string }) => {
    setLoading(true);
    try {
      const qSearch = overrideFilters?.search !== undefined ? overrideFilters.search : search;
      const qGrade = overrideFilters?.grade !== undefined ? overrideFilters.grade : gradeFilter;
      const qStatus = overrideFilters?.status !== undefined ? overrideFilters.status : statusFilter;
      const qClass = overrideFilters?.classId !== undefined ? overrideFilters.classId : classFilter;

      const queryParams = new URLSearchParams({
        search: qSearch,
        grade: qGrade,
        status: qStatus,
        classId: qClass
      });
      const data = await apiRequest<Student[]>(`/students?${queryParams.toString()}`);
      setStudents(data || []);
    } catch (err) {
      console.error('Failed to load students:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    setClassesLoading(true);
    try {
      const res = await apiRequest<any[]>('/classes');
      setClasses(res || []);
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setClassesLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
    fetchClasses();
  }, [gradeFilter, statusFilter, classFilter]);

  // Real-time synchronization: Auto-refresh on changes
  useEffect(() => {
    const handleDataChanged = () => {
      fetchStudents();
    };
    window.addEventListener('cams-data-changed', handleDataChanged);
    return () => window.removeEventListener('cams-data-changed', handleDataChanged);
  }, [gradeFilter, statusFilter, classFilter, search]);

  // When Add Modal is opened, ensure fresh classes are fetched
  useEffect(() => {
    if (isAddModalOpen) {
      fetchClasses();
      setClassSearch('');
      setClassGradeFilter('ALL');
    }
  }, [isAddModalOpen]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setModalError('Image file is too large (maximum size 4MB)');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setFormData(prev => ({ ...prev, photo: reader.result as string }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents();
  };

  const handleToggleStudentStatus = async (s: Student, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    const nextStatus = s.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      const updated = await apiRequest<Student>(`/students/${s.id}`, {
        method: 'PUT',
        body: JSON.stringify({ status: nextStatus })
      });
      setStudents(prev => prev.map(item => item.id === s.id ? { ...item, status: updated.status || nextStatus } : item));
    } catch (err: any) {
      alert(err.message || 'Failed to update student status');
    }
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formData.fullName || !formData.grade) {
      setModalError('Full name and grade are required');
      return;
    }

    setSubmitting(true);
    try {
      const created = await apiRequest<any>('/students', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsAddModalOpen(false);
      setFormData({
        fullName: '',
        grade: 'Grade 11',
        school: '',
        gender: 'Male',
        dateOfBirth: '',
        phone: '',
        whatsapp: '',
        email: '',
        address: '',
        city: 'Colombo',
        parentName: '',
        parentPhone: '',
        emergencyContact: '',
        notes: '',
        rfidTag: '',
        photo: MALE_STUDENT_AVATAR,
        enrolledClassIds: []
      });
      setGradeFilter('ALL');
      setStatusFilter('ALL');
      setClassFilter('ALL');
      setSearch('');
      fetchStudents({ search: '', grade: 'ALL', status: 'ALL', classId: 'ALL' });
      setSuccessNotice(`Student ${created.fullName} (${created.studentIdNumber}) registered successfully!`);
      setTimeout(() => setSuccessNotice(null), 6000);

      try {
        window.dispatchEvent(new CustomEvent('cams-data-changed', {
          detail: { type: 'STUDENT_CREATED', studentId: created?.id }
        }));
      } catch (e) {}

      // Show SMS link modal if parent portal link was generated
      if (created.parentPortalUrl && created.welcomeSms) {
        setPortalSmsInfo({
          studentName: created.fullName,
          studentIdNumber: created.studentIdNumber,
          recipient: created.parentPhone || created.phone || 'Registered Phone',
          parentPortalUrl: created.parentPortalUrl,
          smsMessage: created.welcomeSms
        });
      }
    } catch (err: any) {
      setModalError(err.message || 'Failed to create student');
    } finally {
      setSubmitting(false);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Student ID', 'Full Name', 'Grade', 'School', 'Phone', 'Parent Phone', 'Status'];
    const rows = students.map(s => [
      s.studentIdNumber,
      `"${s.fullName}"`,
      s.grade,
      `"${s.school || ''}"`,
      s.phone || '',
      s.parentPhone || '',
      s.status
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Students_Directory_${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Computed helpers for Register Student Class Enrollment
  const filteredClasses = classes.filter(c => {
    const s = classSearch.toLowerCase().trim();
    const matchesSearch = !s ||
      (c.name && c.name.toLowerCase().includes(s)) ||
      (c.subject?.name && c.subject.name.toLowerCase().includes(s)) ||
      (c.teacher?.name && c.teacher.name.toLowerCase().includes(s)) ||
      (c.grade && c.grade.toLowerCase().includes(s)) ||
      (c.dayOfWeek && c.dayOfWeek.toLowerCase().includes(s));

    const matchesGrade = 
      classGradeFilter === 'ALL' 
        ? true 
        : classGradeFilter === 'MATCH_STUDENT' 
          ? c.grade === formData.grade 
          : c.grade === classGradeFilter;

    return matchesSearch && matchesGrade;
  });

  const matchingGradeCount = classes.filter(c => c.grade === formData.grade).length;

  const totalSelectedFees = classes
    .filter(c => formData.enrolledClassIds.includes(c.id))
    .reduce((sum, c) => sum + (Number(c.monthlyFee) || 0), 0);

  return (
    <div className="space-y-6">
      {/* Page Title & Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Student Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage student profiles, enrollments, attendance, and smart QR identification cards</p>
        </div>

        <div className="flex items-center space-x-2.5 shrink-0">
          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
            title="Export CSV"
          >
            <Download size={15} />
            <span className="hidden sm:inline">Export CSV</span>
          </button>

          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md shadow-brand-600/30 transition-all"
          >
            <UserPlus size={16} />
            <span>Register Student</span>
          </button>
        </div>
      </div>

      {successNotice && (
        <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 shadow-sm animate-in fade-in">
          <Check size={16} className="text-emerald-600 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <form onSubmit={handleSearchSubmit} className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by student name, ID, parent phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-brand-500"
          />
        </form>

        <div className="flex items-center space-x-2 overflow-x-auto pb-1 md:pb-0">
          {/* Grade filter */}
          <select
            value={gradeFilter}
            onChange={(e) => setGradeFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Grades (1 - 13)</option>
            <optgroup label="Primary (Grades 1-5)">
              <option value="Grade 1">Grade 1</option>
              <option value="Grade 2">Grade 2</option>
              <option value="Grade 3">Grade 3</option>
              <option value="Grade 4">Grade 4</option>
              <option value="Grade 5">Grade 5 (Scholarship)</option>
            </optgroup>
            <optgroup label="Junior Secondary (Grades 6-9)">
              <option value="Grade 6">Grade 6</option>
              <option value="Grade 7">Grade 7</option>
              <option value="Grade 8">Grade 8</option>
              <option value="Grade 9">Grade 9</option>
            </optgroup>
            <optgroup label="Ordinary Level (Grades 10-11)">
              <option value="Grade 10">Grade 10</option>
              <option value="Grade 11">Grade 11 (O/L)</option>
            </optgroup>
            <optgroup label="Advanced Level (Grades 12-13)">
              <option value="Grade 12">Grade 12 (A/L)</option>
              <option value="Grade 13">Grade 13 (A/L)</option>
            </optgroup>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
          >
            <option value="ALL">All Status</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
          </select>

          {/* Class filter */}
          <select
            value={classFilter}
            onChange={(e) => setClassFilter(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none max-w-[160px] truncate"
          >
            <option value="ALL">All Classes</option>
            {classes.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Desktop Students Data Table (hidden on mobile) */}
      <div className="hidden md:block bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-slate-50/80 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Student</th>
                <th className="py-3 px-4">Grade & School</th>
                <th className="py-3 px-4">Contact</th>
                <th className="py-3 px-4">Guardian Details</th>
                <th className="py-3 px-4">Enrolled Classes</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">Loading student directory...</td>
                </tr>
              ) : students.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">No students match current search filter.</td>
                </tr>
              ) : (
                students.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50/60 transition-colors group">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={getStudentAvatar(s)} 
                          alt="" 
                          className="w-9 h-9 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                        />
                        <div className="min-w-0">
                          <p 
                            onClick={() => onOpenProfile(s.id)}
                            className="font-bold text-slate-900 group-hover:text-brand-600 cursor-pointer truncate"
                          >
                            {s.fullName}
                          </p>
                          <div className="flex items-center gap-1.5 mt-0.5">
                            <span className="text-[10px] text-slate-400 font-mono">{s.studentIdNumber}</span>
                            {s.rfidTag ? (
                              <span className="px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 font-mono text-[9px] font-bold border border-indigo-200 flex items-center gap-0.5" title={`125kHz RFID: ${s.rfidTag}`}>
                                <Radio size={9} />
                                <span>{s.rfidTag}</span>
                              </span>
                            ) : (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setAssignRfidStudent(s);
                                }}
                                className="px-1.5 py-0.5 rounded bg-slate-100 hover:bg-brand-50 hover:text-brand-600 text-slate-500 font-mono text-[9px] font-semibold border border-slate-200 flex items-center gap-0.5 transition-all"
                                title="Click to assign 125kHz RFID Card"
                              >
                                <Radio size={9} />
                                <span>+RFID</span>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{s.grade}</p>
                      <p className="text-[10px] text-slate-500 truncate max-w-[150px]">{s.school || 'Private'}</p>
                    </td>

                    <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                      {s.phone || 'N/A'}
                    </td>

                    <td className="py-3 px-4">
                      <p className="font-semibold text-slate-800">{s.parentName || s.parent?.name || 'Guardian'}</p>
                      <p className="text-[10px] text-slate-500 font-mono">{s.parentPhone || s.parent?.phone || 'N/A'}</p>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={() => setEditingStudent(s)}
                        className="px-2.5 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-[11px] border border-indigo-200/80 transition-colors flex items-center gap-1.5"
                        title="Click to add or change class enrollments"
                      >
                        <BookOpen size={12} className="text-indigo-600" />
                        <span>{s.enrollments?.length || 0} Classes</span>
                      </button>
                    </td>

                    <td className="py-3 px-4">
                      <button
                        type="button"
                        onClick={(e) => handleToggleStudentStatus(s, e)}
                        title="Click to toggle Active / Inactive status"
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                          s.status === 'ACTIVE'
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                            : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                        }`}
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                        <span>{s.status}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end space-x-1.5">
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Add or Change Class Enrollments"
                        >
                          <BookOpen size={15} />
                        </button>
                        <button
                          onClick={() => setEditingStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                          title="Edit Student Details & Parent Phone"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => handleSendParentLink(s)}
                          disabled={sendingLinkId === s.id}
                          className="p-1.5 rounded-lg text-teal-600 hover:bg-teal-50 transition-colors"
                          title="Send / Copy Guardian Portal SMS Link"
                        >
                          <Smartphone size={15} className={sendingLinkId === s.id ? 'animate-pulse' : ''} />
                        </button>
                        <button
                          onClick={() => setAssignRfidStudent(s)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                          title={s.rfidTag ? `Reassign RFID (Current: ${s.rfidTag})` : 'Assign 125kHz RFID Card'}
                        >
                          <Radio size={15} className={s.rfidTag ? 'text-indigo-600' : ''} />
                        </button>
                        <button
                          onClick={() => onOpenIDCard(s.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="View & Print QR ID Card"
                        >
                          <QrCode size={15} />
                        </button>
                        <button
                          onClick={() => onOpenProfile(s.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                          title="Open 10-Tab Profile"
                        >
                          <Eye size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Touch-Friendly Student Cards (Visible on mobile < md) */}
      <div className="md:hidden space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            Loading students directory...
          </div>
        ) : students.length === 0 ? (
          <div className="p-8 text-center text-xs text-slate-400 bg-white rounded-3xl border border-slate-200">
            No students found matching current filter.
          </div>
        ) : (
          students.map(s => {
            const rawPhone = (s.parentPhone || s.phone || '').replace(/[^0-9]/g, '');
            const cleanPhone = rawPhone.startsWith('0') ? '94' + rawPhone.substring(1) : rawPhone;
            return (
              <div 
                key={s.id} 
                className="p-4 rounded-3xl bg-white border border-slate-200/90 shadow-sm space-y-3"
              >
                {/* Top Row: Photo + Name + Grade */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center space-x-3 min-w-0">
                    <img 
                      src={getStudentAvatar(s)} 
                      alt="" 
                      className="w-12 h-12 rounded-2xl object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div className="min-w-0">
                      <h4 
                        onClick={() => onOpenProfile(s.id)}
                        className="font-bold text-sm text-slate-900 truncate hover:text-indigo-600 cursor-pointer"
                      >
                        {s.fullName}
                      </h4>
                      <p className="text-[11px] text-slate-400 font-mono">{s.studentIdNumber}</p>
                      <div className="flex items-center gap-1.5 mt-1">
                        <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/60">
                          {s.grade}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => handleToggleStudentStatus(s, e)}
                          title="Click to toggle Active / Inactive status"
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center gap-1 ${
                            s.status === 'ACTIVE'
                              ? 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100'
                              : 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${s.status === 'ACTIVE' ? 'bg-emerald-500' : 'bg-rose-500'}`}></span>
                          <span>{s.status}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Guardian / Contact Row with Direct Tap-to-Call & WhatsApp */}
                {(s.parentPhone || s.phone) && (
                  <div className="p-2.5 rounded-2xl bg-slate-50 border border-slate-100 flex items-center justify-between text-xs">
                    <div className="min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Guardian / Phone</p>
                      <p className="font-semibold text-slate-800 text-xs truncate">
                        {s.parentName ? `${s.parentName} (${s.parentPhone || s.phone})` : (s.parentPhone || s.phone)}
                      </p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                      <button
                        type="button"
                        onClick={() => handleSendParentLink(s)}
                        className="w-8 h-8 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-600 flex items-center justify-center transition-colors"
                        title="Send Parent Portal SMS Link"
                      >
                        <Smartphone size={15} />
                      </button>
                      <a
                        href={`tel:${s.parentPhone || s.phone}`}
                        className="w-8 h-8 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-600 flex items-center justify-center transition-colors"
                        title="Call Guardian"
                      >
                        <Phone size={15} />
                      </a>
                      <a
                        href={`https://wa.me/${cleanPhone}`}
                        target="_blank"
                        rel="noreferrer"
                        className="w-8 h-8 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                        title="Chat on WhatsApp"
                      >
                        <MessageCircle size={15} />
                      </a>
                    </div>
                  </div>
                )}

                {/* Bottom Touch Actions */}
                <div className="grid grid-cols-4 gap-1 pt-1 border-t border-slate-100">
                  <button
                    onClick={() => setEditingStudent(s)}
                    className="py-2 px-1 rounded-xl bg-brand-50 hover:bg-brand-100 text-brand-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Add or Change Class Enrollments"
                  >
                    <BookOpen size={12} />
                    <span>Classes</span>
                  </button>

                  <button
                    onClick={() => setEditingStudent(s)}
                    className="py-2 px-1 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                    title="Edit Student Profile & Parent Phone"
                  >
                    <Edit3 size={12} />
                    <span>Edit</span>
                  </button>

                  <button
                    onClick={() => onOpenProfile(s.id)}
                    className="py-2 px-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <Eye size={12} />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => onOpenIDCard(s.id)}
                    className="py-2 px-2 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 text-[11px] font-bold flex items-center justify-center gap-1 transition-colors"
                  >
                    <QrCode size={13} />
                    <span>ID Pass</span>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* REGISTER STUDENT MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2">
                <UserPlus size={18} className="text-brand-600" />
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Register New Student</h3>
              </div>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={15} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Profile Image & Avatar Icon Selector */}
              <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-50 via-indigo-50/40 to-slate-50 border border-slate-200/80 space-y-3">
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                  Student Profile Image &amp; Avatar Icon
                </label>

                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4">
                  {/* Current Preview */}
                  <div className="relative shrink-0">
                    <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-white shadow-md bg-white border border-slate-200 flex items-center justify-center">
                      <img
                        src={formData.photo || (formData.gender === 'Female' ? FEMALE_STUDENT_AVATAR : MALE_STUDENT_AVATAR)}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <span className="absolute -bottom-1 -right-1 px-1.5 py-0.5 rounded-full bg-emerald-600 text-white text-[9px] font-bold shadow">
                      Selected
                    </span>
                  </div>

                  {/* 2 Type Image Icon Selectors & Upload */}
                  <div className="flex-1 space-y-2.5 w-full">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-bold text-slate-500">Choose Profile Icon:</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {/* 1. Male Student Icon */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: MALE_STUDENT_AVATAR, gender: 'Male' })}
                        className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                          formData.photo === MALE_STUDENT_AVATAR || (!formData.photo && formData.gender === 'Male')
                            ? 'bg-blue-50 border-blue-500 text-blue-900 ring-2 ring-blue-400 font-bold shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <img src={MALE_STUDENT_AVATAR} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-[11px] leading-tight truncate">Male Icon</p>
                          <p className="text-[9px] text-blue-600 font-bold">Boy Student</p>
                        </div>
                      </button>

                      {/* 2. Female Student Icon */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: FEMALE_STUDENT_AVATAR, gender: 'Female' })}
                        className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                          formData.photo === FEMALE_STUDENT_AVATAR || (!formData.photo && formData.gender === 'Female')
                            ? 'bg-pink-50 border-pink-500 text-pink-900 ring-2 ring-pink-400 font-bold shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <img src={FEMALE_STUDENT_AVATAR} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-[11px] leading-tight truncate">Female Icon</p>
                          <p className="text-[9px] text-pink-600 font-bold">Girl Student</p>
                        </div>
                      </button>

                      {/* 3. Male Photo */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: MALE_STUDENT_PHOTO, gender: 'Male' })}
                        className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                          formData.photo === MALE_STUDENT_PHOTO
                            ? 'bg-indigo-50 border-indigo-500 text-indigo-900 ring-2 ring-indigo-400 font-bold shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <img src={MALE_STUDENT_PHOTO} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-[11px] leading-tight truncate">Male Photo</p>
                          <p className="text-[9px] text-slate-500">Boy Portrait</p>
                        </div>
                      </button>

                      {/* 4. Female Photo */}
                      <button
                        type="button"
                        onClick={() => setFormData({ ...formData, photo: FEMALE_STUDENT_PHOTO, gender: 'Female' })}
                        className={`p-2 rounded-xl border flex items-center space-x-2 transition-all ${
                          formData.photo === FEMALE_STUDENT_PHOTO
                            ? 'bg-purple-50 border-purple-500 text-purple-900 ring-2 ring-purple-400 font-bold shadow-sm'
                            : 'bg-white hover:bg-slate-50 border-slate-200 text-slate-700'
                        }`}
                      >
                        <img src={FEMALE_STUDENT_PHOTO} alt="" className="w-7 h-7 rounded-lg object-cover shrink-0" />
                        <div className="text-left min-w-0">
                          <p className="text-[11px] leading-tight truncate">Female Photo</p>
                          <p className="text-[9px] text-slate-500">Girl Portrait</p>
                        </div>
                      </button>
                    </div>

                    {/* Upload or Custom URL */}
                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 pt-1">
                      <label className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer shadow-sm">
                        <Camera size={13} className="text-brand-600" />
                        <span>Upload Custom Photo</span>
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageFileUpload}
                          className="hidden"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="Or paste external photo URL..."
                        value={formData.photo}
                        onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                        className="flex-1 px-3 py-1.5 rounded-xl border border-slate-300 text-[11px] bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kasun Kalhara"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Grade *</label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold text-slate-800"
                  >
                    <optgroup label="Primary (Grades 1 to 5)">
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5 (Scholarship)</option>
                    </optgroup>
                    <optgroup label="Junior Secondary (Grades 6 to 9)">
                      <option value="Grade 6">Grade 6</option>
                      <option value="Grade 7">Grade 7</option>
                      <option value="Grade 8">Grade 8</option>
                      <option value="Grade 9">Grade 9</option>
                    </optgroup>
                    <optgroup label="Ordinary Level (Grades 10 to 11)">
                      <option value="Grade 10">Grade 10</option>
                      <option value="Grade 11">Grade 11 (O/L)</option>
                    </optgroup>
                    <optgroup label="Advanced Level (Grades 12 to 13)">
                      <option value="Grade 12">Grade 12 (A/L)</option>
                      <option value="Grade 13">Grade 13 (A/L)</option>
                    </optgroup>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => {
                      const newGender = e.target.value;
                      let newPhoto = formData.photo;
                      if (!newPhoto || newPhoto === MALE_STUDENT_AVATAR || newPhoto === FEMALE_STUDENT_AVATAR) {
                        newPhoto = newGender === 'Female' ? FEMALE_STUDENT_AVATAR : MALE_STUDENT_AVATAR;
                      }
                      setFormData({ ...formData, gender: newGender, photo: newPhoto });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">School</label>
                  <input
                    type="text"
                    placeholder="e.g. Ananda College"
                    value={formData.school}
                    onChange={(e) => setFormData({ ...formData, school: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Date of Birth</label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    125kHz RFID Card UID (Optional)
                  </label>
                  <div className="flex space-x-2">
                    <input
                      type="text"
                      placeholder="Tap card on USB reader or enter UID (e.g. 0004928172)..."
                      value={formData.rfidTag}
                      onChange={(e) => setFormData({ ...formData, rfidTag: e.target.value })}
                      className="flex-1 px-3.5 py-2 rounded-xl border border-slate-300 text-xs font-mono font-medium focus:ring-2 focus:ring-brand-500"
                    />
                    <span className="px-3 py-2 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 text-[11px] font-semibold flex items-center gap-1 shrink-0">
                      <Radio size={14} className="text-emerald-500" />
                      <span>Tap Reader</span>
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Student Phone</label>
                  <input
                    type="text"
                    placeholder="+94 77 123 4567"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Guardian Name</label>
                  <input
                    type="text"
                    placeholder="Father/Mother/Guardian name"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Parent Phone (for SMS/WhatsApp)</label>
                  <input
                    type="text"
                    placeholder="+94 77 987 6543"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">City</label>
                  <input
                    type="text"
                    placeholder="Colombo"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Address</label>
                  <input
                    type="text"
                    placeholder="House number, street address"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                {/* Enhanced Class Enrollment Section */}
                <div className="sm:col-span-2 space-y-2.5 pt-2 border-t border-slate-100">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <BookOpen size={16} className="text-brand-600" />
                        <label className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                          Enroll into Initial Classes
                        </label>
                      </div>
                      <p className="text-[11px] text-slate-500 mt-0.5">
                        Select tuition batches to enroll this student upon registration. Fee records are generated automatically.
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2.5 py-1 rounded-xl bg-indigo-50 border border-indigo-200/80 text-indigo-700 font-bold text-[11px]">
                        {formData.enrolledClassIds.length} Selected &bull; {formatLKR(totalSelectedFees)}/mo
                      </span>
                      <button
                        type="button"
                        onClick={fetchClasses}
                        disabled={classesLoading}
                        title="Reload Classes List"
                        className="p-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 text-xs transition-colors flex items-center gap-1"
                      >
                        <RefreshCw size={13} className={classesLoading ? 'animate-spin text-brand-600' : ''} />
                        <span className="text-[10px] hidden sm:inline">Refresh</span>
                      </button>
                    </div>
                  </div>

                  {/* Search and Grade Filter Bar */}
                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 bg-slate-50 p-2.5 rounded-2xl border border-slate-200">
                    <div className="relative flex-1">
                      <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search by class name, subject, or teacher..."
                        value={classSearch}
                        onChange={(e) => setClassSearch(e.target.value)}
                        className="w-full pl-8 pr-7 py-1.5 rounded-xl border border-slate-200 bg-white text-xs focus:ring-2 focus:ring-brand-500"
                      />
                      {classSearch && (
                        <button
                          type="button"
                          onClick={() => setClassSearch('')}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                        >
                          <X size={12} />
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0 shrink-0">
                      <button
                        type="button"
                        onClick={() => setClassGradeFilter('ALL')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          classGradeFilter === 'ALL'
                            ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        All Classes ({classes.length})
                      </button>

                      <button
                        type="button"
                        onClick={() => setClassGradeFilter('MATCH_STUDENT')}
                        className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition-all ${
                          classGradeFilter === 'MATCH_STUDENT'
                            ? 'bg-brand-600 text-white shadow-sm shadow-brand-600/30'
                            : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-100'
                        }`}
                      >
                        Matching Grade: {formData.grade} ({matchingGradeCount})
                      </button>

                      {filteredClasses.length > 0 && (
                        <button
                          type="button"
                          onClick={() => {
                            const filteredIds = filteredClasses.map(c => c.id);
                            const allSelected = filteredIds.every(id => formData.enrolledClassIds.includes(id));
                            if (allSelected) {
                              setFormData({
                                ...formData,
                                enrolledClassIds: formData.enrolledClassIds.filter(id => !filteredIds.includes(id))
                              });
                            } else {
                              const combined = Array.from(new Set([...formData.enrolledClassIds, ...filteredIds]));
                              setFormData({ ...formData, enrolledClassIds: combined });
                            }
                          }}
                          className="px-2.5 py-1 rounded-xl text-[11px] font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700"
                        >
                          {filteredClasses.every(c => formData.enrolledClassIds.includes(c.id)) ? 'Deselect All' : 'Select All'}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Classes List View Container */}
                  <div className="max-h-64 sm:max-h-72 overflow-y-auto p-2 border border-slate-200 rounded-2xl bg-slate-50/50 space-y-2">
                    {classesLoading ? (
                      <div className="py-8 text-center text-xs text-slate-500 flex flex-col items-center justify-center gap-2">
                        <RefreshCw size={20} className="animate-spin text-brand-600" />
                        <span>Loading tuition classes directory...</span>
                      </div>
                    ) : filteredClasses.length === 0 ? (
                      <div className="py-8 text-center px-4">
                        <p className="text-xs font-semibold text-slate-600">No classes match your search or filter</p>
                        <p className="text-[11px] text-slate-400 mt-1">
                          Try switching to "All Classes ({classes.length})" or clearing your search.
                        </p>
                        {(classGradeFilter !== 'ALL' || classSearch) && (
                          <button
                            type="button"
                            onClick={() => {
                              setClassGradeFilter('ALL');
                              setClassSearch('');
                            }}
                            className="mt-3 px-3 py-1 rounded-xl bg-white border border-slate-300 text-slate-700 text-xs font-semibold hover:bg-slate-100 shadow-sm"
                          >
                            Show All Classes
                          </button>
                        )}
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {filteredClasses.map(c => {
                          const isSelected = formData.enrolledClassIds.includes(c.id);
                          return (
                            <div
                              key={c.id}
                              onClick={() => {
                                if (isSelected) {
                                  setFormData({
                                    ...formData,
                                    enrolledClassIds: formData.enrolledClassIds.filter(id => id !== c.id)
                                  });
                                } else {
                                  setFormData({
                                    ...formData,
                                    enrolledClassIds: [...formData.enrolledClassIds, c.id]
                                  });
                                }
                              }}
                              className={`p-3 rounded-2xl border transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                                isSelected
                                  ? 'bg-brand-50/80 border-brand-500 shadow-sm ring-1 ring-brand-400/40'
                                  : 'bg-white border-slate-200/90 hover:border-slate-300 hover:shadow-xs'
                              }`}
                            >
                              <div className="flex items-start gap-2.5">
                                <input
                                  type="checkbox"
                                  checked={isSelected}
                                  onChange={() => {}}
                                  className="mt-0.5 rounded text-brand-600 focus:ring-brand-500 h-4 w-4 shrink-0 pointer-events-none"
                                />
                                <div className="min-w-0 flex-1">
                                  <div className="flex items-center justify-between gap-1 mb-1">
                                    <span className="px-2 py-0.5 rounded-lg bg-indigo-50 text-indigo-700 text-[10px] font-bold border border-indigo-200/60 shrink-0">
                                      {c.grade}
                                    </span>
                                    <span className="font-extrabold text-xs text-brand-700 font-mono">
                                      {formatLKR(c.monthlyFee)}
                                    </span>
                                  </div>
                                  <h5 className="font-bold text-xs text-slate-900 leading-snug line-clamp-2">
                                    {c.name}
                                  </h5>
                                  {c.subject?.name && (
                                    <p className="text-[11px] text-slate-500 mt-0.5 truncate">
                                      {c.subject.name}
                                    </p>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center justify-between text-[10px] text-slate-400 pt-1.5 border-t border-slate-100/80">
                                <span className="truncate max-w-[130px] font-medium text-slate-600">
                                  {c.teacher?.name || 'Assigned Faculty'}
                                </span>
                                {(c.dayOfWeek || c.startTime) && (
                                  <span className="flex items-center gap-1 font-mono text-slate-500 shrink-0">
                                    <Clock size={11} className="text-slate-400" />
                                    <span>{c.dayOfWeek ? `${c.dayOfWeek.slice(0, 3)} ` : ''}{c.startTime || ''}</span>
                                  </span>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-600/30 disabled:opacity-50"
                >
                  {submitting ? 'Registering...' : 'Register Student & Issue QR'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign 125kHz RFID Card Modal */}
      {assignRfidStudent && (
        <AssignRFIDModal
          student={assignRfidStudent}
          isOpen={!!assignRfidStudent}
          onClose={() => setAssignRfidStudent(null)}
          onSuccess={(updatedStudent) => {
            setStudents(prev => prev.map(s => s.id === updatedStudent.id ? { ...s, rfidTag: updatedStudent.rfidTag } : s));
          }}
        />
      )}

      {/* Parent & Guardian Portal SMS Link Modal */}
      {portalSmsInfo && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative space-y-5 animate-in zoom-in-95 duration-200">
            {/* Close Button */}
            <button
              onClick={() => {
                setPortalSmsInfo(null);
                setCopiedLink(false);
                setCopiedSms(false);
              }}
              className="absolute top-5 right-5 p-2 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <X size={18} />
            </button>

            {/* Header */}
            <div className="flex items-center space-x-3 text-left">
              <div className="w-12 h-12 rounded-2xl bg-teal-500/20 text-teal-600 flex items-center justify-center shrink-0 border border-teal-500/30">
                <Smartphone size={24} />
              </div>
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-teal-600">SMS Gateway Link Dispatched</span>
                <h3 className="text-lg font-black text-slate-900">Parent Portal Login Link</h3>
                <p className="text-xs text-slate-500">{portalSmsInfo.studentName} ({portalSmsInfo.studentIdNumber})</p>
              </div>
            </div>

            {/* Recipient & Guarantee Banner */}
            <div className="p-3.5 rounded-2xl bg-teal-50 border border-teal-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-teal-700 uppercase tracking-wider">SMS Recipient Number</span>
                <p className="font-mono font-bold text-sm text-teal-950 mt-0.5">{portalSmsInfo.recipient}</p>
              </div>
              <span className="px-2.5 py-1 rounded-full bg-teal-200/80 text-teal-900 font-extrabold text-[10px]">
                1-Time Login Active
              </span>
            </div>

            {/* Generated Portal URL Box with 1-Click Copy */}
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-700">Direct Portal Login URL:</label>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  readOnly
                  value={portalSmsInfo.parentPortalUrl}
                  className="flex-1 px-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 font-mono text-xs select-all focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(portalSmsInfo.parentPortalUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className={`px-3 py-2 rounded-xl font-bold text-xs transition-all flex items-center space-x-1 shrink-0 ${
                    copiedLink ? 'bg-emerald-600 text-white' : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {copiedLink ? <Check size={14} /> : <Copy size={14} />}
                  <span>{copiedLink ? 'Copied!' : 'Copy'}</span>
                </button>
              </div>
            </div>

            {/* SMS Message Text Preview with Copy */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-slate-700">Dispatched SMS Message Preview:</label>
                <button
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(portalSmsInfo.smsMessage);
                    setCopiedSms(true);
                    setTimeout(() => setCopiedSms(false), 2500);
                  }}
                  className="text-xs text-teal-600 font-bold hover:underline flex items-center space-x-1"
                >
                  {copiedSms ? <Check size={12} /> : <Copy size={12} />}
                  <span>{copiedSms ? 'SMS Copied!' : 'Copy Full SMS'}</span>
                </button>
              </div>
              <div className="p-3.5 rounded-2xl bg-slate-900 text-slate-200 font-sans text-xs leading-relaxed border border-slate-800">
                {portalSmsInfo.smsMessage}
              </div>
            </div>

            {/* Actions: Test Login & Done */}
            <div className="flex items-center justify-end space-x-2 pt-2 border-t border-slate-100">
              <a
                href={portalSmsInfo.parentPortalUrl}
                target="_blank"
                rel="noreferrer"
                className="px-4 py-2.5 rounded-xl bg-teal-50 hover:bg-teal-100 text-teal-700 font-bold text-xs transition-colors flex items-center space-x-1.5"
              >
                <span>Test Open Portal</span>
                <ExternalLink size={13} />
              </a>

              <button
                type="button"
                onClick={() => {
                  setPortalSmsInfo(null);
                  setCopiedLink(false);
                  setCopiedSms(false);
                }}
                className="px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-500 text-white font-bold text-xs shadow-md shadow-teal-600/30 transition-all"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT STUDENT MODAL */}
      <EditStudentModal
        student={editingStudent}
        isOpen={Boolean(editingStudent)}
        onClose={() => setEditingStudent(null)}
        onSuccess={() => {
          fetchStudents();
        }}
        onShowPortalLinkModal={(info) => {
          setPortalSmsInfo(info);
        }}
      />
    </div>
  );
};
