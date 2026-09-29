import { Router, Response } from 'express';
import db, { Teacher } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/teachers - List all teachers with assigned classes & stats
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const teachers = db.data.teachers.map(t => {
      const classes = db.data.classes.filter(c => c.teacherId === t.id);
      const totalStudents = db.data.classStudents.filter(cs => 
        classes.some(c => c.id === cs.classId) && cs.status === 'ACTIVE'
      ).length;

      return {
        ...t,
        classes,
        classCount: classes.length,
        totalStudents
      };
    });

    return res.json(teachers);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch teachers' });
  }
});

// GET /api/teachers/:id - Teacher Profile & Dashboard Data
router.get('/:id', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacher = db.data.teachers.find(t => t.id === id);
    if (!teacher) return res.status(404).json({ error: 'Teacher not found' });

    const classes = db.data.classes.filter(c => c.teacherId === tId(id)).map(cls => {
      const subject = db.data.subjects.find(s => s.id === cls.subjectId);
      const enrolledCount = db.data.classStudents.filter(cs => cs.classId === cls.id && cs.status === 'ACTIVE').length;
      return {
        ...cls,
        subject,
        enrolledCount
      };
    });

    const materials = db.data.learningMaterials.filter(m => m.teacherId === teacher.id);
    const payouts = db.data.teacherPayments.filter(p => p.teacherId === teacher.id);

    return res.json({
      ...teacher,
      classes,
      materials,
      payouts
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch teacher profile' });
  }
});

function tId(id: string) { return id; }

// POST /api/teachers - Create Teacher
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, phone, email, qualifications, paymentRate, paymentMethod, photo } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const nextNum = String(db.data.teachers.length + 1).padStart(3, '0');
    const teacherIdNumber = `TCH-${nextNum}`;

    const newTeacher: Teacher = {
      id: db.generateId(),
      teacherIdNumber,
      name: name.trim(),
      phone: phone.trim(),
      email: email ? email.trim() : undefined,
      qualifications: qualifications ? qualifications.trim() : undefined,
      paymentRate: Number(paymentRate) || 70.0,
      paymentMethod: paymentMethod || 'Percentage',
      photo: photo || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      status: 'ACTIVE',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.teachers.push(newTeacher);
    db.save();

    await logAuditAction(req, 'TEACHER_CREATE', `Created teacher ${newTeacher.name} (${newTeacher.teacherIdNumber})`);

    return res.status(201).json(newTeacher);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to create teacher' });
  }
});

// PUT /api/teachers/:id - Update Teacher
router.put('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherIndex = db.data.teachers.findIndex(t => t.id === id);
    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const { name, phone, email, qualifications, address, paymentRate, paymentMethod, photo, status } = req.body;
    if (!name || !phone) {
      return res.status(400).json({ error: 'Name and phone are required' });
    }

    const currentTeacher = db.data.teachers[teacherIndex];
    const updatedTeacher: Teacher = {
      ...currentTeacher,
      name: name.trim(),
      phone: phone.trim(),
      email: email !== undefined ? email.trim() : currentTeacher.email,
      qualifications: qualifications !== undefined ? qualifications.trim() : currentTeacher.qualifications,
      address: address !== undefined ? address.trim() : currentTeacher.address,
      paymentRate: paymentRate !== undefined ? Number(paymentRate) : currentTeacher.paymentRate,
      paymentMethod: paymentMethod || currentTeacher.paymentMethod,
      photo: photo || currentTeacher.photo,
      status: (status === 'INACTIVE' ? 'INACTIVE' : 'ACTIVE') as 'ACTIVE' | 'INACTIVE',
      updatedAt: new Date().toISOString()
    };

    db.data.teachers[teacherIndex] = updatedTeacher;
    db.save();

    await logAuditAction(req, 'TEACHER_UPDATE', `Updated teacher ${updatedTeacher.name} (${updatedTeacher.teacherIdNumber})`);

    const classes = db.data.classes.filter(c => c.teacherId === updatedTeacher.id);
    const totalStudents = db.data.classStudents.filter(cs => 
      classes.some(c => c.id === cs.classId) && cs.status === 'ACTIVE'
    ).length;

    return res.json({
      ...updatedTeacher,
      classes,
      classCount: classes.length,
      totalStudents
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update teacher' });
  }
});

// DELETE /api/teachers/:id - Delete / Deactivate Teacher
router.delete('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const teacherIndex = db.data.teachers.findIndex(t => t.id === id);
    if (teacherIndex === -1) {
      return res.status(404).json({ error: 'Teacher not found' });
    }

    const teacher = db.data.teachers[teacherIndex];
    const assignedClasses = db.data.classes.filter(c => c.teacherId === id && c.status === 'ACTIVE');
    
    if (assignedClasses.length > 0) {
      return res.status(400).json({ 
        error: `Cannot delete teacher with ${assignedClasses.length} active class(es). Please reassign or archive classes first, or mark teacher as INACTIVE.` 
      });
    }

    db.data.teachers.splice(teacherIndex, 1);
    db.save();

    await logAuditAction(req, 'TEACHER_DELETE', `Deleted teacher ${teacher.name} (${teacher.teacherIdNumber})`);

    return res.json({ message: 'Teacher successfully deleted', id });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete teacher' });
  }
});

export default router;
