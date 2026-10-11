import { Router, Response } from 'express';
import db, { Exam, ExamResult } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

const computeGrade = (marks: number, totalMarks: number = 100, passMarks: number = 40): 'A' | 'B' | 'C' | 'S' | 'F' => {
  const max = totalMarks > 0 ? totalMarks : 100;
  const pct = (marks / max) * 100;
  const passPct = (passMarks / max) * 100;
  if (pct >= 75) return 'A';
  if (pct >= 65) return 'B';
  if (pct >= 55) return 'C';
  if (pct >= passPct) return 'S';
  return 'F';
};

// GET /api/exams - List all exams with stats, subjects & classes metadata
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
      const cls = e.classId ? db.data.classes.find(c => c.id === e.classId) : null;
      const subject = db.data.subjects.find(s => s.id === e.subjectId) || 
        (cls ? db.data.subjects.find(s => s.id === cls.subjectId) : undefined) ||
        { id: e.subjectId, name: cls?.name || 'General Subject', code: 'SUB' };

      const results = db.data.examResults.filter(r => r.examId === e.id);
      const totalStudents = results.length;
      const averageMarks = totalStudents > 0 
        ? Math.round(results.reduce((sum, r) => sum + r.marks, 0) / totalStudents) 
        : 0;
      const highestMarks = totalStudents > 0
        ? Math.max(...results.map(r => r.marks))
        : 0;
      const passCount = results.filter(r => r.marks >= (e.passMarks || 40)).length;

      return {
        ...e,
        subject,
        class: cls,
        totalStudents,
        averageMarks,
        highestMarks,
        passCount
      };
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exams' });
  }
});

// GET /api/exams/:id - Get exam details with all graded student marks & class student roster
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const exam = db.data.exams.find(e => e.id === id);
    if (!exam) return res.status(404).json({ error: 'Exam not found' });

    const cls = exam.classId ? db.data.classes.find(c => c.id === exam.classId) : null;
    const subject = db.data.subjects.find(s => s.id === exam.subjectId) ||
      (cls ? db.data.subjects.find(s => s.id === cls.subjectId) : undefined) ||
      { id: exam.subjectId, name: cls?.name || 'General Subject', code: 'SUB' };

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

    // Dynamic rank assignment (handling ties cleanly)
    results.forEach((r, idx) => {
      r.rank = idx + 1;
    });

    // Build class roster so teachers can immediately enter marks for enrolled students
    let enrolledStudentIds: string[] = [];
    if (exam.classId) {
      enrolledStudentIds = db.data.classStudents
        .filter(cs => cs.classId === exam.classId && cs.status === 'ACTIVE')
        .map(cs => cs.studentId);
    } else if (exam.subjectId) {
      const matchingClassIds = db.data.classes
        .filter(c => c.subjectId === exam.subjectId)
        .map(c => c.id);
      enrolledStudentIds = Array.from(new Set(
        db.data.classStudents
          .filter(cs => matchingClassIds.includes(cs.classId) && cs.status === 'ACTIVE')
          .map(cs => cs.studentId)
      ));
    }

    const classRoster = db.data.students
      .filter(s => enrolledStudentIds.includes(s.id) && s.status === 'ACTIVE')
      .map(s => ({
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullName: s.fullName,
        grade: s.grade
      }));

    const allStudents = db.data.students
      .filter(s => s.status === 'ACTIVE')
      .map(s => ({
        id: s.id,
        studentIdNumber: s.studentIdNumber,
        fullName: s.fullName,
        grade: s.grade
      }));

    return res.json({
      ...exam,
      subject,
      class: cls,
      results,
      classRoster,
      allStudents
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch exam results' });
  }
});

// POST /api/exams - Create new exam
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { title, examType, subjectId, classId, date, totalMarks, passMarks } = req.body;
    if (!title || !date) {
      return res.status(400).json({ error: 'Title and date are required' });
    }

    let resolvedSubjectId = subjectId;
    if (classId) {
      const cls = db.data.classes.find(c => c.id === classId);
      if (cls && (!resolvedSubjectId || resolvedSubjectId === 'ALL')) {
        resolvedSubjectId = cls.subjectId;
      }
    }
    if (!resolvedSubjectId) {
      resolvedSubjectId = db.data.subjects[0]?.id || 'subj-math';
    }

    const newExam: Exam = {
      id: db.generateId(),
      title: title.trim(),
      examType: examType || 'Monthly Test',
      subjectId: resolvedSubjectId,
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

// PUT /api/exams/:id - Update existing exam details
router.put('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const examIndex = db.data.exams.findIndex(e => e.id === id);
    if (examIndex === -1) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const { title, examType, subjectId, classId, date, totalMarks, passMarks } = req.body;
    const existing = db.data.exams[examIndex];

    let resolvedSubjectId = subjectId !== undefined ? subjectId : existing.subjectId;
    if (classId) {
      const cls = db.data.classes.find(c => c.id === classId);
      if (cls && cls.subjectId && !subjectId) {
        resolvedSubjectId = cls.subjectId;
      }
    }

    const updatedTotalMarks = totalMarks !== undefined ? Number(totalMarks) : existing.totalMarks;
    const updatedPassMarks = passMarks !== undefined ? Number(passMarks) : existing.passMarks;

    db.data.exams[examIndex] = {
      ...existing,
      title: title ? title.trim() : existing.title,
      examType: examType || existing.examType,
      subjectId: resolvedSubjectId,
      classId: classId !== undefined ? (classId || undefined) : existing.classId,
      date: date || existing.date,
      totalMarks: updatedTotalMarks,
      passMarks: updatedPassMarks
    };

    // Re-evaluate grades for any existing results of this exam
    db.data.examResults.forEach(r => {
      if (r.examId === id) {
        r.grade = computeGrade(r.marks, updatedTotalMarks, updatedPassMarks);
      }
    });

    db.save();
    await logAuditAction(req, 'EXAM_UPDATE', `Updated assessment "${db.data.exams[examIndex].title}"`);

    return res.json(db.data.exams[examIndex]);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update assessment' });
  }
});

// DELETE /api/exams/:id - Delete an assessment and its results
router.delete('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const exam = db.data.exams.find(e => e.id === id);
    if (!exam) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    db.data.exams = db.data.exams.filter(e => e.id !== id);
    db.data.examResults = db.data.examResults.filter(r => r.examId !== id);
    db.save();

    await logAuditAction(req, 'EXAM_DELETE', `Deleted assessment "${exam.title}"`);
    return res.json({ message: 'Assessment deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete assessment' });
  }
});

// POST /api/exams/:id/results - Batch or Single Record/Edit Student Marks
router.post('/:id/results', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const exam = db.data.exams.find(e => e.id === id);
    if (!exam) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const { results } = req.body; // array of { studentId, marks, comment }

    if (!Array.isArray(results)) {
      return res.status(400).json({ error: 'Results array is required' });
    }

    for (const item of results) {
      if (!item.studentId) continue;

      if (item.marks === '' || item.marks === null || item.marks === undefined) {
        continue;
      }

      const marks = Math.max(0, Math.min(Number(item.marks), exam.totalMarks || 100));
      const grade = computeGrade(marks, exam.totalMarks || 100, exam.passMarks || 40);

      const existingIndex = db.data.examResults.findIndex(r => r.examId === id && r.studentId === item.studentId);
      if (existingIndex !== -1) {
        db.data.examResults[existingIndex].marks = marks;
        db.data.examResults[existingIndex].grade = grade;
        db.data.examResults[existingIndex].comment = item.comment !== undefined ? (item.comment || undefined) : db.data.examResults[existingIndex].comment;
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
    await logAuditAction(req, 'EXAM_MARKS_RECORD', `Updated marks for "${exam.title}" (${results.length} entries)`);

    return res.json({ message: 'Student marks saved and ranked successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to record marks' });
  }
});

// DELETE /api/exams/:id/results/:studentId - Remove a student's result from an exam
router.delete('/:id/results/:studentId', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { id, studentId } = req.params;
    db.data.examResults = db.data.examResults.filter(r => !(r.examId === id && r.studentId === studentId));
    db.save();
    return res.json({ message: 'Student mark entry removed' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to remove student mark' });
  }
});

export default router;
