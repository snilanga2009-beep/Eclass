import { Router, Response } from 'express';
import db, { Expense, Income, TeacherPayment } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/accounting/summary - Real-time Financial KPIs & P&L Summary
router.get('/summary', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const today = new Date().toISOString().substring(0, 10);
    const currentMonth = '2026-09';

    // Income computations
    const allIncome = db.data.income;
    const todayIncome = allIncome
      .filter(i => i.date === today)
      .reduce((sum, i) => sum + i.amount, 0);

    const monthlyIncome = allIncome
      .filter(i => i.date.startsWith(currentMonth))
      .reduce((sum, i) => sum + i.amount, 0);

    const totalIncome = allIncome.reduce((sum, i) => sum + i.amount, 0);

    // Expense computations
    const allExpenses = db.data.expenses;
    const todayExpenses = allExpenses
      .filter(e => e.date === today)
      .reduce((sum, e) => sum + e.amount, 0);

    const monthlyExpenses = allExpenses
      .filter(e => e.date.startsWith(currentMonth))
      .reduce((sum, e) => sum + e.amount, 0);

    const totalExpenses = allExpenses.reduce((sum, e) => sum + e.amount, 0);

    // Outstanding / Pending Fees
    const outstandingFees = db.data.feeRecords
      .filter(f => f.status !== 'PAID' && f.remainingBalance > 0)
      .reduce((sum, f) => sum + f.remainingBalance, 0);

    // Net Income = Total Income - Total Expenses
    const monthlyNetIncome = monthlyIncome - monthlyExpenses;
    const totalNetIncome = totalIncome - totalExpenses;

    // Income breakdown by category
    const incomeCategories: { [key: string]: number } = {};
    allIncome.forEach(i => {
      incomeCategories[i.category] = (incomeCategories[i.category] || 0) + i.amount;
    });

    // Expense breakdown by category
    const expenseCategories: { [key: string]: number } = {};
    allExpenses.forEach(e => {
      expenseCategories[e.category] = (expenseCategories[e.category] || 0) + e.amount;
    });

    return res.json({
      todayIncome,
      todayExpenses,
      monthlyIncome,
      monthlyExpenses,
      monthlyNetIncome,
      totalIncome,
      totalExpenses,
      totalNetIncome,
      outstandingFees,
      incomeCategories,
      expenseCategories
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to compute accounting summary' });
  }
});

// GET /api/accounting/daily-collection - Comprehensive Daily Collection, Earnings, & Cash Drawer Handover Report
router.get('/daily-collection', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const todayStr = new Date().toISOString().substring(0, 10);
    const targetDate = String(req.query.date || todayStr);

    // Filter payments for target date
    const dayPayments = db.data.payments.filter(p => p.paymentDate && p.paymentDate.startsWith(targetDate));

    // Summary Totals
    const totalCollected = dayPayments.reduce((sum, p) => sum + (p.totalAmount || 0), 0);
    const receiptCount = dayPayments.length;

    // Payment Methods Breakdown
    let cashInHand = 0;
    let cardAmount = 0;
    let bankTransferAmount = 0;
    let onlineAmount = 0;
    let otherMethodAmount = 0;

    dayPayments.forEach(p => {
      const amt = p.totalAmount || 0;
      const m = (p.paymentMethod || '').toLowerCase();
      if (m.includes('cash')) {
        cashInHand += amt;
      } else if (m.includes('card')) {
        cardAmount += amt;
      } else if (m.includes('bank')) {
        bankTransferAmount += amt;
      } else if (m.includes('online')) {
        onlineAmount += amt;
      } else {
        otherMethodAmount += amt;
      }
    });

    const digitalAndBank = cardAmount + bankTransferAmount + onlineAmount + otherMethodAmount;

    // Daily Expenses (Petty cash / payouts paid out today)
    const dayExpenses = db.data.expenses.filter(e => e.date && e.date.startsWith(targetDate));
    const totalExpensesToday = dayExpenses.reduce((sum, e) => sum + (e.amount || 0), 0);
    const netCashDrawerBalance = Math.max(0, cashInHand - totalExpensesToday);

    // Cashier Breakdown (Front Office Staff who collected fees)
    const cashierMap: { [key: string]: { name: string; receiptCount: number; totalCollected: number; cash: number; digital: number } } = {};
    dayPayments.forEach(p => {
      const cashierName = p.cashier || 'Front Desk Staff';
      if (!cashierMap[cashierName]) {
        cashierMap[cashierName] = { name: cashierName, receiptCount: 0, totalCollected: 0, cash: 0, digital: 0 };
      }
      cashierMap[cashierName].receiptCount += 1;
      cashierMap[cashierName].totalCollected += p.totalAmount || 0;
      if ((p.paymentMethod || '').toLowerCase().includes('cash')) {
        cashierMap[cashierName].cash += p.totalAmount || 0;
      } else {
        cashierMap[cashierName].digital += p.totalAmount || 0;
      }
    });

    // Class & Teacher Commission Breakdown
    const classRevenueMap: { 
      [key: string]: { 
        classId: string; 
        className: string; 
        classCode: string; 
        grade: string;
        teacherName: string; 
        rate: number;
        totalCollected: number; 
        studentCount: number;
        teacherShare: number; 
        academyShare: number;
      } 
    } = {};

    let totalTeacherCommissions = 0;
    let totalAcademyShare = 0;

    dayPayments.forEach(p => {
      const items = db.data.paymentItems.filter(pi => pi.paymentId === p.id);
      items.forEach(pi => {
        const fee = db.data.feeRecords.find(f => f.id === pi.feeRecordId);
        const cls = fee ? db.data.classes.find(c => c.id === fee.classId) : null;
        const teacher = cls ? db.data.teachers.find(t => t.id === cls.teacherId) : null;

        const classKey = cls ? cls.id : 'GENERAL';
        const isPercentage = !teacher || teacher.paymentMethod === 'Percentage' || (teacher.paymentRate && teacher.paymentRate <= 100);
        const rate = isPercentage ? (teacher?.paymentRate || 70) : 70;
        const amt = pi.amountPaid || 0;
        const teacherPortion = Math.round(amt * (rate / 100));
        const academyPortion = Math.max(0, amt - teacherPortion);

        totalTeacherCommissions += teacherPortion;
        totalAcademyShare += academyPortion;

        if (!classRevenueMap[classKey]) {
          classRevenueMap[classKey] = {
            classId: classKey,
            className: cls?.name || 'General Tuition Fees',
            classCode: cls?.classCode || 'GEN-FEE',
            grade: cls?.grade || 'General',
            teacherName: teacher?.name || 'Academy Staff',
            rate,
            totalCollected: 0,
            studentCount: 0,
            teacherShare: 0,
            academyShare: 0
          };
        }

        classRevenueMap[classKey].totalCollected += amt;
        classRevenueMap[classKey].studentCount += 1;
        classRevenueMap[classKey].teacherShare += teacherPortion;
        classRevenueMap[classKey].academyShare += academyPortion;
      });
    });

    // Populate day's transactions with student names and items
    const transactions = dayPayments.map(p => {
      const student = db.data.students.find(s => s.id === p.studentId);
      const items = db.data.paymentItems
        .filter(pi => pi.paymentId === p.id)
        .map(pi => {
          const fee = db.data.feeRecords.find(f => f.id === pi.feeRecordId);
          const cls = fee ? db.data.classes.find(c => c.id === fee.classId) : null;
          return {
            ...pi,
            className: cls?.name || 'Tuition Class',
            month: fee?.month || ''
          };
        });

      return {
        id: p.id,
        receiptNumber: p.receiptNumber,
        studentIdNumber: student?.studentIdNumber || 'N/A',
        studentName: student?.fullName || 'Student',
        totalAmount: p.totalAmount,
        paymentMethod: p.paymentMethod,
        paymentDate: p.paymentDate,
        cashier: p.cashier,
        items
      };
    }).sort((a, b) => new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime());

    // Hourly Distribution for the day
    const hourlyMap: { [slot: string]: number } = {
      '07:00 - 09:00': 0,
      '09:00 - 11:00': 0,
      '11:00 - 13:00': 0,
      '13:00 - 15:00': 0,
      '15:00 - 17:00': 0,
      '17:00 - 19:00': 0,
      '19:00 - 21:00': 0
    };

    dayPayments.forEach(p => {
      try {
        const hour = new Date(p.paymentDate).getHours();
        if (hour >= 7 && hour < 9) hourlyMap['07:00 - 09:00'] += p.totalAmount;
        else if (hour >= 9 && hour < 11) hourlyMap['09:00 - 11:00'] += p.totalAmount;
        else if (hour >= 11 && hour < 13) hourlyMap['11:00 - 13:00'] += p.totalAmount;
        else if (hour >= 13 && hour < 15) hourlyMap['13:00 - 15:00'] += p.totalAmount;
        else if (hour >= 15 && hour < 17) hourlyMap['15:00 - 17:00'] += p.totalAmount;
        else if (hour >= 17 && hour < 19) hourlyMap['17:00 - 19:00'] += p.totalAmount;
        else hourlyMap['19:00 - 21:00'] += p.totalAmount;
      } catch {
        hourlyMap['09:00 - 11:00'] += p.totalAmount;
      }
    });

    return res.json({
      date: targetDate,
      totalCollected,
      receiptCount,
      methods: {
        cash: cashInHand,
        card: cardAmount,
        bankTransfer: bankTransferAmount,
        online: onlineAmount,
        other: otherMethodAmount,
        digitalTotal: digitalAndBank
      },
      drawerSettlement: {
        cashCollected: cashInHand,
        expensesPaidOut: totalExpensesToday,
        netCashToHandover: netCashDrawerBalance,
        digitalTotal: digitalAndBank
      },
      profitSharing: {
        totalCollected,
        teacherCommissions: totalTeacherCommissions,
        academyNetShare: totalAcademyShare > 0 ? totalAcademyShare : (totalCollected - totalTeacherCommissions)
      },
      byClass: Object.values(classRevenueMap),
      byCashier: Object.values(cashierMap),
      hourlyBreakdown: Object.entries(hourlyMap).map(([timeSlot, amount]) => ({ timeSlot, amount })),
      expensesToday: dayExpenses,
      transactions
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to generate daily collection report' });
  }
});

// GET /api/accounting/expenses - List Expenses
router.get('/expenses', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category, month } = req.query;
    let list = [...db.data.expenses];

    if (category && category !== 'ALL') {
      list = list.filter(e => e.category === category);
    }

    if (month && month !== 'ALL') {
      list = list.filter(e => e.date.startsWith(String(month)));
    }

    return res.json(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// POST /api/accounting/expenses - Create new expense
router.post('/expenses', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req: AuthRequest, res: Response) => {
  try {
    const { category, title, amount, date, paidTo, paymentMethod, receiptNo, description } = req.body;

    if (!category || !title || !amount) {
      return res.status(400).json({ error: 'Category, title, and amount are required' });
    }

    const newExpense: Expense = {
      id: db.generateId(),
      category,
      title: title.trim(),
      amount: Number(amount),
      date: date || new Date().toISOString().substring(0, 10),
      paidTo: paidTo ? paidTo.trim() : undefined,
      paymentMethod: paymentMethod || 'Cash',
      receiptNo: receiptNo ? receiptNo.trim() : undefined,
      description: description ? description.trim() : undefined,
      recordedBy: req.user?.name || 'Staff',
      createdAt: new Date().toISOString()
    };

    db.data.expenses.unshift(newExpense);
    db.save();

    await logAuditAction(req, 'EXPENSE_CREATE', `Added expense "${newExpense.title}" of Rs. ${newExpense.amount.toLocaleString()} (${newExpense.category})`);

    return res.status(201).json(newExpense);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record expense' });
  }
});

// GET /api/accounting/income - List Income
router.get('/income', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { category, month } = req.query;
    let list = [...db.data.income];

    if (category && category !== 'ALL') {
      list = list.filter(i => i.category === category);
    }

    if (month && month !== 'ALL') {
      list = list.filter(i => i.date.startsWith(String(month)));
    }

    return res.json(list.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch income' });
  }
});

// POST /api/accounting/income - Create miscellaneous income
router.post('/income', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req: AuthRequest, res: Response) => {
  try {
    const { category, amount, source, date, description } = req.body;
    if (!category || !amount) {
      return res.status(400).json({ error: 'Category and amount are required' });
    }

    const receiptNo = `INC-2026-${Math.floor(1000 + Math.random() * 9000)}`;

    const newIncome: Income = {
      id: db.generateId(),
      category,
      amount: Number(amount),
      source: source || 'Direct Collection',
      receiptNo,
      date: date || new Date().toISOString().substring(0, 10),
      description: description || undefined,
      receivedBy: req.user?.name || 'Cashier',
      createdAt: new Date().toISOString()
    };

    db.data.income.unshift(newIncome);
    db.save();

    await logAuditAction(req, 'INCOME_CREATE', `Added income "${newIncome.category}" of Rs. ${newIncome.amount.toLocaleString()}`);

    return res.status(201).json(newIncome);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record income' });
  }
});

// GET /api/accounting/teacher-commissions - Calculate teacher earnings & commissions
router.get('/teacher-commissions', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { month } = req.query;
    const targetMonth = String(month || '2026-09');

    const commissionReport = db.data.teachers.map(teacher => {
      // Find classes taught by this teacher
      const teacherClasses = db.data.classes.filter(c => c.teacherId === teacher.id);
      const classIds = new Set(teacherClasses.map(c => c.id));

      // Find all fee records for these classes in the target month
      const relevantFees = db.data.feeRecords.filter(f => classIds.has(f.classId) && f.month === targetMonth);
      const totalCollected = relevantFees.reduce((sum, f) => sum + f.paidAmount, 0);
      const totalReceivable = relevantFees.reduce((sum, f) => sum + f.totalDue, 0);

      // Payout calculation based on teacher payout method
      const commissionRate = teacher.paymentRate !== undefined ? teacher.paymentRate : 70.0;
      let commissionAmount = 0;

      if (teacher.paymentMethod === 'FlatRate') {
        commissionAmount = commissionRate;
      } else if (teacher.paymentMethod === 'PerStudent') {
        const activePaidStudents = relevantFees.filter(f => f.paidAmount > 0).length;
        commissionAmount = commissionRate * (activePaidStudents || relevantFees.length);
      } else if (teacher.paymentMethod === 'Hourly') {
        commissionAmount = commissionRate;
      } else {
        // Percentage (Default)
        commissionAmount = Math.round(totalCollected * (commissionRate / 100));
      }

      // Check if already paid
      const existingPayout = db.data.teacherPayments.find(tp => tp.teacherId === teacher.id && tp.month === targetMonth);

      return {
        teacher,
        month: targetMonth,
        classCount: teacherClasses.length,
        studentCount: relevantFees.length,
        totalReceivable,
        totalCollected,
        commissionRate,
        commissionAmount,
        isPaid: !!existingPayout,
        payoutRecord: existingPayout || null
      };
    });

    return res.json(commissionReport);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to calculate teacher commissions' });
  }
});

// POST /api/accounting/teacher-commissions/pay - Pay teacher commission
router.post('/teacher-commissions/pay', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT']), async (req: AuthRequest, res: Response) => {
  try {
    const { teacherId, month, amount, paymentMethod, referenceNo, notes } = req.body;
    const teacher = db.data.teachers.find(t => t.id === teacherId);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const newPayout: TeacherPayment = {
      id: db.generateId(),
      teacherId,
      month: month || '2026-09',
      totalRevenue: teacher.paymentMethod === 'Percentage' && teacher.paymentRate > 0 
        ? Number(amount) / (teacher.paymentRate / 100) 
        : Number(amount),
      rate: teacher.paymentRate,
      payoutAmount: Number(amount),
      status: 'PAID',
      paidDate: new Date().toISOString().substring(0, 10),
      paymentMethod: paymentMethod || 'Bank Transfer',
      referenceNo: referenceNo || `TXN-${Math.floor(100000 + Math.random() * 900000)}`,
      notes: notes || `Commission payout for ${month}`,
      createdAt: new Date().toISOString()
    };

    db.data.teacherPayments.push(newPayout);

    // Also record an Expense entry for Teacher Payments
    db.data.expenses.push({
      id: db.generateId(),
      category: 'Teacher Payments',
      title: `Teacher Commission: ${teacher.name} (${month})`,
      amount: Number(amount),
      date: new Date().toISOString().substring(0, 10),
      paidTo: teacher.name,
      paymentMethod: paymentMethod || 'Bank Transfer',
      receiptNo: newPayout.referenceNo,
      recordedBy: req.user?.name || 'Accountant',
      createdAt: new Date().toISOString()
    });

    db.save();

    await logAuditAction(req, 'TEACHER_PAYOUT', `Processed commission payout of Rs. ${newPayout.payoutAmount.toLocaleString()} to ${teacher.name}`);

    return res.status(201).json(newPayout);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record teacher payout' });
  }
});

export default router;
