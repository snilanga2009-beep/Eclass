import React, { useState, useEffect } from 'react';
import { 
  Users as UsersIcon, 
  UserPlus, 
  Shield, 
  Key, 
  Search, 
  Filter, 
  Edit3, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  Lock, 
  RefreshCw, 
  Sparkles, 
  ShieldCheck, 
  Clock, 
  Phone, 
  Mail, 
  UserCheck, 
  UserX, 
  Plus, 
  Eye, 
  EyeOff, 
  X, 
  Copy, 
  Check, 
  GraduationCap, 
  BookOpen, 
  HelpCircle 
} from 'lucide-react';
import { apiRequest, formatDate } from '../api';
import { useAuth } from '../context/AuthContext';

export const Users: React.FC = () => {
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState<any[]>([]);
  const [roles, setRoles] = useState<any[]>([]);
  const [teachers, setTeachers] = useState<any[]>([]);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<'USERS' | 'ROLES'>('USERS');

  // Search & Filter
  const [search, setSearch] = useState<string>('');
  const [selectedRole, setSelectedRole] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modals state
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isEditUserOpen, setIsEditUserOpen] = useState(false);
  const [isResetPasswordOpen, setIsResetPasswordOpen] = useState(false);
  const [isAddRoleOpen, setIsAddRoleOpen] = useState(false);
  const [targetUser, setTargetUser] = useState<any>(null);

  // Form states
  const [userForm, setUserForm] = useState({
    username: '',
    name: '',
    password: '',
    email: '',
    phone: '',
    roleId: '',
    teacherId: '',
    studentId: '',
    isActive: true
  });

  const [editForm, setEditForm] = useState({
    name: '',
    email: '',
    phone: '',
    roleId: '',
    teacherId: '',
    studentId: '',
    isActive: true
  });

  const [resetPasswordVal, setResetPasswordVal] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [copiedPassword, setCopiedPassword] = useState(false);

  const [roleForm, setRoleForm] = useState({
    name: '',
    description: ''
  });

  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const showToast = (type: 'success' | 'error', message: string) => {
    setFeedback({ type, message });
    setTimeout(() => setFeedback(null), 4000);
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const [uRes, rRes, tRes, sRes] = await Promise.all([
        apiRequest('/auth/users'),
        apiRequest('/auth/roles'),
        apiRequest('/teachers').catch(() => []),
        apiRequest('/students').catch(() => [])
      ]);
      setUsers(uRes || []);
      setRoles(rRes || []);
      setTeachers(tRes || []);
      setStudents(sRes || []);
    } catch (err: any) {
      console.error('Failed to load user management data:', err);
      showToast('error', err.message || 'Failed to load user data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filter users
  const filteredUsers = users.filter(u => {
    const q = search.toLowerCase();
    const matchesSearch = 
      !search ||
      u.name?.toLowerCase().includes(q) ||
      u.username?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.phone?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q);

    const matchesRole = selectedRole === 'ALL' || u.role === selectedRole;
    const matchesStatus = 
      statusFilter === 'ALL' ||
      (statusFilter === 'ACTIVE' && u.isActive) ||
      (statusFilter === 'INACTIVE' && !u.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // KPI Calculations
  const totalUsers = users.length;
  const activeCount = users.filter(u => u.isActive).length;
  const adminCount = users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length;
  const staffCount = users.filter(u => ['ACCOUNTANT', 'TEACHER', 'RECEPTIONIST'].includes(u.role)).length;

  // Handle Add User
  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/users', {
        method: 'POST',
        body: JSON.stringify(userForm)
      });
      showToast('success', `User account "@${userForm.username}" created successfully!`);
      setIsAddUserOpen(false);
      setUserForm({
        username: '',
        name: '',
        password: '',
        email: '',
        phone: '',
        roleId: roles[0]?.id || '',
        teacherId: '',
        studentId: '',
        isActive: true
      });
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create user');
    }
  };

  // Open Edit Modal
  const openEditModal = (u: any) => {
    setTargetUser(u);
    setEditForm({
      name: u.name || '',
      email: u.email || '',
      phone: u.phone || '',
      roleId: u.roleId || roles.find(r => r.name === u.role)?.id || '',
      teacherId: u.teacherId || '',
      studentId: u.studentId || '',
      isActive: u.isActive !== false
    });
    setIsEditUserOpen(true);
  };

  // Handle Save Edit User
  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    try {
      await apiRequest(`/auth/users/${targetUser.id}`, {
        method: 'PUT',
        body: JSON.stringify(editForm)
      });
      showToast('success', `User "@${targetUser.username}" updated successfully!`);
      setIsEditUserOpen(false);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update user');
    }
  };

  // Open Reset Password Modal
  const openResetPasswordModal = (u: any) => {
    setTargetUser(u);
    setResetPasswordVal('');
    setShowPassword(false);
    setCopiedPassword(false);
    setIsResetPasswordOpen(true);
  };

  // Handle Save Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetUser) return;
    if (resetPasswordVal.length < 4) {
      showToast('error', 'Password must be at least 4 characters long.');
      return;
    }
    try {
      await apiRequest(`/auth/users/${targetUser.id}/password`, {
        method: 'PUT',
        body: JSON.stringify({ newPassword: resetPasswordVal })
      });
      showToast('success', `New password for "@${targetUser.username}" updated successfully!`);
      setIsResetPasswordOpen(false);
    } catch (err: any) {
      showToast('error', err.message || 'Failed to update password');
    }
  };

  // Generate strong random password
  const generateRandomPassword = () => {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$%';
    let pass = '';
    for (let i = 0; i < 10; i++) {
      pass += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setResetPasswordVal(pass);
    setShowPassword(true);
  };

  // Toggle user active status
  const handleToggleActive = async (u: any) => {
    try {
      await apiRequest(`/auth/users/${u.id}`, {
        method: 'PUT',
        body: JSON.stringify({ isActive: !u.isActive })
      });
      showToast('success', `User "@${u.username}" ${!u.isActive ? 'activated' : 'deactivated'}.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to toggle status');
    }
  };

  // Delete User
  const handleDeleteUser = async (u: any) => {
    if (!window.confirm(`Are you sure you want to permanently delete user "@${u.username}" (${u.name})?`)) {
      return;
    }
    try {
      await apiRequest(`/auth/users/${u.id}`, {
        method: 'DELETE'
      });
      showToast('success', `User "@${u.username}" deleted successfully.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete user');
    }
  };

  // Handle Create Role ("roll add")
  const handleCreateRole = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await apiRequest('/auth/roles', {
        method: 'POST',
        body: JSON.stringify(roleForm)
      });
      showToast('success', `Role "${roleForm.name.toUpperCase().replace(/[^A-Z0-9_]/g, '_')}" created successfully!`);
      setIsAddRoleOpen(false);
      setRoleForm({ name: '', description: '' });
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to create role');
    }
  };

  // Handle Delete Custom Role
  const handleDeleteRole = async (r: any) => {
    if (!window.confirm(`Are you sure you want to delete role "${r.name}"?`)) {
      return;
    }
    try {
      await apiRequest(`/auth/roles/${r.id}`, {
        method: 'DELETE'
      });
      showToast('success', `Role "${r.name}" deleted.`);
      loadData();
    } catch (err: any) {
      showToast('error', err.message || 'Failed to delete role');
    }
  };

  // Helper for role badge colors
  const getRoleBadge = (roleName: string) => {
    switch (roleName) {
      case 'SUPER_ADMIN':
        return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'ADMIN':
        return 'bg-indigo-100 text-indigo-800 border-indigo-300';
      case 'ACCOUNTANT':
        return 'bg-emerald-100 text-emerald-800 border-emerald-300';
      case 'TEACHER':
        return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'RECEPTIONIST':
        return 'bg-amber-100 text-amber-800 border-amber-300';
      case 'PARENT':
        return 'bg-teal-100 text-teal-800 border-teal-300';
      case 'STUDENT':
        return 'bg-rose-100 text-rose-800 border-rose-300';
      default:
        return 'bg-cyan-100 text-cyan-800 border-cyan-300';
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {feedback && (
        <div className={`p-4 rounded-2xl flex items-center justify-between shadow-lg border transition-all animate-in fade-in duration-200 ${
          feedback.type === 'success' 
            ? 'bg-emerald-50 text-emerald-900 border-emerald-300' 
            : 'bg-rose-50 text-rose-900 border-rose-300'
        }`}>
          <div className="flex items-center space-x-2.5">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} className="text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle size={18} className="text-rose-600 shrink-0" />
            )}
            <span className="text-xs font-semibold">{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="text-slate-400 hover:text-slate-700">
            <X size={16} />
          </button>
        </div>
      )}

      {/* Top Banner & Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              User Panel & Access Control
            </h1>
            <span className="px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
              Admin Shield
            </span>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage admin, staff, and teacher login credentials, reset passwords, and create system roles
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={() => {
              setUserForm({
                username: '',
                name: '',
                password: '',
                email: '',
                phone: '',
                roleId: roles[0]?.id || '',
                teacherId: '',
                studentId: '',
                isActive: true
              });
              setIsAddUserOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
          >
            <UserPlus size={15} />
            <span>+ Add New User</span>
          </button>

          <button
            onClick={() => {
              setRoleForm({ name: '', description: '' });
              setIsAddRoleOpen(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-bold text-xs shadow-xs transition-all flex items-center gap-1.5"
          >
            <Shield size={15} className="text-indigo-600" />
            <span>+ Create Role</span>
          </button>

          <button
            onClick={loadData}
            className="p-2.5 rounded-2xl bg-white border border-slate-300 hover:bg-slate-50 text-slate-600 transition-colors"
            title="Refresh list"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold shrink-0">
            <UsersIcon size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Users</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{totalUsers}</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold shrink-0">
            <UserCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Active Logins</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{activeCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold shrink-0">
            <ShieldCheck size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Admins</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{adminCount}</p>
          </div>
        </div>

        <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold shrink-0">
            <Shield size={22} />
          </div>
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Roles</p>
            <p className="text-xl font-black text-slate-900 mt-0.5">{roles.length}</p>
          </div>
        </div>
      </div>

      {/* Tabs: Users vs Roles */}
      <div className="flex border-b border-slate-200 gap-4">
        <button
          onClick={() => setActiveTab('USERS')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'USERS'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>User Accounts Directory ({filteredUsers.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('ROLES')}
          className={`pb-3 text-xs font-bold transition-all relative ${
            activeTab === 'ROLES'
              ? 'text-indigo-600 border-b-2 border-indigo-600'
              : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <span>Role Management & Privileges ({roles.length})</span>
        </button>
      </div>

      {activeTab === 'USERS' && (
        <div className="space-y-4">
          {/* Search & Filter Toolbar */}
          <div className="p-4 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3">
            {/* Search */}
            <div className="relative w-full md:w-80">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search username, name, email..."
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
              />
              <Search size={15} className="absolute left-3 top-2.5 text-slate-400" />
            </div>

            {/* Role & Status Filters */}
            <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="ALL">All Roles ({users.length})</option>
                {roles.map(r => (
                  <option key={r.id} value={r.name}>{r.name}</option>
                ))}
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as any)}
                className="px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold bg-white text-slate-700"
              >
                <option value="ALL">All Status</option>
                <option value="ACTIVE">Active Only</option>
                <option value="INACTIVE">Deactivated</option>
              </select>
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
            {loading ? (
              <div className="py-16 text-center text-xs text-slate-400">Loading user accounts...</div>
            ) : filteredUsers.length === 0 ? (
              <div className="py-16 text-center space-y-2">
                <UsersIcon size={36} className="mx-auto text-slate-300" />
                <p className="text-xs font-bold text-slate-600">No user accounts found</p>
                <p className="text-[11px] text-slate-400">Try adjusting your search criteria or create a new user.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50/80 border-b border-slate-200/70 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Assigned Role</th>
                      <th className="py-3 px-4">Contact</th>
                      <th className="py-3 px-4">Linked Profile</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {filteredUsers.map((u) => {
                      const isCurrent = u.id === currentUser?.id;
                      return (
                        <tr key={u.id} className="hover:bg-slate-50/60 transition-colors">
                          {/* User Name & Handle */}
                          <td className="py-3 px-4">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-purple-600 text-white flex items-center justify-center font-bold text-xs uppercase shadow-xs shrink-0">
                                {u.name ? u.name.charAt(0) : u.username.charAt(0)}
                              </div>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5">
                                  <p className="font-bold text-slate-900 truncate">{u.name}</p>
                                  {isCurrent && (
                                    <span className="px-1.5 py-0.2 rounded bg-indigo-50 text-indigo-700 text-[9px] font-bold border border-indigo-200">
                                      YOU
                                    </span>
                                  )}
                                </div>
                                <p className="text-[10px] text-slate-400 font-mono">@{u.username}</p>
                              </div>
                            </div>
                          </td>

                          {/* Role Badge */}
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold border ${getRoleBadge(u.role)}`}>
                              {u.role}
                            </span>
                          </td>

                          {/* Contact */}
                          <td className="py-3 px-4 text-slate-600 font-mono text-[11px]">
                            {u.email && (
                              <div className="flex items-center gap-1">
                                <Mail size={11} className="text-slate-400" />
                                <span className="truncate max-w-[150px]">{u.email}</span>
                              </div>
                            )}
                            {u.phone && (
                              <div className="flex items-center gap-1 text-slate-500">
                                <Phone size={11} className="text-slate-400" />
                                <span>{u.phone}</span>
                              </div>
                            )}
                            {!u.email && !u.phone && <span className="text-slate-300">--</span>}
                          </td>

                          {/* Linked Profile */}
                          <td className="py-3 px-4">
                            {u.teacher ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-blue-50 text-blue-700 text-[10px] font-medium border border-blue-200">
                                <BookOpen size={11} />
                                <span>Teacher: {u.teacher.name}</span>
                              </span>
                            ) : u.student ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-rose-50 text-rose-700 text-[10px] font-medium border border-rose-200">
                                <GraduationCap size={11} />
                                <span>Student: {u.student.fullName}</span>
                              </span>
                            ) : (
                              <span className="text-slate-400 text-[11px]">System Account</span>
                            )}
                          </td>

                          {/* Status */}
                          <td className="py-3 px-4">
                            {u.isActive ? (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-bold border border-emerald-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>Active</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 text-[10px] font-bold border border-rose-200">
                                <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                <span>Deactivated</span>
                              </span>
                            )}
                          </td>

                          {/* Last Activity */}
                          <td className="py-3 px-4 text-slate-500 text-[11px] font-mono">
                            {u.lastLogin ? formatDate(u.lastLogin) : 'Never logged in'}
                          </td>

                          {/* Action Buttons */}
                          <td className="py-3 px-4 text-right">
                            <div className="flex items-center justify-end space-x-1.5">
                              {/* Reset Password Button */}
                              <button
                                onClick={() => openResetPasswordModal(u)}
                                className="p-1.5 rounded-lg text-purple-600 hover:bg-purple-50 border border-purple-200 shadow-2xs transition-colors"
                                title="Set / Reset User Password"
                              >
                                <Key size={14} />
                              </button>

                              {/* Edit Profile & Role */}
                              <button
                                onClick={() => openEditModal(u)}
                                className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 border border-indigo-200 shadow-2xs transition-colors"
                                title="Edit User Details & Role"
                              >
                                <Edit3 size={14} />
                              </button>

                              {/* Toggle Active Status */}
                              {!isCurrent && (
                                <button
                                  onClick={() => handleToggleActive(u)}
                                  className={`p-1.5 rounded-lg border shadow-2xs transition-colors ${
                                    u.isActive 
                                      ? 'text-amber-600 hover:bg-amber-50 border-amber-200' 
                                      : 'text-emerald-600 hover:bg-emerald-50 border-emerald-200'
                                  }`}
                                  title={u.isActive ? "Deactivate User" : "Activate User"}
                                >
                                  {u.isActive ? <UserX size={14} /> : <UserCheck size={14} />}
                                </button>
                              )}

                              {/* Delete Account */}
                              {!isCurrent && (
                                <button
                                  onClick={() => handleDeleteUser(u)}
                                  className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 border border-rose-200 shadow-2xs transition-colors"
                                  title="Delete User"
                                >
                                  <Trash2 size={14} />
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Role Management Tab */}
      {activeTab === 'ROLES' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-sm text-slate-900">System Roles & Permission Schemes</h3>
              <p className="text-xs text-slate-500">Every user account is assigned a role that determines access boundaries</p>
            </div>
            <button
              onClick={() => {
                setRoleForm({ name: '', description: '' });
                setIsAddRoleOpen(true);
              }}
              className="px-4 py-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-600/30 transition-all flex items-center gap-1.5"
            >
              <Plus size={14} />
              <span>+ Add New Role</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {roles.map(r => {
              const isBuiltIn = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'RECEPTIONIST', 'PARENT', 'STUDENT'].includes(r.name);
              return (
                <div key={r.id} className="p-5 rounded-3xl bg-white border border-slate-200/80 shadow-xs flex flex-col justify-between space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-bold border ${getRoleBadge(r.name)}`}>
                        {r.name}
                      </span>
                      {isBuiltIn ? (
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">System Built-In</span>
                      ) : (
                        <button
                          onClick={() => handleDeleteRole(r)}
                          className="p-1 rounded-lg text-rose-500 hover:bg-rose-50 transition-colors"
                          title="Delete Custom Role"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-slate-600 line-clamp-2">{r.description || 'Custom defined role'}</p>
                  </div>

                  <div className="pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                    <span className="text-slate-400 font-medium">Assigned Users:</span>
                    <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-800 font-bold font-mono">
                      {r.userCount || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD NEW USER */}
      {/* ========================================================= */}
      {isAddUserOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                  <UserPlus size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New Login User</h3>
                  <p className="text-[11px] text-slate-500">Add an administrator, teacher, accountant, or staff member</p>
                </div>
              </div>
              <button onClick={() => setIsAddUserOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-6 space-y-4 overflow-y-auto">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Username *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. kperera"
                    value={userForm.username}
                    onChange={(e) => setUserForm({ ...userForm, username: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kavindu Perera"
                    value={userForm.name}
                    onChange={(e) => setUserForm({ ...userForm, name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    Initial Password *
                  </label>
                  <button
                    type="button"
                    onClick={() => {
                      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnpqrstuvwxyz23456789!@#$';
                      let p = '';
                      for (let i = 0; i < 10; i++) p += chars.charAt(Math.floor(Math.random() * chars.length));
                      setUserForm({ ...userForm, password: p });
                    }}
                    className="text-[10px] font-semibold text-indigo-600 hover:underline"
                  >
                    Generate Random
                  </button>
                </div>
                <input
                  type="text"
                  required
                  placeholder="Min. 4 characters"
                  value={userForm.password}
                  onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Assign System Role *
                </label>
                <select
                  value={userForm.roleId}
                  onChange={(e) => setUserForm({ ...userForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>
                      {r.name} - {r.description || 'System Role'}
                    </option>
                  ))}
                </select>
              </div>

              {/* Contact info */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. kperera@gmail.com"
                    value={userForm.email}
                    onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 077 123 4567"
                    value={userForm.phone}
                    onChange={(e) => setUserForm({ ...userForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Optional Link to Teacher */}
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Link to Teacher Record (Optional)
                </label>
                <select
                  value={userForm.teacherId}
                  onChange={(e) => setUserForm({ ...userForm, teacherId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white text-slate-700"
                >
                  <option value="">-- No linked teacher --</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} ({t.teacherIdNumber})</option>
                  ))}
                </select>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddUserOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Create User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: EDIT USER */}
      {/* ========================================================= */}
      {isEditUserOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                  <Edit3 size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Edit User: @{targetUser.username}</h3>
                  <p className="text-[11px] text-slate-500">Update profile details, contact information, or change role</p>
                </div>
              </div>
              <button onClick={() => setIsEditUserOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={editForm.name}
                  onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-semibold focus:border-indigo-600"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Assigned System Role *
                </label>
                <select
                  value={editForm.roleId}
                  onChange={(e) => setEditForm({ ...editForm, roleId: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-bold bg-white text-slate-800"
                >
                  {roles.map(r => (
                    <option key={r.id} value={r.id}>{r.name} - {r.description || 'System Role'}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                    Phone Number
                  </label>
                  <input
                    type="text"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                  />
                </div>
              </div>

              {/* Status toggle */}
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200">
                <div>
                  <p className="text-xs font-bold text-slate-800">Account Login Status</p>
                  <p className="text-[10px] text-slate-500">Allow this user to authenticate and access the system</p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={editForm.isActive}
                    onChange={(e) => setEditForm({ ...editForm, isActive: e.target.checked })}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                </label>
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsEditUserOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: SET / RESET PASSWORD */}
      {/* ========================================================= */}
      {isResetPasswordOpen && targetUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold shadow-xs">
                  <Key size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Set New Password</h3>
                  <p className="text-[11px] text-slate-500">For user @{targetUser.username} ({targetUser.name})</p>
                </div>
              </div>
              <button onClick={() => setIsResetPasswordOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="p-6 space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider">
                    New Password *
                  </label>
                  <button
                    type="button"
                    onClick={generateRandomPassword}
                    className="text-[10px] font-semibold text-purple-600 hover:underline flex items-center gap-1"
                  >
                    <Sparkles size={11} />
                    <span>Generate Strong Password</span>
                  </button>
                </div>

                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={resetPasswordVal}
                    onChange={(e) => setResetPasswordVal(e.target.value)}
                    placeholder="Enter new password (min. 4 chars)"
                    className="w-full pl-9 pr-20 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:border-purple-600 focus:ring-2 focus:ring-purple-600/20"
                  />
                  <Lock size={15} className="absolute left-3 top-3 text-slate-400" />
                  
                  <div className="absolute right-2 top-2 flex items-center space-x-1">
                    {resetPasswordVal && (
                      <button
                        type="button"
                        onClick={() => {
                          navigator.clipboard.writeText(resetPasswordVal);
                          setCopiedPassword(true);
                          setTimeout(() => setCopiedPassword(false), 2000);
                        }}
                        className="p-1 text-slate-400 hover:text-slate-600"
                        title="Copy to clipboard"
                      >
                        {copiedPassword ? <Check size={14} className="text-emerald-600" /> : <Copy size={14} />}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="p-1 text-slate-400 hover:text-slate-600"
                    >
                      {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                </div>
              </div>

              {copiedPassword && (
                <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
                  <Check size={12} />
                  <span>Password copied to clipboard! Share it safely with the user.</span>
                </p>
              )}

              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                <strong>Note:</strong> The user will immediately be able to log in with this new password. Existing active sessions will remain valid.
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold shadow-md shadow-purple-600/25 flex items-center gap-1.5"
                >
                  <Key size={14} />
                  <span>Save New Password</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: ADD ROLE ("roll add") */}
      {/* ========================================================= */}
      {isAddRoleOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/60">
              <div className="flex items-center space-x-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center font-bold shadow-xs">
                  <Shield size={18} />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Create New System Role</h3>
                  <p className="text-[11px] text-slate-500">Define custom roles such as Branch Manager, Coordinator, etc.</p>
                </div>
              </div>
              <button onClick={() => setIsAddRoleOpen(false)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700">
                <X size={16} />
              </button>
            </div>

            <form onSubmit={handleCreateRole} className="p-6 space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Role Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. BRANCH_MANAGER or EXAM_COORDINATOR"
                  value={roleForm.name}
                  onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono font-bold uppercase focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
                <p className="text-[10px] text-slate-400 mt-1">Will be formatted automatically as uppercase with underscores.</p>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-1">
                  Role Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Briefly describe what responsibilities this role handles..."
                  value={roleForm.description}
                  onChange={(e) => setRoleForm({ ...roleForm, description: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:border-indigo-600 focus:ring-2 focus:ring-indigo-600/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddRoleOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/30 flex items-center gap-1.5"
                >
                  <Shield size={14} />
                  <span>Create Role</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
