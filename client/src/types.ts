// TypeScript Definitions for CAMS Client

export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'ACCOUNTANT' | 'TEACHER' | 'RECEPTIONIST' | 'PARENT' | 'STUDENT';

export interface User {
  id: string;
  username: string;
  name: string;
  email?: string;
  phone?: string;
  avatar?: string;
  role: UserRole;
  teacherId?: string | null;
  studentId?: string | null;
  parentId?: string | null;
  teacher?: any;
  student?: any;
  parent?: any;
}

export interface Student {
  id: string;
  studentIdNumber: string;
  qrCodeToken: string;
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
  rfidTag?: string;
  parentId?: string | null;
  parentName?: string;
  parentPhone?: string;
  registrationFee?: number;
  registrationFeeStatus?: 'PAID' | 'PENDING' | 'WAIVED';
  registrationReceiptNo?: string;
  parent?: any;
  enrollments?: any[];
  _count?: {
    attendances: number;
    payments: number;
    feeRecords: number;
  };
}

export interface Teacher {
  id: string;
  teacherIdNumber: string;
  name: string;
  photo?: string;
  phone: string;
  email?: string;
  qualifications?: string;
  paymentRate: number;
  paymentMethod: string;
  status: 'ACTIVE' | 'INACTIVE';
  classes?: Class[];
  classCount?: number;
  totalStudents?: number;
}

export interface Subject {
  id: string;
  code: string;
  name: string;
  category?: string;
  description?: string;
}

export interface Class {
  id: string;
  classCode: string;
  name: string;
  subjectId: string;
  teacherId: string;
  grade: string;
  classGroup?: string;
  dayOfWeek: string;
  startTime: string;
  endTime: string;
  room?: string;
  monthlyFee: number;
  maxStudents: number;
  status: 'ACTIVE' | 'INACTIVE' | 'ARCHIVED';
  teacher?: Teacher;
  subject?: Subject;
  enrolledCount?: number;
  isToday?: boolean;
  presentCount?: number;
  absentCount?: number;
  attendanceRate?: number;
}

export interface FeeRecord {
  id: string;
  studentId: string;
  classId: string;
  month: string;
  baseFee: number;
  discount: number;
  previousBalance: number;
  totalDue: number;
  paidAmount: number;
  remainingBalance: number;
  status: 'PENDING' | 'PARTIAL' | 'PAID' | 'OVERDUE';
  dueDate?: string;
  class?: Class;
  student?: Student;
}

export interface Payment {
  id: string;
  receiptNumber: string;
  studentId: string;
  totalAmount: number;
  paymentMethod: string;
  paymentDate: string;
  cashier: string;
  reference?: string;
  notes?: string;
  student?: Student;
  items?: any[];
}

export interface Attendance {
  id: string;
  sessionId: string;
  studentId: string;
  classId: string;
  date: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED';
  scannedAt: string;
  method: string;
  remark?: string;
  recordedBy?: string;
  class?: Class;
  student?: Student;
}

export interface Exam {
  id: string;
  title: string;
  examType: string;
  subjectId: string;
  classId?: string;
  date: string;
  totalMarks: number;
  passMarks: number;
  subject?: Subject;
  class?: Class;
  totalStudents?: number;
  averageMarks?: number;
}

export interface ExamResult {
  id: string;
  examId: string;
  studentId: string;
  marks: number;
  grade: 'A' | 'B' | 'C' | 'S' | 'F';
  rank?: number;
  comment?: string;
  student?: Student;
  exam?: Exam;
}

export interface LearningMaterial {
  id: string;
  title: string;
  description?: string;
  fileType: string;
  fileUrl: string;
  fileSize?: string;
  subjectId: string;
  classId?: string;
  teacherId?: string;
  grade?: string;
  lessonTopic?: string;
  uploadDate: string;
  subject?: Subject;
  class?: Class;
  teacher?: Teacher;
}
