import { Router, Response } from 'express';
import QRCode from 'qrcode';
import db, { Attendance, AttendanceSession } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import { dispatchRealSMS } from '../services/smsService';

const router = Router();

// GET /api/attendance/sample-qr - Returns a high-contrast test QR code for live phone testing
router.get('/sample-qr', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const student = db.data.students[0] || {
      id: 'stu-1',
      fullName: 'Kasun Kalhara',
      studentIdNumber: 'STU-2026-0001',
      qrCodeToken: 'CAMS-STU-3F019FB024D7'
    };

    const qrDataUrl = await QRCode.toDataURL(student.qrCodeToken, {
      width: 320,
      margin: 2,
      color: {
        dark: '#000000',
        light: '#ffffff'
      }
    });

    return res.json({
      studentId: student.id,
      fullName: student.fullName,
      studentIdNumber: student.studentIdNumber,
      qrCodeToken: student.qrCodeToken,
      qrDataUrl
    });
  } catch (err) {
    return res.status(500).json({ error: 'Failed to generate sample QR' });
  }
});

// GET /api/attendance/today-classes - Get classes scheduled for today or active classes
router.get('/today-classes', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().substring(0, 10);
    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const currentDayName = dayNames[new Date().getDay()];

    let classes = db.data.classes.filter(c => c.status === 'ACTIVE');

    if (req.user?.role === 'TEACHER' && req.user.teacherId) {
      classes = classes.filter(c => c.teacherId === req.user!.teacherId);
    }

    const classesWithStats = classes.map(cls => {
      const teacher = db.data.teachers.find(t => t.id === cls.teacherId);
      const subject = db.data.subjects.find(s => s.id === cls.subjectId);
      const totalEnrolled = db.data.classStudents.filter(cs => cs.classId === cls.id && cs.status === 'ACTIVE').length;

      // Check attendance for today
      const todayAttendances = db.data.attendances.filter(a => a.classId === cls.id && a.date === today);
      const presentCount = todayAttendances.filter(a => a.status === 'PRESENT' || a.status === 'LATE').length;
      const absentCount = todayAttendances.filter(a => a.status === 'ABSENT').length;

      return {
        ...cls,
        teacher,
        subject,
        isToday: cls.dayOfWeek.toLowerCase() === currentDayName.toLowerCase(),
        totalEnrolled,
        presentCount,
        absentCount,
        attendanceRate: totalEnrolled > 0 ? Math.round((presentCount / totalEnrolled) * 100) : 0
      };
    });

    return res.json(classesWithStats);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch today classes' });
  }
});

// GET /api/attendance/session/:classId/:date - Get or create attendance session for a class on a date
router.get('/session/:classId/:date', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date } = req.params;
    const cls = db.data.classes.find(c => c.id === classId);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    let session = db.data.attendanceSessions.find(s => s.classId === classId && s.date === date);
    if (!session) {
      session = {
        id: `sess-${classId}-${date}`,
        classId,
        date,
        title: `${cls.name} (${date})`,
        startedAt: new Date().toISOString(),
        takenBy: req.user?.name || 'Staff',
        createdAt: new Date().toISOString()
      };
      db.data.attendanceSessions.push(session);
      db.save();
    }

    // Get all enrolled students and their attendance status
    const enrolledStudents = db.data.classStudents
      .filter(cs => cs.classId === classId && cs.status === 'ACTIVE')
      .map(cs => {
        const student = db.data.students.find(s => s.id === cs.studentId);
        const record = db.data.attendances.find(a => a.classId === classId && a.studentId === cs.studentId && a.date === date);
        const feeRecord = db.data.feeRecords.find(f => f.classId === classId && f.studentId === cs.studentId && f.month === '2026-09');

        return {
          student,
          attendance: record || null,
          status: record ? record.status : 'NOT_MARKED',
          hasPendingFees: feeRecord ? feeRecord.remainingBalance > 0 : false,
          remainingBalance: feeRecord ? feeRecord.remainingBalance : cls.monthlyFee
        };
      });

    return res.json({
      session,
      class: cls,
      students: enrolledStudents
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to load attendance session' });
  }
});

// POST /api/attendance/scan - High-Speed Mobile & Desk QR/RFID Scan
router.post('/scan', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { qrToken, rfidTag, token, classId, date, method } = req.body;
    const rawInput = String(rfidTag || qrToken || token || '').trim();
    if (!rawInput) {
      return res.status(400).json({ 
        scanResult: 'ERROR', 
        message: 'Scan token or RFID card number is required' 
      });
    }

    const scanDate = date || new Date().toISOString().substring(0, 10);
    const scanMethod = method || (rfidTag ? 'RFID' : 'QR_CODE');

    // Locate requested class or fallback to first available
    let cls = classId ? db.data.classes.find(c => c.id === classId) : null;
    if (!cls && db.data.classes.length > 0) {
      cls = db.data.classes[0];
    }
    if (!cls) {
      return res.status(400).json({ 
        scanResult: 'ERROR', 
        message: 'No classes available in the system' 
      });
    }

    // Find student by RFID tag OR secure token OR student ID (case-insensitive & leading-zero forgiving)
    const cleanToken = rawInput.toLowerCase();
    const strippedToken = cleanToken.replace(/^0+/, '');

    const student = db.data.students.find(s => {
      // Check RFID tag match (exact or with stripped leading zeros)
      if (s.rfidTag) {
        const sTag = s.rfidTag.trim().toLowerCase();
        const sTagStripped = sTag.replace(/^0+/, '');
        if (sTag === cleanToken || (strippedToken.length >= 4 && sTagStripped === strippedToken)) {
          return true;
        }
      }

      // Check QR code token or student ID
      return (
        s.qrCodeToken.toLowerCase() === cleanToken || 
        s.studentIdNumber.toLowerCase() === cleanToken ||
        s.id.toLowerCase() === cleanToken ||
        cleanToken.includes(s.studentIdNumber.toLowerCase()) ||
        cleanToken.includes(s.qrCodeToken.toLowerCase())
      );
    });

    if (!student) {
      return res.status(404).json({
        scanResult: 'ERROR',
        message: `No student found for ${scanMethod === 'RFID' ? 'RFID Card' : 'QR/Card ID'}: "${rawInput}"`
      });
    }

    if (student.status !== 'ACTIVE') {
      return res.status(400).json({
        scanResult: 'ERROR',
        message: `Student ${student.fullName} status is ${student.status}`
      });
    }

    // Check if enrolled in selected class, or auto-detect student's enrolled class
    let activeClass = cls;
    let isEnrolled = db.data.classStudents.some(cs => cs.classId === activeClass.id && cs.studentId === student.id && cs.status === 'ACTIVE');

    if (!isEnrolled) {
      // Auto-detect student's enrolled classes
      const studentEnrollments = db.data.classStudents.filter(cs => cs.studentId === student.id && cs.status === 'ACTIVE');
      if (studentEnrollments.length > 0) {
        const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const currentDayName = dayNames[new Date().getDay()].toLowerCase();

        // 1. Try class scheduled for today
        let foundClass = db.data.classes.find(c => 
          studentEnrollments.some(e => e.classId === c.id) && 
          c.dayOfWeek.toLowerCase() === currentDayName
        );

        // 2. Otherwise use student's primary enrolled class
        if (!foundClass) {
          foundClass = db.data.classes.find(c => studentEnrollments.some(e => e.classId === c.id));
        }

        if (foundClass) {
          activeClass = foundClass;
          isEnrolled = true;
        }
      }
    }

    if (!isEnrolled || !activeClass) {
      return res.status(400).json({
        scanResult: 'ERROR',
        student: {
          id: student.id,
          fullName: student.fullName,
          studentIdNumber: student.studentIdNumber,
          photo: student.photo
        },
        message: `Student is not enrolled in "${cls.name}" or any active class`
      });
    }

    const currentClass = activeClass;
    const targetClassId = currentClass.id;

    // Compute all pending fees for this student across all enrolled subjects/classes
    const studentFeeRecords = db.data.feeRecords.filter(f => f.studentId === student.id);
    const pendingFees = studentFeeRecords
      .filter(f => f.remainingBalance > 0)
      .map(f => {
        const c = db.data.classes.find(clsItem => clsItem.id === f.classId);
        const t = c ? db.data.teachers.find(tch => tch.id === c.teacherId) : null;
        return {
          id: f.id,
          classId: f.classId,
          className: c?.name || 'Tuition Class',
          classCode: c?.classCode || '',
          teacherName: t?.name || 'Academy Staff',
          month: f.month,
          baseFee: f.baseFee,
          totalDue: f.totalDue,
          paidAmount: f.paidAmount,
          remainingBalance: f.remainingBalance,
          isCurrentClass: f.classId === targetClassId
        };
      });

    const totalPendingAmount = pendingFees.reduce((sum, f) => sum + f.remainingBalance, 0);
    const currentClassPending = pendingFees.find(f => f.classId === targetClassId);

    // Check duplicate attendance for student + class + date
    const existingAttendance = db.data.attendances.find(a => 
      a.studentId === student.id && 
      a.classId === targetClassId && 
      a.date === scanDate
    );

    if (existingAttendance) {
      return res.json({
        scanResult: 'ALREADY_RECORDED', // YELLOW in UI
        student: {
          id: student.id,
          fullName: student.fullName,
          studentIdNumber: student.studentIdNumber,
          photo: student.photo,
          grade: student.grade,
          parentPhone: student.parentPhone
        },
        class: {
          id: currentClass.id,
          name: currentClass.name,
          classCode: currentClass.classCode
        },
        attendance: existingAttendance,
        pendingFees,
        totalPendingAmount,
        hasPendingFees: pendingFees.length > 0,
        feeWarning: currentClassPending ? {
          month: currentClassPending.month,
          due: currentClassPending.remainingBalance,
          feeRecordId: currentClassPending.id
        } : (pendingFees.length > 0 ? {
          month: pendingFees[0].month,
          due: totalPendingAmount,
          feeRecordId: pendingFees[0].id
        } : null),
        message: `Attendance already marked at ${new Date(existingAttendance.scannedAt).toLocaleTimeString()}`
      });
    }

    // Ensure session exists
    let session = db.data.attendanceSessions.find(s => s.classId === targetClassId && s.date === scanDate);
    if (!session) {
      session = {
        id: `sess-${targetClassId}-${scanDate}`,
        classId: targetClassId,
        date: scanDate,
        title: `${currentClass.name} (${scanDate})`,
        startedAt: new Date().toISOString(),
        takenBy: req.user?.name || 'Scanner',
        createdAt: new Date().toISOString()
      };
      db.data.attendanceSessions.push(session);
    }

    // Check fee payment status for warning banner
    const feeRecord = db.data.feeRecords.find(f => f.studentId === student.id && f.classId === targetClassId && f.month === '2026-09');
    const feePending = feeRecord && feeRecord.remainingBalance > 0;

    const newAttendance: Attendance = {
      id: db.generateId(),
      sessionId: session.id,
      studentId: student.id,
      classId: targetClassId,
      date: scanDate,
      status: 'PRESENT',
      scannedAt: new Date().toISOString(),
      method: scanMethod as any,
      recordedBy: req.user?.name || 'Scanner'
    };

    db.data.attendances.push(newAttendance);

    // Dispatch real-time SMS & WhatsApp alert to parent
    const targetPhone = student.parentPhone || student.phone;
    if (targetPhone) {
      const scanTimeStr = new Date(newAttendance.scannedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const methodLabel = scanMethod === 'RFID' ? '125kHz RFID Card' : 'QR Scanner';
      const alertMsg = `Dear Parent, your child ${student.fullName} has arrived and was marked PRESENT for ${currentClass.name} today at ${scanTimeStr} via ${methodLabel}. - Apex Institute`;

      try {
        await dispatchRealSMS(targetPhone, alertMsg);
      } catch (smsErr) {
        console.warn('Live SMS dispatch notice:', smsErr);
      }

      db.data.smsLogs.unshift({
        id: db.generateId(),
        studentId: student.id,
        recipient: targetPhone,
        message: alertMsg,
        type: 'ATTENDANCE_ALERT',
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });

      db.data.whatsappLogs.unshift({
        id: db.generateId(),
        studentId: student.id,
        recipient: targetPhone,
        templateName: 'attendance_alert',
        message: alertMsg,
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });
    }

    db.save();

    await logAuditAction(
      req,
      'ATTENDANCE_SCAN',
      `Marked attendance for ${student.fullName} in ${currentClass.name} via ${scanMethod}. SMS & WhatsApp alert sent to ${targetPhone || 'N/A'}`
    );

    return res.json({
      scanResult: 'SUCCESS', // GREEN in UI
      student: {
        id: student.id,
        fullName: student.fullName,
        studentIdNumber: student.studentIdNumber,
        photo: student.photo,
        grade: student.grade,
        parentPhone: student.parentPhone || student.phone
      },
      class: {
        id: currentClass.id,
        name: currentClass.name,
        classCode: currentClass.classCode
      },
      attendance: newAttendance,
      pendingFees,
      totalPendingAmount,
      hasPendingFees: pendingFees.length > 0,
      feeWarning: currentClassPending ? {
        month: currentClassPending.month,
        due: currentClassPending.remainingBalance,
        feeRecordId: currentClassPending.id
      } : (pendingFees.length > 0 ? {
        month: pendingFees[0].month,
        due: totalPendingAmount,
        feeRecordId: pendingFees[0].id
      } : null),
      message: `Successfully marked PRESENT for ${student.fullName}`
    });
  } catch (error: any) {
    return res.status(500).json({ scanResult: 'ERROR', message: error.message || 'Scan error' });
  }
});

// POST /api/attendance/batch - Manual Batch Attendance
router.post('/batch', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, date, records } = req.body;
    // records: [{ studentId, status: 'PRESENT' | 'ABSENT' | 'LATE' | 'EXCUSED', remark }]
    if (!classId || !date || !Array.isArray(records)) {
      return res.status(400).json({ error: 'classId, date, and records array are required' });
    }

    let session = db.data.attendanceSessions.find(s => s.classId === classId && s.date === date);
    if (!session) {
      session = {
        id: `sess-${classId}-${date}`,
        classId,
        date,
        title: `Manual Session (${date})`,
        startedAt: new Date().toISOString(),
        takenBy: req.user?.name || 'Staff',
        createdAt: new Date().toISOString()
      };
      db.data.attendanceSessions.push(session);
    }

    for (const item of records) {
      const existingIndex = db.data.attendances.findIndex(a => 
        a.classId === classId && a.studentId === item.studentId && a.date === date
      );

      if (existingIndex !== -1) {
        db.data.attendances[existingIndex].status = item.status;
        db.data.attendances[existingIndex].remark = item.remark || undefined;
      } else {
        db.data.attendances.push({
          id: db.generateId(),
          sessionId: session.id,
          studentId: item.studentId,
          classId,
          date,
          status: item.status,
          scannedAt: new Date().toISOString(),
          method: 'MANUAL',
          remark: item.remark || undefined,
          recordedBy: req.user?.name || 'Staff'
        });
      }
    }

    db.save();
    await logAuditAction(req, 'ATTENDANCE_BATCH', `Updated attendance for ${records.length} students on ${date}`);

    return res.json({ message: 'Attendance records updated successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update attendance records' });
  }
});

// POST /api/attendance/sync or /sync-offline - Syncs offline queue captured on mobile
router.post(['/sync', '/sync-offline'], authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const queue = req.body.queue || req.body.batch; // Array of offline scan objects
    if (!Array.isArray(queue) || queue.length === 0) {
      return res.json({ synced: 0, skipped: 0 });
    }

    let synced = 0;
    let skipped = 0;

    for (const item of queue) {
      const { studentId, classId, date, scannedAt, method } = item;
      const existing = db.data.attendances.find(a => 
        a.studentId === studentId && a.classId === classId && a.date === date
      );

      if (existing) {
        skipped++;
      } else {
        let session = db.data.attendanceSessions.find(s => s.classId === classId && s.date === date);
        if (!session) {
          session = {
            id: `sess-${classId}-${date}`,
            classId,
            date,
            startedAt: scannedAt || new Date().toISOString(),
            takenBy: req.user?.name || 'Offline Sync',
            createdAt: new Date().toISOString()
          };
          db.data.attendanceSessions.push(session);
        }

        db.data.attendances.push({
          id: db.generateId(),
          sessionId: session.id,
          studentId,
          classId,
          date,
          status: 'PRESENT',
          scannedAt: scannedAt || new Date().toISOString(),
          method: method || 'QR_CODE',
          recordedBy: req.user?.name || 'Offline Sync'
        });
        synced++;
      }
    }

    db.save();
    return res.json({ synced, skipped });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to sync offline attendance' });
  }
});

export default router;
