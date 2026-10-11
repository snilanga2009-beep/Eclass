import React, { useState, useEffect, useMemo } from 'react';
import { 
  FileText, 
  Plus, 
  Award, 
  BarChart2, 
  Check, 
  Calendar, 
  Users, 
  X,
  Edit2,
  Trash2,
  ClipboardCheck,
  HelpCircle,
  Search,
  UserPlus,
  Save
} from 'lucide-react';
import { apiRequest, formatDate } from '../api';

const computePreviewGrade = (marks: number, totalMarks = 100, passMarks = 40): string => {
  const pct = totalMarks > 0 ? (marks / totalMarks) * 100 : marks;
  const passPct = totalMarks > 0 ? (passMarks / totalMarks) * 100 : passMarks;
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= passPct) return 'S';
  return 'F';
};

export const Assessments: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [classes, setClasses] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showHowItWorks, setShowHowItWorks] = useState(false);

  // Create / Edit Exam Modal
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [editingExamId, setEditingExamId] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    examType: 'Monthly Test',
    classId: '',
    subjectId: 'subj-math',
    date: new Date().toISOString().substring(0, 10),
    totalMarks: 100,
    passMarks: 40
  });

  // Bulk / Single Student Marks Modal
  const [isGradingModalOpen, setIsGradingModalOpen] = useState(false);
  const [markEntries, setMarkEntries] = useState<Record<string, { marks: string; comment: string; student: any }>>({});
  const [studentSearch, setStudentSearch] = useState('');
  const [savingMarks, setSavingMarks] = useState(false);

  // Quick Single-Student Edit Modal
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [singleMarkForm, setSingleMarkForm] = useState({ marks: 0, comment: '' });

  const fetchExamsAndClasses = async () => {
    setLoading(true);
    try {
      const [examData, classData] = await Promise.all([
        apiRequest('/exams'),
        apiRequest('/classes').catch(() => [])
      ]);
      setExams(examData || []);
      setClasses(classData || []);
      if (examData && examData.length > 0 && !selectedExamId) {
        setSelectedExamId(examData[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchExamDetail = async (id: string) => {
    try {
      const res = await apiRequest(`/exams/${id}`);
      setExamDetail(res);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    fetchExamsAndClasses();
  }, []);

  useEffect(() => {
    if (!selectedExamId) {
      setExamDetail(null);
      return;
    }
    fetchExamDetail(selectedExamId);
  }, [selectedExamId]);

  // Unique subjects derived from classes + fallback defaults
  const availableSubjects = useMemo(() => {
    const map = new Map<string, { id: string; name: string }>();
    map.set('subj-math', { id: 'subj-math', name: 'Combined Mathematics' });
    map.set('subj-phys', { id: 'subj-phys', name: 'Physics' });
    map.set('subj-chem', { id: 'subj-chem', name: 'Chemistry' });
    map.set('subj-bio', { id: 'subj-bio', name: 'Biology' });
    map.set('subj-ict', { id: 'subj-ict', name: 'Information & Communication Technology' });
    classes.forEach((c: any) => {
      if (c.subject?.id && c.subject?.name) {
        map.set(c.subject.id, { id: c.subject.id, name: c.subject.name });
      } else if (c.subjectId) {
        map.set(c.subjectId, { id: c.subjectId, name: c.subject?.name || c.name || c.title });
      }
    });
    exams.forEach((e: any) => {
      if (e.subject?.id && e.subject?.name) {
        map.set(e.subject.id, { id: e.subject.id, name: e.subject.name });
      }
    });
    return Array.from(map.values());
  }, [classes, exams]);

  const openCreateExamModal = () => {
    setEditingExamId(null);
    const defaultClass = classes[0];
    setFormData({
      title: '',
      examType: 'Monthly Test',
      classId: defaultClass?.id || '',
      subjectId: defaultClass?.subjectId || 'subj-math',
      date: new Date().toISOString().substring(0, 10),
      totalMarks: 100,
      passMarks: 40
    });
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (exam: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingExamId(exam.id);
    setFormData({
      title: exam.title || '',
      examType: exam.examType || 'Monthly Test',
      classId: exam.classId || '',
      subjectId: exam.subjectId || exam.subject?.id || 'subj-math',
      date: exam.date ? String(exam.date).substring(0, 10) : new Date().toISOString().substring(0, 10),
      totalMarks: Number(exam.totalMarks || 100),
      passMarks: Number(exam.passMarks || 40)
    });
    setIsExamModalOpen(true);
  };

  const handleSaveExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) return;

    try {
      if (editingExamId) {
        await apiRequest(`/exams/${editingExamId}`, {
          method: 'PUT',
          body: JSON.stringify(formData)
        });
        setIsExamModalOpen(false);
        await fetchExamsAndClasses();
        if (selectedExamId === editingExamId) {
          await fetchExamDetail(editingExamId);
        }
      } else {
        const created = await apiRequest('/exams', {
          method: 'POST',
          body: JSON.stringify(formData)
        });
        setIsExamModalOpen(false);
        await fetchExamsAndClasses();
        if (created?.id) {
          setSelectedExamId(created.id);
        }
      }
    } catch (err: any) {
      alert(err.message || 'Failed to save assessment');
    }
  };

  const handleDeleteExam = async (examId: string, examTitle: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete "${examTitle}" and all its student scores?`)) return;
    try {
      await apiRequest(`/exams/${examId}`, { method: 'DELETE' });
      const remaining = exams.filter(ex => ex.id !== examId);
      setExams(remaining);
      if (selectedExamId === examId) {
        setSelectedExamId(remaining[0]?.id || null);
      }
    } catch (err: any) {
      alert(err.message || 'Failed to delete assessment');
    }
  };

  // Open Bulk Grading Sheet
  const openGradingSheet = () => {
    if (!examDetail) return;
    const initial: Record<string, { marks: string; comment: string; student: any }> = {};

    // 1. Add students from classRoster first
    (examDetail.classRoster || []).forEach((s: any) => {
      initial[s.id] = {
        marks: '',
        comment: '',
        student: s
      };
    });

    // 2. Overlay existing graded results
    (examDetail.results || []).forEach((r: any) => {
      if (r.studentId) {
        initial[r.studentId] = {
          marks: String(r.marks ?? ''),
          comment: r.comment || '',
          student: r.student || { id: r.studentId, fullName: 'Student', studentIdNumber: r.studentId }
        };
      }
    });

    // 3. If neither classRoster nor results has anyone, populate with all active students so the sheet is ready to use immediately
    if (Object.keys(initial).length === 0 && examDetail.allStudents?.length > 0) {
      examDetail.allStudents.forEach((s: any) => {
        initial[s.id] = {
          marks: '',
          comment: '',
          student: s
        };
      });
    }

    setMarkEntries(initial);
    setStudentSearch('');
    setIsGradingModalOpen(true);
  };

  const addStudentToSheet = (student: any) => {
    setMarkEntries(prev => ({
      ...prev,
      [student.id]: prev[student.id] || {
        marks: '',
        comment: '',
        student
      }
    }));
  };

  const handleSaveBulkMarks = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDetail) return;

    const resultsPayload = Object.entries(markEntries)
      .filter(([_, val]) => val.marks !== '' && !isNaN(Number(val.marks)))
      .map(([studentId, val]) => ({
        studentId,
        marks: Number(val.marks),
        comment: val.comment.trim() || undefined
      }));

    if (resultsPayload.length === 0) {
      alert('Please enter marks for at least one student before saving.');
      return;
    }

    setSavingMarks(true);
    try {
      await apiRequest(`/exams/${examDetail.id}/results`, {
        method: 'POST',
        body: JSON.stringify({ results: resultsPayload })
      });
      setIsGradingModalOpen(false);
      await fetchExamsAndClasses();
      await fetchExamDetail(examDetail.id);
    } catch (err: any) {
      alert(err.message || 'Failed to save student marks');
    } finally {
      setSavingMarks(false);
    }
  };

  const openSingleResultEdit = (resultRow: any) => {
    setEditingResult(resultRow);
    setSingleMarkForm({
      marks: Number(resultRow.marks ?? 0),
      comment: resultRow.comment || ''
    });
  };

  const handleSaveSingleResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!examDetail || !editingResult) return;
    try {
      await apiRequest(`/exams/${examDetail.id}/results`, {
        method: 'POST',
        body: JSON.stringify({
          results: [
            {
              studentId: editingResult.studentId,
              marks: Number(singleMarkForm.marks),
              comment: singleMarkForm.comment.trim() || undefined
            }
          ]
        })
      });
      setEditingResult(null);
      await fetchExamsAndClasses();
      await fetchExamDetail(examDetail.id);
    } catch (err: any) {
      alert(err.message || 'Failed to update student score');
    }
  };

  const handleDeleteSingleResult = async (studentId: string, studentName: string) => {
    if (!examDetail) return;
    if (!window.confirm(`Remove score entry for ${studentName}?`)) return;
    try {
      await apiRequest(`/exams/${examDetail.id}/results/${studentId}`, {
        method: 'DELETE'
      });
      await fetchExamsAndClasses();
      await fetchExamDetail(examDetail.id);
    } catch (err: any) {
      alert(err.message || 'Failed to remove student score');
    }
  };

  // Unlisted students that can be added to the grading sheet
  const unlistedStudents = useMemo(() => {
    if (!examDetail?.allStudents) return [];
    const q = studentSearch.trim().toLowerCase();
    return examDetail.allStudents.filter((s: any) => {
      if (markEntries[s.id]) return false;
      if (!q) return true;
      return (
        s.fullName?.toLowerCase().includes(q) ||
        s.studentIdNumber?.toLowerCase().includes(q)
      );
    });
  }, [examDetail, markEntries, studentSearch]);

  const classAverage = useMemo(() => {
    if (!examDetail?.results || examDetail.results.length === 0) return 0;
    const sum = examDetail.results.reduce((s: number, r: any) => s + Number(r.marks || 0), 0);
    return Math.round(sum / examDetail.results.length);
  }, [examDetail]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Assessments & Student Performance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage class tests, monthly assessments, term exams, student marks, and automatic rankings</p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={() => setShowHowItWorks(!showHowItWorks)}
            className="px-3.5 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
          >
            <HelpCircle size={15} className="text-brand-600" />
            <span>How It Works</span>
          </button>

          <button
            onClick={openCreateExamModal}
            className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all"
          >
            <Plus size={16} />
            <span>New Assessment</span>
          </button>
        </div>
      </div>

      {/* How It Works Guide Banner */}
      {showHowItWorks && (
        <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-r from-brand-50 via-indigo-50/60 to-white border border-brand-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-brand-800 flex items-center gap-1.5">
              <Award size={16} className="text-brand-600" />
              <span>How Assessments & Student Performance Works</span>
            </h3>
            <button onClick={() => setShowHowItWorks(false)} className="text-slate-400 hover:text-slate-600">
              <X size={16} />
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-white/90 border border-brand-100">
              <span className="inline-block px-2 py-0.5 rounded-md bg-brand-600 text-white font-bold text-[10px] mb-1">STEP 1</span>
              <p className="font-bold text-slate-900">Create or Edit Assessment</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Click <strong>+ New Assessment</strong> (or the <strong>Edit</strong> icon on any exam) to set the Title, Class, Subject, Date, Total Marks, and Pass Marks.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-brand-100">
              <span className="inline-block px-2 py-0.5 rounded-md bg-emerald-600 text-white font-bold text-[10px] mb-1">STEP 2</span>
              <p className="font-bold text-slate-900">Enter / Edit Student Marks</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Select an exam and click <strong>Enter / Edit Marks</strong> to enter scores for the class roster, or click the <strong>Edit</strong> button on any student row.
              </p>
            </div>
            <div className="p-3 rounded-2xl bg-white/90 border border-brand-100">
              <span className="inline-block px-2 py-0.5 rounded-md bg-indigo-600 text-white font-bold text-[10px] mb-1">STEP 3</span>
              <p className="font-bold text-slate-900">Auto-Grade & Class Ranking</p>
              <p className="text-slate-500 text-[11px] mt-0.5">
                Grades (<strong>A</strong> ≥75%, <strong>B</strong> ≥65%, <strong>C</strong> ≥55%, <strong>S</strong> ≥Pass, <strong>F</strong> &lt;Pass), Class Ranks (<strong>#1, #2...</strong>), and Averages are calculated automatically.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of Assessments */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Available Exams ({exams.length})</h3>
          </div>

          <div className="space-y-2.5">
            {exams.length === 0 && !loading && (
              <div className="py-10 text-center text-xs text-slate-400">
                No assessments yet. Click <strong>New Assessment</strong> to create one.
              </div>
            )}
            {exams.map(e => (
              <div
                key={e.id}
                onClick={() => setSelectedExamId(e.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer group ${
                  selectedExamId === e.id
                    ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9px] font-bold text-slate-700">
                    {e.examType}
                  </span>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400 mr-1">{formatDate(e.date)}</span>
                    <button
                      type="button"
                      title="Edit Assessment"
                      onClick={(ev) => openEditExamModal(e, ev)}
                      className="p-1 rounded-lg text-slate-400 hover:text-brand-600 hover:bg-white transition-colors"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      type="button"
                      title="Delete Assessment"
                      onClick={(ev) => handleDeleteExam(e.id, e.title, ev)}
                      className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-white transition-colors"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{e.title}</h4>
                <p className="text-[11px] text-brand-700 mt-0.5">
                  {(e.class?.name || e.class?.title) ? `${e.class.name || e.class.title} • ` : ''}{e.subject?.name || 'General'}
                </p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 mt-2 border-t border-slate-100">
                  <span>Graded: <strong className="text-slate-800">{e.totalStudents}</strong></span>
                  <span>Avg: <strong className="text-emerald-700">{e.averageMarks}/{e.totalMarks || 100}</strong></span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Detailed Exam Sheet & Student Rankings */}
        <div className="lg:col-span-2 p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4">
          {examDetail ? (
            <>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
                <div>
                  <span className="text-[10px] font-mono font-bold text-brand-600 uppercase tracking-wider">
                    {(examDetail.class?.name || examDetail.class?.title) ? `${examDetail.class.name || examDetail.class.title} • ` : ''}{examDetail.subject?.name} • {examDetail.examType}
                  </span>
                  <h3 className="font-bold text-base text-slate-900 mt-0.5">{examDetail.title}</h3>
                  <p className="text-xs text-slate-500">
                    Date: {formatDate(examDetail.date)} • Total Marks: {examDetail.totalMarks || 100} • Pass Mark: {examDetail.passMarks || 40}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    Class Avg: {classAverage}/{examDetail.totalMarks || 100}
                  </div>

                  <button
                    type="button"
                    onClick={() => openEditExamModal(examDetail)}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:border-brand-300 hover:bg-brand-50 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all"
                  >
                    <Edit2 size={13} />
                    <span>Edit Exam</span>
                  </button>

                  <button
                    type="button"
                    onClick={openGradingSheet}
                    className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
                  >
                    <ClipboardCheck size={14} />
                    <span>Enter / Edit Marks</span>
                  </button>
                </div>
              </div>

              {/* Student Results Table */}
              {examDetail.results && examDetail.results.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Rank</th>
                        <th className="py-2.5 px-3">Student Name</th>
                        <th className="py-2.5 px-3">Student ID</th>
                        <th className="py-2.5 px-3">Marks ({examDetail.totalMarks || 100})</th>
                        <th className="py-2.5 px-3">Grade</th>
                        <th className="py-2.5 px-3">Teacher Remarks</th>
                        <th className="py-2.5 px-3 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {examDetail.results.map((r: any) => (
                        <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                          <td className="py-2.5 px-3 font-bold font-mono text-slate-700">
                            #{r.rank}
                          </td>

                          <td className="py-2.5 px-3 font-semibold text-slate-900">
                            {r.student?.fullName || 'Student'}
                          </td>

                          <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                            {r.student?.studentIdNumber || r.studentId}
                          </td>

                          <td className="py-2.5 px-3 font-black text-slate-900 text-sm">
                            {r.marks}
                          </td>

                          <td className="py-2.5 px-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              r.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                              r.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                              r.grade === 'C' ? 'bg-amber-100 text-amber-800' :
                              r.grade === 'S' ? 'bg-slate-100 text-slate-700' :
                              'bg-rose-100 text-rose-800'
                            }`}>
                              Grade {r.grade}
                            </span>
                          </td>

                          <td className="py-2.5 px-3 text-[11px] text-slate-500 italic max-w-xs truncate">
                            {r.comment || 'Satisfactory'}
                          </td>

                          <td className="py-2.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => openSingleResultEdit(r)}
                                title="Edit Student Score"
                                className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-brand-50 transition-colors"
                              >
                                <Edit2 size={13} />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteSingleResult(r.studentId, r.student?.fullName || 'Student')}
                                title="Remove Student Score"
                                className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              >
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="py-12 px-4 text-center rounded-2xl bg-slate-50/70 border border-dashed border-slate-200 space-y-3">
                  <ClipboardCheck size={28} className="mx-auto text-slate-400" />
                  <div>
                    <p className="text-xs font-bold text-slate-700">No Student Marks Recorded Yet</p>
                    <p className="text-[11px] text-slate-500 mt-0.5">
                      Click <strong>Enter / Edit Marks</strong> to enter student scores and automatically calculate grades & rankings.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={openGradingSheet}
                    className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold inline-flex items-center gap-1.5 shadow-sm"
                  >
                    <ClipboardCheck size={14} />
                    <span>Enter Student Marks Now</span>
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Select an assessment to view or enter student scores.</div>
          )}
        </div>
      </div>

      {/* CREATE / EDIT ASSESSMENT MODAL */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                {editingExamId ? 'Edit Assessment' : 'Create New Assessment'}
              </h3>
              <button onClick={() => setIsExamModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveExam} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Exam Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Combined Maths Term 1 Evaluation"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Class</label>
                  <select
                    value={formData.classId}
                    onChange={(e) => {
                      const clsId = e.target.value;
                      const cls = classes.find((c: any) => c.id === clsId);
                      setFormData({
                        ...formData,
                        classId: clsId,
                        subjectId: cls?.subjectId || formData.subjectId
                      });
                    }}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    <option value="">-- All / General Class --</option>
                    {classes.map((c: any) => (
                      <option key={c.id} value={c.id}>
                        {c.name || c.title} ({c.grade})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Subject</label>
                  <select
                    value={formData.subjectId}
                    onChange={(e) => setFormData({ ...formData, subjectId: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                  >
                    {availableSubjects.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assessment Type</label>
                <select
                  value={formData.examType}
                  onChange={(e) => setFormData({ ...formData, examType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Class Test">Class Test</option>
                  <option value="Monthly Test">Monthly Test</option>
                  <option value="Term Exam">Term Exam</option>
                  <option value="Assignment">Assignment</option>
                  <option value="Quiz">Quiz</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Total Marks</label>
                  <input
                    type="number"
                    min={1}
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pass Marks</label>
                  <input
                    type="number"
                    min={0}
                    value={formData.passMarks}
                    onChange={(e) => setFormData({ ...formData, passMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Assessment Date</label>
                <input
                  type="date"
                  value={formData.date}
                  onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
                >
                  {editingExamId ? 'Save Changes' : 'Create Assessment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* BULK ENTER / EDIT STUDENT MARKS MODAL */}
      {isGradingModalOpen && examDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">
                  Enter / Edit Student Marks — {examDetail.title}
                </h3>
                <p className="text-[11px] text-slate-500 mt-0.5">
                  Total Marks: {examDetail.totalMarks || 100} • Pass Mark: {examDetail.passMarks || 40} (Leave blank for ungraded students)
                </p>
              </div>
              <button onClick={() => setIsGradingModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveBulkMarks} className="flex-1 overflow-y-auto p-6 space-y-4">
              {/* Quick Add Student from Institute */}
              {examDetail.allStudents && examDetail.allStudents.length > Object.keys(markEntries).length && (
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <span className="text-[11px] font-bold text-slate-700 flex items-center gap-1.5">
                      <UserPlus size={14} className="text-brand-600" />
                      <span>Add More Students to Grading Sheet</span>
                    </span>
                    <div className="relative w-full sm:w-64">
                      <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        type="text"
                        placeholder="Search student name or ID..."
                        value={studentSearch}
                        onChange={(e) => setStudentSearch(e.target.value)}
                        className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-white border border-slate-200 text-xs"
                      />
                    </div>
                  </div>
                  {unlistedStudents.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto pt-1">
                      {unlistedStudents.slice(0, 12).map((s: any) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => addStudentToSheet(s)}
                          className="px-2.5 py-1 rounded-lg bg-white border border-slate-200 hover:border-brand-400 hover:bg-brand-50 text-[11px] font-semibold text-slate-700 flex items-center gap-1"
                        >
                          <Plus size={11} className="text-brand-600" />
                          <span>{s.fullName}</span>
                          <span className="text-[10px] font-mono text-slate-400">({s.studentIdNumber})</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Grading Table */}
              <div className="overflow-x-auto border border-slate-200 rounded-2xl">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Student</th>
                      <th className="py-2.5 px-3 w-32">Marks (/{examDetail.totalMarks || 100})</th>
                      <th className="py-2.5 px-3 w-24">Auto Grade</th>
                      <th className="py-2.5 px-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {Object.entries(markEntries).map(([studentId, entry]) => {
                      const hasMarks = entry.marks !== '' && !isNaN(Number(entry.marks));
                      const previewGrade = hasMarks
                        ? computePreviewGrade(Number(entry.marks), examDetail.totalMarks || 100, examDetail.passMarks || 40)
                        : '-';
                      return (
                        <tr key={studentId} className="hover:bg-slate-50/60">
                          <td className="py-2.5 px-3">
                            <div className="font-bold text-slate-900">{entry.student?.fullName || 'Student'}</div>
                            <div className="text-[10px] font-mono text-slate-400">{entry.student?.studentIdNumber || studentId}</div>
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="number"
                              min={0}
                              max={examDetail.totalMarks || 100}
                              placeholder="0 - 100"
                              value={entry.marks}
                              onChange={(e) =>
                                setMarkEntries(prev => ({
                                  ...prev,
                                  [studentId]: { ...prev[studentId], marks: e.target.value }
                                }))
                              }
                              className="w-24 px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:ring-2 focus:ring-brand-500"
                            />
                          </td>
                          <td className="py-2.5 px-3">
                            {hasMarks ? (
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                previewGrade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                                previewGrade === 'B' ? 'bg-blue-100 text-blue-800' :
                                previewGrade === 'C' ? 'bg-amber-100 text-amber-800' :
                                previewGrade === 'S' ? 'bg-slate-100 text-slate-700' :
                                'bg-rose-100 text-rose-800'
                              }`}>
                                Grade {previewGrade}
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Not graded</span>
                            )}
                          </td>
                          <td className="py-2.5 px-3">
                            <input
                              type="text"
                              placeholder="e.g. Excellent / Needs revision"
                              value={entry.comment}
                              onChange={(e) =>
                                setMarkEntries(prev => ({
                                  ...prev,
                                  [studentId]: { ...prev[studentId], comment: e.target.value }
                                }))
                              }
                              className="w-full px-2.5 py-1.5 rounded-xl border border-slate-300 text-xs"
                            />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsGradingModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingMarks}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md flex items-center gap-1.5"
                >
                  <Save size={14} />
                  <span>{savingMarks ? 'Saving Marks...' : 'Save Student Marks'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK SINGLE STUDENT RESULT EDIT MODAL */}
      {editingResult && examDetail && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-sm bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Edit Student Score</h3>
              <button onClick={() => setEditingResult(null)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveSingleResult} className="p-6 space-y-4">
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div className="font-bold text-xs text-slate-900">{editingResult.student?.fullName || 'Student'}</div>
                <div className="text-[10px] font-mono text-slate-500">{editingResult.student?.studentIdNumber || editingResult.studentId}</div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <div className="flex-1">
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Marks (Out of {examDetail.totalMarks || 100})
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={examDetail.totalMarks || 100}
                    required
                    value={singleMarkForm.marks}
                    onChange={(e) => setSingleMarkForm({ ...singleMarkForm, marks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-sm font-black text-slate-900"
                  />
                </div>
                <div className="pt-5">
                  <span className="px-3 py-1.5 rounded-xl bg-brand-50 text-brand-700 font-bold text-xs border border-brand-200">
                    Grade {computePreviewGrade(Number(singleMarkForm.marks), examDetail.totalMarks || 100, examDetail.passMarks || 40)}
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Teacher Remarks</label>
                <input
                  type="text"
                  placeholder="e.g. Very Good / Satisfactory"
                  value={singleMarkForm.comment}
                  onChange={(e) => setSingleMarkForm({ ...singleMarkForm, comment: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setEditingResult(null)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
                >
                  Update Score
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
