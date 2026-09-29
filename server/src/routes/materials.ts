import { Router, Response } from 'express';
import db, { LearningMaterial } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();

// GET /api/materials - List learning materials with filters
router.get('/', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { subjectId, classId, grade, fileType, search } = req.query;
    let list = [...db.data.learningMaterials];

    if (subjectId && subjectId !== 'ALL') {
      list = list.filter(m => m.subjectId === subjectId);
    }

    if (classId && classId !== 'ALL') {
      list = list.filter(m => m.classId === classId);
    }

    if (grade && grade !== 'ALL') {
      list = list.filter(m => m.grade === grade);
    }

    if (fileType && fileType !== 'ALL') {
      list = list.filter(m => m.fileType === fileType);
    }

    if (search) {
      const q = String(search).trim().toLowerCase();
      list = list.filter(m => 
        m.title.toLowerCase().includes(q) ||
        (m.description && m.description.toLowerCase().includes(q)) ||
        (m.lessonTopic && m.lessonTopic.toLowerCase().includes(q))
      );
    }

    const populated = list.map(m => {
      const subject = db.data.subjects.find(s => s.id === m.subjectId);
      const cls = m.classId ? db.data.classes.find(c => c.id === m.classId) : null;
      const teacher = m.teacherId ? db.data.teachers.find(t => t.id === m.teacherId) : null;

      return {
        ...m,
        subject,
        class: cls,
        teacher
      };
    });

    return res.json(populated.sort((a, b) => new Date(b.uploadDate).getTime() - new Date(a.uploadDate).getTime()));
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch learning materials' });
  }
});

// POST /api/materials - Upload or register new learning material
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, fileType, fileUrl, fileSize, subjectId, classId, grade, lessonTopic } = req.body;

    if (!title || !subjectId || !fileType) {
      return res.status(400).json({ error: 'Title, subject, and file type are required' });
    }

    const newMaterial: LearningMaterial = {
      id: db.generateId(),
      title: title.trim(),
      description: description ? description.trim() : undefined,
      fileType: fileType || 'PDF',
      fileUrl: fileUrl || '/materials/sample_document.pdf',
      fileSize: fileSize || '5.2 MB',
      subjectId,
      classId: classId || undefined,
      teacherId: req.user?.teacherId || undefined,
      grade: grade || undefined,
      lessonTopic: lessonTopic ? lessonTopic.trim() : undefined,
      uploadDate: new Date().toISOString().substring(0, 10)
    };

    db.data.learningMaterials.unshift(newMaterial);
    db.save();

    await logAuditAction(req, 'MATERIAL_UPLOAD', `Uploaded resource "${newMaterial.title}"`);

    return res.status(201).json(newMaterial);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to save learning material' });
  }
});

export default router;
