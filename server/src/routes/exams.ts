import { Router, Response } from 'express';
import db, { Exam, ExamResult } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/exams - List all exams
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { classId, subjectId } = req.query;
    let list = [...db.data.exams];

    if (classId && classId !== 'ALL') {
      list = list.filter(e => e.classId === classId);
    }

    if (subjectId && subjectId !== 'ALL') {
      list = list.filter(e => e.subjectId === subjectId);
    }

    const populated = list.map(e => {
      const subject = db.data.subjects.find(s => s.id === e.subjectId);
      const cls = e.classId ? db.data.classes.find(c => c.id === e.classId) : null;
      const results = db.data.examResults.filter(r => r.examId === e.id);
      const totalStudents = results.length;
      const averageMarks = totalStudents > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.marks, 0) / totalStudents) 
        : 0;

      return {
        ...e,
        subject,
        class: cls,
        totalStudents,
        averageMarks
      };
    });

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id - Get exam details with all graded student marks
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const exam = db.data.exams.find(e => e.id === id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const subject = db.data.subjects.find(s => s.id === exam.subjectId);
    const cls = exam.classId ? db.data.classes.find(c => c.id === exam.classId) : null;

    const results = db.data.examResults
      .filter(r => r.examId === exam.id)
      .map(r => {
        const student = db.data.students.find(s => s.id === r.studentId);
        return {
          ...r,
          student
        };
      })
      .sort((a, b) => b.marks - a.marks);

    // Dynamic rank assignment
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    return res.json({
      ...exam,
      subject,
      class: cls,
      results
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

// POST /api/exams - Create new exam
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { title, examType, subjectId, classId, date, totalMarks, passMarks } = req.body;
    if (!title || !subjectId || !date) {
      return res.status(400).json({ error: 'Title, subject, and date are required' });
    }

    const newExam: Exam = {
      id: db.generateId(),
      title: title.trim(),
      examType: examType || 'Monthly Test',
      subjectId,
      classId: classId || undefined,
      date,
      totalMarks: Number(totalMarks) || 100,
      passMarks: Number(passMarks) || 40,
      createdAt: new Date().toISOString()
    };

    db.data.exams.push(newExam);
    db.save();

    await logAuditAction(req, 'EXAM_CREATE', `Created assessment "${newExam.title}" (${newExam.examType})`);

    return res.status(201).json(newExam);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create exam' });
  }
});

// POST /api/exams/:id/results - Batch Record Marks
router.post('/:id/results', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { results } = req.body; // array of { studentId, marks, comment }

    if (!Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    for (const item of results) {
      const marks = Number(item.marks);
      let grade: 'A' | 'B' | 'C' | 'S' | 'F' = 'F';
      if (marks >= 75) grade = 'A';
      else if (marks >= 65) grade = 'B';
      else if (marks >= 55) grade = 'C';
      else if (marks >= 40) grade = 'S';

      const existingIndex = db.data.examResults.findIndex(r => r.examId === id && r.studentId === item.studentId);
      if (existingIndex !== -1) {
        db.data.examResults[existingIndex].marks = marks;
        db.data.examResults[existingIndex].grade = grade;
        db.data.examResults[existingIndex].comment = item.comment || undefined;
      } else {
        db.data.examResults.push({
          id: db.generateId(),
          examId: id,
          studentId: item.studentId,
          marks,
          grade,
          comment: item.comment || undefined,
          createdAt: new Date().toISOString()
        });
      }
    }

    db.save();
    await logAuditAction(req, 'EXAM_MARKS_RECORD', `Recorded marks for ${results.length} students`);

    return res.json({ message: 'Exam marks recorded successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record marks' });
  }
});

export default router;
