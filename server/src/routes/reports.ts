import { Router, Response } from 'express';
import db from '../db';
import { AuthRequest, authenticateToken } from '../middleware/auth';

const router = Router();

// GET /api/reports/dashboard - Overview of all reports metadata & KPIs
router.get('/dashboard', authenticateToken, (req: AuthRequest, res: Response) => {
  const totalStudents = db.data.students.length;
  const activeStudents = db.data.students.filter(s => s.status === 'ACTIVE').length;
  const totalClasses = db.data.classes.length;
  const totalTeachers = db.data.teachers.length;
  const totalCollections = db.data.payments.reduce((sum, p) => sum + p.totalAmount, 0);
  const totalPending = db.data.feeRecords.filter(f => f.status !== 'PAID').reduce((sum, f) => sum + f.remainingBalance, 0);
  const totalExpenses = db.data.expenses.reduce((sum, e) => sum + e.amount, 0);
  const netIncome = totalCollections - totalExpenses;

  return res.json({
    kpis: {
      totalStudents,
      activeStudents,
      totalClasses,
      totalTeachers,
      totalCollections,
      totalPending,
      totalExpenses,
      netIncome
    },
    availableReports: [
      { id: 'students', name: 'Comprehensive Student Master Report', category: 'Students', formats: ['CSV', 'PRINT', 'PDF'] },
      { id: 'attendance', name: 'Attendance & Absenteeism Log', category: 'Attendance', formats: ['CSV', 'PRINT', 'PDF'] },
      { id: 'payments', name: 'Tuition Fee Collection Ledger', category: 'Finance', formats: ['CSV', 'PRINT', 'PDF'] },
      { id: 'pending-fees', name: 'Outstanding Fee Aging & Defaulter List', category: 'Finance', formats: ['CSV', 'PRINT', 'PDF'] },
      { id: 'teacher-payouts', name: 'Teacher Commission & Remuneration Report', category: 'HR', formats: ['CSV', 'PRINT', 'PDF'] },
      { id: 'profit-loss', name: 'Income vs. Expense Profit & Loss Statement', category: 'Accounting', formats: ['CSV', 'PRINT', 'PDF'] },
      { id: 'exam-ranks', name: 'Assessment Mark Sheets & Student Rankings', category: 'Academics', formats: ['CSV', 'PRINT', 'PDF'] }
    ]
  });
});

// GET /api/reports/export/:reportId - Returns structured data ready for CSV or PDF conversion
router.get('/export/:reportId', authenticateToken, (req: AuthRequest, res: Response) => {
  const { reportId } = req.params;

  if (reportId === 'students') {
    const data = db.data.students.map(s => {
      const parent = s.parentId ? db.data.parents.find(p => p.id === s.parentId) : null;
      return {
        'Student ID': s.studentIdNumber,
        'Full Name': s.fullName,
        'Grade': s.grade,
        'School': s.school || 'N/A',
        'Student Phone': s.phone || 'N/A',
        'Parent Name': s.parentName || parent?.name || 'N/A',
        'Parent Phone': s.parentPhone || parent?.phone || 'N/A',
        'Status': s.status,
        'Registered Date': s.registrationDate.substring(0, 10)
      };
    });
    return res.json({ title: 'Student Master Directory', data });
  }

  if (reportId === 'attendance') {
    const data = db.data.attendances.map(a => {
      const student = db.data.students.find(s => s.id === a.studentId);
      const cls = db.data.classes.find(c => c.id === a.classId);
      return {
        'Date': a.date,
        'Student ID': student?.studentIdNumber || 'N/A',
        'Student Name': student?.fullName || 'N/A',
        'Class': cls?.name || 'N/A',
        'Status': a.status,
        'Method': a.method,
        'Scanned Time': new Date(a.scannedAt).toLocaleTimeString(),
        'Recorded By': a.recordedBy || 'N/A'
      };
    });
    return res.json({ title: 'Attendance Ledger', data });
  }

  if (reportId === 'payments') {
    const data = db.data.payments.map(p => {
      const student = db.data.students.find(s => s.id === p.studentId);
      return {
        'Receipt No': p.receiptNumber,
        'Payment Date': p.paymentDate.substring(0, 10),
        'Student ID': student?.studentIdNumber || 'N/A',
        'Student Name': student?.fullName || 'N/A',
        'Amount Paid (Rs.)': p.totalAmount,
        'Payment Method': p.paymentMethod,
        'Cashier': p.cashier,
        'Reference': p.reference || 'None'
      };
    });
    return res.json({ title: 'Tuition Fee Collection Report', data });
  }

  if (reportId === 'pending-fees') {
    const pending = db.data.feeRecords.filter(f => f.status !== 'PAID' && f.remainingBalance > 0);
    const data = pending.map(f => {
      const student = db.data.students.find(s => s.id === f.studentId);
      const cls = db.data.classes.find(c => c.id === f.classId);
      return {
        'Student ID': student?.studentIdNumber || 'N/A',
        'Student Name': student?.fullName || 'N/A',
        'Class': cls?.name || 'N/A',
        'Month': f.month,
        'Base Fee (Rs.)': f.baseFee,
        'Discount (Rs.)': f.discount,
        'Total Due (Rs.)': f.totalDue,
        'Paid (Rs.)': f.paidAmount,
        'Balance Due (Rs.)': f.remainingBalance,
        'Status': f.status,
        'Parent Contact': student?.parentPhone || 'N/A'
      };
    });
    return res.json({ title: 'Outstanding Fees Defaulter Report', data });
  }

  if (reportId === 'profit-loss') {
    const totalIncome = db.data.income.reduce((sum, i) => sum + i.amount, 0);
    const totalExpenses = db.data.expenses.reduce((sum, e) => sum + e.amount, 0);
    const net = totalIncome - totalExpenses;

    const data = [
      { 'Component': 'TOTAL REVENUE (Fees & Collections)', 'Amount (Rs.)': totalIncome, 'Type': 'INCOME' },
      { 'Component': 'TOTAL OPERATING EXPENSES', 'Amount (Rs.)': totalExpenses, 'Type': 'EXPENSE' },
      { 'Component': 'NET OPERATING PROFIT / SURPLUS', 'Amount (Rs.)': net, 'Type': 'NET_INCOME' }
    ];
    return res.json({ title: 'Institute Profit & Loss Statement', data });
  }

  return res.status(404).json({ error: 'Report type not found' });
});

export default router;
