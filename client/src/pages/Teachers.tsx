import React, { useState, useEffect } from 'react';
import { 
  GraduationCap, 
  Plus, 
  Phone, 
  Mail, 
  BookOpen, 
  Users, 
  CheckCircle2, 
  CreditCard,
  X,
  Eye,
  Edit2,
  Trash2,
  Percent,
  Clock,
  Briefcase,
  Search,
  Filter,
  AlertCircle,
  MapPin,
  DollarSign
} from 'lucide-react';
import { apiRequest, formatLKR } from '../api';
import { useAuth } from '../context/AuthContext';

export const Teachers: React.FC = () => {
  const { user } = useAuth();
  const [teachers, setTeachers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPayoutFilter, setSelectedPayoutFilter] = useState('ALL');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState('ALL');

  // Add Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    email: '',
    qualifications: '',
    address: '',
    paymentRate: 70,
    paymentMethod: 'Percentage',
    photo: '',
    status: 'ACTIVE'
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<any>(null);
  const [editFormData, setEditFormData] = useState({
    id: '',
    name: '',
    phone: '',
    email: '',
    qualifications: '',
    address: '',
    paymentRate: 70,
    paymentMethod: 'Percentage',
    photo: '',
    status: 'ACTIVE'
  });

  const [saving, setSaving] = useState(false);
  const [actionError, setActionError] = useState('');

  const fetchTeachers = async () => {
    setLoading(true);
    try {
      const data = await apiRequest('/teachers');
      setTeachers(data || []);
    } catch (err) {
      console.error('Failed to fetch teachers:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;
    setSaving(true);
    setActionError('');

    try {
      await apiRequest('/teachers', {
        method: 'POST',
        body: JSON.stringify(formData)
      });
      setIsAddModalOpen(false);
      setFormData({
        name: '',
        phone: '',
        email: '',
        qualifications: '',
        address: '',
        paymentRate: 70,
        paymentMethod: 'Percentage',
        photo: '',
        status: 'ACTIVE'
      });
      fetchTeachers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to create teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (teacher: any) => {
    setEditingTeacher(teacher);
    setEditFormData({
      id: teacher.id,
      name: teacher.name || '',
      phone: teacher.phone || '',
      email: teacher.email || '',
      qualifications: teacher.qualifications || '',
      address: teacher.address || '',
      paymentRate: teacher.paymentRate !== undefined ? teacher.paymentRate : 70,
      paymentMethod: teacher.paymentMethod || 'Percentage',
      photo: teacher.photo || '',
      status: teacher.status || 'ACTIVE'
    });
    setActionError('');
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editFormData.name || !editFormData.phone || !editFormData.id) return;
    setSaving(true);
    setActionError('');

    try {
      await apiRequest(`/teachers/${editFormData.id}`, {
        method: 'PUT',
        body: JSON.stringify(editFormData)
      });
      setIsEditModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      setActionError(err.message || 'Failed to update teacher');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTeacher = async (teacher: any) => {
    if (!window.confirm(`Are you sure you want to remove ${teacher.name} (${teacher.teacherIdNumber})?`)) {
      return;
    }
    setActionError('');
    try {
      await apiRequest(`/teachers/${teacher.id}`, {
        method: 'DELETE'
      });
      if (isEditModalOpen) setIsEditModalOpen(false);
      fetchTeachers();
    } catch (err: any) {
      alert(err.message || 'Failed to delete teacher');
    }
  };

  // Filtered teachers list
  const filteredTeachers = teachers.filter(t => {
    const matchesSearch = 
      t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacherIdNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.phone?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.qualifications?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesPayout = selectedPayoutFilter === 'ALL' || t.paymentMethod === selectedPayoutFilter;
    const matchesStatus = selectedStatusFilter === 'ALL' || t.status === selectedStatusFilter;

    return matchesSearch && matchesPayout && matchesStatus;
  });

  const getPayoutLabel = (method: string) => {
    switch (method) {
      case 'Percentage':
        return 'Percentage (%)';
      case 'FlatRate':
        return 'Flat Monthly';
      case 'PerStudent':
        return 'Per Student';
      case 'Hourly':
        return 'Hourly Rate';
      case 'Other':
        return 'Custom / Other';
      default:
        return method || 'Percentage';
    }
  };

  const getPayoutBadgeColor = (method: string) => {
    switch (method) {
      case 'Percentage':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'FlatRate':
        return 'bg-emerald-50 text-emerald-700 border-emerald-200';
      case 'PerStudent':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'Hourly':
        return 'bg-amber-50 text-amber-700 border-amber-200';
      default:
        return 'bg-indigo-50 text-indigo-700 border-indigo-200';
    }
  };

  const renderPayoutFormattedRate = (teacher: any) => {
    const rate = teacher.paymentRate !== undefined ? teacher.paymentRate : 70;
    switch (teacher.paymentMethod) {
      case 'Percentage':
        return `${rate}%`;
      case 'FlatRate':
        return `${formatLKR(rate)} / mo`;
      case 'PerStudent':
        return `${formatLKR(rate)} / student`;
      case 'Hourly':
        return `${formatLKR(rate)} / hr`;
      case 'Other':
        return formatLKR(rate);
      default:
        return `${rate}%`;
    }
  };

  return (
    <div className="space-y-6">
      {/* Title & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Teacher Management</h1>
          <p className="text-xs text-slate-500 mt-0.5">Faculty profiles, remuneration models (Percentage, Flat Monthly, Per Student, Hourly), and class contracts</p>
        </div>

        <button
          onClick={() => {
            setActionError('');
            setIsAddModalOpen(true);
          }}
          className="px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-md transition-all shrink-0 active:scale-95"
        >
          <Plus size={16} />
          <span>Add Faculty Teacher</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row gap-3 items-center justify-between bg-white p-3.5 rounded-2xl border border-slate-200/80 shadow-sm">
        <div className="relative w-full sm:w-80">
          <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search teachers by name, ID, phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 bg-slate-50/50"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5 w-full sm:w-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <Filter size={14} className="text-slate-400 shrink-0" />
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Payout:</span>
            <select
              value={selectedPayoutFilter}
              onChange={(e) => setSelectedPayoutFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Payout Methods</option>
              <option value="Percentage">Percentage (%)</option>
              <option value="FlatRate">Flat Monthly</option>
              <option value="PerStudent">Per Student</option>
              <option value="Hourly">Hourly Rate</option>
              <option value="Other">Other / Custom</option>
            </select>
          </div>

          <div className="flex items-center gap-1.5 text-xs text-slate-600">
            <span className="font-semibold text-[11px] uppercase tracking-wider text-slate-400">Status:</span>
            <select
              value={selectedStatusFilter}
              onChange={(e) => setSelectedStatusFilter(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 text-xs bg-white text-slate-700 font-medium focus:outline-none focus:ring-2 focus:ring-brand-500/20"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active Faculty</option>
              <option value="INACTIVE">Inactive</option>
            </select>
          </div>
        </div>
      </div>

      {/* Teachers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {loading ? (
          <div className="col-span-3 py-16 text-center text-xs text-slate-400 animate-pulse">Loading faculty members...</div>
        ) : filteredTeachers.length === 0 ? (
          <div className="col-span-3 py-16 text-center bg-white rounded-3xl border border-slate-200/80 p-8 space-y-2">
            <GraduationCap size={40} className="mx-auto text-slate-300" />
            <p className="text-sm font-bold text-slate-700">No teachers found</p>
            <p className="text-xs text-slate-400">Try adjusting your search criteria or add a new teacher.</p>
          </div>
        ) : filteredTeachers.map(t => (
          <div key={t.id} className="p-6 rounded-3xl bg-white border border-slate-200/80 shadow-sm space-y-4 hover:border-brand-300 hover:shadow-md transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center space-x-3.5 min-w-0">
                  <img 
                    src={t.photo || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=100"} 
                    alt="" 
                    className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 shadow-md shrink-0 bg-slate-100"
                  />
                  <div className="min-w-0">
                    <h3 className="font-bold text-sm text-slate-900 truncate">{t.name}</h3>
                    <p className="text-[10px] text-brand-600 font-mono font-semibold">{t.teacherIdNumber}</p>
                    <p className="text-[11px] text-slate-500 line-clamp-1">{t.qualifications || 'Lecturer'}</p>
                  </div>
                </div>

                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                    t.status === 'ACTIVE' 
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200' 
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}>
                    {t.status}
                  </span>

                  {/* Quick Edit button in top corner */}
                  <button
                    onClick={() => handleOpenEdit(t)}
                    title="Edit Teacher"
                    className="p-1.5 rounded-xl bg-slate-50 hover:bg-brand-50 hover:text-brand-600 text-slate-400 border border-slate-200/60 transition-all active:scale-95"
                  >
                    <Edit2 size={13} />
                  </button>
                </div>
              </div>

              {/* Contacts */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <p className="flex items-center gap-2">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  <a href={`tel:${t.phone}`} className="font-mono hover:text-brand-600 transition-colors">{t.phone}</a>
                </p>
                {t.email && (
                  <p className="flex items-center gap-2">
                    <Mail size={13} className="text-slate-400 shrink-0" />
                    <a href={`mailto:${t.email}`} className="truncate hover:text-brand-600 transition-colors">{t.email}</a>
                  </p>
                )}
                {t.address && (
                  <p className="flex items-center gap-2 text-slate-500">
                    <MapPin size={13} className="text-slate-400 shrink-0" />
                    <span className="truncate">{t.address}</span>
                  </p>
                )}
              </div>

              {/* Stats & Payout Breakdown */}
              <div className="mt-3 grid grid-cols-2 gap-2 p-3 rounded-2xl bg-slate-50 border border-slate-100 text-center text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Assigned Classes</span>
                  <p className="font-bold text-slate-900 text-sm mt-0.5 flex items-center justify-center gap-1">
                    <BookOpen size={14} className="text-slate-400" />
                    <span>{t.classCount || 0}</span>
                  </p>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Payout Rate</span>
                  <p className="font-bold text-brand-700 text-sm mt-0.5 truncate">
                    {renderPayoutFormattedRate(t)}
                  </p>
                </div>
              </div>
            </div>

            {/* Card Footer with Edit & Payout Details */}
            <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs gap-2">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className={`px-2 py-0.5 rounded-lg text-[10px] font-bold border truncate ${getPayoutBadgeColor(t.paymentMethod)}`}>
                  Payout: {getPayoutLabel(t.paymentMethod)}
                </span>
              </div>

              <button
                onClick={() => handleOpenEdit(t)}
                className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-brand-50 hover:text-brand-700 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-all border border-slate-200/80 active:scale-95 shrink-0"
              >
                <Edit2 size={12} />
                <span>Edit</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ADD TEACHER MODAL */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Add Faculty Teacher</h3>
                <p className="text-[11px] text-slate-500 mt-0.5">Register a new educator and configure their payout scheme</p>
              </div>
              <button 
                onClick={() => setIsAddModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Silva"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 111 2233"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="teacher@apex.edu.lk"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Qualifications</label>
                  <input
                    type="text"
                    placeholder="B.Sc. (Hons), M.Phil"
                    value={formData.qualifications}
                    onChange={(e) => setFormData({ ...formData, qualifications: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. 45/2 Galle Road, Colombo 03"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Photo Avatar URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.photo}
                  onChange={(e) => setFormData({ ...formData, photo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono text-[11px]"
                />
              </div>

              {/* Payout Configuration Section */}
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-brand-600" />
                  <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Payout & Remuneration Structure</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Payout Method</label>
                    <select
                      value={formData.paymentMethod}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        let defaultRate = formData.paymentRate;
                        if (newMethod === 'Percentage' && (defaultRate > 100 || defaultRate <= 0)) defaultRate = 70;
                        if (newMethod === 'FlatRate' && defaultRate <= 100) defaultRate = 50000;
                        if (newMethod === 'PerStudent' && defaultRate > 5000) defaultRate = 500;
                        if (newMethod === 'Hourly' && defaultRate > 10000) defaultRate = 2500;
                        setFormData({ ...formData, paymentMethod: newMethod, paymentRate: defaultRate });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="Percentage">Percentage (%) - Revenue Commission</option>
                      <option value="FlatRate">Flat Monthly - Fixed Monthly Retainer</option>
                      <option value="PerStudent">Per Student - Rate per Paid Student</option>
                      <option value="Hourly">Hourly Rate - Hourly Teaching Fee</option>
                      <option value="Other">Other / Custom Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {formData.paymentMethod === 'Percentage' && 'Commission Rate (%)'}
                      {formData.paymentMethod === 'FlatRate' && 'Monthly Flat Amount (Rs.)'}
                      {formData.paymentMethod === 'PerStudent' && 'Rate per Student (Rs.)'}
                      {formData.paymentMethod === 'Hourly' && 'Hourly Rate (Rs.)'}
                      {formData.paymentMethod === 'Other' && 'Agreed Rate (Rs. / Unit)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={formData.paymentMethod === 'Percentage' ? 100 : undefined}
                        value={formData.paymentRate}
                        onChange={(e) => setFormData({ ...formData, paymentRate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {formData.paymentMethod === 'Percentage' ? '%' : 'LKR'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-2 pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                >
                  {saving ? 'Creating...' : 'Add Teacher'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT TEACHER MODAL */}
      {isEditModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
              <div>
                <h3 className="font-bold text-sm text-slate-800 uppercase tracking-wider">Edit Teacher Profile</h3>
                <p className="text-[11px] text-brand-600 font-mono font-semibold">{editingTeacher?.teacherIdNumber} - {editingTeacher?.name}</p>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)} 
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 transition-colors"
              >
                <X size={18} />
              </button>
            </div>

            {actionError && (
              <div className="mx-6 mt-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
                <AlertCircle size={15} className="shrink-0" />
                <span>{actionError}</span>
              </div>
            )}

            <form onSubmit={handleEditSubmit} className="p-6 space-y-4 overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name & Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. K. Silva"
                  value={editFormData.name}
                  onChange={(e) => setEditFormData({ ...editFormData, name: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+94 77 111 2233"
                    value={editFormData.phone}
                    onChange={(e) => setEditFormData({ ...editFormData, phone: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address</label>
                  <input
                    type="email"
                    placeholder="teacher@apex.edu.lk"
                    value={editFormData.email}
                    onChange={(e) => setEditFormData({ ...editFormData, email: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Qualifications</label>
                  <input
                    type="text"
                    placeholder="B.Sc. (Hons), M.Phil"
                    value={editFormData.qualifications}
                    onChange={(e) => setEditFormData({ ...editFormData, qualifications: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Status</label>
                  <select
                    value={editFormData.status}
                    onChange={(e) => setEditFormData({ ...editFormData, status: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-semibold"
                  >
                    <option value="ACTIVE">ACTIVE</option>
                    <option value="INACTIVE">INACTIVE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Address / Location</label>
                <input
                  type="text"
                  placeholder="e.g. 45/2 Galle Road, Colombo 03"
                  value={editFormData.address}
                  onChange={(e) => setEditFormData({ ...editFormData, address: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Photo Avatar URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={editFormData.photo}
                  onChange={(e) => setEditFormData({ ...editFormData, photo: e.target.value })}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500 font-mono text-[11px]"
                />
              </div>

              {/* Payout Configuration Section */}
              <div className="p-4 rounded-2xl bg-brand-50/50 border border-brand-100 space-y-3">
                <div className="flex items-center gap-2">
                  <CreditCard size={16} className="text-brand-600" />
                  <h4 className="text-xs font-bold text-brand-900 uppercase tracking-wider">Payout & Remuneration Structure</h4>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">Payout Method</label>
                    <select
                      value={editFormData.paymentMethod}
                      onChange={(e) => {
                        const newMethod = e.target.value;
                        let defaultRate = editFormData.paymentRate;
                        if (newMethod === 'Percentage' && (defaultRate > 100 || defaultRate <= 0)) defaultRate = 70;
                        if (newMethod === 'FlatRate' && defaultRate <= 100) defaultRate = 50000;
                        if (newMethod === 'PerStudent' && defaultRate > 5000) defaultRate = 500;
                        if (newMethod === 'Hourly' && defaultRate > 10000) defaultRate = 2500;
                        setEditFormData({ ...editFormData, paymentMethod: newMethod, paymentRate: defaultRate });
                      }}
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs bg-white font-semibold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                    >
                      <option value="Percentage">Percentage (%) - Revenue Commission</option>
                      <option value="FlatRate">Flat Monthly - Fixed Monthly Retainer</option>
                      <option value="PerStudent">Per Student - Rate per Paid Student</option>
                      <option value="Hourly">Hourly Rate - Hourly Teaching Fee</option>
                      <option value="Other">Other / Custom Contract</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      {editFormData.paymentMethod === 'Percentage' && 'Commission Rate (%)'}
                      {editFormData.paymentMethod === 'FlatRate' && 'Monthly Flat Amount (Rs.)'}
                      {editFormData.paymentMethod === 'PerStudent' && 'Rate per Student (Rs.)'}
                      {editFormData.paymentMethod === 'Hourly' && 'Hourly Rate (Rs.)'}
                      {editFormData.paymentMethod === 'Other' && 'Agreed Rate (Rs. / Unit)'}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min="0"
                        max={editFormData.paymentMethod === 'Percentage' ? 100 : undefined}
                        value={editFormData.paymentRate}
                        onChange={(e) => setEditFormData({ ...editFormData, paymentRate: Number(e.target.value) })}
                        className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-bold focus:ring-2 focus:ring-brand-500/20 focus:border-brand-500"
                      />
                      <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-slate-400">
                        {editFormData.paymentMethod === 'Percentage' ? '%' : 'LKR'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-slate-200">
                <button
                  type="button"
                  onClick={() => handleDeleteTeacher(editingTeacher)}
                  className="px-3.5 py-2 rounded-xl text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors border border-rose-200/60"
                >
                  <Trash2 size={14} />
                  <span>Delete</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={saving}
                    className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md transition-all active:scale-95"
                  >
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
