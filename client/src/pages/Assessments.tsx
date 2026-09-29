import React, { useState, useEffect } from 'react';
import { 
  FileText, 
  Plus, 
  Award, 
  BarChart2, 
  Check, 
  Calendar, 
  Users, 
  X,
  ChevronRight
} from 'lucide-react';
import { apiRequest, formatDate } from '../api';

export const Assessments: React.FC = () => {
  const [exams, setExams] = useState<any[]>([]);
  const [selectedExamId, setSelectedExamId] = useState<string | null>(null);
  const [examDetail, setExamDetail] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Create Exam Modal
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    examType: 'Monthly Test',
    subjectId: 'subj-math',
    date: new Date().toISOString().substring(0, 10),
    totalMarks: 100,
    passMarks: 40
  });

  const fetchExams = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/exams');
      setExams(data || []);
      if (data && data.length > 0 && !selectedExamId) {
        setSelectedExamId(data[0].id);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExams();
  }, []);

  useEffect(() => {
    if (!selectedExamId) return;
    apiRequest(`/exams/${selectedExamId}`)
      .then(res => setExamDetail(res))
      .catch(err => console.error(err));
  }, [selectedExamId]);

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title) return;

    try {
      await apiRequest('/exams', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsAddModalOpen(false);
      fetchExams();
    } catch (err: any) {
      alert(err.message || 'Failed to create exam');
    }
  };

  return (
    <div className="space-y-6">
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Assessments & Student Performance</h1>
          <p className="text-xs text-slate-500 mt-0.5">Manage class tests, monthly assessments, term exams, and student performance rankings</p>
        </div>

        <button
          onClick={() => setIsAddModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0"
        >
          <Plus size={16} />
          <span>New Assessment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: List of Assessments */}
        <div className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-3">
          <h3 className="font-bold text-xs text-slate-400 uppercase tracking-wider mb-2">Available Exams ({exams.length})</h3>

          <div className="space-y-2">
            {exams.map(e => (
              <div
                key={e.id}
                onClick={() => setSelectedExamId(e.id)}
                className={`p-3.5 rounded-2xl border transition-all cursor-pointer ${
                  selectedExamId === e.id
                    ? 'border-brand-500 bg-brand-50/60 shadow-sm'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="px-2 py-0.5 rounded bg-white border border-slate-200 font-mono text-[9px] font-bold text-slate-700">
                    {e.examType}
                  </span>
                  <span className="text-[10px] text-slate-400">{formatDate(e.date)}</span>
                </div>
                <h4 className="font-bold text-xs text-slate-900">{e.title}</h4>
                <p className="text-[11px] text-brand-700 mt-0.5">{e.subject?.name}</p>

                <div className="flex items-center justify-between text-[10px] text-slate-500 pt-2 mt-2 border-t border-slate-100">
                  <span>Graded: <strong className="text-slate-800">{e.totalStudents}</strong></span>
                  <span>Avg: <strong className="text-emerald-700">{e.averageMarks}/100</strong></span>
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
                    {examDetail.subject?.name} • {examDetail.examType}
                  </span>
                  <h3 className="font-bold text-base text-slate-900">{examDetail.title}</h3>
                  <p className="text-xs text-slate-500">Date: {formatDate(examDetail.date)} • Pass Mark: {examDetail.passMarks}/100</p>
                </div>

                <div className="flex items-center space-x-2">
                  <div className="px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-bold">
                    Class Avg: {Math.round(examDetail.results?.reduce((s: number, r: any) => s + r.marks, 0) / (examDetail.results?.length || 1))}%
                  </div>
                </div>
              </div>

              {/* Student Results Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-50 text-slate-500 font-semibold uppercase tracking-wider text-[10px] border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Rank</th>
                      <th className="py-2.5 px-3">Student Name</th>
                      <th className="py-2.5 px-3">Student ID</th>
                      <th className="py-2.5 px-3">Marks (100)</th>
                      <th className="py-2.5 px-3">Grade</th>
                      <th className="py-2.5 px-3">Teacher Remarks</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {examDetail.results?.map((r: any) => (
                      <tr key={r.id} className="hover:bg-slate-50/60 transition-colors">
                        <td className="py-2.5 px-3 font-bold font-mono text-slate-700">
                          #{r.rank}
                        </td>

                        <td className="py-2.5 px-3 font-semibold text-slate-900">
                          {r.student?.fullName || 'Student'}
                        </td>

                        <td className="py-2.5 px-3 font-mono text-slate-500 text-[10px]">
                          {r.student?.studentIdNumber}
                        </td>

                        <td className="py-2.5 px-3 font-black text-slate-900 text-sm">
                          {r.marks}
                        </td>

                        <td className="py-2.5 px-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.grade === 'A' ? 'bg-emerald-100 text-emerald-800' :
                            r.grade === 'B' ? 'bg-blue-100 text-blue-800' :
                            r.grade === 'C' ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-700'
                          }`}>
                            Grade {r.grade}
                          </span>
                        </td>

                        <td className="py-2.5 px-3 text-[11px] text-slate-500 italic max-w-xs truncate">
                          {r.comment || 'Satisfactory'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="py-20 text-center text-xs text-slate-400">Select an assessment to view scores.</div>
          )}
        </div>
      </div>

      {/* CREATE EXAM MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Create New Assessment</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="p-6 space-y-4">
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
                    value={formData.totalMarks}
                    onChange={(e) => setFormData({ ...formData, totalMarks: Number(e.target.value) })}
                    className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Pass Marks</label>
                  <input
                    type="number"
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
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
                >
                  Create Assessment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
