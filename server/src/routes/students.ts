import { Router, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import db, { Student, Parent, ClassStudent, FeeRecord, Payment, PaymentItem, Income } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import { dispatchRealSMS } from '../services/smsService';

const getSetting = (k: string, def: string) => {
  const s = db.data.settings.find(st => st.key === k);
  return s && s.value ? s.value : def;
};

const formatWelcomeSms = (studentName: string, studentId: string, portalUrl: string) => {
  const instName = getSetting('INSTITUTE_NAME', 'Cambridge Academy');
  const tpl = getSetting(
    'SMS_TEMPLATE_WELCOME',
    "Welcome to {institute_name}! Track {student_name}'s live attendance, RFID check-in times & fee receipts on the Parent Portal PWA: {portal_url} (Save to your phone home screen for 1-tap instant access)"
  );
  return tpl
    .replace(/{institute_name}/g, instName)
    .replace(/{student_name}/g, studentName)
    .replace(/{student_id}/g, studentId)
    .replace(/{portal_url}/g, portalUrl);
};

const router = Router();

// GET /api/students - List all students with search, filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { search, grade, status, classId } = req.query;

    let students = [...db.data.students];

    if (status && status !== 'ALL') {
      students = students.filter(s => s.status === status);
    }

    if (grade && grade !== 'ALL') {
      students = students.filter(s => s.grade === grade);
    }

    if (classId && classId !== 'ALL') {
      const enrolledStudentIds = new Set(
        db.data.classStudents
          .filter(cs => cs.classId === classId && cs.status === 'ACTIVE')
          .map(cs => cs.studentId)
      );
      students = students.filter(s => enrolledStudentIds.has(s.id));
    }

    if (search) {
      const q = String(search).trim().toLowerCase();
      students = students.filter(s =>
        s.fullName.toLowerCase().includes(q) ||
        s.studentIdNumber.toLowerCase().includes(q) ||
        (s.rfidTag && s.rfidTag.toLowerCase().includes(q)) ||
        (s.phone && s.phone.includes(q)) ||
        (s.parentPhone && s.parentPhone.includes(q)) ||
        (s.school && s.school.toLowerCase().includes(q)) ||
        s.qrCodeToken.toLowerCase().includes(q)
      );
    }

    // Populate enrollments and counts
    const populated = students.map(s => {
      const parent = s.parentId ? db.data.parents.find(p => p.id === s.parentId) : null;
      const enrollments = db.data.classStudents
        .filter(cs => cs.studentId === s.id && cs.status === 'ACTIVE')
        .map(cs => {
          const cls = db.data.classes.find(c => c.id === cs.classId);
          const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
          const subject = cls ? db.data.subjects.find(sub => sub.id === cls.subjectId) : null;
          return {
            ...cs,
            class: cls ? { ...cls, teacher, subject } : null
          };
        });

      const attendancesCount = db.data.attendances.filter(a => a.studentId === s.id).length;
      const paymentsCount = db.data.payments.filter(p => p.studentId === s.id).length;
      const pendingFeesCount = db.data.feeRecords.filter(f => f.studentId === s.id && f.status !== 'PAID').length;

      return {
        ...s,
        parent,
        enrollments,
        _count: {
          attendances: attendancesCount,
          payments: paymentsCount,
          feeRecords: pendingFeesCount
        }
      };
    });

    return res.json(populated);
  } catch (error) {
    console.error('Error fetching students:', error);
    return res.status(500).json({ error: 'Failed to fetch students' });
  }
});

// GET /api/students/qr-lookup/:token - Fast lookup for QR / RFID Scanner
router.get('/qr-lookup/:token', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { token } = req.params;
    const cleanToken = token.trim().toLowerCase();

    const student = db.data.students.find(s => 
      s.qrCodeToken.toLowerCase() === cleanToken || 
      s.studentIdNumber.toLowerCase() === cleanToken ||
      (s.rfidTag && s.rfidTag.toLowerCase() === cleanToken)
    );

    if (!student) {
      return res.status(404).json({ error: 'Student not found with this QR / Card ID' });
    }

    const enrollments = db.data.classStudents
      .filter(cs => cs.studentId === student.id && cs.status === 'ACTIVE')
      .map(cs => {
        const cls = db.data.classes.find(c => c.id === cs.classId);
        const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
        const subject = cls ? db.data.subjects.find(sub => sub.id === cls.subjectId) : null;
        return {
          ...cs,
          class: cls ? { ...cls, teacher, subject } : null
        };
      });

    const pendingFeeRecords = db.data.feeRecords.filter(f => f.studentId === student.id && f.status !== 'PAID');
    const totalPendingAmount = pendingFeeRecords.reduce((sum, f) => sum + f.remainingBalance, 0);

    return res.json({
      ...student,
      enrollments,
      hasPendingFees: pendingFeeRecords.length > 0,
      totalPendingAmount
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to look up student by QR' });
  }
});

// GET /api/students/rfid-lookup/:tag - Fast lookup for 125kHz RFID card diagnostics
router.get('/rfid-lookup/:tag', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { tag } = req.params;
    const cleanTag = tag.trim().toLowerCase();
    const strippedTag = cleanTag.replace(/^0+/, '');

    const student = db.data.students.find(s => {
      if (!s.rfidTag) return false;
      const sTag = s.rfidTag.trim().toLowerCase();
      const sTagStripped = sTag.replace(/^0+/, '');
      return sTag === cleanTag || (strippedTag.length >= 4 && sTagStripped === strippedTag);
    });

    if (!student) {
      return res.status(404).json({ error: `No student assigned to RFID tag: "${tag}"` });
    }

    return res.json({
      found: true,
      studentId: student.id,
      fullName: student.fullName,
      studentIdNumber: student.studentIdNumber,
      grade: student.grade,
      rfidTag: student.rfidTag,
      photo: student.photo,
      status: student.status
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to look up student by RFID' });
  }
});

// POST /api/students/assign-rfid - Bind 125kHz RFID card UID to student
router.post('/assign-rfid', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, rfidTag } = req.body;
    if (!studentId || !rfidTag) {
      return res.status(400).json({ error: 'studentId and rfidTag are required' });
    }

    const cleanTag = String(rfidTag).trim();
    const student = db.data.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    // Check if another active student already uses this RFID card UID
    const conflict = db.data.students.find(s => 
      s.id !== studentId && 
      s.status === 'ACTIVE' && 
      s.rfidTag && 
      s.rfidTag.trim().toLowerCase() === cleanTag.toLowerCase()
    );

    if (conflict) {
      return res.status(409).json({ 
        error: `RFID card "${cleanTag}" is already assigned to: ${conflict.fullName} (${conflict.studentIdNumber})` 
      });
    }

    student.rfidTag = cleanTag;
    student.updatedAt = new Date().toISOString();
    db.save();

    await logAuditAction(
      req,
      'STUDENT_RFID_ASSIGN',
      `Assigned RFID Card ${cleanTag} to student ${student.fullName} (${student.studentIdNumber})`
    );

    return res.json({ 
      success: true, 
      message: `RFID card ${cleanTag} successfully assigned to ${student.fullName}`,
      student 
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to assign RFID card' });
  }
});

// GET /api/students/:id - Deep Profile with all 10 tabs data
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = db.data.students.find(s => 
      s.id === id || 
      (s.studentIdNumber && s.studentIdNumber.toLowerCase() === id.toLowerCase()) || 
      s.qrCodeToken === id || 
      s.rfidTag === id
    );

    if (!student) {
      return res.status(404).json({ error: 'Student profile not found' });
    }

    const parent = student.parentId ? db.data.parents.find(p => p.id === student.parentId) : null;

    // 1. Classes
    const enrollments = db.data.classStudents
      .filter(cs => cs.studentId === student.id && cs.status === 'ACTIVE')
      .map(cs => {
        const cls = db.data.classes.find(c => c.id === cs.classId);
        const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
        const subject = cls ? db.data.subjects.find(sub => sub.id === cls.subjectId) : null;
        return {
          ...cs,
          class: cls ? { ...cls, teacher, subject } : null
        };
      });

    // 2. Attendance
    const attendances = db.data.attendances
      .filter(a => a.studentId === student.id)
      .map(a => {
        const cls = db.data.classes.find(c => c.id === a.classId);
        return {
          ...a,
          class: cls
        };
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // 3. Payments
    const payments = db.data.payments
      .filter(p => p.studentId === student.id)
      .map(p => {
        const items = db.data.paymentItems
          .filter(pi => pi.paymentId === p.id)
          .map(pi => {
            const feeRecord = db.data.feeRecords.find(f => f.id === pi.feeRecordId);
            const cls = feeRecord ? db.data.classes.find(c => c.id === feeRecord.classId) : null;
            return {
              ...pi,
              feeRecord: feeRecord ? { ...feeRecord, class: cls } : null
            };
          });
        return {
          ...p,
          items
        };
      })
      .sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // 4. Fee Records & Pending Fees
    const feeRecords = db.data.feeRecords
      .filter(f => f.studentId === student.id)
      .map(f => {
        const cls = db.data.classes.find(c => c.id === f.classId);
        return {
          ...f,
          class: cls
        };
      })
      .sort((a, b) => b.month.localeCompare(a.month));

    // 5. Exam Results
    const examResults = db.data.examResults
      .filter(er => er.studentId === student.id)
      .map(er => {
        const exam = db.data.exams.find(e => e.id === er.examId);
        const subject = exam ? db.data.subjects.find(s => s.id === exam.subjectId) : null;
        const cls = exam?.classId ? db.data.classes.find(c => c.id === exam.classId) : null;
        return {
          ...er,
          exam: exam ? { ...exam, subject, class: cls } : null
        };
      });

    // 6. Learning Materials (available for this student's grade/classes)
    const studentClassIds = new Set(enrollments.map(e => e.classId));
    const learningMaterials = db.data.learningMaterials.filter(m => 
      (m.grade && m.grade === student.grade) ||
      (m.classId && studentClassIds.has(m.classId))
    );

    // 7. Messages / SMS & WhatsApp Logs
    const messages = db.data.smsLogs.filter(s => s.studentId === student.id || (student.phone && s.recipient.includes(student.phone)));
    const whatsappLogs = db.data.whatsappLogs.filter(w => w.studentId === student.id || (student.whatsapp && w.recipient.includes(student.whatsapp)));

    // 8. Documents
    const documents = db.data.documents.filter(d => d.studentId === student.id);

    // 9. Activity History
    const activityHistory = db.data.auditLogs
      .filter(a => a.details && a.details.includes(student.studentIdNumber))
      .slice(0, 20);

    // 10. Generate QR Data URL for student ID Card
    const qrDataUrl = await QRCode.toDataURL(student.qrCodeToken, {
      width: 250,
      margin: 1,
      color: {
        dark: '#1e3a8a',
        light: '#ffffff'
      }
    });

    return res.json({
      ...student,
      parent,
      enrollments,
      attendances,
      payments,
      feeRecords,
      examResults,
      learningMaterials,
      messages,
      whatsappLogs,
      documents,
      activityHistory,
      qrDataUrl
    });
  } catch (error) {
    console.error('Error fetching student profile:', error);
    return res.status(500).json({ error: 'Failed to fetch student profile' });
  }
});

// POST /api/students - Register new student
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'ACCOUNTANT']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      fullName,
      dateOfBirth,
      gender,
      school,
      grade,
      address,
      city,
      phone,
      whatsapp,
      email,
      emergencyContact,
      parentName,
      parentPhone,
      notes,
      rfidTag,
      photo,
      enrolledClassIds,
      registrationFee,
      collectRegistrationFeeNow,
      registrationFeePaymentMethod,
      registrationFeeNotes
    } = req.body;

    if (!fullName || !grade) {
      return res.status(400).json({ error: 'Student full name and grade are required' });
    }

    if (rfidTag) {
      const cleanTag = String(rfidTag).trim();
      const conflict = db.data.students.find(s => s.rfidTag && s.rfidTag.toLowerCase() === cleanTag.toLowerCase());
      if (conflict) {
        return res.status(409).json({ error: `RFID card "${cleanTag}" is already assigned to student ${conflict.fullName}` });
      }
    }

    // Auto-generate unique student ID: STU-2026-XXXX
    let maxNum = 0;
    db.data.students.forEach(s => {
      const match = s.studentIdNumber ? s.studentIdNumber.match(/STU-\d{4}-(\d+)/) : null;
      if (match) {
        const n = parseInt(match[1], 10);
        if (n > maxNum) maxNum = n;
      }
    });
    const nextNum = String(Math.max(maxNum + 1, db.data.students.length + 1)).padStart(4, '0');
    const studentIdNumber = `STU-2026-${nextNum}`;

    // Auto-assign unique 10-digit 125kHz RFID card UID if not provided
    let finalRfidTag = rfidTag ? String(rfidTag).trim() : undefined;
    if (!finalRfidTag) {
      finalRfidTag = `000${String(4928100 + Math.max(maxNum + 1, db.data.students.length + 1)).padStart(7, '0')}`;
    }

    // Generate secure random QR token
    const qrCodeToken = `CAMS-STU-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;

    // Handle Parent
    let parentId: string | null = null;
    if (parentPhone) {
      let existingParent = db.data.parents.find(p => p.phone === parentPhone.trim());
      if (!existingParent) {
        existingParent = {
          id: db.generateId(),
          name: parentName || `${fullName}'s Guardian`,
          phone: parentPhone.trim(),
          whatsapp: whatsapp || parentPhone.trim(),
          address: address || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.data.parents.push(existingParent);
      }
      parentId = existingParent.id;
    }

    const defaultMaleAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bgM" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%233b82f6"/><stop offset="100%" stop-color="%231d4ed8"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(%23bgM)"/><circle cx="60" cy="46" r="21" fill="%23ffd1a9"/><path d="M38 42 C38 24, 48 17, 60 17 C72 17, 82 24, 82 42 C76 34, 66 31, 60 31 C54 31, 44 34, 38 42 Z" fill="%232d1c0c"/><circle cx="53" cy="46" r="2.5" fill="%231e293b"/><circle cx="67" cy="46" r="2.5" fill="%231e293b"/><path d="M54 54 Q60 59 66 54" stroke="%239a3412" stroke-width="2" fill="none" stroke-linecap="round"/><path d="M30 110 C30 84, 45 74, 60 74 C75 74, 90 84, 90 110 Z" fill="%23ffffff"/><polygon points="52,74 60,86 68,74 64,74 60,80 56,74" fill="%23cbd5e1"/><polygon points="57,84 63,84 64,106 60,112 56,106" fill="%23ef4444"/></svg>`;
    const defaultFemaleAvatar = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120" width="120" height="120"><defs><linearGradient id="bgF" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="%23ec4899"/><stop offset="100%" stop-color="%23be185d"/></linearGradient></defs><rect width="120" height="120" rx="28" fill="url(%23bgF)"/><path d="M32 46 C32 75, 42 85, 44 95 C48 95, 72 95, 76 95 C78 85, 88 75, 88 46 C88 22, 76 18, 60 18 C44 18, 32 22, 32 46 Z" fill="%23451a03"/><circle cx="60" cy="48" r="20" fill="%23ffd1a9"/><path d="M40 40 C46 32, 54 30, 60 30 C66 30, 74 32, 80 40 C75 36, 68 34, 60 34 C52 34, 45 36, 40 40 Z" fill="%23451a03"/><circle cx="53" cy="48" r="2.5" fill="%231e293b"/><circle cx="67" cy="48" r="2.5" fill="%231e293b"/><path d="M54 56 Q60 61 66 56" stroke="%239a3412" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="48" cy="52" r="3" fill="%23fca5a5" opacity="0.6"/><circle cx="72" cy="52" r="3" fill="%23fca5a5" opacity="0.6"/><path d="M30 110 C30 84, 45 74, 60 74 C75 74, 90 84, 90 110 Z" fill="%23ffffff"/><polygon points="50,74 60,86 70,74 65,74 60,80 55,74" fill="%23cbd5e1"/><circle cx="60" cy="84" r="3.5" fill="%233b82f6"/><polygon points="56,84 48,80 50,88" fill="%233b82f6"/><polygon points="64,84 72,80 70,88" fill="%233b82f6"/></svg>`;

    const newStudent: Student = {
      id: db.generateId(),
      studentIdNumber,
      qrCodeToken,
      fullName: fullName.trim(),
      dateOfBirth: dateOfBirth || undefined,
      gender: gender || 'Other',
      school: school ? school.trim() : undefined,
      grade: grade.trim(),
      address: address ? address.trim() : undefined,
      city: city ? city.trim() : undefined,
      photo: photo ? photo.trim() : (gender === 'Female' ? defaultFemaleAvatar : defaultMaleAvatar),
      phone: phone ? phone.trim() : undefined,
      whatsapp: whatsapp ? whatsapp.trim() : (phone ? phone.trim() : undefined),
      email: email ? email.trim() : undefined,
      emergencyContact: emergencyContact || undefined,
      registrationDate: new Date().toISOString(),
      status: 'ACTIVE',
      notes: notes ? notes.trim() : undefined,
      rfidTag: finalRfidTag,
      parentId,
      parentName: parentName ? parentName.trim() : undefined,
      parentPhone: parentPhone ? parentPhone.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.students.push(newStudent);

    // Handle Student Registration / Admission Fee
    const regFeeAmount = Number(registrationFee) || 0;
    let regReceiptNumber: string | undefined = undefined;
    let regPayment: Payment | undefined = undefined;

    if (regFeeAmount > 0) {
      if (collectRegistrationFeeNow) {
        // Collect Registration Fee Now & Issue Official Receipt
        let maxPayNum = 0;
        db.data.payments.forEach(p => {
          const match = p.receiptNumber ? p.receiptNumber.match(/REC-\d{4}-(\d+)/) : null;
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxPayNum) maxPayNum = n;
          }
        });
        const nextReceiptNum = String(Math.max(maxPayNum + 1, db.data.payments.length + 1)).padStart(4, '0');
        regReceiptNumber = `REC-2026-${nextReceiptNum}`;

        newStudent.registrationFee = regFeeAmount;
        newStudent.registrationFeeStatus = 'PAID';
        newStudent.registrationReceiptNo = regReceiptNumber;

        // Payment record
        regPayment = {
          id: db.generateId(),
          receiptNumber: regReceiptNumber,
          studentId: newStudent.id,
          totalAmount: regFeeAmount,
          paymentMethod: (registrationFeePaymentMethod as any) || 'Cash',
          paymentDate: new Date().toISOString(),
          cashier: req.user?.name || 'Receptionist',
          notes: registrationFeeNotes || 'Student Admission & Registration Fee',
          createdAt: new Date().toISOString()
        };
        db.data.payments.push(regPayment);

        // Admission Fee Record (settled)
        const regFeeRecord: FeeRecord = {
          id: db.generateId(),
          studentId: newStudent.id,
          classId: 'REGISTRATION_FEE',
          month: 'REGISTRATION',
          baseFee: regFeeAmount,
          discount: 0,
          previousBalance: 0,
          totalDue: regFeeAmount,
          paidAmount: regFeeAmount,
          remainingBalance: 0,
          status: 'PAID',
          dueDate: new Date().toISOString().substring(0, 10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.data.feeRecords.push(regFeeRecord);

        // Payment Item
        db.data.paymentItems.push({
          id: db.generateId(),
          paymentId: regPayment.id,
          feeRecordId: regFeeRecord.id,
          amountPaid: regFeeAmount,
          balanceLeft: 0,
          description: 'Student Admission & Registration Fee'
        });

        // Income Ledger entry
        db.data.income.push({
          id: db.generateId(),
          category: 'Registration Fees',
          amount: regFeeAmount,
          source: `${newStudent.fullName} (${newStudent.studentIdNumber})`,
          paymentId: regPayment.id,
          receiptNo: regReceiptNumber,
          date: new Date().toISOString().substring(0, 10),
          description: `Student Admission & Registration Fee Receipt ${regReceiptNumber}`,
          receivedBy: req.user?.name || 'Receptionist',
          createdAt: new Date().toISOString()
        });
      } else {
        // Mark as Due / Pending
        newStudent.registrationFee = regFeeAmount;
        newStudent.registrationFeeStatus = 'PENDING';

        const regFeeRecord: FeeRecord = {
          id: db.generateId(),
          studentId: newStudent.id,
          classId: 'REGISTRATION_FEE',
          month: 'REGISTRATION',
          baseFee: regFeeAmount,
          discount: 0,
          previousBalance: 0,
          totalDue: regFeeAmount,
          paidAmount: 0,
          remainingBalance: regFeeAmount,
          status: 'PENDING',
          dueDate: new Date().toISOString().substring(0, 10),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.data.feeRecords.push(regFeeRecord);
      }
    } else {
      newStudent.registrationFee = 0;
      newStudent.registrationFeeStatus = 'WAIVED';
    }

    // Enroll in classes
    if (Array.isArray(enrolledClassIds) && enrolledClassIds.length > 0) {
      const currentMonth = new Date().toISOString().substring(0, 7); // e.g. "2026-09"
      for (const classId of enrolledClassIds) {
        db.data.classStudents.push({
          id: db.generateId(),
          classId,
          studentId: newStudent.id,
          enrolledAt: new Date().toISOString(),
          status: 'ACTIVE'
        });

        const cls = db.data.classes.find(c => c.id === classId);
        if (cls) {
          db.data.feeRecords.push({
            id: db.generateId(),
            studentId: newStudent.id,
            classId: cls.id,
            month: currentMonth,
            baseFee: cls.monthlyFee,
            discount: 0,
            previousBalance: 0,
            totalDue: cls.monthlyFee,
            paidAmount: 0,
            remainingBalance: cls.monthlyFee,
            status: 'PENDING',
            dueDate: `${currentMonth}-10`,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    // Persist immediately to disk so student is NEVER lost even if SMS or network fails
    db.save();

    // Generate Parent & Guardian Portal direct login link (safely)
    let parentPortalUrl: string | null = null;
    let welcomeSms: string | null = null;

    if (newStudent.parentPhone || newStudent.phone) {
      try {
        const rawTargetPhone = newStudent.parentPhone || newStudent.phone || '';
        const digitsOnly = rawTargetPhone.replace(/\D/g, '');
        let clientOrigin = 'http://localhost:3000';
        try {
          if (req.headers.origin) {
            clientOrigin = req.headers.origin;
          } else if (req.headers.referer) {
            clientOrigin = new URL(req.headers.referer).origin;
          }
        } catch {
          clientOrigin = 'http://localhost:3000';
        }
        
        parentPortalUrl = `${clientOrigin}/login?phone=${digitsOnly}&autoLogin=1`;
        welcomeSms = formatWelcomeSms(newStudent.fullName, newStudent.studentIdNumber, parentPortalUrl);

        // Check master & welcome SMS switch
        const isMasterSms = db.data.settings.find(s => s.key === 'SMS_ENABLED')?.value;
        const isWelcomeSms = db.data.settings.find(s => s.key === 'SMS_WELCOME_ENABLED')?.value;
        const canSendSms = (isMasterSms !== 'false') && (isWelcomeSms !== 'false');

        if (canSendSms) {
          const smsResult = await dispatchRealSMS(rawTargetPhone, welcomeSms);

          db.data.smsLogs.unshift({
            id: db.generateId(),
            studentId: newStudent.id,
            recipient: rawTargetPhone,
            message: welcomeSms,
            type: 'PARENT_PORTAL_WELCOME',
            status: smsResult.success ? 'DELIVERED' : 'FAILED',
            sentAt: new Date().toISOString()
          });
          db.save();
        }
      } catch (smsErr) {
        console.warn('Welcome SMS dispatch error (non-fatal):', smsErr);
      }
    }

    try {
      await logAuditAction(
        req,
        'STUDENT_CREATE',
        `Registered student ${newStudent.fullName} (${newStudent.studentIdNumber}) in Grade ${newStudent.grade}. Sent Parent Portal SMS link to ${newStudent.parentPhone || 'N/A'}`
      );
    } catch (auditErr) {
      console.warn('Audit log error (non-fatal):', auditErr);
    }

    return res.status(201).json({
      ...newStudent,
      parentPortalUrl,
      welcomeSms,
      smsSent: Boolean(welcomeSms),
      registrationReceiptNo: regReceiptNumber,
      registrationPayment: regPayment
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return res.status(500).json({ error: error.message || 'Failed to create student' });
  }
});

// POST /api/students/:id/send-parent-link - Generate/Resend Parent Portal direct SMS link
router.post('/:id/send-parent-link', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'ACCOUNTANT']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = db.data.students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const rawTargetPhone = student.parentPhone || student.phone;
    if (!rawTargetPhone) {
      return res.status(400).json({ error: 'Student does not have a parent or contact phone number registered.' });
    }

    const digitsOnly = rawTargetPhone.replace(/\D/g, '');
    const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000');
    const parentPortalUrl = `${clientOrigin}/login?phone=${digitsOnly}&autoLogin=1`;
    const smsMessage = formatWelcomeSms(student.fullName, student.studentIdNumber, parentPortalUrl);

    // Dispatch real SMS via text.lk
    const smsResult = await dispatchRealSMS(rawTargetPhone, smsMessage);

    const smsLog = {
      id: db.generateId(),
      studentId: student.id,
      recipient: rawTargetPhone,
      message: smsMessage,
      type: 'PARENT_PORTAL_WELCOME',
      status: (smsResult.success ? 'DELIVERED' : 'FAILED') as 'DELIVERED' | 'FAILED',
      sentAt: new Date().toISOString()
    };

    db.data.smsLogs.unshift(smsLog);
    db.save();

    await logAuditAction(
      req,
      'PARENT_PORTAL_LINK_SENT',
      `Sent Parent Portal direct SMS login link for ${student.fullName} to ${rawTargetPhone} (Status: ${smsResult.success ? 'DELIVERED' : 'FAILED - ' + (smsResult.error || '')})`
    );

    return res.json({
      success: smsResult.success,
      recipient: rawTargetPhone,
      normalizedPhone: smsResult.normalizedPhone,
      parentPortalUrl,
      smsMessage,
      smsResult,
      sentAt: smsLog.sentAt
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to send parent portal link' });
  }
});

// PUT /api/students/:id - Update student profile
router.put('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'ACCOUNTANT']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = db.data.students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const {
      fullName,
      dateOfBirth,
      gender,
      school,
      grade,
      address,
      city,
      phone,
      whatsapp,
      email,
      emergencyContact,
      parentName,
      parentPhone,
      status,
      notes,
      rfidTag,
      photo,
      enrolledClassIds,
      resendParentPortalLink
    } = req.body;

    if (rfidTag !== undefined) {
      if (rfidTag) {
        const cleanTag = String(rfidTag).trim();
        const conflict = db.data.students.find(s => s.id !== id && s.rfidTag && s.rfidTag.toLowerCase() === cleanTag.toLowerCase());
        if (conflict) {
          return res.status(409).json({ error: `RFID card "${cleanTag}" is already assigned to student ${conflict.fullName}` });
        }
        student.rfidTag = cleanTag;
      } else {
        student.rfidTag = undefined;
      }
    }

    if (fullName) student.fullName = fullName.trim();
    if (dateOfBirth !== undefined) student.dateOfBirth = dateOfBirth;
    if (gender) student.gender = gender;
    if (school !== undefined) student.school = school;
    if (grade) student.grade = grade;
    if (address !== undefined) student.address = address;
    if (city !== undefined) student.city = city;
    if (phone !== undefined) student.phone = phone ? phone.trim() : undefined;
    if (whatsapp !== undefined) student.whatsapp = whatsapp ? whatsapp.trim() : undefined;
    if (email !== undefined) student.email = email ? email.trim() : undefined;
    if (emergencyContact !== undefined) student.emergencyContact = emergencyContact;
    if (status) student.status = status;
    if (notes !== undefined) student.notes = notes;
    if (photo !== undefined) student.photo = photo ? photo.trim() : undefined;

    // Registration / Admission Fee Updates
    if (req.body.registrationFee !== undefined) {
      student.registrationFee = Number(req.body.registrationFee) || 0;
    }
    if (req.body.registrationFeeStatus !== undefined) {
      const prevStatus = student.registrationFeeStatus;
      student.registrationFeeStatus = req.body.registrationFeeStatus;
      if (req.body.registrationFeeStatus === 'PAID' && prevStatus !== 'PAID') {
        const regFee = db.data.feeRecords.find(f => f.studentId === student.id && f.classId === 'REGISTRATION_FEE');
        const regAmount = student.registrationFee || 1500;
        if (regFee) {
          regFee.paidAmount = regAmount;
          regFee.remainingBalance = 0;
          regFee.status = 'PAID';
          regFee.updatedAt = new Date().toISOString();
        }
        let maxPayNum = 0;
        db.data.payments.forEach(p => {
          const match = p.receiptNumber ? p.receiptNumber.match(/REC-\d{4}-(\d+)/) : null;
          if (match) {
            const n = parseInt(match[1], 10);
            if (n > maxPayNum) maxPayNum = n;
          }
        });
        const nextReceiptNum = String(Math.max(maxPayNum + 1, db.data.payments.length + 1)).padStart(4, '0');
        const regReceiptNumber = `REC-2026-${nextReceiptNum}`;
        student.registrationReceiptNo = regReceiptNumber;

        const regPayment: Payment = {
          id: db.generateId(),
          receiptNumber: regReceiptNumber,
          studentId: student.id,
          totalAmount: regAmount,
          paymentMethod: req.body.registrationFeePaymentMethod || 'Cash',
          paymentDate: new Date().toISOString(),
          cashier: req.user?.name || 'Receptionist',
          notes: 'Settled Student Admission & Registration Fee',
          createdAt: new Date().toISOString()
        };
        db.data.payments.push(regPayment);
        db.data.income.push({
          id: db.generateId(),
          category: 'Registration Fees',
          amount: regAmount,
          source: `${student.fullName} (${student.studentIdNumber})`,
          paymentId: regPayment.id,
          receiptNo: regReceiptNumber,
          date: new Date().toISOString().substring(0, 10),
          description: `Settled Admission & Registration Fee Receipt ${regReceiptNumber}`,
          receivedBy: req.user?.name || 'Receptionist',
          createdAt: new Date().toISOString()
        });
      }
    }

    // Sync Parent Name & Phone
    if (parentPhone !== undefined) {
      const cleanParentPhone = parentPhone ? parentPhone.trim() : undefined;
      student.parentPhone = cleanParentPhone;

      if (cleanParentPhone) {
        let parent = student.parentId ? db.data.parents.find(p => p.id === student.parentId) : null;
        if (!parent) {
          parent = db.data.parents.find(p => p.phone === cleanParentPhone);
        }

        if (parent) {
          parent.phone = cleanParentPhone;
          if (parentName) parent.name = parentName.trim();
          if (whatsapp) parent.whatsapp = whatsapp.trim();
          parent.updatedAt = new Date().toISOString();
          student.parentId = parent.id;
        } else {
          const newParent: Parent = {
            id: db.generateId(),
            name: parentName?.trim() || `${student.fullName}'s Guardian`,
            phone: cleanParentPhone,
            whatsapp: whatsapp?.trim() || cleanParentPhone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.data.parents.push(newParent);
          student.parentId = newParent.id;
        }
      }
    }

    if (parentName !== undefined) {
      student.parentName = parentName ? parentName.trim() : undefined;
    }

    // Update Class Enrollments if provided (Add new classes or change/unenroll classes)
    let enrollmentsChanged = false;
    if (enrolledClassIds !== undefined && Array.isArray(enrolledClassIds)) {
      const targetClassIds = new Set(enrolledClassIds.map(String));
      const currentActive = db.data.classStudents.filter(cs => cs.studentId === id && cs.status === 'ACTIVE');
      const currentClassIds = new Set(currentActive.map(cs => cs.classId));

      const toAdd = Array.from(targetClassIds).filter(cid => !currentClassIds.has(cid));
      const toRemove = Array.from(currentClassIds).filter(cid => !targetClassIds.has(cid));

      if (toAdd.length > 0 || toRemove.length > 0) {
        enrollmentsChanged = true;
      }

      // Add new class enrollments
      const currentMonth = new Date().toISOString().substring(0, 7);
      for (const classId of toAdd) {
        const existingRecord = db.data.classStudents.find(cs => cs.studentId === id && cs.classId === classId);
        if (existingRecord) {
          existingRecord.status = 'ACTIVE';
          existingRecord.enrolledAt = new Date().toISOString();
        } else {
          db.data.classStudents.push({
            id: db.generateId(),
            classId,
            studentId: id,
            enrolledAt: new Date().toISOString(),
            status: 'ACTIVE'
          });
        }

        // Generate fee record for current month if none exists
        const feeExisting = db.data.feeRecords.find(f => f.classId === classId && f.studentId === id && f.month === currentMonth);
        if (!feeExisting) {
          const cls = db.data.classes.find(c => c.id === classId);
          if (cls) {
            db.data.feeRecords.push({
              id: db.generateId(),
              studentId: id,
              classId: cls.id,
              month: currentMonth,
              baseFee: cls.monthlyFee,
              discount: 0,
              previousBalance: 0,
              totalDue: cls.monthlyFee,
              paidAmount: 0,
              remainingBalance: cls.monthlyFee,
              status: 'PENDING',
              dueDate: `${currentMonth}-10`,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString()
            });
          }
        }
      }

      // Remove unenrolled classes
      for (const classId of toRemove) {
        const csIndex = db.data.classStudents.findIndex(cs => cs.studentId === id && cs.classId === classId);
        if (csIndex !== -1) {
          db.data.classStudents.splice(csIndex, 1);
        }
      }
    }

    student.updatedAt = new Date().toISOString();
    db.save();

    // Optionally re-send Parent Portal SMS link if requested
    let portalLinkResult = null;
    if (resendParentPortalLink && (student.parentPhone || student.phone)) {
      try {
        const rawTargetPhone = student.parentPhone || student.phone!;
        const digitsOnly = rawTargetPhone.replace(/\D/g, '');
        let clientOrigin = 'http://localhost:3000';
        try {
          if (req.headers.origin) {
            clientOrigin = req.headers.origin;
          } else if (req.headers.referer) {
            clientOrigin = new URL(req.headers.referer).origin;
          }
        } catch {
          clientOrigin = 'http://localhost:3000';
        }
        const parentPortalUrl = `${clientOrigin}/login?phone=${digitsOnly}&autoLogin=1`;
        const smsMessage = formatWelcomeSms(student.fullName, student.studentIdNumber, parentPortalUrl);

        const smsResult = await dispatchRealSMS(rawTargetPhone, smsMessage);
        db.data.smsLogs.unshift({
          id: db.generateId(),
          studentId: student.id,
          recipient: rawTargetPhone,
          message: smsMessage,
          type: 'PARENT_PORTAL_WELCOME',
          status: smsResult.success ? 'DELIVERED' : 'FAILED',
          sentAt: new Date().toISOString()
        });
        db.save();

        portalLinkResult = {
          recipient: rawTargetPhone,
          smsResult,
          parentPortalUrl
        };
      } catch (smsErr) {
        console.warn('Resend portal SMS error (non-fatal):', smsErr);
      }
    }

    await logAuditAction(
      req,
      'STUDENT_UPDATE',
      `Updated student ${student.fullName} (${student.studentIdNumber}) - Guardian Phone: ${student.parentPhone || 'N/A'}`
    );

    if (enrollmentsChanged && Array.isArray(enrolledClassIds)) {
      await logAuditAction(
        req,
        'STUDENT_ENROLLMENT_UPDATE',
        `Updated class enrollments for ${student.fullName} (${student.studentIdNumber}) - Now enrolled in ${enrolledClassIds.length} classes`
      );
    }

    const updatedEnrollments = db.data.classStudents
      .filter(cs => cs.studentId === student.id && cs.status === 'ACTIVE')
      .map(cs => {
        const cls = db.data.classes.find(c => c.id === cs.classId);
        const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
        const subject = cls ? db.data.subjects.find(sub => sub.id === cls.subjectId) : null;
        return {
          ...cs,
          class: cls ? { ...cls, teacher, subject } : null
        };
      });

    return res.json({
      ...student,
      enrollments: updatedEnrollments,
      portalLinkResult
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update student' });
  }
});

// DELETE /api/students/:id - Archive student
router.delete('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const student = db.data.students.find(s => s.id === id);

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    student.status = 'INACTIVE';
    student.updatedAt = new Date().toISOString();
    db.save();

    await logAuditAction(
      req,
      'STUDENT_ARCHIVE',
      `Archived student ${student.fullName} (${student.studentIdNumber})`
    );

    return res.json({ message: 'Student successfully archived', student });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to archive student' });
  }
});

export default router;
