import React, { useState, useEffect } from 'react';
import { 
  X, 
  Edit3, 
  Save, 
  AlertCircle, 
  CheckCircle2, 
  Phone, 
  User, 
  Radio, 
  Shield, 
  Smartphone,
  Check,
  Camera,
  Image as ImageIcon
} from 'lucide-react';
import { useRFIDReader } from '../utils/useRFIDReader';
import { apiRequest } from '../api';
import { Student } from '../types';
import { 
  MALE_STUDENT_AVATAR, 
  FEMALE_STUDENT_AVATAR, 
  MALE_STUDENT_PHOTO, 
  FEMALE_STUDENT_PHOTO,
  getStudentAvatar 
} from '../utils/studentAvatars';

interface EditStudentModalProps {
  student: Student | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (updatedStudent: any) => void;
  onShowPortalLinkModal?: (info: {
    studentName: string;
    studentIdNumber: string;
    recipient: string;
    parentPortalUrl: string;
    smsMessage: string;
  }) => void;
}

export const EditStudentModal: React.FC<EditStudentModalProps> = ({
  student,
  isOpen,
  onClose,
  onSuccess,
  onShowPortalLinkModal
}) => {
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
    status: 'ACTIVE' as 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ALUMNI',
    notes: '',
    rfidTag: '',
    photo: '',
    resendParentPortalLink: false
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  // Sync form when student prop changes
  useEffect(() => {
    if (student) {
      setFormData({
        fullName: student.fullName || '',
        grade: student.grade || 'Grade 12',
        school: student.school || '',
        gender: student.gender || 'Male',
        dateOfBirth: student.dateOfBirth || '',
        phone: student.phone || '',
        whatsapp: student.whatsapp || '',
        email: student.email || '',
        address: student.address || '',
        city: student.city || 'Colombo',
        parentName: student.parentName || student.parent?.name || '',
        parentPhone: student.parentPhone || student.parent?.phone || '',
        emergencyContact: student.emergencyContact || '',
        status: (student.status || 'ACTIVE') as any,
        notes: student.notes || '',
        rfidTag: student.rfidTag || '',
        photo: student.photo || '',
        resendParentPortalLink: false
      });
      setError(null);
      setSuccessNotice(null);
    }
  }, [student, isOpen]);

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      setError('Image file is too large (maximum size 4MB)');
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

  // Live RFID reader support: if staff taps an RFID card while this modal is open
  useRFIDReader({
    enabled: isOpen,
    onScan: (scannedTag) => {
      setFormData(prev => ({ ...prev, rfidTag: scannedTag }));
    }
  });

  if (!isOpen || !student) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName.trim()) {
      setError('Student full name is required');
      return;
    }
    if (!formData.grade.trim()) {
      setError('Student grade is required');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessNotice(null);

    try {
      const updated = await apiRequest<any>(`/students/${student.id}`, {
        method: 'PUT',
        body: JSON.stringify(formData)
      });

      setSuccessNotice('Student profile updated successfully!');
      onSuccess(updated);

      // If user chose to resend parent portal SMS link and result is present
      if (updated.portalLinkResult && onShowPortalLinkModal) {
        onShowPortalLinkModal({
          studentName: updated.fullName,
          studentIdNumber: updated.studentIdNumber,
          recipient: updated.portalLinkResult.recipient,
          parentPortalUrl: updated.portalLinkResult.parentPortalUrl,
          smsMessage: updated.portalLinkResult.smsResult?.message || `Parent Portal link updated and sent to ${updated.portalLinkResult.recipient}`
        });
      }

      setTimeout(() => {
        onClose();
      }, 700);
    } catch (err: any) {
      setError(err.message || 'Failed to update student profile');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center space-x-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
              <Edit3 size={18} />
            </div>
            <div>
              <h3 className="font-bold text-sm text-slate-900">Edit Student Profile</h3>
              <p className="text-[11px] text-slate-500 font-mono">
                {student.studentIdNumber} &bull; {student.fullName}
              </p>
            </div>
          </div>
          <button 
            type="button"
            onClick={onClose} 
            className="p-1.5 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200/50 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-4">
          {error && (
            <div className="p-3.5 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle size={16} className="shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successNotice && (
            <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
              <CheckCircle2 size={16} className="shrink-0" />
              <span>{successNotice}</span>
            </div>
          )}

          {/* Profile Photo / Avatar Selector */}
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
                  Active
                </span>
              </div>

              {/* 2 Type Image Icon Selectors & Upload */}
              <div className="flex-1 space-y-2.5 w-full">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-bold text-slate-500">Preset Avatar Icons:</span>
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

          {/* Section 1: Basic Student Info */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
              <User size={13} />
              <span>Student Information</span>
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  value={formData.fullName}
                  onChange={e => setFormData({ ...formData, fullName: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Grade / Level *</label>
                <select
                  value={formData.grade}
                  onChange={e => setFormData({ ...formData, grade: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white focus:ring-2 focus:ring-brand-500"
                >
                  <option value="Grade 6">Grade 6</option>
                  <option value="Grade 7">Grade 7</option>
                  <option value="Grade 8">Grade 8</option>
                  <option value="Grade 9">Grade 9</option>
                  <option value="Grade 10">Grade 10</option>
                  <option value="Grade 11">Grade 11 (O/L)</option>
                  <option value="Grade 12">Grade 12 (A/L)</option>
                  <option value="Grade 13">Grade 13 (A/L)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">School Attending</label>
                <input
                  type="text"
                  value={formData.school}
                  onChange={e => setFormData({ ...formData, school: e.target.value })}
                  placeholder="e.g. Royal College, Colombo"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Account Status</label>
                <select
                  value={formData.status}
                  onChange={e => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white font-semibold"
                >
                  <option value="ACTIVE">ACTIVE (Normal)</option>
                  <option value="INACTIVE">INACTIVE</option>
                  <option value="SUSPENDED">SUSPENDED</option>
                  <option value="ALUMNI">ALUMNI (Completed)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Gender</label>
                <select
                  value={formData.gender}
                  onChange={e => setFormData({ ...formData, gender: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs bg-white"
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Date of Birth</label>
                <input
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={e => setFormData({ ...formData, dateOfBirth: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Guardian Details & Parent Mobile (Crucial for SMS & Parent Portal) */}
          <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-[11px] font-bold text-amber-900 uppercase tracking-wider flex items-center gap-1.5">
                <Phone size={13} className="text-amber-700" />
                <span>Parent & Guardian Contact (Portal & SMS)</span>
              </h4>
              <span className="px-2 py-0.5 rounded-full bg-amber-200/80 text-amber-900 text-[10px] font-bold">
                SMS Recipient
              </span>
            </div>

            <p className="text-[11px] text-amber-800 leading-relaxed">
              This mobile number receives automated attendance check-in SMS, fee receipts, and serves as the <strong>Parent Portal PWA Login</strong> phone.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1">
                  Guardian / Parent Name
                </label>
                <input
                  type="text"
                  value={formData.parentName}
                  onChange={e => setFormData({ ...formData, parentName: e.target.value })}
                  placeholder="e.g. Mr. Sunil Perera"
                  className="w-full px-3 py-2 rounded-xl border border-amber-300 bg-white text-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-800 mb-1 flex items-center justify-between">
                  <span>Parent Mobile Number *</span>
                  <span className="text-[10px] text-amber-700 font-mono">07X / +947X</span>
                </label>
                <input
                  type="tel"
                  required
                  value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="0771234567"
                  className="w-full px-3 py-2 rounded-xl border border-amber-400 bg-white text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-amber-500 shadow-sm"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Emergency Contact Number</label>
                <input
                  type="tel"
                  value={formData.emergencyContact}
                  onChange={e => setFormData({ ...formData, emergencyContact: e.target.value })}
                  placeholder="e.g. 0112345678"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 bg-white text-xs font-mono"
                />
              </div>
            </div>

            {/* Checkbox to trigger Parent Portal Link dispatch */}
            <div className="pt-2 border-t border-amber-200/60 flex items-center gap-2">
              <input
                type="checkbox"
                id="resendParentPortalLink"
                checked={formData.resendParentPortalLink}
                onChange={e => setFormData({ ...formData, resendParentPortalLink: e.target.checked })}
                className="w-4 h-4 rounded border-amber-300 text-brand-600 focus:ring-brand-500 cursor-pointer"
              />
              <label htmlFor="resendParentPortalLink" className="text-xs font-semibold text-slate-800 cursor-pointer select-none">
                Send Parent Portal 1-tap direct SMS login link to this updated number upon saving
              </label>
            </div>
          </div>

          {/* Section 3: Student Direct Contact */}
          <div>
            <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
              Student Direct Contact & Address
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Student Mobile Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={e => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="0771234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Student WhatsApp</label>
                <input
                  type="tel"
                  value={formData.whatsapp}
                  onChange={e => setFormData({ ...formData, whatsapp: e.target.value })}
                  placeholder="0771234567"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Email Address</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  placeholder="student@example.com"
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">City</label>
                <input
                  type="text"
                  value={formData.city}
                  onChange={e => setFormData({ ...formData, city: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Residential Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={e => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
                />
              </div>
            </div>
          </div>

          {/* Section 4: 125kHz HID RFID Card */}
          <div className="p-3.5 rounded-2xl bg-indigo-50/70 border border-indigo-200/80 space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-bold text-indigo-950 flex items-center gap-1.5">
                <Radio size={14} className="text-indigo-600 animate-pulse" />
                <span>125kHz HID RFID Card UID</span>
              </label>
              <span className="text-[10px] text-indigo-700 font-semibold">
                Tap card on USB reader anytime
              </span>
            </div>

            <div className="relative">
              <input
                type="text"
                value={formData.rfidTag}
                onChange={e => setFormData({ ...formData, rfidTag: e.target.value })}
                placeholder="Tap card on USB Reader or enter 10-digit number..."
                className="w-full pl-3 pr-24 py-2 rounded-xl border border-indigo-300 bg-white text-xs font-mono font-bold text-indigo-900 focus:ring-2 focus:ring-indigo-500"
              />
              {formData.rfidTag && (
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, rfidTag: '' })}
                  className="absolute right-2 top-1/2 -translate-y-1/2 px-2 py-0.5 rounded text-[10px] text-slate-400 hover:text-rose-600 font-semibold"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Section 5: Internal Administrative Notes */}
          <div>
            <label className="block text-[11px] font-bold text-slate-700 mb-1">Administrative Notes</label>
            <textarea
              rows={2}
              value={formData.notes}
              onChange={e => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Internal notes regarding student or parent..."
              className="w-full px-3 py-2 rounded-xl border border-slate-300 text-xs"
            />
          </div>

          {/* Footer Actions */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="px-4 py-2 rounded-xl border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 disabled:opacity-50 text-white text-xs font-bold shadow-md shadow-brand-600/30 transition-all flex items-center gap-1.5"
            >
              <Save size={14} />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
