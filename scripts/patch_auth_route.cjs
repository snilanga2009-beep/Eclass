const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('server/src/routes/auth.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Patch matching students parent linking in POST /parent-login
const oldParentLoginStudentLinkRegex = /\/\/ Ensure all matching students have this parentId[\s\S]*?matchingStudents\.forEach\(s => \{[\s\S]*?\}\);\s*\}/;
const newParentLoginStudentLinkCode = `// Ensure all matching students have this parentId and sync parent contact
    matchingStudents.forEach(s => {
      s.parentId = parent!.id;
      s.parentPhone = parent!.phone;
      if (!s.parentName && parent!.name) {
        s.parentName = parent!.name;
      }
    });`;

if (oldParentLoginStudentLinkRegex.test(content)) {
  content = content.replace(oldParentLoginStudentLinkRegex, newParentLoginStudentLinkCode);
  console.log('Successfully patched parent-login student linking');
} else {
  console.warn('Regex match for parent-login student linking failed');
}

// 2. Patch POST /parent-login children return
const oldParentLoginReturnRegex = /children: matchingStudents\.map\(s => \(\{[\s\S]*?\}\)\)/;
const newParentLoginReturnCode = `children: matchingStudents.map(s => {
        const todayStr = new Date().toISOString().substring(0, 10);
        const todayAtt = db.data.attendances.find(a => a.studentId === s.id && a.date === todayStr);
        return {
          id: s.id,
          fullName: s.fullName,
          studentIdNumber: s.studentIdNumber,
          grade: s.grade,
          school: s.school,
          photo: s.photo,
          rfidTag: s.rfidTag,
          parentPhone: s.parentPhone,
          parentName: s.parentName,
          hasFaceEnrolled: !!(s.faceDescriptor && s.faceDescriptor.length > 0),
          attendancesCount: db.data.attendances.filter(a => a.studentId === s.id).length,
          todayAttendance: todayAtt ? {
            status: todayAtt.status,
            method: todayAtt.method,
            scannedAt: todayAtt.scannedAt
          } : null
        };
      })`;

if (oldParentLoginReturnRegex.test(content)) {
  content = content.replace(oldParentLoginReturnRegex, newParentLoginReturnCode);
  console.log('Successfully patched parent-login return mapping');
} else {
  console.warn('Regex match for parent-login return mapping failed');
}

// 3. Patch GET /parent-children
const oldParentChildrenRegex = /\/\/ GET \/api\/auth\/parent-children[\s\S]*?return res\.json\(children\);\s*\} catch \(error\) \{/i;
const newParentChildrenCode = `// GET /api/auth/parent-children (Get all children linked to currently logged in parent)
router.get('/parent-children', authenticateToken, async (req: AuthRequest, res: Response) => {
  try {
    const user = db.data.users.find(u => u.id === req.user!.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const uDigits = (user.phone || '').replace(/\\D/g, '');
    const userLast9 = uDigits.slice(-9);

    const parent = user.parentId ? db.data.parents.find(p => p.id === user.parentId) : null;
    const parentDigits = (parent?.phone || '').replace(/\\D/g, '');
    const parentLast9 = parentDigits.slice(-9);

    // Collect all parent IDs for this user
    const matchingParentIds = new Set<string>();
    if (user.parentId) matchingParentIds.add(user.parentId);
    if (parent?.id) matchingParentIds.add(parent.id);

    db.data.parents.forEach(p => {
      if (!p.phone) return;
      const pD = p.phone.replace(/\\D/g, '');
      if (
        (userLast9.length >= 7 && pD.endsWith(userLast9)) ||
        (parentLast9.length >= 7 && pD.endsWith(parentLast9))
      ) {
        matchingParentIds.add(p.id);
      }
    });

    let children = db.data.students.filter(s => {
      if (s.parentId && matchingParentIds.has(s.parentId)) return true;
      const pDigits = (s.parentPhone || '').replace(/\\D/g, '');
      const sDigits = (s.phone || '').replace(/\\D/g, '');
      const emDigits = (s.emergencyContact || '').replace(/\\D/g, '');

      const matchesUserPhone = userLast9.length >= 7 && (pDigits.endsWith(userLast9) || sDigits.endsWith(userLast9) || emDigits.endsWith(userLast9));
      const matchesParentPhone = parentLast9.length >= 7 && (pDigits.endsWith(parentLast9) || sDigits.endsWith(parentLast9) || emDigits.endsWith(parentLast9));

      return matchesUserPhone || matchesParentPhone;
    });

    // Fallback for admin previewing the Parent Portal
    if (children.length === 0 && (req.user?.role === 'SUPER_ADMIN' || req.user?.role === 'ADMIN')) {
      children = db.data.students.filter(s => s.status === 'ACTIVE').slice(0, 3);
    }

    const todayStr = new Date().toISOString().substring(0, 10);
    const enrichedChildren = children.map(s => {
      const todayAtt = db.data.attendances.find(a => a.studentId === s.id && a.date === todayStr);
      return {
        ...s,
        hasFaceEnrolled: !!(s.faceDescriptor && s.faceDescriptor.length > 0),
        attendancesCount: db.data.attendances.filter(a => a.studentId === s.id).length,
        todayAttendance: todayAtt ? {
          status: todayAtt.status,
          method: todayAtt.method,
          scannedAt: todayAtt.scannedAt
        } : null
      };
    });

    return res.json(enrichedChildren);
  } catch (error) {`;

if (oldParentChildrenRegex.test(content)) {
  content = content.replace(oldParentChildrenRegex, newParentChildrenCode);
  console.log('Successfully patched GET /parent-children');
} else {
  console.warn('Regex match for GET /parent-children failed');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done updating server/src/routes/auth.ts');
