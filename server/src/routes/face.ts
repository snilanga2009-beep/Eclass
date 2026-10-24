import { Router, Response } from 'express';
import db, { FaceTemplate } from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';
import { matchFaceDescriptor } from '../services/faceService';

const router = Router();

// GET /api/face/templates - Retrieve registered facial templates for client-side fast matching
router.get('/templates', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const isFaceEnabled = db.data.settings.find(s => s.key === 'ATTENDANCE_METHOD_FACE')?.value !== 'false';
    if (!isFaceEnabled) {
      return res.json({
        enabled: false,
        message: 'Face recognition attendance is currently disabled by administrator.',
        templates: []
      });
    }

    // Sanitize template output (do not expose unnecessary internal IDs, only descriptor + student info)
    const sanitized = (db.data.faceTemplates || []).map(t => {
      const student = db.data.students.find(s => s.id === t.studentId);
      return {
        id: t.id,
        studentId: t.studentId,
        studentIdNumber: t.studentIdNumber,
        studentName: student?.fullName || 'Student',
        studentPhoto: student?.photo || t.photoSampleUrl || '',
        grade: student?.grade || '',
        label: t.label,
        descriptor: t.descriptor,
        descriptors: t.descriptors || [],
        qualityScore: t.qualityScore || 1.0,
        consentGiven: t.consentGiven,
        consentDate: t.consentDate,
        consentBy: t.consentBy,
        createdAt: t.createdAt
      };
    });

    return res.json({
      enabled: true,
      count: sanitized.length,
      templates: sanitized
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch face templates' });
  }
});

// GET /api/face/student/:studentId - Get face enrollment status & consent for a specific student
router.get('/student/:studentId', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { studentId } = req.params;
    const student = db.data.students.find(s => s.id === studentId || s.studentIdNumber === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const templates = (db.data.faceTemplates || []).filter(t => t.studentId === student.id);
    const hasEnrolled = templates.length > 0;
    const primaryTemplate = templates[0];

    return res.json({
      studentId: student.id,
      studentIdNumber: student.studentIdNumber,
      fullName: student.fullName,
      photo: student.photo,
      hasFaceEnrolled: hasEnrolled,
      templateCount: templates.length,
      consentGiven: primaryTemplate ? primaryTemplate.consentGiven : false,
      consentDate: primaryTemplate ? primaryTemplate.consentDate : null,
      consentBy: primaryTemplate ? primaryTemplate.consentBy : null,
      qualityScore: primaryTemplate?.qualityScore || null,
      enrolledBy: primaryTemplate?.enrolledBy || null,
      enrolledAt: primaryTemplate?.createdAt || null
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to fetch student face status' });
  }
});

// POST /api/face/enroll - Register biometric facial template with consent
router.post('/enroll', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN', 'RECEPTIONIST', 'TEACHER']), async (req: AuthRequest, res: Response) => {
  try {
    const {
      studentId,
      descriptor,
      descriptors,
      consentGiven,
      consentBy,
      label,
      photoSampleUrl,
      qualityScore
    } = req.body;

    if (!studentId) {
      return res.status(400).json({ error: 'studentId is required' });
    }

    const student = db.data.students.find(s => s.id === studentId || s.studentIdNumber === studentId);
    if (!student) {
      return res.status(404).json({ error: 'Student not found in system' });
    }

    // Consent is MANDATORY for biometric face template storage
    if (consentGiven !== true) {
      return res.status(400).json({
        error: 'Consent-based enrollment requirement: explicit biometric consent must be granted before saving face templates.'
      });
    }

    if (!consentBy || typeof consentBy !== 'string' || !consentBy.trim()) {
      return res.status(400).json({
        error: 'Name of the consenting individual (parent, guardian or student) is required.'
      });
    }

    // Validate descriptor format (128-element float array)
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({
        error: 'Invalid facial template descriptor. Expected a 128-dimensional embedding vector.'
      });
    }

    // Check if alternate descriptors were supplied (e.g. 2-3 poses)
    const validDescriptors: number[][] = [];
    if (Array.isArray(descriptors)) {
      for (const d of descriptors) {
        if (Array.isArray(d) && d.length === 128) {
          validDescriptors.push(d);
        }
      }
    }
    if (validDescriptors.length === 0) {
      validDescriptors.push(descriptor);
    }

    // Check if a template already exists for this student
    if (!Array.isArray(db.data.faceTemplates)) {
      db.data.faceTemplates = [];
    }

    const existingIdx = db.data.faceTemplates.findIndex(t => t.studentId === student.id);
    const now = new Date().toISOString();

    let savedTemplate: FaceTemplate;
    if (existingIdx !== -1) {
      // Update existing template
      savedTemplate = {
        ...db.data.faceTemplates[existingIdx],
        descriptor,
        descriptors: validDescriptors,
        label: label || db.data.faceTemplates[existingIdx].label || 'Primary Face',
        consentGiven: true,
        consentDate: now,
        consentBy: consentBy.trim(),
        photoSampleUrl: photoSampleUrl || student.photo || undefined,
        qualityScore: typeof qualityScore === 'number' ? qualityScore : 1.0,
        enrolledBy: req.user?.name || 'Staff',
        updatedAt: now
      };
      db.data.faceTemplates[existingIdx] = savedTemplate;
    } else {
      // Create new template
      savedTemplate = {
        id: `face-${db.generateId()}`,
        studentId: student.id,
        studentIdNumber: student.studentIdNumber,
        label: label || 'Primary Face',
        descriptor,
        descriptors: validDescriptors,
        consentGiven: true,
        consentDate: now,
        consentBy: consentBy.trim(),
        photoSampleUrl: photoSampleUrl || student.photo || undefined,
        qualityScore: typeof qualityScore === 'number' ? qualityScore : 1.0,
        enrolledBy: req.user?.name || 'Staff',
        createdAt: now,
        updatedAt: now
      };
      db.data.faceTemplates.push(savedTemplate);
    }

    // Update student flags
    student.hasFaceEnrolled = true;
    student.faceEnrolledAt = now;
    if (photoSampleUrl && !student.photo) {
      student.photo = photoSampleUrl;
    }

    db.save();

    await logAuditAction(
      req,
      'FACE_ENROLLMENT',
      `Enrolled biometric facial template for student ${student.fullName} (${student.studentIdNumber}). Consent granted by: ${consentBy.trim()}. Quality: ${qualityScore || '1.0'}.`
    );

    return res.status(200).json({
      message: `Face template successfully enrolled for ${student.fullName}`,
      template: {
        id: savedTemplate.id,
        studentId: savedTemplate.studentId,
        studentIdNumber: savedTemplate.studentIdNumber,
        consentGiven: savedTemplate.consentGiven,
        consentDate: savedTemplate.consentDate,
        consentBy: savedTemplate.consentBy,
        qualityScore: savedTemplate.qualityScore
      }
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Face enrollment failed' });
  }
});

// DELETE /api/face/template/:id - Revoke and delete a face template
router.delete('/template/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const idx = (db.data.faceTemplates || []).findIndex(t => t.id === id || t.studentId === id);
    if (idx === -1) {
      return res.status(404).json({ error: 'Face template not found' });
    }

    const removed = db.data.faceTemplates.splice(idx, 1)[0];
    const remaining = db.data.faceTemplates.filter(t => t.studentId === removed.studentId);

    const student = db.data.students.find(s => s.id === removed.studentId);
    if (student && remaining.length === 0) {
      student.hasFaceEnrolled = false;
      student.faceEnrolledAt = undefined;
    }

    db.save();

    await logAuditAction(
      req,
      'FACE_TEMPLATE_DELETED',
      `Deleted biometric face template for student ${student?.fullName || removed.studentIdNumber} (${removed.id}).`
    );

    return res.json({ message: 'Face template removed successfully' });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Failed to delete template' });
  }
});

// POST /api/face/verify - Server-side verification of a detected face against registered templates
router.post('/verify', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const { descriptor, classId, date } = req.body;
    if (!Array.isArray(descriptor) || descriptor.length !== 128) {
      return res.status(400).json({ error: 'Descriptor (128-element array) is required' });
    }

    const isFaceEnabled = db.data.settings.find(s => s.key === 'ATTENDANCE_METHOD_FACE')?.value !== 'false';
    if (!isFaceEnabled) {
      return res.status(403).json({
        error: 'Face recognition attendance is currently disabled by administrator in System Settings.'
      });
    }

    const matchThreshold = Number(db.data.settings.find(s => s.key === 'FACE_MATCH_THRESHOLD')?.value || '0.45');
    const reviewThreshold = Number(db.data.settings.find(s => s.key === 'FACE_REVIEW_THRESHOLD')?.value || '0.58');

    const templates = db.data.faceTemplates || [];
    const result = matchFaceDescriptor(descriptor, templates, matchThreshold, reviewThreshold);

    return res.json({
      matchStatus: result.status,
      distance: result.distance,
      similarity: Math.round(result.similarity * 100),
      student: result.student ? {
        id: result.student.id,
        fullName: result.student.fullName,
        studentIdNumber: result.student.studentIdNumber,
        photo: result.student.photo,
        grade: result.student.grade
      } : null,
      candidates: (result.candidates || []).map(c => ({
        id: c.student.id,
        fullName: c.student.fullName,
        studentIdNumber: c.student.studentIdNumber,
        photo: c.student.photo,
        grade: c.student.grade,
        distance: Math.round(c.distance * 1000) / 1000,
        similarity: Math.round(c.similarity * 100)
      }))
    });
  } catch (error: any) {
    return res.status(500).json({ error: error.message || 'Face verification failed' });
  }
});

export default router;
