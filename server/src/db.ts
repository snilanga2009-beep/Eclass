import fs from 'fs';
import path from 'path';

// Core Interfaces
export interface Role {
  id: string;
  name: string; // SUPER_ADMIN, ADMIN, ACCOUNTANT, TEACHER, RECEPTIONIST, PARENT, STUDENT
  description?: string;
  createdAt: string;
}

export interface Permission {
  id: string;
  roleId: string;
  module: string;
  canRead: boolean;
  canWrite: boolean;
  canDelete: boolean;
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email?: string;
  passwordHash: string;
  name: string;
  roleId: string;
  phone?: string;
  avatar?: string;
  isActive: boolean;
  lastLogin?: string;
  teacherId?: string | null;
  parentId?: string | null;
  studentId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Parent {
  id: string;
  name: string;
  phone: string;
  whatsapp?: string;
  email?: string;
  occupation?: string;
  address?: string;
  relationship?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Student {
  id: string;
  studentIdNumber: string; // e.g. STU-2026-0001
  qrCodeToken: string; // Secure random token
  fullName: string;
  dateOfBirth?: string;
  gender?: string;
  school?: string;
  grade: string;
  address?: string;
  city?: string;
  photo?: string;
  phone?: string;
  whatsapp?: string;
  email?: string;
  emergencyContact?: string;
  registrationDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'ALUMNI';
  notes?: string;
  rfidTag?: string; // 125kHz HID RFID Card / Keyfob UID (e.g. 10-digit decimal or 8-digit hex)
  parentId?: string | null;
  parentName?: string;
  parentPhone?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Teacher {
  id: string;
  teacherIdNumber: string; // e.g. TCH-001
  name: string;
  photo?: string;
  phone: string;
  email?: string;
  address?: string;
  qualifications?: string;
  paymentRate: number; // e.g. 70 (%) or flat fee
  paymentMethod: 'Percentage' | 'FlatRate' | 'PerStudent' | 'Hourly' | 'Other' | string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
  updatedAt: string;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
  createdAt: string;
}

export interface Class {
  id: string;
  classCode: string; // e.g. CLS-MAT-10A
  name: string;
  subjectId: string;
  teacherId: string;
  grade: string;
  classGroup?: string;
  dayOfWeek: string;
  startTime: string; // "08:30"
  endTime: string; // "11:30"
  room?: string;
  monthlyFee: number; // in LKR, e.g. 2500
  maxStudents: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  createdAt: string;
  updatedAt: string;
}

export interface ClassStudent {
  id: string;
  classId: string;
  studentId: string;
  enrolledAt: string;
  status: 'ACTIVE' | 'DROPPED';
}

export interface AttendanceSession {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  title?: string;
  startedAt: string;
  endedAt?: string;
  takenBy?: string;
  createdAt: string;
}

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  classId: string;
  date: string; // YYYY-MM-DD
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  scannedAt: string;
  method: 'QR_CODE' | 'BARCODE' | 'RFID' | 'MANUAL' | 'ID_CARD';
  remark?: string;
  recordedBy?: string;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  classId: string;
  month: string; // e.g. "2026-09"
  baseFee: number;
  discount: number;
  previousBalance: number;
  totalDue: number; // (baseFee + previousBalance) - discount
  paidAmount: number;
  remainingBalance: number; // totalDue - paidAmount
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Payment {
  id: string;
  receiptNumber: string; // REC-2026-0001
  studentId: string;
  totalAmount: number;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card' | 'Online Payment' | 'Other';
  paymentDate: string;
  cashier: string;
  reference?: string;
  notes?: string;
  createdAt: string;
}

export interface PaymentItem {
  id: string;
  paymentId: string;
  feeRecordId: string;
  amountPaid: number;
  balanceLeft: number;
  description?: string;
}

export interface Income {
  id: string;
  category: 'Student Fees' | 'Registration Fees' | 'Exam Fees' | 'Material Fees' | 'Other Income';
  amount: number;
  source?: string;
  paymentId?: string;
  receiptNo?: string;
  date: string;
  description?: string;
  receivedBy?: string;
  createdAt: string;
}

export interface Expense {
  id: string;
  category: 'Teacher Payments' | 'Rent' | 'Electricity' | 'Internet' | 'Equipment' | 'Printing' | 'Advertising' | 'Other Expenses';
  title: string;
  amount: number;
  date: string;
  paidTo?: string;
  paymentMethod: 'Cash' | 'Bank Transfer' | 'Card';
  receiptNo?: string;
  description?: string;
  recordedBy?: string;
  createdAt: string;
}

export interface TeacherPayment {
  id: string;
  teacherId: string;
  month: string;
  classId?: string;
  totalRevenue: number;
  rate: number;
  payoutAmount: number;
  status: 'PENDING' | 'PAID';
  paidDate: string;
  paymentMethod: string;
  referenceNo?: string;
  notes?: string;
  createdAt: string;
}

export interface Exam {
  id: string;
  title: string;
  examType: 'Class Test' | 'Monthly Test' | 'Term Exam' | 'Assignment' | 'Quiz';
  subjectId: string;
  classId?: string;
  date: string;
  totalMarks: number;
  passMarks: number;
  createdAt: string;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marks: number;
  grade: 'A' | 'B' | 'C' | 'S' | 'F';
  rank?: number;
  comment?: string;
  createdAt: string;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  fileType: 'PDF' | 'Document' | 'Image' | 'Video' | 'Link' | 'Past Paper';
  fileUrl: string;
  fileSize?: string;
  subjectId: string;
  classId?: string;
  teacherId?: string;
  grade?: string;
  lessonTopic?: string;
  uploadDate: string;
}

export interface SMSLog {
  id: string;
  studentId?: string;
  recipient: string;
  message: string;
  type: string;
  status: 'SENT' | 'FAILED' | 'DELIVERED';
  sentAt: string;
}

export interface WhatsAppLog {
  id: string;
  studentId?: string;
  recipient: string;
  templateName: string;
  message: string;
  status: 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
  sentAt: string;
}

export interface Notification {
  id: string;
  userId?: string | null;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  linkUrl?: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  targetRole: 'ALL' | 'STUDENTS' | 'TEACHERS' | 'PARENTS';
  grade?: string;
  classId?: string;
  postedBy: string;
  priority: 'NORMAL' | 'URGENT';
  createdAt: string;
}

export interface Document {
  id: string;
  studentId: string;
  name: string;
  fileUrl: string;
  docType?: string;
  createdAt: string;
}

export interface AuditLog {
  id: string;
  userId?: string | null;
  userName?: string;
  userRole?: string;
  action: string;
  details?: string | null;
  ipAddress?: string;
  userAgent?: string;
  createdAt: string;
}

export interface SystemSetting {
  id: string;
  key: string;
  value: string;
  category: 'GENERAL' | 'BRANDING' | 'SMS' | 'WHATSAPP' | 'FINANCIAL' | 'PWA';
  updatedAt: string;
}

export interface DatabaseData {
  roles: Role[];
  permissions: Permission[];
  users: User[];
  parents: Parent[];
  students: Student[];
  teachers: Teacher[];
  subjects: Subject[];
  classes: Class[];
  classStudents: ClassStudent[];
  attendanceSessions: AttendanceSession[];
  attendances: Attendance[];
  feeRecords: FeeRecord[];
  payments: Payment[];
  paymentItems: PaymentItem[];
  income: Income[];
  expenses: Expense[];
  teacherPayments: TeacherPayment[];
  exams: Exam[];
  examResults: ExamResult[];
  learningMaterials: LearningMaterial[];
  smsLogs: SMSLog[];
  whatsappLogs: WhatsAppLog[];
  notifications: Notification[];
  announcements: Announcement[];
  documents: Document[];
  auditLogs: AuditLog[];
  settings: SystemSetting[];
}

const IS_VERCEL = !!process.env.VERCEL;
const BUNDLED_DATA_DIR = path.join(__dirname, '..', 'data');
const BUNDLED_DATA_FILE = path.join(BUNDLED_DATA_DIR, 'db.json');

const DATA_DIR = IS_VERCEL ? '/tmp/cams_data' : BUNDLED_DATA_DIR;
const DATA_FILE = path.join(DATA_DIR, 'db.json');

// In-Memory Database Store with Atomic Persistence
class DatabaseStore {
  public data: DatabaseData;

  constructor() {
    this.data = this.load();
  }

  private getDefaultData(): DatabaseData {
    return {
      roles: [],
      permissions: [],
      users: [],
      parents: [],
      students: [],
      teachers: [],
      subjects: [],
      classes: [],
      classStudents: [],
      attendanceSessions: [],
      attendances: [],
      feeRecords: [],
      payments: [],
      paymentItems: [],
      income: [],
      expenses: [],
      teacherPayments: [],
      exams: [],
      examResults: [],
      learningMaterials: [],
      smsLogs: [],
      whatsappLogs: [],
      notifications: [],
      announcements: [],
      documents: [],
      auditLogs: [],
      settings: []
    };
  }

  private load(): DatabaseData {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      if (IS_VERCEL && !fs.existsSync(DATA_FILE) && fs.existsSync(BUNDLED_DATA_FILE)) {
        try {
          fs.copyFileSync(BUNDLED_DATA_FILE, DATA_FILE);
        } catch (e) {}
      }
      if (fs.existsSync(DATA_FILE)) {
        const raw = fs.readFileSync(DATA_FILE, 'utf-8');
        const parsed: DatabaseData = JSON.parse(raw);
        // Ensure all students have a valid 125kHz RFID Tag assigned if missing
        if (Array.isArray(parsed.students)) {
          let updated = false;
          parsed.students.forEach((s, idx) => {
            if (!s.rfidTag) {
              s.rfidTag = `000${String(4928100 + (idx + 1)).padStart(7, '0')}`;
              updated = true;
            }
          });
          if (updated) {
            fs.writeFileSync(DATA_FILE, JSON.stringify(parsed, null, 2), 'utf-8');
          }
        }
        return parsed;
      }
    } catch (err) {
      console.error('Error loading db.json, initializing empty default', err);
    }
    return this.getDefaultData();
  }

  public save(): void {
    try {
      if (!fs.existsSync(DATA_DIR)) {
        fs.mkdirSync(DATA_DIR, { recursive: true });
      }
      fs.writeFileSync(DATA_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Failed to persist database to disk:', err);
    }
  }

  public reload(): void {
    this.data = this.load();
  }

  // Helper generators
  public generateId(): string {
    return Math.random().toString(36).substring(2, 9) + '-' + Date.now().toString(36);
  }
}

export const db = new DatabaseStore();
export default db;
