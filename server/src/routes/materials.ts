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
      const cls = m.classId ? db.data.classes.find(c => c.id === m.classId) : null;
      const subject = db.data.subjects.find(s => s.id === m.subjectId) ||
        (cls ? db.data.subjects.find(s => s.id === cls.subjectId) : null) ||
        db.data.subjects[0] ||
        { id: m.subjectId, name: m.subjectId, code: 'GEN' };
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

// POST /api/materials - Upload or register new learning material (supports Google Drive & external links)
router.post('/', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const { title, description, fileType, fileUrl, fileSize, subjectId, classId, grade, lessonTopic } = req.body;

    if (!title || !fileType) {
      return res.status(400).json({ error: 'Title and resource type are required' });
    }

    const cls = classId ? db.data.classes.find(c => c.id === classId) : null;
    const resolvedSubjectId = subjectId || cls?.subjectId || db.data.subjects[0]?.id || 'subj-math';
    const trimmedUrl = fileUrl ? String(fileUrl).trim() : '/materials/sample_document.pdf';
    const isGoogleDrive = trimmedUrl.includes('drive.google.com') || trimmedUrl.includes('docs.google.com');
    const defaultSize = isGoogleDrive ? 'Google Drive' : (trimmedUrl.startsWith('http') ? 'Cloud Link' : '5.2 MB');

    const newMaterial: LearningMaterial = {
      id: db.generateId(),
      title: title.trim(),
      description: description ? description.trim() : undefined,
      fileType: fileType || 'PDF',
      fileUrl: trimmedUrl,
      fileSize: fileSize || defaultSize,
      subjectId: resolvedSubjectId,
      classId: classId || undefined,
      teacherId: req.user?.teacherId || cls?.teacherId || undefined,
      grade: grade || cls?.grade || undefined,
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

// PUT /api/materials/:id - Edit learning material or update Google Drive link
router.put('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const material = db.data.learningMaterials.find(m => m.id === req.params.id);
    if (!material) {
      return res.status(404).json({ error: 'Learning material not found' });
    }

    const { title, description, fileType, fileUrl, fileSize, subjectId, classId, grade, lessonTopic } = req.body;

    if (title !== undefined && String(title).trim()) material.title = String(title).trim();
    if (description !== undefined) material.description = String(description).trim() || undefined;
    if (fileType !== undefined) material.fileType = fileType;
    if (fileUrl !== undefined && String(fileUrl).trim()) {
      const trimmedUrl = String(fileUrl).trim();
      material.fileUrl = trimmedUrl;
      const isGoogleDrive = trimmedUrl.includes('drive.google.com') || trimmedUrl.includes('docs.google.com');
      if (!fileSize) {
        material.fileSize = isGoogleDrive ? 'Google Drive' : (trimmedUrl.startsWith('http') ? 'Cloud Link' : material.fileSize);
      }
    }
    if (fileSize !== undefined && String(fileSize).trim()) material.fileSize = String(fileSize).trim();
    if (classId !== undefined) material.classId = classId || undefined;
    if (subjectId !== undefined && subjectId) {
      material.subjectId = subjectId;
    } else if (classId) {
      const cls = db.data.classes.find(c => c.id === classId);
      if (cls?.subjectId) material.subjectId = cls.subjectId;
    }
    if (grade !== undefined) material.grade = grade || undefined;
    if (lessonTopic !== undefined) material.lessonTopic = String(lessonTopic).trim() || undefined;

    db.save();
    await logAuditAction(req, 'MATERIAL_UPDATE', `Updated resource "${material.title}"`);

    return res.json(material);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to update learning material' });
  }
});

// DELETE /api/materials/:id - Delete learning material
router.delete('/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const idx = db.data.learningMaterials.findIndex(m => m.id === req.params.id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Learning material not found' });
    }
    const removed = db.data.learningMaterials.splice(idx, 1)[0];
    db.save();

    await logAuditAction(req, 'MATERIAL_DELETE', `Deleted resource "${removed.title}"`);
    return res.json({ message: 'Resource deleted successfully' });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to delete learning material' });
  }
});

export default router;
