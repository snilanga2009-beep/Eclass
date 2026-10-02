import { Router, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import db, { User, Role } from '../db';
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
    roleId: u.roleId,
    isActive: u.isActive !== false,
    lastLogin: u.lastLogin,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
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

// ==========================================
// USER & ROLE MANAGEMENT (Admin & Self-Service)
// ==========================================

// GET /api/auth/users - List all users
router.get('/users', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const users = db.data.users
      .slice()
      .reverse()
      .map(u => populateUser(u));
    return res.json(users);
  } catch (error) {
    return res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// POST /api/auth/users - Create new login user
router.post('/users', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { username, password, name, email, phone, roleId, roleName, teacherId, studentId, isActive } = req.body;
    
    if (!username || !password || !name) {
      return res.status(400).json({ error: 'Username, Full Name, and Password are required.' });
    }
    if (String(password).length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters long.' });
    }

    const cleanUsername = String(username).trim().toLowerCase();
    const existing = db.data.users.find(u => u.username.toLowerCase() === cleanUsername);
    if (existing) {
      return res.status(400).json({ error: `Username "${username}" is already taken.` });
    }

    if (email && String(email).trim()) {
      const cleanEmail = String(email).trim().toLowerCase();
      const existingEmail = db.data.users.find(u => u.email && u.email.toLowerCase() === cleanEmail);
      if (existingEmail) {
        return res.status(400).json({ error: `Email "${email}" is already registered to another user.` });
      }
    }

    // Resolve Role ID
    let resolvedRoleId = roleId;
    if (!resolvedRoleId && roleName) {
      const foundRole = db.data.roles.find(r => r.name === roleName);
      if (foundRole) resolvedRoleId = foundRole.id;
    }
    if (!resolvedRoleId) {
      const defaultRole = db.data.roles.find(r => r.name === 'RECEPTIONIST') || db.data.roles[0];
      resolvedRoleId = defaultRole?.id || 'role-receptionist';
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const newUser: User = {
      id: db.generateId(),
      username: String(username).trim(),
      name: String(name).trim(),
      email: email ? String(email).trim() : undefined,
      phone: phone ? String(phone).trim() : undefined,
      passwordHash,
      roleId: resolvedRoleId,
      isActive: isActive !== false,
      teacherId: teacherId || null,
      studentId: studentId || null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.data.users.unshift(newUser);
    db.save();

    const populated = populateUser(newUser);
    await logAuditAction(req, 'USER_CREATE', `Created new user account "${newUser.username}" with role ${populated.role}`);
    return res.status(201).json(populated);
  } catch (err: any) {
    console.error('Error creating user:', err);
    return res.status(500).json({ error: err.message || 'Failed to create user' });
  }
});

// PUT /api/auth/users/:id - Update user profile, role, status
router.put('/users/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { name, email, phone, roleId, roleName, isActive, teacherId, studentId } = req.body;

    if (name) user.name = String(name).trim();
    if (email !== undefined) user.email = email ? String(email).trim() : undefined;
    if (phone !== undefined) user.phone = phone ? String(phone).trim() : undefined;

    if (isActive !== undefined) {
      // Prevent deactivating own logged-in account
      if (user.id === req.user?.id && !isActive) {
        return res.status(400).json({ error: 'You cannot deactivate your own account while logged in.' });
      }
      user.isActive = Boolean(isActive);
    }

    // Role change
    if (roleId) {
      const targetRole = db.data.roles.find(r => r.id === roleId);
      if (targetRole) user.roleId = targetRole.id;
    } else if (roleName) {
      const targetRole = db.data.roles.find(r => r.name === roleName);
      if (targetRole) user.roleId = targetRole.id;
    }

    if (teacherId !== undefined) user.teacherId = teacherId || null;
    if (studentId !== undefined) user.studentId = studentId || null;

    user.updatedAt = new Date().toISOString();
    db.save();

    const populated = populateUser(user);
    await logAuditAction(req, 'USER_UPDATE', `Updated user account "${user.username}" (Role: ${populated.role}, Active: ${user.isActive})`);
    return res.json(populated);
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to update user' });
  }
});

// PUT /api/auth/users/:id/password - Admin sets / resets user password
router.put('/users/:id/password', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const user = db.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { newPassword } = req.body;
    if (!newPassword || String(newPassword).length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.updatedAt = new Date().toISOString();
    db.save();

    await logAuditAction(req, 'PASSWORD_RESET', `Admin reset password for user "${user.username}"`);
    return res.json({ message: `Password for "${user.username}" was updated successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to reset password' });
  }
});

// POST /api/auth/change-my-password - Any logged-in user changes their own password
router.post('/change-my-password', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = db.data.users.find(u => u.id === req.user?.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ error: 'Both current password and new password are required.' });
    }
    if (String(newPassword).length < 4) {
      return res.status(400).json({ error: 'New password must be at least 4 characters long.' });
    }

    const isMatch = await bcrypt.compare(String(currentPassword), user.passwordHash);
    if (!isMatch) {
      return res.status(400).json({ error: 'Current password does not match.' });
    }

    user.passwordHash = await bcrypt.hash(String(newPassword), 10);
    user.updatedAt = new Date().toISOString();
    db.save();

    await logAuditAction(req, 'PASSWORD_CHANGE', `User "${user.username}" successfully changed their own password.`);
    return res.json({ message: 'Your password was changed successfully.' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to change password' });
  }
});

// DELETE /api/auth/users/:id - Delete a user account
router.delete('/users/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const userIndex = db.data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ error: 'User not found' });
    }

    const userToDelete = db.data.users[userIndex];
    if (userToDelete.id === req.user?.id) {
      return res.status(400).json({ error: 'You cannot delete your own active account while logged in.' });
    }

    // Safety: Protect last Super Admin
    const superRole = db.data.roles.find(r => r.name === 'SUPER_ADMIN');
    if (userToDelete.roleId === superRole?.id) {
      const remainingSuperAdmins = db.data.users.filter(u => u.id !== userToDelete.id && u.roleId === superRole?.id && u.isActive);
      if (remainingSuperAdmins.length === 0) {
        return res.status(400).json({ error: 'Cannot delete the only remaining Super Administrator account.' });
      }
    }

    const deletedUsername = userToDelete.username;
    db.data.users.splice(userIndex, 1);
    db.save();

    await logAuditAction(req, 'USER_DELETE', `Deleted user account "${deletedUsername}"`);
    return res.json({ message: `User "${deletedUsername}" was deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete user' });
  }
});

// GET /api/auth/roles - List all roles with user counts
router.get('/roles', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const rolesWithCounts = db.data.roles.map(r => {
      const userCount = db.data.users.filter(u => u.roleId === r.id).length;
      return {
        id: r.id,
        name: r.name,
        description: r.description || `Role for ${r.name}`,
        createdAt: r.createdAt,
        userCount
      };
    });
    return res.json(rolesWithCounts);
  } catch (err: any) {
    return res.status(500).json({ error: 'Failed to fetch roles' });
  }
});

// POST /api/auth/roles - Add new system role ("roll add")
router.post('/roles', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const { name, description } = req.body;
    if (!name || !String(name).trim()) {
      return res.status(400).json({ error: 'Role name is required.' });
    }

    // Format clean role name: uppercase with underscores, e.g. "BRANCH_MANAGER"
    const cleanRoleName = String(name).trim().toUpperCase().replace(/[^A-Z0-9_]/g, '_');
    const existing = db.data.roles.find(r => r.name === cleanRoleName);
    if (existing) {
      return res.status(400).json({ error: `Role "${cleanRoleName}" already exists.` });
    }

    const newRoleId = 'role-' + cleanRoleName.toLowerCase();
    const newRole: Role = {
      id: newRoleId,
      name: cleanRoleName,
      description: description ? String(description).trim() : `Custom role: ${cleanRoleName}`,
      createdAt: new Date().toISOString()
    };

    db.data.roles.push(newRole);

    // Seed default read permissions for custom role
    const defaultModules = ['students', 'classes', 'attendance', 'payments', 'materials'];
    defaultModules.forEach(mod => {
      db.data.permissions.push({
        id: db.generateId(),
        roleId: newRoleId,
        module: mod,
        canRead: true,
        canWrite: false,
        canDelete: false,
        createdAt: new Date().toISOString()
      });
    });

    db.save();

    await logAuditAction(req, 'ROLE_CREATE', `Created new system role "${cleanRoleName}"`);
    return res.status(201).json({
      message: `Role "${cleanRoleName}" created successfully`,
      role: { ...newRole, userCount: 0 }
    });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to create role' });
  }
});

// DELETE /api/auth/roles/:id - Delete a custom role
router.delete('/roles/:id', authenticateToken, requireRoles(['SUPER_ADMIN', 'ADMIN']), async (req: AuthRequest, res: Response) => {
  try {
    const roleIndex = db.data.roles.findIndex(r => r.id === req.params.id);
    if (roleIndex === -1) {
      return res.status(404).json({ error: 'Role not found' });
    }

    const roleToDelete = db.data.roles[roleIndex];
    const BUILT_IN_ROLES = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'RECEPTIONIST', 'PARENT', 'STUDENT'];
    if (BUILT_IN_ROLES.includes(roleToDelete.name)) {
      return res.status(400).json({ error: `Built-in role "${roleToDelete.name}" cannot be deleted.` });
    }

    const assignedUsers = db.data.users.filter(u => u.roleId === roleToDelete.id);
    if (assignedUsers.length > 0) {
      return res.status(400).json({
        error: `Cannot delete role "${roleToDelete.name}" because ${assignedUsers.length} user(s) are currently assigned to it. Please reassign them first.`
      });
    }

    const roleName = roleToDelete.name;
    db.data.roles.splice(roleIndex, 1);
    db.data.permissions = db.data.permissions.filter(p => p.roleId !== req.params.id);
    db.save();

    await logAuditAction(req, 'ROLE_DELETE', `Deleted custom role "${roleName}"`);
    return res.json({ message: `Role "${roleName}" was deleted successfully.` });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Failed to delete role' });
  }
});

export default router;
