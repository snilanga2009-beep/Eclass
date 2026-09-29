import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/pending-fees - List pending and overdue fees with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { filter, classId, teacherId, search } = req.query;
    const currentMonth = '2026-09';

    let pendingRecords = db.data.feeRecords.filter(f => f.status !== 'PAID' && f.remainingBalance > 0);

    // Apply Filter: 'ALL', 'CURRENT_MONTH', 'OVERDUE'
    if (filter === 'CURRENT_MONTH') {
      pendingRecords = pendingRecords.filter(f => f.month === currentMonth);
    } else if (filter === 'OVERDUE') {
      pendingRecords = pendingRecords.filter(f => f.month < currentMonth || f.status === 'OVERDUE');
    }

    if (classId && classId !== 'ALL') {
      pendingRecords = pendingRecords.filter(f => f.classId === classId);
    }

    const populated = pendingRecords.map(f => {
      const student = db.data.students.find(s => s.id === f.studentId);
      const cls = db.data.classes.find(c => c.id === f.classId);
      const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
      const subject = cls ? db.data.subjects.find(sub => sub.id === cls.subjectId) : null;

      return {
        ...f,
        student,
        class: cls,
        teacher,
        subject
      };
    });

    let result = populated;

    // Filter by Teacher
    if (teacherId && teacherId !== 'ALL') {
      result = result.filter(r => r.teacher?.id === teacherId);
    }

    // Teacher self filter
    if (req.user?.role === 'TEACHER' && req.user.teacherId) {
      result = result.filter(r => r.teacher?.id === req.user!.teacherId);
    }

    // Search query
    if (search) {
      const q = String(search).trim().toLowerCase();
      result = result.filter(r => 
        (r.student && r.student.fullName.toLowerCase().includes(q)) ||
        (r.student && r.student.studentIdNumber.toLowerCase().includes(q)) ||
        (r.student && r.student.phone && r.student.phone.includes(q)) ||
        (r.student && r.student.parentPhone && r.student.parentPhone.includes(q)) ||
        (r.class && r.class.name.toLowerCase().includes(q))
      );
    }

    // Statistics
    const totalPendingAmount = result.reduce((sum, r) => sum + r.remainingBalance, 0);
    const totalPendingStudents = new Set(result.map(r => r.studentId)).size;
    const overdueAmount = result.filter(r => r.month < currentMonth).reduce((sum, r) => sum + r.remainingBalance, 0);

    return res.json({
      summary: {
        totalPendingAmount,
        totalPendingStudents,
        totalRecords: result.length,
        overdueAmount
      },
      records: result
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch pending fees' });
  }
});

// POST /api/pending-fees/remind - Send SMS or WhatsApp fee reminder
router.post('/remind', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { feeRecordId, channel } = req.body; // channel: 'SMS' | 'WHATSAPP'
    const fee = db.data.feeRecords.find(f => f.id === feeRecordId);
    if (!fee) return res.status(404).json({ error: 'Fee record not found' });

    const student = db.data.students.find(s => s.id === fee.studentId);
    const cls = db.data.classes.find(c => c.id === fee.classId);
    const recipientPhone = student?.parentPhone || student?.phone;

    if (!recipientPhone) {
      return res.status(400).json({ error: 'No phone number found for student or parent' });
    }

    const message = `Reminder: Fee of Rs. ${fee.remainingBalance.toLocaleString()} for ${student?.fullName} (${cls?.name} - ${fee.month}) is pending. Please make the payment at the front desk. - Apex Institute`;

    if (channel === 'WHATSAPP') {
      db.data.whatsappLogs.unshift({
        id: db.generateId(),
        studentId: student?.id,
        recipient: recipientPhone,
        templateName: 'fee_reminder_template',
        message,
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });
    } else {
      db.data.smsLogs.unshift({
        id: db.generateId(),
        studentId: student?.id,
        recipient: recipientPhone,
        message,
        type: 'FEE_REMINDER',
        status: 'SENT',
        sentAt: new Date().toISOString()
      });
    }

    db.save();
    await logAuditAction(req, 'FEE_REMINDER_SENT', `Sent ${channel} reminder to ${recipientPhone} for ${student?.fullName}`);

    return res.json({
      message: `${channel} reminder sent successfully to ${recipientPhone}`
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to dispatch reminder' });
  }
});

export default router;
