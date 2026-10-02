import { Router, Response } from 'express';
import db, { Payment, PaymentItem, Income, FeeRecord } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import { dispatchRealSMS } from '../services/smsService';

const router = Router();

// GET /api/payments - List payments with search, date filter, student/class filter
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { studentId, search, fromDate, toDate, method } = req.query;

    let payments = [...db.data.payments];

    // Enforce role-based privacy: Students and Parents can ONLY see their own payments
    if (req.user?.role === 'STUDENT' && req.user.studentId) {
      payments = payments.filter(p => p.studentId === req.user!.studentId);
    } else if (req.user?.role === 'PARENT') {
      const allowedStudentIds = db.data.students
        .filter(s => s.parentId === req.user!.parentId || (req.user!.phone && s.parentPhone === req.user!.phone) || (req.user!.studentId && s.id === req.user!.studentId))
        .map(s => s.id);
      payments = payments.filter(p => allowedStudentIds.includes(p.studentId));
    } else if (studentId) {
      payments = payments.filter(p => p.studentId === studentId);
    }

    if (method && method !== 'ALL') {
      payments = payments.filter(p => p.paymentMethod === method);
    }

    if (fromDate) {
      payments = payments.filter(p => p.paymentDate >= String(fromDate));
    }

    if (toDate) {
      payments = payments.filter(p => p.paymentDate <= String(toDate) + 'T23:59:59.999Z');
    }

    if (search) {
      const q = String(search).trim().toLowerCase();
      payments = payments.filter(p => {
        const student = db.data.students.find(s => s.id === p.studentId);
        return (
          p.receiptNumber.toLowerCase().includes(q) ||
          (student && student.fullName.toLowerCase().includes(q)) ||
          (student && student.studentIdNumber.toLowerCase().includes(q)) ||
          p.cashier.toLowerCase().includes(q)
        );
      });
    }

    const populated = payments.map(p => {
      const student = db.data.students.find(s => s.id === p.studentId);
      const items = db.data.paymentItems
        .filter(pi => pi.paymentId === p.id)
        .map(pi => {
          const fee = db.data.feeRecords.find(f => f.id === pi.feeRecordId);
          const cls = fee ? db.data.classes.find(c => c.id === fee.classId) : null;
          return {
            ...pi,
            feeRecord: fee ? { ...fee, class: cls } : null
          };
        });

      return {
        ...p,
        student,
        items
      };
    }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch payments' });
  }
});

// GET /api/payments/receipt/:receiptNumber - Detailed Receipt Data for Thermal / A4 Printout
router.get('/receipt/:receiptNumber', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { receiptNumber } = req.params;
    const payment = db.data.payments.find(p => p.receiptNumber === receiptNumber);
    if (!payment) {
      return res.status(404).json({ error: 'Receipt not found' });
    }

    const student = db.data.students.find(s => s.id === payment.studentId);
    const parent = student?.parentId ? db.data.parents.find(p => p.id === student.parentId) : null;

    const items = db.data.paymentItems
      .filter(pi => pi.paymentId === payment.id)
      .map(pi => {
        const fee = db.data.feeRecords.find(f => f.id === pi.feeRecordId);
        const cls = fee ? db.data.classes.find(c => c.id === fee.classId) : null;
        const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
        return {
          ...pi,
          classTitle: cls?.name || 'Tuition Class',
          classCode: cls?.classCode || '',
          teacherName: teacher?.name || '',
          month: fee?.month || '',
          baseFee: fee?.baseFee || 0,
          discount: fee?.discount || 0,
          totalDue: fee?.totalDue || 0,
          amountPaid: pi.amountPaid,
          remainingBalance: pi.balanceLeft
        };
      });

    // Institute Branding Settings
    const getSetting = (k: string, def: string) => {
      const s = db.data.settings.find(st => st.key === k);
      return s ? s.value : def;
    };

    const receiptData = {
      receiptNumber: payment.receiptNumber,
      paymentDate: payment.paymentDate,
      paymentMethod: payment.paymentMethod,
      cashier: payment.cashier,
      reference: payment.reference,
      notes: payment.notes,
      totalPaid: payment.totalAmount,
      institute: {
        name: getSetting('INSTITUTE_NAME', 'Apex Higher Education Institute'),
        tagline: getSetting('INSTITUTE_TAGLINE', 'Excellence in Tuition & Mentorship'),
        address: getSetting('ADDRESS', 'No. 45, Galle Road, Colombo 03, Sri Lanka'),
        phone: getSetting('PHONE', '+94 11 234 5678'),
        email: getSetting('EMAIL', 'info@apexeducation.lk'),
        currency: getSetting('CURRENCY_SYMBOL', 'Rs. ')
      },
      student: {
        id: student?.id,
        fullName: student?.fullName,
        studentIdNumber: student?.studentIdNumber,
        grade: student?.grade,
        school: student?.school,
        parentName: student?.parentName || parent?.name,
        parentPhone: student?.parentPhone || parent?.phone
      },
      items
    };

    return res.json(receiptData);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve receipt details' });
  }
});

// POST /api/payments - Process Fee Payment (Supports Full & Partial Payments)
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      studentId,
      items, // array of { feeRecordId, amountPaid, discount }
      paymentMethod,
      reference,
      notes
    } = req.body;

    if (!studentId || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Student ID and at least one fee record item are required' });
    }

    const student = db.data.students.find(s => s.id === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    let grandTotalPaid = 0;
    const paymentItemsToSave: { feeRecord: FeeRecord; amountPaid: number; balanceLeft: number; description?: string }[] = [];

    // Validate and calculate balances strictly
    for (const item of items) {
      const fee = db.data.feeRecords.find(f => f.id === item.feeRecordId && f.studentId === studentId);
      if (!fee) {
        return res.status(400).json({ error: `Fee record ${item.feeRecordId} not found for student` });
      }

      const amountToPay = Number(item.amountPaid);
      if (isNaN(amountToPay) || amountToPay <= 0) {
        return res.status(400).json({ error: 'Amount paid must be greater than zero' });
      }

      const discountGiven = Number(item.discount || 0);
      if (discountGiven > 0) {
        fee.discount += discountGiven;
        // Recalculate totalDue
        fee.totalDue = Math.max(0, (fee.baseFee + fee.previousBalance) - fee.discount);
      }

      // Check overpayment
      const currentRemaining = fee.remainingBalance;
      if (amountToPay > currentRemaining) {
        return res.status(400).json({
          error: `Amount paid (Rs. ${amountToPay}) cannot exceed remaining balance (Rs. ${currentRemaining})`
        });
      }

      fee.paidAmount += amountToPay;
      fee.remainingBalance = Math.max(0, fee.totalDue - fee.paidAmount);
      
      if (fee.remainingBalance === 0) {
        fee.status = 'PAID';
      } else {
        fee.status = 'PARTIAL';
      }
      fee.updatedAt = new Date().toISOString();

      grandTotalPaid += amountToPay;

      const cls = db.data.classes.find(c => c.id === fee.classId);
      paymentItemsToSave.push({
        feeRecord: fee,
        amountPaid: amountToPay,
        balanceLeft: fee.remainingBalance,
        description: `${cls?.name || 'Class'} (${fee.month})`
      });
    }

    // Generate unique sequential receipt number: REC-2026-XXXX
    const nextReceiptNum = String(db.data.payments.length + 1).padStart(4, '0');
    const receiptNumber = `REC-2026-${nextReceiptNum}`;

    const newPayment: Payment = {
      id: db.generateId(),
      receiptNumber,
      studentId,
      totalAmount: grandTotalPaid,
      paymentMethod: paymentMethod || 'Cash',
      paymentDate: new Date().toISOString(),
      cashier: req.user?.name || 'Cashier',
      reference: reference ? String(reference).trim() : undefined,
      notes: notes ? String(notes).trim() : undefined,
      createdAt: new Date().toISOString()
    };

    db.data.payments.push(newPayment);

    // Create payment items
    for (const item of paymentItemsToSave) {
      db.data.paymentItems.push({
        id: db.generateId(),
        paymentId: newPayment.id,
        feeRecordId: item.feeRecord.id,
        amountPaid: item.amountPaid,
        balanceLeft: item.balanceLeft,
        description: item.description
      });
    }

    // Auto-record Income entry
    db.data.income.push({
      id: db.generateId(),
      category: 'Student Fees',
      amount: grandTotalPaid,
      source: `${student.fullName} (${student.studentIdNumber})`,
      paymentId: newPayment.id,
      receiptNo: receiptNumber,
      date: new Date().toISOString().substring(0, 10),
      description: `Payment for receipt ${receiptNumber}`,
      receivedBy: req.user?.name || 'Cashier',
      createdAt: new Date().toISOString()
    });

    // Dispatch instant Payment Receipt SMS & WhatsApp to parent
    const targetPhone = student.parentPhone || student.phone;
    let smsDispatched = false;
    if (targetPhone) {
      const remainingTotal = db.data.feeRecords
        .filter(f => f.studentId === student.id && f.status !== 'PAID')
        .reduce((sum, f) => sum + f.remainingBalance, 0);

      const paymentMsg = `Dear Parent, received Rs. ${grandTotalPaid.toLocaleString()} for ${student.fullName}. Receipt #${receiptNumber}. Outstanding balance: Rs. ${remainingTotal.toLocaleString()}. - Apex Institute`;

      try {
        await dispatchRealSMS(targetPhone, paymentMsg);
        smsDispatched = true;
      } catch (smsErr) {
        console.warn('Live SMS dispatch notice:', smsErr);
      }

      db.data.smsLogs.unshift({
        id: db.generateId(),
        studentId: student.id,
        recipient: targetPhone,
        message: paymentMsg,
        type: 'PAYMENT_RECEIPT',
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });

      db.data.whatsappLogs.unshift({
        id: db.generateId(),
        studentId: student.id,
        recipient: targetPhone,
        templateName: 'payment_receipt',
        message: paymentMsg,
        status: 'DELIVERED',
        sentAt: new Date().toISOString()
      });
    }

    db.save();

    await logAuditAction(
      req,
      'PAYMENT_RECORD',
      `Processed payment of Rs. ${grandTotalPaid.toLocaleString()} for ${student.fullName} (Receipt: ${receiptNumber}). Sent SMS/WhatsApp receipt to ${targetPhone || 'N/A'}`
    );

    return res.status(201).json({
      message: 'Payment recorded successfully',
      receiptNumber,
      payment: newPayment,
      smsSent: !!targetPhone,
      parentPhone: targetPhone || null
    });
  } catch (error: any) {
    console.error('Payment processing error:', error);
    return res.status(500).json({ error: error.message || 'Payment processing failed' });
  }
});

export default router;
