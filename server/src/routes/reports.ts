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

  if (reportId === 'teacher-payouts') {
    const data = db.data.payments.flatMap(p => {
      const items = db.data.paymentItems.filter(pi => pi.paymentId === p.id);
      const student = db.data.students.find(s => s.id === p.studentId);
      return items.map(item => {
        const fee = db.data.feeRecords.find(f => f.id === item.feeRecordId);
        const cls = fee ? db.data.classes.find(c => c.id === fee.classId) : null;
        const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;
        const collected = item.amountPaid || 0;
        const rate = teacher?.paymentRate || 70;
        const teacherCut = Math.round((collected * rate) / 100);
        const academyCut = collected - teacherCut;
        return {
          'Receipt No': p.receiptNumber,
          'Date': p.paymentDate.substring(0, 10),
          'Teacher': teacher?.name || 'Academy Staff',
          'Class': cls?.name || 'Class',
          'Student': student?.fullName || 'Student',
          'Fee Paid (Rs.)': collected,
          'Teacher Rate (%)': `${rate}%`,
          'Teacher Earnings (Rs.)': teacherCut,
          'Academy Profit (Rs.)': academyCut
        };
      });
    });
    return res.json({ title: 'Teacher Commission & Academy Profit Report', data });
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

// GET /api/reports/teacher-commissions - Teacher Commission & Academy Net Profit with Daily, Weekly, Monthly filters
router.get('/teacher-commissions', authenticateToken, (req: AuthRequest, res: Response) => {
  const { teacherId, period, classId, subject } = req.query;

  const now = new Date();
  const todayStr = now.toISOString().substring(0, 10);
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString().substring(0, 10);
  const currentMonthStr = todayStr.substring(0, 7);

  let records: any[] = [];

  db.data.payments.forEach(payment => {
    const paymentDate = payment.paymentDate.substring(0, 10);
    const student = db.data.students.find(s => s.id === payment.studentId);
    const items = db.data.paymentItems.filter(pi => pi.paymentId === payment.id);

    items.forEach(item => {
      const feeRecord = db.data.feeRecords.find(f => f.id === item.feeRecordId);
      const cls = feeRecord ? db.data.classes.find(c => c.id === feeRecord.classId) : null;
      const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;

      if (!teacher || !cls) return;

      // Filter by teacher if specified
      if (teacherId && teacherId !== 'ALL' && teacher.id !== teacherId) return;

      // Filter by class if specified
      if (classId && classId !== 'ALL' && cls.id !== classId) return;

      // Resolve subject name for the class
      let subjectName = 'General';
      if (cls.subjectId) {
        const sub = db.data.subjects.find(s => s.id === cls.subjectId);
        if (sub && sub.name) subjectName = sub.name;
      }
      if (subjectName === 'General' && (cls as any).subject) {
        subjectName = (cls as any).subject;
      }
      if (subjectName === 'General' && teacher.courses && teacher.courses.length === 1) {
        subjectName = teacher.courses[0];
      }

      // Filter by subject if specified
      if (subject && subject !== 'ALL' && subjectName.toLowerCase() !== String(subject).toLowerCase()) return;

      const collectedAmount = item.amountPaid || 0;
      let commissionRate = 70;
      let teacherEarning = 0;
      let academyProfit = 0;

      if (teacher.paymentMethod === 'Percentage' || teacher.paymentMethod === 'DayClassCommission') {
        commissionRate = teacher.paymentRate !== undefined ? teacher.paymentRate : 70;
        teacherEarning = Math.round((collectedAmount * commissionRate) / 100);
        academyProfit = collectedAmount - teacherEarning;
      } else if (teacher.paymentMethod === 'PerStudent') {
        teacherEarning = Math.min(collectedAmount, teacher.paymentRate || 500);
        commissionRate = Math.round((teacherEarning / (collectedAmount || 1)) * 100);
        academyProfit = collectedAmount - teacherEarning;
      } else if (teacher.paymentMethod === 'FlatRate') {
        commissionRate = 70;
        teacherEarning = Math.round((collectedAmount * commissionRate) / 100);
        academyProfit = collectedAmount - teacherEarning;
      } else {
        commissionRate = teacher.paymentRate || 70;
        teacherEarning = Math.round((collectedAmount * commissionRate) / 100);
        academyProfit = collectedAmount - teacherEarning;
      }

      records.push({
        id: item.id,
        paymentId: payment.id,
        receiptNo: payment.receiptNumber,
        date: paymentDate,
        studentId: student?.id,
        studentName: student?.fullName || 'Unknown Student',
        studentIdNumber: student?.studentIdNumber || '',
        classId: cls.id,
        className: cls.name,
        subject: subjectName,
        teacherId: teacher.id,
        teacherName: teacher.name,
        teacherPhone: teacher.phone,
        paymentMethod: teacher.paymentMethod,
        commissionRate,
        collectedAmount,
        teacherEarning,
        academyProfit
      });
    });
  });

  const dailyRecords = records.filter(r => r.date === todayStr);
  const weeklyRecords = records.filter(r => r.date >= sevenDaysAgo);
  const monthlyRecords = records.filter(r => r.date.startsWith(currentMonthStr) || r.date.startsWith('2026-09') || r.date.startsWith('2026-10'));

  const sumRecords = (arr: any[]) => ({
    totalCollections: arr.reduce((s, r) => s + r.collectedAmount, 0),
    teacherEarnings: arr.reduce((s, r) => s + r.teacherEarning, 0),
    academyProfit: arr.reduce((s, r) => s + r.academyProfit, 0),
    transactionCount: arr.length,
    studentCount: new Set(arr.map(r => r.studentId)).size
  });

  const dailyStats = sumRecords(dailyRecords);
  const weeklyStats = sumRecords(weeklyRecords);
  const monthlyStats = sumRecords(monthlyRecords);
  const allStats = sumRecords(records);

  let activeRecords = monthlyRecords;
  let activeStats = monthlyStats;
  if (period === 'daily') {
    activeRecords = dailyRecords;
    activeStats = dailyStats;
  } else if (period === 'weekly') {
    activeRecords = weeklyRecords;
    activeStats = weeklyStats;
  } else if (period === 'all') {
    activeRecords = records;
    activeStats = allStats;
  }

  // Calculate Breakdown by Class
  const classMap: Record<string, any> = {};
  activeRecords.forEach(r => {
    if (!classMap[r.classId]) {
      classMap[r.classId] = {
        classId: r.classId,
        className: r.className,
        subject: r.subject,
        studentIds: new Set<string>(),
        totalCollected: 0,
        teacherEarnings: 0,
        academyProfit: 0,
        transactionCount: 0
      };
    }
    classMap[r.classId].studentIds.add(r.studentId);
    classMap[r.classId].totalCollected += r.collectedAmount;
    classMap[r.classId].teacherEarnings += r.teacherEarning;
    classMap[r.classId].academyProfit += r.academyProfit;
    classMap[r.classId].transactionCount += 1;
  });

  const breakdownByClass = Object.values(classMap).map(c => ({
    classId: c.classId,
    className: c.className,
    subject: c.subject,
    studentCount: c.studentIds.size,
    totalCollected: c.totalCollected,
    teacherEarnings: c.teacherEarnings,
    academyProfit: c.academyProfit,
    transactionCount: c.transactionCount
  }));

  // Calculate Breakdown by Subject / Course
  const subjectMap: Record<string, any> = {};
  activeRecords.forEach(r => {
    const sub = r.subject || 'General';
    if (!subjectMap[sub]) {
      subjectMap[sub] = {
        subject: sub,
        studentIds: new Set<string>(),
        totalCollected: 0,
        teacherEarnings: 0,
        academyProfit: 0,
        transactionCount: 0
      };
    }
    subjectMap[sub].studentIds.add(r.studentId);
    subjectMap[sub].totalCollected += r.collectedAmount;
    subjectMap[sub].teacherEarnings += r.teacherEarning;
    subjectMap[sub].academyProfit += r.academyProfit;
    subjectMap[sub].transactionCount += 1;
  });

  const breakdownBySubject = Object.values(subjectMap).map(s => ({
    subject: s.subject,
    studentCount: s.studentIds.size,
    totalCollected: s.totalCollected,
    teacherEarnings: s.teacherEarnings,
    academyProfit: s.academyProfit,
    transactionCount: s.transactionCount
  }));

  const teachersList = db.data.teachers.map(t => ({
    id: t.id,
    name: t.name,
    phone: t.phone,
    paymentMethod: t.paymentMethod,
    paymentRate: t.paymentRate,
    courses: t.courses || []
  }));

  // Available classes for filtering
  let candidateClasses = db.data.classes;
  if (teacherId && teacherId !== 'ALL') {
    candidateClasses = db.data.classes.filter(c => c.teacherId === teacherId);
  }
  const availableClasses = candidateClasses.map(c => {
    let subName = 'General';
    if (c.subjectId) {
      const sub = db.data.subjects.find(s => s.id === c.subjectId);
      if (sub && sub.name) subName = sub.name;
    }
    return {
      id: c.id,
      name: c.name,
      teacherId: c.teacherId,
      subject: subName
    };
  });

  // Available subjects for filtering
  const subjectSet = new Set<string>();
  if (teacherId && teacherId !== 'ALL') {
    const chosenTeacher = db.data.teachers.find(t => t.id === teacherId);
    if (chosenTeacher?.courses) {
      chosenTeacher.courses.forEach(c => subjectSet.add(c.trim()));
    }
    candidateClasses.forEach(c => {
      if (c.subjectId) {
        const sub = db.data.subjects.find(s => s.id === c.subjectId);
        if (sub?.name) subjectSet.add(sub.name.trim());
      }
    });
  } else {
    db.data.subjects.forEach(s => subjectSet.add(s.name.trim()));
    db.data.teachers.forEach(t => {
      if (t.courses) t.courses.forEach(c => subjectSet.add(c.trim()));
    });
  }
  const availableSubjects = Array.from(subjectSet).filter(Boolean).sort();

  return res.json({
    period: period || 'monthly',
    selectedTeacherId: teacherId || 'ALL',
    selectedClassId: classId || 'ALL',
    selectedSubject: subject || 'ALL',
    teachers: teachersList,
    availableClasses,
    availableSubjects,
    dailyStats,
    weeklyStats,
    monthlyStats,
    allStats,
    activeStats,
    breakdownByClass,
    breakdownBySubject,
    records: activeRecords
  });
});

export default router;
