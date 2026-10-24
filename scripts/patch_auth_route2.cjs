const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('server/src/routes/auth.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Replace matchingStudents.forEach in parent-login
const target1 = `    // Ensure all matching students have this parentId
    matchingStudents.forEach(s => {
      if (!s.parentId) {
        s.parentId = parent!.id;
        s.parentName = parent!.name;
        s.parentPhone = parent!.phone;
      }
    });`;

const replacement1 = `    // Ensure all matching students have this parentId
    matchingStudents.forEach(s => {
      s.parentId = parent!.id;
      s.parentPhone = parent!.phone;
      if (!s.parentName && parent!.name) {
        s.parentName = parent!.name;
      }
    });`;

// 2. Replace children mapping in parent-login
const target2 = `      children: matchingStudents.map(s => ({
        id: s.id,
        fullName: s.fullName,
        studentIdNumber: s.studentIdNumber,
        grade: s.grade,
        school: s.school,
        photo: s.photo,
        rfidTag: s.rfidTag
      }))`;

const replacement2 = `      children: matchingStudents.map(s => {
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

// 3. Replace children filtering in /parent-children
const target3 = `    const children = db.data.students.filter(s => {
      if (user.parentId && s.parentId === user.parentId) return true;
      const pDigits = (s.parentPhone || '').replace(/\\D/g, '');
      const sDigits = (s.phone || '').replace(/\\D/g, '');

      const matchesUserPhone = userLast9.length >= 7 && (pDigits.endsWith(userLast9) || sDigits.endsWith(userLast9));
      const matchesParentPhone = parentLast9.length >= 7 && (pDigits.endsWith(parentLast9) || sDigits.endsWith(parentLast9));

      return matchesUserPhone || matchesParentPhone;
    });

    return res.json(children);`;

const replacement3 = `    // Collect all parent IDs for this user
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

    return res.json(enrichedChildren);`;

// Normalize CRLF to LF for reliable search and replace
const isCRLF = content.includes('\r\n');
let norm = content.replace(/\r\n/g, '\n');

if (norm.includes(target1.replace(/\r\n/g, '\n'))) {
  norm = norm.replace(target1.replace(/\r\n/g, '\n'), replacement1.replace(/\r\n/g, '\n'));
  console.log('Patch 1 applied');
} else {
  console.warn('Patch 1 target not found');
}

if (norm.includes(target2.replace(/\r\n/g, '\n'))) {
  norm = norm.replace(target2.replace(/\r\n/g, '\n'), replacement2.replace(/\r\n/g, '\n'));
  console.log('Patch 2 applied');
} else {
  console.warn('Patch 2 target not found');
}

if (norm.includes(target3.replace(/\r\n/g, '\n'))) {
  norm = norm.replace(target3.replace(/\r\n/g, '\n'), replacement3.replace(/\r\n/g, '\n'));
  console.log('Patch 3 applied');
} else {
  console.warn('Patch 3 target not found');
}

fs.writeFileSync(targetPath, isCRLF ? norm.replace(/\n/g, '\r\n') : norm, 'utf8');
console.log('Saved server/src/routes/auth.ts');
