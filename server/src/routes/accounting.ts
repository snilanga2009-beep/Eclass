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
