import React, { useState, useEffect } from 'react';
import { 
  BookOpen, 
  Plus, 
  Users, 
  Calendar, 
  Clock, 
  MapPin, 
  GraduationCap, 
  X, 
  CheckCircle2, 
  AlertCircle,
  Eye,
  UserPlus,
  Search,
  Filter,
  Sparkles,
  Layers,
  Edit3,
  Trash2
} from 'lucide-react';
import { apiRequest, formatLKR } from '../api';
import { Class } from '../types';

export const ALL_GRADES = [
  { value: 'Grade 1', label: 'Grade 1', group: 'Primary (Grades 1-5)' },
  { value: 'Grade 2', label: 'Grade 2', group: 'Primary (Grades 1-5)' },
  { value: 'Grade 3', label: 'Grade 3', group: 'Primary (Grades 1-5)' },
  { value: 'Grade 4', label: 'Grade 4', group: 'Primary (Grades 1-5)' },
  { value: 'Grade 5', label: 'Grade 5 (Scholarship)', group: 'Primary (Grades 1-5)' },
  { value: 'Grade 6', label: 'Grade 6', group: 'Junior Secondary (Grades 6-9)' },
  { value: 'Grade 7', label: 'Grade 7', group: 'Junior Secondary (Grades 6-9)' },
  { value: 'Grade 8', label: 'Grade 8', group: 'Junior Secondary (Grades 6-9)' },
  { value: 'Grade 9', label: 'Grade 9', group: 'Junior Secondary (Grades 6-9)' },
  { value: 'Grade 10', label: 'Grade 10', group: 'Ordinary Level (Grades 10-11)' },
  { value: 'Grade 11', label: 'Grade 11 (O/L)', group: 'Ordinary Level (Grades 10-11)' },
  { value: 'Grade 12', label: 'Grade 12 (A/L)', group: 'Advanced Level (Grades 12-13)' },
  { value: 'Grade 13', label: 'Grade 13 (A/L)', group: 'Advanced Level (Grades 12-13)' },
];

const COMMON_DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const COMMON_BATCHES = ['Theory', 'Revision', 'Paper Class', 'English Medium', 'Sinhala Medium'];
const FEE_PRESETS = [1500, 2000, 2500, 3000, 3500, 4000];

export const SUBJECT_CATEGORIES = [
  'Primary (Grades 1-5)',
  'Junior Secondary (Grades 6-9)',
  'Ordinary Level (O/L)',
  'A/L - Science & Mathematics',
  'A/L - Commerce & Business',
  'A/L - Arts & Humanities',
  'Languages & Technology',
  'General Curriculum',
  'Vocational & Skills'
];

interface ClassesProps {
  onOpenQuickScan: () => void;
  onOpenStudentProfile: (studentId: string) => void;
}

export const Classes: React.FC<ClassesProps> = ({ onOpenQuickScan, onOpenStudentProfile }) => {
  const [classes, setClasses] = useState<Class[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [gradeFilter, setGradeFilter] = useState('ALL');

  // Roster Drawer
  const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
  const [classDetails, setClassDetails] = useState<any>(null);
  const [detailsLoading, setDetailsLoading] = useState(false);

  // Create Class Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    subjectId: '',
    teacherId: '',
    grade: 'Grade 1',
    classGroup: 'Theory',
    dayOfWeek: 'Saturday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Hall 1',
    monthlyFee: 2500,
    maxStudents: 60
  });

  // Edit Class Modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClass, setEditingClass] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    subjectId: '',
    teacherId: '',
    grade: 'Grade 1',
    classGroup: 'Theory',
    dayOfWeek: 'Saturday',
    startTime: '08:00',
    endTime: '10:00',
    room: 'Hall 1',
    monthlyFee: 2500,
    maxStudents: 60,
    status: 'ACTIVE'
  });

  // Custom Subject Modal
  const [isAddSubjectModalOpen, setIsAddSubjectModalOpen] = useState(false);
  const [newSubjectData, setNewSubjectData] = useState({
    name: '',
    category: 'Ordinary Level (O/L)',
    code: '',
    description: ''
  });
  const [savingSubject, setSavingSubject] = useState(false);

  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const fetchClasses = async () => {
    setLoading(true);
    try {
      const [clsData, tchData, subData] = await Promise.all([
        apiRequest<Class[]>('/classes'),
        apiRequest<any[]>('/teachers'),
        apiRequest<any[]>('/classes/subjects')
      ]);
      setClasses(clsData || []);
      setTeachers(tchData || []);
      setSubjects(subData || []);
      if (tchData && tchData.length > 0 && !formData.teacherId) {
        setFormData(prev => ({ 
          ...prev, 
          teacherId: tchData[0].id, 
          subjectId: subData && subData.length > 0 ? subData[0].id : '' 
        }));
      }
    } catch (err) {
      console.error('Failed to load classes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClasses();
  }, []);

  const handleOpenRoster = async (classId: string) => {
    setSelectedClassId(classId);
    setDetailsLoading(true);
    try {
      const data = await apiRequest(`/classes/${classId}`);
      setClassDetails(data);
    } catch (err) {
      console.error('Failed to fetch class roster:', err);
    } finally {
      setDetailsLoading(false);
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!formData.name || !formData.subjectId || !formData.teacherId) {
      setModalError('Class title, subject, and teacher are required');
      return;
    }

    setSubmitting(true);
    try {
      await apiRequest('/classes', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsAddModalOpen(false);
      // Reset form
      setFormData(prev => ({
        ...prev,
        name: '',
        grade: 'Grade 1',
        classGroup: 'Theory',
        monthlyFee: 2500
      }));
      fetchClasses();
    } catch (err: any) {
      setModalError(err.message || 'Failed to create class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleOpenEdit = (c: any) => {
    setEditingClass(c);
    setEditFormData({
      id: c.id,
      name: c.name || '',
      subjectId: c.subjectId || (c.subject?.id || ''),
      teacherId: c.teacherId || (c.teacher?.id || ''),
      grade: c.grade || 'Grade 1',
      classGroup: c.classGroup || 'Theory',
      dayOfWeek: c.dayOfWeek || 'Saturday',
      startTime: c.startTime || '08:00',
      endTime: c.endTime || '10:00',
      room: c.room || 'Hall 1',
      monthlyFee: c.monthlyFee || 2500,
      maxStudents: c.maxStudents || 60,
      status: c.status || 'ACTIVE'
    });
    setModalError(null);
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setModalError(null);
    if (!editFormData.name || !editFormData.subjectId || !editFormData.teacherId) {
      setModalError('Class title, subject, and teacher are required');
      return;
    }
    setSubmitting(true);
    try {
      await apiRequest(`/classes/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setIsEditModalOpen(false);
      fetchClasses();
    } catch (err: any) {
      setModalError(err.message || 'Failed to update class');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClass = async (c: any) => {
    if (!window.confirm(`Are you sure you want to delete class "${c.name}" (${c.classCode})? This action cannot be undone.`)) {
      return;
    }
    try {
      await apiRequest(`/classes/${c.id}`, { method: 'DELETE' });
      fetchClasses();
    } catch (err: any) {
      alert(err.message || 'Failed to delete class');
    }
  };

  const handleCreateSubject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubjectData.name.trim()) return;
    setSavingSubject(true);
    try {
      const created = await apiRequest<any>('/classes/subjects', {
        method: 'POST',
        body: JSON.stringify(newSubjectData)
      });
      setSubjects(prev => [...prev, created]);
      if (isEditModalOpen) {
        setEditFormData(prev => ({ ...prev, subjectId: created.id }));
      } else {
        setFormData(prev => ({ ...prev, subjectId: created.id }));
      }
      setIsAddSubjectModalOpen(false);
      setNewSubjectData({ name: '', category: 'Ordinary Level (O/L)', code: '', description: '' });
    } catch (err: any) {
      alert(err.message || 'Failed to create subject');
    } finally {
      setSavingSubject(false);
    }
  };

  // Filtered classes by search and grade
  const filteredClasses = classes.filter(c => {
    const matchesGrade = gradeFilter === 'ALL' || c.grade === gradeFilter;
    const matchesSearch = !searchQuery || 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.classCode.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.subject?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.teacher?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (c.room && c.room.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesGrade && matchesSearch;
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Class Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Organize tuition classes across Grade 1 to 12 & A/L, subject curricula, schedules, and student rosters</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/25 transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Create New Class</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search classes by title, subject, teacher name, class code, room..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center space-x-2">
            <Filter size={15} className="text-slate-400 shrink-0" />
            <select
              value={gradeFilter}
              onChange={(e) => setGradeFilter(e.target.value)}
              className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-bold text-slate-700 focus:outline-none"
            >
              <option value="ALL">All Grades (Grade 1 - 13)</option>
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
          </div>
        </div>

        {/* Quick Grade Filter Chips */}
        <div className="flex items-center space-x-1.5 overflow-x-auto pb-1 text-[11px] scrollbar-thin">
          <button
            onClick={() => setGradeFilter('ALL')}
            className={`px-3 py-1 rounded-xl font-bold whitespace-nowrap transition-all ${
              gradeFilter === 'ALL'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            All Grades ({classes.length})
          </button>
          {ALL_GRADES.map(g => {
            const count = classes.filter(c => c.grade === g.value).length;
            const isSelected = gradeFilter === g.value;
            return (
              <button
                key={g.value}
                onClick={() => setGradeFilter(g.value)}
                className={`px-2.5 py-1 rounded-xl font-medium whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-sm shadow-emerald-600/30'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                <span>{g.label}</span>
                {count > 0 && (
                  <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-mono ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-200 text-slate-700'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Classes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading active classes...</div>
        ) : filteredClasses.length === 0 ? (
          <div className="col-span-3 py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-3">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto" />
            <p className="text-sm font-bold text-slate-700">No classes found for the selected filter</p>
            <p className="text-xs text-slate-400">Try changing the grade filter or click below to create a new class.</p>
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-md shadow-emerald-600/20"
            >
              <Plus size={14} />
              <span>Create Class for {gradeFilter !== 'ALL' ? gradeFilter : 'New Grade'}</span>
            </button>
          </div>
        ) : filteredClasses.map(c => (
          <div 
            key={c.id} 
            className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-emerald-300 hover:shadow-md transition-all flex flex-col justify-between space-y-4"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1.5">
                  <span className="px-2.5 py-0.5 rounded-lg bg-emerald-50 text-emerald-800 font-mono text-[10px] font-bold border border-emerald-200/60">
                    {c.classCode}
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-purple-50 text-purple-700 text-[10px] font-bold border border-purple-200/60">
                    {c.grade}
                  </span>
                </div>
                <span className="text-sm font-black text-slate-900">
                  {formatLKR(c.monthlyFee)} <span className="text-[10px] text-slate-400 font-normal">/mo</span>
                </span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 leading-snug">{c.name}</h3>
              <p className="text-xs text-brand-600 font-medium mt-0.5">{c.subject?.name}</p>

              {/* Teacher Info */}
              <div className="flex items-center space-x-2.5 mt-3 pt-3 border-t border-slate-100">
                <img 
                  src={c.teacher?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} 
                  alt="" 
                  className="w-8 h-8 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                />
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-slate-800 truncate">{c.teacher?.name}</p>
                  <p className="text-[10px] text-slate-400">{c.teacher?.qualifications || 'Lecturer'}</p>
                </div>
              </div>

              {/* Schedule and Room */}
              <div className="mt-3 space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl">
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><Calendar size={13} /> Day:</span>
                  <span className="font-semibold text-slate-800">{c.dayOfWeek}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><Clock size={13} /> Time:</span>
                  <span className="font-mono text-slate-800">{c.startTime} - {c.endTime}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 text-slate-500"><MapPin size={13} /> Room:</span>
                  <span className="text-slate-800 font-medium">{c.room || 'Hall A'}</span>
                </div>
              </div>
            </div>

            {/* Card Footer: Enrolled vs Capacity & Action */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <div className="flex items-center space-x-1.5 text-xs text-slate-500">
                <Users size={14} className="text-slate-400" />
                <span>Enrolled: <strong className="text-slate-800">{c.enrolledCount || 0}</strong> / {c.maxStudents}</span>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleOpenRoster(c.id)}
                  className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 text-brand-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  title="View Enrolled Students"
                >
                  <Eye size={13} />
                  <span>Roster</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleOpenEdit(c)}
                  className="p-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-700 border border-amber-200 text-xs font-semibold flex items-center transition-colors"
                  title="Edit Class Details"
                >
                  <Edit3 size={13} />
                </button>

                <button
                  type="button"
                  onClick={() => handleDeleteClass(c)}
                  className="p-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-semibold flex items-center transition-colors"
                  title="Delete Class"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ROSTER DRAWER */}
      {selectedClassId && (
        <div className="fixed inset-0 z-50 flex items-center justify-end bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col">
            <div className="flex items-center justify-between p-5 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-900">Class Student Roster</h3>
                <p className="text-xs text-slate-500">{classDetails?.name || 'Class Details'}</p>
              </div>
              <button onClick={() => setSelectedClassId(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {detailsLoading ? (
                <div className="py-12 text-center text-xs text-slate-400">Loading enrolled students...</div>
              ) : classDetails ? (
                <>
                  <div className="p-4 rounded-2xl bg-brand-50/60 border border-brand-200 text-xs flex justify-between items-center">
                    <div>
                      <p className="font-bold text-brand-900">{classDetails.teacher?.name}</p>
                      <p className="text-brand-700">{classDetails.dayOfWeek} ({classDetails.startTime} - {classDetails.endTime}) • Room: {classDetails.room}</p>
                    </div>
                    <span className="font-bold text-brand-900 text-sm">{formatLKR(classDetails.monthlyFee)}/mo</span>
                  </div>

                  <div>
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                      Enrolled Students ({classDetails.students?.length || 0})
                    </h4>

                    <div className="space-y-2">
                      {classDetails.students?.map((item: any) => (
                        <div key={item.enrollmentId} className="flex items-center justify-between p-3 rounded-2xl border border-slate-200 bg-white hover:border-slate-300 transition-colors">
                          <div className="flex items-center space-x-3">
                            <img src={item.student?.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=80"} alt="" className="w-8 h-8 rounded-full object-cover" />
                            <div>
                              <p 
                                onClick={() => onOpenStudentProfile(item.student?.id)}
                                className="font-bold text-xs text-slate-900 hover:text-brand-600 cursor-pointer"
                              >
                                {item.student?.fullName}
                              </p>
                              <p className="text-[10px] text-slate-400 font-mono">{item.student?.studentIdNumber} • Phone: {item.student?.phone || 'N/A'}</p>
                            </div>
                          </div>

                          <div className="text-right">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              item.currentFeeStatus === 'PAID' ? 'bg-emerald-100 text-emerald-800' :
                              item.currentFeeStatus === 'PARTIAL' ? 'bg-amber-100 text-amber-800' : 'bg-rose-100 text-rose-800'
                            }`}>
                              Fee: {item.currentFeeStatus}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}

      {/* CREATE CLASS MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 text-white">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/30 flex items-center justify-center text-emerald-300">
                  <BookOpen size={20} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-white tracking-wide flex items-center gap-2">
                    <span>Create New Tuition Class</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                      Grade 1 to 13
                    </span>
                  </h3>
                  <p className="text-[11px] text-slate-300">Set up course curriculum, schedule, classroom hall, and fee structure</p>
                </div>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="flex-1 overflow-y-auto p-6 space-y-5">
              {modalError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="text-rose-500 shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Class Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Grade 1 English & Phonics Mastery OR Grade 11 Mathematics Paper Class"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Grade & Subject Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5 flex items-center justify-between">
                    <span>Grade / Academic Level *</span>
                    <span className="text-[10px] text-emerald-600 font-semibold">Grades 1 to 12 & A/L</span>
                  </label>
                  <select
                    value={formData.grade}
                    onChange={(e) => setFormData({ ...formData, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs bg-white font-bold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    <optgroup label="Primary Education (Grades 1 to 5)">
                      <option value="Grade 1">Grade 1</option>
                      <option value="Grade 2">Grade 2</option>
                      <option value="Grade 3">Grade 3</option>
                      <option value="Grade 4">Grade 4</option>
                      <option value="Grade 5">Grade 5 (Scholarship / ශිෂ්‍යත්වය)</option>
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Subject Curriculum *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Plus size={11} />
                      <span>Add Subject / Category</span>
                    </button>
                  </div>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {SUBJECT_CATEGORIES.map(cat => {
                      const catSubjects = subjects.filter(s => (s.category || 'General Curriculum') === cat);
                      if (catSubjects.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat}>
                          {catSubjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code || 'SUBJ'})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {subjects.filter(s => s.category && !SUBJECT_CATEGORIES.includes(s.category)).length > 0 && (
                      <optgroup label="Custom Categories">
                        {subjects.filter(s => s.category && !SUBJECT_CATEGORIES.includes(s.category)).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code || 'SUBJ'}) • {s.category}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Teacher & Batch Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Lecturer / Teacher *</label>
                  <select
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} • {t.qualifications || 'Lecturer'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Batch / Stream Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Theory, Revision, English Medium"
                    value={formData.classGroup}
                    onChange={(e) => setFormData({ ...formData, classGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                    {COMMON_BATCHES.map(b => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => setFormData({ ...formData, classGroup: b })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                          formData.classGroup === b 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-700 font-bold' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class Schedule Day *</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {COMMON_DAYS.map(day => {
                    const isSelected = formData.dayOfWeek === day;
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setFormData({ ...formData, dayOfWeek: day })}
                        className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/30'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time and Room */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.startTime}
                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">End Time *</label>
                  <input
                    type="time"
                    required
                    value={formData.endTime}
                    onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Hall / Classroom</label>
                  <input
                    type="text"
                    placeholder="e.g. Hall 1 / Auditorium"
                    value={formData.room}
                    onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Fee and Student Capacity */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Monthly Tuition Fee (Rs. LKR) *</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={formData.monthlyFee}
                    onChange={(e) => setFormData({ ...formData, monthlyFee: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-black text-slate-900"
                  />
                  <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                    {FEE_PRESETS.map(p => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setFormData({ ...formData, monthlyFee: p })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-semibold border ${
                          formData.monthlyFee === p 
                            ? 'bg-emerald-50 border-emerald-300 text-emerald-800' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        Rs. {p.toLocaleString()}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Maximum Student Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={formData.maxStudents}
                    onChange={(e) => setFormData({ ...formData, maxStudents: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                  <p className="text-[10px] text-slate-400 mt-1">Class attendance scanner warns when capacity is reached</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <Plus size={16} />
                  <span>{submitting ? 'Creating Class...' : 'Save & Publish Tuition Class'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT CLASS MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-amber-500/20 text-amber-700 flex items-center justify-center font-bold">
                  <Edit3 size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Edit Tuition Class</h3>
                  <p className="text-[11px] text-slate-500 font-mono font-semibold">{editingClass?.classCode}</p>
                </div>
              </div>
              <button onClick={() => setIsEditModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="flex-1 overflow-y-auto p-6 space-y-4">
              {modalError && (
                <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                  <AlertCircle size={16} className="shrink-0" />
                  <span>{modalError}</span>
                </div>
              )}

              {/* Class Title */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 2026 Combined Maths Theory"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
              </div>

              {/* Grade and Subject */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Target Grade Level *</label>
                  <select
                    value={editFormData.grade}
                    onChange={(e) => setEditFormData({ ...editFormData, grade: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
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
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider">Subject Curriculum *</label>
                    <button
                      type="button"
                      onClick={() => setIsAddSubjectModalOpen(true)}
                      className="text-[10px] font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center gap-1"
                    >
                      <Plus size={11} />
                      <span>Add Subject / Category</span>
                    </button>
                  </div>
                  <select
                    value={editFormData.subjectId}
                    onChange={(e) => setEditFormData({ ...editFormData, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {SUBJECT_CATEGORIES.map(cat => {
                      const catSubjects = subjects.filter(s => (s.category || 'General Curriculum') === cat);
                      if (catSubjects.length === 0) return null;
                      return (
                        <optgroup key={cat} label={cat}>
                          {catSubjects.map(s => (
                            <option key={s.id} value={s.id}>
                              {s.name} ({s.code || 'SUBJ'})
                            </option>
                          ))}
                        </optgroup>
                      );
                    })}
                    {subjects.filter(s => s.category && !SUBJECT_CATEGORIES.includes(s.category)).length > 0 && (
                      <optgroup label="Custom Categories">
                        {subjects.filter(s => s.category && !SUBJECT_CATEGORIES.includes(s.category)).map(s => (
                          <option key={s.id} value={s.id}>
                            {s.name} ({s.code || 'SUBJ'}) • {s.category}
                          </option>
                        ))}
                      </optgroup>
                    )}
                  </select>
                </div>
              </div>

              {/* Teacher & Batch Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Assigned Lecturer / Teacher *</label>
                  <select
                    value={editFormData.teacherId}
                    onChange={(e) => setEditFormData({ ...editFormData, teacherId: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs bg-white font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500"
                  >
                    {teachers.map(t => (
                      <option key={t.id} value={t.id}>
                        {t.name} • {t.qualifications || 'Lecturer'}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Batch / Stream Category</label>
                  <input
                    type="text"
                    value={editFormData.classGroup}
                    onChange={(e) => setEditFormData({ ...editFormData, classGroup: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs"
                  />
                  <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto">
                    {COMMON_BATCHES.map(b => (
                      <button
                        type="button"
                        key={b}
                        onClick={() => setEditFormData({ ...editFormData, classGroup: b })}
                        className={`px-2 py-0.5 rounded-lg text-[10px] font-medium border transition-colors ${
                          editFormData.classGroup === b 
                            ? 'bg-amber-50 border-amber-300 text-amber-800 font-bold' 
                            : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                        }`}
                      >
                        {b}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Day of Week Selector */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class Schedule Day *</label>
                <div className="grid grid-cols-7 gap-1.5">
                  {COMMON_DAYS.map(day => {
                    const isSelected = editFormData.dayOfWeek === day;
                    return (
                      <button
                        type="button"
                        key={day}
                        onClick={() => setEditFormData({ ...editFormData, dayOfWeek: day })}
                        className={`py-2 rounded-xl text-xs font-bold transition-all text-center ${
                          isSelected
                            ? 'bg-amber-600 text-white shadow-md shadow-amber-600/30'
                            : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                        }`}
                      >
                        <span className="hidden sm:inline">{day}</span>
                        <span className="sm:hidden">{day.substring(0, 3)}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Time and Room */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editFormData.startTime}
                    onChange={(e) => setEditFormData({ ...editFormData, startTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editFormData.endTime}
                    onChange={(e) => setEditFormData({ ...editFormData, endTime: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Hall / Classroom</label>
                  <input
                    type="text"
                    value={editFormData.room}
                    onChange={(e) => setEditFormData({ ...editFormData, room: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Fee, Student Capacity & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Monthly Tuition Fee (Rs.) *</label>
                  <input
                    type="number"
                    min="500"
                    step="100"
                    required
                    value={editFormData.monthlyFee}
                    onChange={(e) => setEditFormData({ ...editFormData, monthlyFee: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-black text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Max Student Capacity</label>
                  <input
                    type="number"
                    min="5"
                    max="500"
                    value={editFormData.maxStudents}
                    onChange={(e) => setEditFormData({ ...editFormData, maxStudents: Number(e.target.value) })}
                    className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-sm font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Class Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-bold text-slate-900 bg-white"
                  >
                    <option value="ACTIVE">ACTIVE (Running)</option>
                    <option value="INACTIVE">INACTIVE (Paused)</option>
                    <option value="ARCHIVED">ARCHIVED</option>
                  </select>
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-5 py-2.5 rounded-2xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white text-xs font-bold shadow-lg shadow-amber-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                >
                  <CheckCircle2 size={16} />
                  <span>{submitting ? 'Updating...' : 'Update Class Details'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD CUSTOM SUBJECT & CATEGORY MODAL */}
      {isAddSubjectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center space-x-2.5">
                <div className="w-8 h-8 rounded-xl bg-emerald-500/20 text-emerald-700 flex items-center justify-center font-bold">
                  <BookOpen size={16} />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Add Subject Curriculum</h3>
                  <p className="text-[11px] text-slate-500">Create auto or custom category subject</p>
                </div>
              </div>
              <button onClick={() => setIsAddSubjectModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateSubject} className="p-6 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Agricultural Science (A/L)"
                  value={newSubjectData.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const autoCode = name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
                    setNewSubjectData({
                      ...newSubjectData,
                      name,
                      code: newSubjectData.code || autoCode
                    });
                  }}
                  className="w-full px-4 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Curriculum Category *</label>
                <select
                  value={newSubjectData.category}
                  onChange={(e) => setNewSubjectData({ ...newSubjectData, category: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-semibold text-slate-900 bg-white focus:ring-2 focus:ring-emerald-500"
                >
                  {SUBJECT_CATEGORIES.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                  <option value="Custom">Custom / Other Category</option>
                </select>
              </div>

              {newSubjectData.category === 'Custom' && (
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Type Custom Category Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Higher National Diploma / Special Stream"
                    onChange={(e) => setNewSubjectData({ ...newSubjectData, category: e.target.value })}
                    className="w-full px-4 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Subject Code</label>
                  <input
                    type="text"
                    placeholder="e.g. AGR-AL"
                    value={newSubjectData.code}
                    onChange={(e) => setNewSubjectData({ ...newSubjectData, code: e.target.value.toUpperCase() })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs font-mono font-bold"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1.5">Brief Notes</label>
                  <input
                    type="text"
                    placeholder="e.g. New syllabus"
                    value={newSubjectData.description}
                    onChange={(e) => setNewSubjectData({ ...newSubjectData, description: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-2xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 pt-3 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddSubjectModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-bold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingSubject}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md shadow-emerald-600/30 transition-all flex items-center gap-1.5"
                >
                  <Plus size={14} />
                  <span>{savingSubject ? 'Saving...' : 'Add Subject'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
