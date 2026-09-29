import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db from '../db';
import { AuthRequest, authenticateToken, requireRoles } from '../middleware/auth';
import { logAuditAction } from '../middleware/audit';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'cams_super_secure_jwt_secret_key_2026_lk';

// Helper to populate user details
const populateUser = (u: any) => {
  const role = db.data.roles.find(r => r.id === u.roleId);
  const teacher = u.teacherId ? db.data.teachers.find(t => t.id === u.teacherId) : null;
  const student = u.studentId ? db.data.students.find(s => s.id === u.studentId) : null;
  const parent = u.parentId ? db.data.parents.find(p => p.id === u.parentId) : null;
  return {
    id: u.id,
    username: u.username,
    name: u.name,
    email: u.email,
    phone: u.phone,
    avatar: u.avatar,
    role: role?.name || 'STUDENT',
    teacherId: u.teacherId,
    studentId: u.studentId,
    parentId: u.parentId,
    teacher,
    student,
    parent
  };
};

// POST /api/auth/login
router.post('/login', async (req: AuthRequest, res: Response) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: 'Username and password are required' });
    }

    const cleanUsername = username.trim().toLowerCase();
    const user = db.data.users.find(u => 
      u.username.toLowerCase() === cleanUsername || 
      (u.email && u.email.toLowerCase() === cleanUsername)
    );

    if (!user) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    if (!user.isActive) {
      return res.status(403).json({ error: 'Your account has been deactivated. Please contact administrator.' });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid username or password' });
    }

    // Update last login
    user.lastLogin = new Date().toISOString();
    db.save();

    const populated = populateUser(user);

    const token = jwt.sign(
      {
        userId: user.id,
        role: populated.role,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    await logAuditAction(
      { ...req, user: { id: user.id, username: user.username, name: user.name, role: populated.role } } as AuthRequest,
      'LOGIN',
      `User ${user.username} logged in successfully with role ${populated.role}`
    );

    return res.json({ token, user: populated });
  } catch (error: any) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Internal server error during login' });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = db.data.users.find(u => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const populated = populateUser(user);
    const permissions = db.data.permissions.filter(p => p.roleId === user.roleId);

    return res.json({
      ...populated,
      permissions
    });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to retrieve profile' });
  }
});

// POST /api/auth/switch-role (Convenient quick-switcher for reviewers & admins)
router.post('/switch-role', async (req: AuthRequest, res: Response) => {
  try {
    const { targetRole } = req.body;
    if (!targetRole) {
      return res.status(400).json({ error: 'Target role is required' });
    }

    const role = db.data.roles.find(r => r.name === targetRole);
    if (!role) {
      return res.status(404).json({ error: `Role ${targetRole} does not exist` });
    }

    const user = db.data.users.find(u => u.roleId === role.id && u.isActive);
    if (!user) {
      return res.status(404).json({ error: `No active user found for role ${targetRole}` });
    }

    const populated = populateUser(user);

    const token = jwt.sign(
      {
        userId: user.id,
        role: populated.role,
        username: user.username
      },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({ token, user: populated });
  } catch (error) {
    return res.status(500).json({ error: 'Failed to switch role' });
  }
});

// POST /api/auth/parent-login (Passwordless 1-time login with mobile phone)
router.post('/parent-login', async (req: AuthRequest, res: Response) => {
  try {
    const { phone } = req.body;
    if (!phone) {
      return res.status(400).json({ error: 'Mobile phone number is required' });
    }

    const cleanInput = String(phone).trim();
    const digitsOnly = cleanInput.replace(/\D/g, '');
    const last9 = digitsOnly.slice(-9);

    if (last9.length < 7) {
      return res.status(400).json({ error: 'Please enter a valid mobile phone number' });
    }

    // Match students where parentPhone or phone ends with the same digits
    const matchingStudents = db.data.students.filter(s => {
      const pDigits = (s.parentPhone || '').replace(/\D/g, '');
      const sDigits = (s.phone || '').replace(/\D/g, '');
      const emDigits = (s.emergencyContact || '').replace(/\D/g, '');
      return (
        (pDigits.length >= 7 && pDigits.endsWith(last9)) ||
        (sDigits.length >= 7 && sDigits.endsWith(last9)) ||
        (emDigits.length >= 7 && emDigits.endsWith(last9))
      );
    });

    if (matchingStudents.length === 0) {
      return res.status(404).json({
        error: `No student record found associated with phone number "${cleanInput}". Please ensure this mobile number is registered with the academy.`
      });
    }

    // Match or create parent in db.data.parents
    const firstStudent = matchingStudents[0];
    let parent = db.data.parents.find(p => {
      const prtDigits = (p.phone || '').replace(/\D/g, '');
      return prtDigits.length >= 7 && prtDigits.endsWith(last9);
    });

    if (!parent) {
      parent = {
        id: firstStudent.parentId || db.generateId(),
        name: firstStudent.parentName || `${firstStudent.fullName}'s Guardian`,
        phone: firstStudent.parentPhone || cleanInput,
        whatsapp: firstStudent.whatsapp || firstStudent.parentPhone || cleanInput,
        address: firstStudent.address,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.parents.push(parent);
    }

    // Ensure all matching students have this parentId
    matchingStudents.forEach(s => {
      if (!s.parentId) {
        s.parentId = parent!.id;
        s.parentName = parent!.name;
        s.parentPhone = parent!.phone;
      }
    });

    // Match or create User entity with role PARENT
    const parentRole = db.data.roles.find(r => r.name === 'PARENT');
    const roleId = parentRole?.id || 'role-parent';

    let user = db.data.users.find(u => 
      u.roleId === roleId && (
        (u.phone && u.phone.replace(/\D/g, '').endsWith(last9)) ||
        u.parentId === parent!.id
      )
    );

    if (!user) {
      const username = `parent_${last9}`;
      user = {
        id: db.generateId(),
        username,
        email: parent.email || `guardian.${last9}@parent.cams.lk`,
        passwordHash: await bcrypt.hash('parent123', 10),
        name: parent.name,
        roleId,
        phone: parent.phone,
        avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
        parentId: parent.id,
        isActive: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.users.push(user);
    } else {
      user.name = parent.name;
      user.parentId = parent.id;
      user.isActive = true;
    }

    user.lastLogin = new Date().toISOString();
    db.save();

    const populated = populateUser(user);

    // Issue long-lived 365-day token for 1-time permanent login
    const token = jwt.sign(
      {
        userId: user.id,
        role: 'PARENT',
        username: user.username,
        parentId: parent.id,
        phone: user.phone
      },
      JWT_SECRET,
      { expiresIn: '365d' }
    );

    await logAuditAction(
      { ...req, user: { id: user.id, username: user.username, name: user.name, role: 'PARENT' } } as AuthRequest,
      'PARENT_LOGIN',
      `Parent/Guardian ${user.name} logged in via 1-time phone auth (${cleanInput}) for ${matchingStudents.length} student(s)`
    );

    return res.json({
      token,
      user: populated,
      children: matchingStudents.map(s => ({
        id: s.id,
        fullName: s.fullName,
        studentIdNumber: s.studentIdNumber,
        grade: s.grade,
        school: s.school,
        photo: s.photo,
        rfidTag: s.rfidTag
      }))
    });
  } catch (error: any) {
    console.error('Parent login error:', error);
    return res.status(500).json({ error: error.message || 'Failed to authenticate parent' });
  }
});

// GET /api/auth/parent-children (Get all children linked to currently logged in parent)
router.get('/parent-children', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = db.data.users.find(u => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const uDigits = (user.phone || '').replace(/\D/g, '');
    const last9 = uDigits.slice(-9);

    const children = db.data.students.filter(s => {
      if (user.parentId && s.parentId === user.parentId) return true;
      const pDigits = (s.parentPhone || '').replace(/\D/g, '');
      const sDigits = (s.phone || '').replace(/\D/g, '');
      return (
        (last9.length >= 7 && pDigits.endsWith(last9)) ||
        (last9.length >= 7 && sDigits.endsWith(last9))
      );
    });

    return res.json(children);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch parent children' });
  }
});

// GET /api/auth/users
router.get('/users', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const users = db.data.users.map(u => populateUser(u));
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

export default router;
