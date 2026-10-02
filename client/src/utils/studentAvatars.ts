// Student Avatar Presets & Utilities

export const MALE_STUDENT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bgM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(%23bgM)"/><circle cx="60" cy="46" r="21" fill="%23ffd1a9"/><path d="M38 42 C38 24, 48 17, 60 17 C72 17, 82 24, 82 42 C76 34, 66 31, 60 31 C54 31, 44 34, 38 42 Z" fill="%232d1c0c"/><circle cx="53" cy="46" r="2.5" fill="%231e293b"/><circle cx="67" cy="46" r="2.5" fill="%231e293b"/><path d="M54 54 Q60 59 66 54" stroke="%239a3412" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 110 C30 84, 45 74, 60 74 C75 74, 90 84, 90 110 Z" fill="%23ffffff"/><polygon points="52,74 60,86 68,74 64,74 60,80 56,74" fill="%23cbd5e1"/><polygon points="57,84 63,84 64,106 60,112 56,106" fill="%23ef4444"/></svg>`;

export const FEMALE_STUDENT_AVATAR = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bgF" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%23be185d"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(%23bgF)"/><path d="M32 46 C32 75, 42 85, 44 95 C48 95, 72 95, 76 95 C78 85, 88 75, 88 46 C88 22, 76 18, 60 18 C44 18, 32 22, 32 46 Z" fill="%23451a03"/><circle cx="60" cy="48" r="20" fill="%23ffd1a9"/><path d="M40 40 C46 32, 54 30, 60 30 C66 30, 74 32, 80 40 C75 36, 68 34, 60 34 C52 34, 45 36, 40 40 Z" fill="%23451a03"/><circle cx="53" cy="48" r="2.5" fill="%231e293b"/><circle cx="67" cy="48" r="2.5" fill="%231e293b"/><path d="M54 56 Q60 61 66 56" stroke="%239a3412" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="48" cy="52" r="3" fill="%23fca5a5" opacity="0.6"/><circle cx="72" cy="52" r="3" fill="%23fca5a5" opacity="0.6"/><path d="M30 110 C30 84, 45 74, 60 74 C75 74, 90 84, 90 110 Z" fill="%23ffffff"/><polygon points="50,74 60,86 70,74 65,74 60,80 55,74" fill="%23cbd5e1"/><circle cx="60" cy="84" r="3.5" fill="%233b82f6"/><polygon points="56,84 48,80 50,88" fill="%233b82f6"/><polygon points="64,84 72,80 70,88" fill="%233b82f6"/></svg>`;

export const MALE_STUDENT_PHOTO = "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=250&auto=format&fit=crop&q=80";
export const FEMALE_STUDENT_PHOTO = "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=250&auto=format&fit=crop&q=80";

export interface AvatarPreset {
  id: string;
  label: string;
  gender: 'Male' | 'Female';
  type: 'ICON' | 'PHOTO';
  url: string;
}

export const STUDENT_AVATAR_PRESETS: AvatarPreset[] = [
  {
    id: 'male-icon',
    label: 'Male Student (Icon)',
    gender: 'Male',
    type: 'ICON',
    url: MALE_STUDENT_AVATAR
  },
  {
    id: 'female-icon',
    label: 'Female Student (Icon)',
    gender: 'Female',
    type: 'ICON',
    url: FEMALE_STUDENT_AVATAR
  },
  {
    id: 'male-photo',
    label: 'Male Student (Photo)',
    gender: 'Male',
    type: 'PHOTO',
    url: MALE_STUDENT_PHOTO
  },
  {
    id: 'female-photo',
    label: 'Female Student (Photo)',
    gender: 'Female',
    type: 'PHOTO',
    url: FEMALE_STUDENT_PHOTO
  }
];

/**
 * Returns the best available avatar for a student.
 * If a custom photo exists, uses it; otherwise falls back to the Male or Female icon based on gender.
 */
export const getStudentAvatar = (student?: { photo?: string | null; gender?: string | null } | null): string => {
  if (student?.photo && student.photo.trim() !== '') {
    return student.photo;
  }
  if (student?.gender === 'Female') {
    return FEMALE_STUDENT_AVATAR;
  }
  return MALE_STUDENT_AVATAR;
};
