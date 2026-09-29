import { Router, Response } from 'express';
import crypto from 'crypto';
import QRCode from 'qrcode';
import db, { Student, Parent, ClassStudent, FeeRecord } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import { dispatchRealSMS } from '../services/smsService';

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
    const student = db.data.students.find(s => s.id === id);

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
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
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
      enrolledClassIds
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

    // Auto-generate student ID: STU-2026-XXXX
    const nextNum = String(db.data.students.length + 1).padStart(4, '0');
    const studentIdNumber = `STU-2026-${nextNum}`;

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
      photo: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80`,
      phone: phone ? phone.trim() : undefined,
      whatsapp: whatsapp ? whatsapp.trim() : (phone ? phone.trim() : undefined),
      email: email ? email.trim() : undefined,
      emergencyContact: emergencyContact || undefined,
      registrationDate: new Date().toISOString(),
      status: 'ACTIVE',
      notes: notes ? notes.trim() : undefined,
      rfidTag: rfidTag ? String(rfidTag).trim() : undefined,
      parentId,
      parentName: parentName ? parentName.trim() : undefined,
      parentPhone: parentPhone ? parentPhone.trim() : undefined,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.students.push(newStudent);

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

    // Generate Parent & Guardian Portal direct login link
    let parentPortalUrl: string | null = null;
    let welcomeSms: string | null = null;

    if (newStudent.parentPhone || newStudent.phone) {
      const rawTargetPhone = newStudent.parentPhone || newStudent.phone || '';
      const digitsOnly = rawTargetPhone.replace(/\D/g, '');
      const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000');
      
      parentPortalUrl = `${clientOrigin}/login?phone=${digitsOnly}&autoLogin=1`;
      welcomeSms = `Welcome to Cambridge Academy! Track ${newStudent.fullName}'s live attendance, RFID check-in times & fee receipts on the Parent Portal PWA: ${parentPortalUrl} (Save to your home screen for 1-tap instant access)`;

      // Dispatch real SMS via text.lk
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
    }

    db.save();

    await logAuditAction(
      req,
      'STUDENT_CREATE',
      `Registered student ${newStudent.fullName} (${newStudent.studentIdNumber}) in Grade ${newStudent.grade}. Sent Parent Portal SMS link to ${newStudent.parentPhone || 'N/A'}`
    );

    return res.status(201).json({
      ...newStudent,
      parentPortalUrl,
      welcomeSms,
      smsSent: Boolean(welcomeSms)
    });
  } catch (error: any) {
    console.error('Error creating student:', error);
    return res.status(500).json({ error: error.message || 'Failed to create student' });
  }
});

// POST /api/students/:id/send-parent-link - Generate/Resend Parent Portal direct SMS link
router.post('/:id/send-parent-link', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
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
    const smsMessage = `Welcome to Cambridge Academy! Track ${student.fullName}'s live attendance, RFID check-in times & fee receipts on the Parent Portal PWA: ${parentPortalUrl} (Save to your phone home screen for 1-tap instant access)`;

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
router.put('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
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

    student.updatedAt = new Date().toISOString();

    // Optionally re-send Parent Portal SMS link if requested
    let portalLinkResult = null;
    if (resendParentPortalLink && (student.parentPhone || student.phone)) {
      const rawTargetPhone = student.parentPhone || student.phone!;
      const digitsOnly = rawTargetPhone.replace(/\D/g, '');
      const clientOrigin = req.headers.origin || (req.headers.referer ? new URL(req.headers.referer).origin : 'http://localhost:3000');
      const parentPortalUrl = `${clientOrigin}/login?phone=${digitsOnly}&autoLogin=1`;
      const smsMessage = `Welcome to Cambridge Academy! Track ${student.fullName}'s live attendance, RFID check-in times & fee receipts on the Parent Portal PWA: ${parentPortalUrl} (Save to your phone home screen for 1-tap instant access)`;

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

      portalLinkResult = {
        recipient: rawTargetPhone,
        smsResult,
        parentPortalUrl
      };
    }

    db.save();

    await logAuditAction(
      req,
      'STUDENT_UPDATE',
      `Updated student ${student.fullName} (${student.studentIdNumber}) - Guardian Phone: ${student.parentPhone || 'N/A'}`
    );

    return res.json({
      ...student,
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
