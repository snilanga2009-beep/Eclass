import { Router, Response } from 'express';
import db, { Class, ClassStudent } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/classes - List all classes with populated Teacher, Subject, Student Count
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { grade, teacherId, status } = req.query;

    let classes = [...db.data.classes];

    if (status && status !== 'ALL') {
      classes = classes.filter(c => c.status === status);
    }

    if (grade && grade !== 'ALL') {
      classes = classes.filter(c => c.grade === grade);
    }

    if (teacherId && teacherId !== 'ALL') {
      classes = classes.filter(c => c.teacherId === teacherId);
    }

    // Teacher filtering if current user is TEACHER
    if (req.user?.role === 'TEACHER' && req.user.teacherId) {
      classes = classes.filter(c => c.teacherId === req.user!.teacherId);
    }

    const populated = classes.map(cls => {
      const teacher = db.data.teachers.find(t => t.id === cls.teacherId);
      const subject = db.data.subjects.find(s => s.id === cls.subjectId);
      const enrolledCount = db.data.classStudents.filter(cs => cs.classId === cls.id && cs.status === 'ACTIVE').length;

      return {
        ...cls,
        teacher,
        subject,
        enrolledCount
      };
    });

    return res.json(populated);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch classes' });
  }
});

// GET /api/classes/subjects - List all available subjects
router.get('/subjects', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const DEFAULT_SUBJECTS = [
      { id: 'subj-math', code: 'MTH-AL', name: 'Combined Mathematics (A/L)', category: 'A/L - Science & Mathematics', description: 'G.C.E. Advanced Level Combined Mathematics' },
      { id: 'subj-phy', code: 'PHY-AL', name: 'Physics (A/L)', category: 'A/L - Science & Mathematics', description: 'G.C.E. Advanced Level Physics' },
      { id: 'subj-chem', code: 'CHM-AL', name: 'Chemistry (A/L)', category: 'A/L - Science & Mathematics', description: 'G.C.E. Advanced Level Chemistry' },
      { id: 'subj-bio', code: 'BIO-AL', name: 'Biology (A/L)', category: 'A/L - Science & Mathematics', description: 'G.C.E. Advanced Level Biology' },
      { id: 'subj-ict', code: 'ICT-AL', name: 'ICT (A/L & O/L)', category: 'Languages & Technology', description: 'Information & Communication Technology' },
      { id: 'subj-acc', code: 'ACC-AL', name: 'Accounting & Business (A/L)', category: 'A/L - Commerce & Business', description: 'Financial Accounting & Business Studies' },
      { id: 'subj-econ', code: 'ECN-AL', name: 'Economics (A/L)', category: 'A/L - Commerce & Business', description: 'Micro & Macro Economics' },
      { id: 'subj-eng', code: 'ENG-OL', name: 'English Language (O/L & General)', category: 'Languages & Technology', description: 'Grammar, Writing & Spoken English' },
      { id: 'subj-sec-math', code: 'MTH-SEC', name: 'Mathematics (Grade 6 - 11)', category: 'Junior Secondary (Grades 6-9)', description: 'Secondary school general mathematics' },
      { id: 'subj-sec-sci', code: 'SCI-SEC', name: 'Science (Grade 6 - 11)', category: 'Junior Secondary (Grades 6-9)', description: 'Integrated science curriculum' },
      { id: 'subj-sec-his', code: 'HIS-SEC', name: 'History (Grade 6 - 11)', category: 'Junior Secondary (Grades 6-9)', description: 'Sri Lankan and world history' },
      { id: 'subj-sec-com', code: 'COM-OL', name: 'Commerce & Entrepreneurship (O/L)', category: 'Ordinary Level (O/L)', description: 'Business & accounting basics' },
      { id: 'subj-scholarship', code: 'SCH-G5', name: 'Grade 5 Scholarship (ශිෂ්‍යත්වය)', category: 'Primary (Grades 1-5)', description: 'Scholarship exam questions, IQ & essays' },
      { id: 'subj-prim-math', code: 'MTH-PRI', name: 'Primary Mathematics (Grade 1 - 5)', category: 'Primary (Grades 1-5)', description: 'Early numeracy and mental math' },
      { id: 'subj-prim-eng', code: 'ENG-PRI', name: 'Primary English (Grade 1 - 5)', category: 'Primary (Grades 1-5)', description: 'Phonics, vocabulary and reading' },
      { id: 'subj-prim-sin', code: 'SIN-PRI', name: 'Primary Sinhala (Grade 1 - 5)', category: 'Primary (Grades 1-5)', description: 'Language and creative writing' },
      { id: 'subj-prim-env', code: 'ENV-PRI', name: 'Environmental Studies / පරිසරය (Grade 1 - 5)', category: 'Primary (Grades 1-5)', description: 'Science & environment discovery' }
    ];

    if (!db.data.subjects || db.data.subjects.length < DEFAULT_SUBJECTS.length) {
      if (!db.data.subjects) db.data.subjects = [];
      let added = false;
      DEFAULT_SUBJECTS.forEach(s => {
        const exist = db.data.subjects.find(e => e.id === s.id || e.name === s.name);
        if (!exist) {
          db.data.subjects.push({
            id: s.id,
            code: s.code,
            name: s.name,
            category: s.category,
            description: s.description,
            createdAt: new Date().toISOString()
          });
          added = true;
        } else if (!exist.category) {
          exist.category = s.category;
          added = true;
        }
      });
      if (added) {
        db.save();
      }
    }

    return res.json(db.data.subjects);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch subjects' });
  }
});

// POST /api/classes/subjects - Create a new subject with category
router.post('/subjects', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, code, category, description } = req.body;
    if (!name) {
      return res.status(400).json({ error: 'Subject name is required' });
    }
    const cleanCode = code || name.substring(0, 3).toUpperCase() + '-' + Math.floor(100 + Math.random() * 900);
    const newSubject = {
      id: db.generateId(),
      name: name.trim(),
      code: cleanCode,
      category: category || 'General Curriculum',
      description: description || `${name} Curriculum`,
      createdAt: new Date().toISOString()
    };
    db.data.subjects.push(newSubject);
    db.save();
    return res.status(201).json(newSubject);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create subject' });
  }
});

// GET /api/classes/:id - Get class details & enrolled student roster
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cls = db.data.classes.find(c => c.id === id);

    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const teacher = db.data.teachers.find(t => t.id === cls.teacherId);
    const subject = db.data.subjects.find(s => s.id === cls.subjectId);

    const enrolledStudents = db.data.classStudents
      .filter(cs => cs.classId === cls.id && cs.status === 'ACTIVE')
      .map(cs => {
        const student = db.data.students.find(s => s.id === cs.studentId);
        const feeRecord = db.data.feeRecords.find(f => f.studentId === cs.studentId && f.classId === cls.id && f.month === '2026-09');
        return {
          enrollmentId: cs.id,
          enrolledAt: cs.enrolledAt,
          student,
          currentFeeStatus: feeRecord?.status || 'PENDING',
          remainingBalance: feeRecord?.remainingBalance || cls.monthlyFee
        };
      });

    return res.json({
      ...cls,
      teacher,
      subject,
      enrolledCount: enrolledStudents.length,
      students: enrolledStudents
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch class details' });
  }
});

// POST /api/classes - Create new class
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      name,
      subjectId,
      teacherId,
      grade,
      classGroup,
      dayOfWeek,
      startTime,
      endTime,
      room,
      monthlyFee,
      maxStudents
    } = req.body;

    if (!name || !subjectId || !teacherId || !grade || !dayOfWeek || !startTime || !endTime || !monthlyFee) {
      return res.status(400).json({ error: 'All required class fields must be filled' });
    }

    const classCode = `CLS-${grade.replace(/\s+/g, '')}-${dayOfWeek.substring(0, 3).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;

    const newClass: Class = {
      id: db.generateId(),
      classCode,
      name: name.trim(),
      subjectId,
      teacherId,
      grade,
      classGroup: classGroup || 'Regular',
      dayOfWeek,
      startTime,
      endTime,
      room: room || 'Lecture Hall',
      monthlyFee: Number(monthlyFee),
      maxStudents: Number(maxStudents) || 60,
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.classes.push(newClass);
    db.save();

    await logAuditAction(req, 'CLASS_CREATE', `Created class ${newClass.name} (${newClass.classCode})`);

    return res.status(201).json(newClass);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create class' });
  }
});

// POST /api/classes/:id/enroll - Enroll a student
router.post('/:id/enroll', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { studentId } = req.body;

    const cls = db.data.classes.find(c => c.id === id);
    if (!cls) return res.status(404).json({ error: 'Class not found' });

    const student = db.data.students.find(s => s.id === studentId);
    if (!student) return res.status(404).json({ error: 'Student not found' });

    const existing = db.data.classStudents.find(cs => cs.classId === id && cs.studentId === studentId && cs.status === 'ACTIVE');
    if (existing) {
      return res.status(400).json({ error: 'Student is already enrolled in this class' });
    }

    db.data.classStudents.push({
      id: db.generateId(),
      classId: id,
      studentId,
      enrolledAt: new Date().toISOString(),
      status: 'ACTIVE'
    });

    // Create current month fee record if not existing
    const currentMonth = '2026-09';
    const feeExisting = db.data.feeRecords.find(f => f.classId === id && f.studentId === studentId && f.month === currentMonth);
    if (!feeExisting) {
      db.data.feeRecords.push({
        id: db.generateId(),
        studentId,
        classId: id,
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

    db.save();
    await logAuditAction(req, 'STUDENT_ENROLL', `Enrolled ${student.fullName} into ${cls.name}`);

    return res.json({ message: 'Student successfully enrolled' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to enroll student' });
  }
});

// DELETE /api/classes/:id/unenroll/:studentId - Unenroll student
router.delete('/:id/unenroll/:studentId', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id, studentId } = req.params;
    const index = db.data.classStudents.findIndex(cs => cs.classId === id && cs.studentId === studentId);
    if (index !== -1) {
      db.data.classStudents.splice(index, 1);
      db.save();
      await logAuditAction(req, 'STUDENT_UNENROLL', `Removed student from class`);
      return res.json({ message: 'Student unenrolled successfully' });
    }
    return res.status(404).json({ error: 'Enrollment not found' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to unenroll student' });
  }
});

// PUT /api/classes/:id - Edit and update class details
router.put('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const cls = db.data.classes.find(c => c.id === id);
    if (!cls) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const {
      name,
      subjectId,
      teacherId,
      grade,
      classGroup,
      dayOfWeek,
      startTime,
      endTime,
      room,
      monthlyFee,
      maxStudents,
      status
    } = req.body;

    if (name) cls.name = name.trim();
    if (subjectId) cls.subjectId = subjectId;
    if (teacherId) cls.teacherId = teacherId;
    if (grade) cls.grade = grade;
    if (classGroup !== undefined) cls.classGroup = classGroup;
    if (dayOfWeek) cls.dayOfWeek = dayOfWeek;
    if (startTime) cls.startTime = startTime;
    if (endTime) cls.endTime = endTime;
    if (room !== undefined) cls.room = room;
    if (monthlyFee !== undefined) cls.monthlyFee = Number(monthlyFee);
    if (maxStudents !== undefined) cls.maxStudents = Number(maxStudents);
    if (status) cls.status = status;
    cls.updatedAt = new Date().toISOString();

    db.save();

    await logAuditAction(req, 'CLASS_UPDATE', `Updated class ${cls.name} (${cls.classCode})`);

    const teacher = db.data.teachers.find(t => t.id === cls.teacherId);
    const subject = db.data.subjects.find(s => s.id === cls.subjectId);
    const enrolledCount = db.data.classStudents.filter(cs => cs.classId === cls.id && cs.status === 'ACTIVE').length;

    return res.json({
      ...cls,
      teacher,
      subject,
      enrolledCount
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update class' });
  }
});

// DELETE /api/classes/:id - Delete a class
router.delete('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const index = db.data.classes.findIndex(c => c.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Class not found' });
    }

    const deletedClass = db.data.classes[index];
    db.data.classes.splice(index, 1);

    // Also unenroll students from this class
    db.data.classStudents = db.data.classStudents.filter(cs => cs.classId !== id);

    db.save();

    await logAuditAction(req, 'CLASS_DELETE', `Deleted class ${deletedClass.name} (${deletedClass.classCode})`);

    return res.json({ success: true, message: `Class ${deletedClass.name} successfully deleted` });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete class' });
  }
});

export default router;
