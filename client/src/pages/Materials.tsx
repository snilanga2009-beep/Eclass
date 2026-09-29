import React, { useState, useEffect } from 'react';
import { 
  FolderDown, 
  Plus, 
  FileText, 
  Image as ImageIcon, 
  Film, 
  BookOpen, 
  Download, 
  Search,
  Filter,
  X
} from 'lucide-react';
import { apiRequest, formatDate } from '../api';

export const Materials: React.FC = () => {
  const [materials, setMaterials] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [fileTypeFilter, setFileTypeFilter] = useState('ALL');
  const [isUploadOpen, setIsUploadOpen] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    title: '',
    description: '',
    fileType: 'PDF',
    fileUrl: '/materials/pure_math_handbook_2026.pdf',
    subjectId: 'subj-math',
    grade: 'Grade 12',
    lessonTopic: 'Theory Handbook'
  });

  const fetchMaterials = async () => {
    setLoading(true);
    try {
      const q = new URLSearchParams({
        search,
        fileType: fileTypeFilter
      });
      const data = await apiRequest(`/materials?${q.toString()}`);
      setMaterials(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMaterials();
  }, [fileTypeFilter]);

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.title) return;

    try {
      await apiRequest('/materials', {
        method: 'POST',
        body: JSON.stringify(uploadForm)
      });
      setIsUploadOpen(false);
      fetchMaterials();
    } catch (err: any) {
      alert(err.message || 'Upload failed');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Learning Materials Repository</h1>
          <p className="text-xs text-slate-500 mt-0.5">Study guides, past paper model questions, lecture handbooks, and revision resources</p>
        </div>

        <button
          onClick={() => setIsUploadOpen(true)}
          className="px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0"
        >
          <Plus size={16} />
          <span>Upload Material</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white border border-slate-200/80 shadow-sm flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        <div className="flex-1 relative">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search material title, lesson topic..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && fetchMaterials()}
            className="w-full pl-10 pr-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:ring-2 focus:ring-brand-500"
          />
        </div>

        <select
          value={fileTypeFilter}
          onChange={(e) => setFileTypeFilter(e.target.value)}
          className="px-3 py-2 rounded-xl border border-slate-200 text-xs bg-slate-50 font-medium text-slate-700 focus:outline-none"
        >
          <option value="ALL">All File Types</option>
          <option value="PDF">PDF Documents</option>
          <option value="Past Paper">Past Papers</option>
          <option value="Image">Diagrams & Charts</option>
          <option value="Video">Video Links</option>
        </select>
      </div>

      {/* Materials Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400">Loading learning repository...</div>
        ) : materials.map(m => (
          <div key={m.id} className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-sm hover:border-brand-300 transition-all flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="px-2.5 py-0.5 rounded-lg bg-brand-50 text-brand-700 font-mono text-[10px] font-bold">
                  {m.subject?.name}
                </span>
                <span className="text-[10px] text-slate-400 font-mono">{m.fileSize || '5 MB'}</span>
              </div>

              <h3 className="font-bold text-sm text-slate-900 leading-snug">{m.title}</h3>
              <p className="text-xs text-slate-500 mt-1 line-clamp-2">{m.description || 'Comprehensive class study notes.'}</p>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span>By: <strong className="text-slate-700">{m.teacher?.name || 'Faculty Staff'}</strong></span>
                <span>{m.grade || 'All Grades'}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[10px] text-slate-400">Uploaded {formatDate(m.uploadDate)}</span>
              <a
                href={m.fileUrl}
                download
                target="_blank"
                rel="noreferrer"
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors"
              >
                <Download size={14} />
                <span>Download</span>
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* UPLOAD MODAL */}
      {isUploadOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Upload Course Resource</h3>
              <button onClick={() => setIsUploadOpen(false)} className="p-1 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pure Math Handout - Complex Numbers"
                  value={uploadForm.title}
                  onChange={(e) => setUploadForm({ ...uploadForm, title: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Resource Type</label>
                <select
                  value={uploadForm.fileType}
                  onChange={(e) => setUploadForm({ ...uploadForm, fileType: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="PDF">PDF Document</option>
                  <option value="Past Paper">Past Paper & Marking Scheme</option>
                  <option value="Image">Infographic / Diagram</option>
                  <option value="Video">Video Link</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Target Grade</label>
                <select
                  value={uploadForm.grade}
                  onChange={(e) => setUploadForm({ ...uploadForm, grade: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
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
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Topic / Lesson</label>
                <input
                  type="text"
                  placeholder="e.g. Mechanics / Matrices"
                  value={uploadForm.lessonTopic}
                  onChange={(e) => setUploadForm({ ...uploadForm, lessonTopic: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of contents..."
                  value={uploadForm.description}
                  onChange={(e) => setUploadForm({ ...uploadForm, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsUploadOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md"
                >
                  Publish Material
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
