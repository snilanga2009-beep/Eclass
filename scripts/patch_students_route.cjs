const fs = require('fs');
const path = require('path');

const targetPath = path.resolve('server/src/routes/students.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Ensure bcrypt is imported
if (!content.includes("import bcrypt from 'bcryptjs';")) {
  content = content.replace(
    "import crypto from 'crypto';",
    "import crypto from 'crypto';\nimport bcrypt from 'bcryptjs';"
  );
}

// 2. Patch POST / parent handling
const oldPostParentRegex = /\/\/ Handle Parent \(Supports multiple students under the same parent phone number\)[\s\S]*?parentId = existingParent\.id;\s*\}/;
const newPostParentCode = `// Handle Parent (Supports multiple students under the same parent phone number)
    let parentId: string | null = null;
    if (parentPhone) {
      const pRaw = parentPhone.trim();
      const pDigits = pRaw.replace(/\\D/g, '');
      const last9 = pDigits.slice(-9);

      let existingParent = db.data.parents.find(p => {
        if (!p.phone) return false;
        const existDigits = p.phone.replace(/\\D/g, '');
        return p.phone.trim() === pRaw || (last9.length >= 7 && existDigits.endsWith(last9));
      });

      if (!existingParent) {
        existingParent = {
          id: db.generateId(),
          name: (parentName && parentName.trim()) || \`\${fullName.trim()}'s Guardian\`,
          phone: pRaw,
          whatsapp: (whatsapp && whatsapp.trim()) || pRaw,
          address: (address && address.trim()) || undefined,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.data.parents.push(existingParent);
      } else {
        // Update parent name if provided and previous was generic
        if (parentName && parentName.trim() && (!existingParent.name || existingParent.name.includes("'s Guardian"))) {
          existingParent.name = parentName.trim();
        }
        if (address && !existingParent.address) {
          existingParent.address = address.trim();
        }
        existingParent.updatedAt = new Date().toISOString();
      }
      parentId = existingParent.id;

      // Link any existing siblings who share this parent phone
      db.data.students.forEach(otherStudent => {
        if (otherStudent.parentPhone) {
          const otherDigits = otherStudent.parentPhone.replace(/\\D/g, '');
          if (otherStudent.parentPhone.trim() === pRaw || (last9.length >= 7 && otherDigits.endsWith(last9))) {
            otherStudent.parentId = existingParent.id;
          }
        }
      });

      // Synchronize/Create User with role PARENT
      const parentRole = db.data.roles.find(r => r.name === 'PARENT');
      const roleId = parentRole?.id || 'role-parent';
      let parentUser = db.data.users.find(u =>
        u.roleId === roleId && (
          (u.phone && u.phone.replace(/\\D/g, '').endsWith(last9)) ||
          u.parentId === existingParent.id
        )
      );

      if (parentUser) {
        parentUser.parentId = existingParent.id;
        parentUser.phone = pRaw;
        if (parentName && parentName.trim()) parentUser.name = parentName.trim();
        parentUser.updatedAt = new Date().toISOString();
      } else {
        const username = \`parent_\${last9}\`;
        db.data.users.push({
          id: db.generateId(),
          username,
          email: existingParent.email || \`guardian.\${last9}@parent.cams.lk\`,
          passwordHash: await bcrypt.hash('parent123', 10),
          name: existingParent.name,
          roleId,
          phone: pRaw,
          avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
          parentId: existingParent.id,
          isActive: true,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
    }`;

if (oldPostParentRegex.test(content)) {
  content = content.replace(oldPostParentRegex, newPostParentCode);
  console.log('Successfully patched POST / parent logic');
} else {
  console.warn('Regex match for POST / parent failed');
}

// 3. Patch PUT /:id parent handling
const oldPutParentRegex = /\/\/ Sync Parent Name & Phone[\s\S]*?if \(parentName !== undefined\) \{[\s\S]*?student\.parentName = parentName \? parentName\.trim\(\) : undefined;\s*\}/;
const newPutParentCode = `// Sync Parent Name & Phone
    if (parentPhone !== undefined) {
      const cleanParentPhone = parentPhone ? parentPhone.trim() : undefined;
      student.parentPhone = cleanParentPhone;

      if (cleanParentPhone) {
        const pDigits = cleanParentPhone.replace(/\\D/g, '');
        const last9 = pDigits.slice(-9);

        // 1. Look for existing parent by phone first (to unify siblings)
        let parent = db.data.parents.find(p => {
          if (!p.phone) return false;
          const existDigits = p.phone.replace(/\\D/g, '');
          return p.phone.trim() === cleanParentPhone || (last9.length >= 7 && existDigits.endsWith(last9));
        }) || null;

        // 2. If not found by phone, check current student's parentId
        if (!parent && student.parentId) {
          parent = db.data.parents.find(p => p.id === student.parentId) || null;
        }

        if (parent) {
          parent.phone = cleanParentPhone;
          if (parentName !== undefined && parentName.trim()) parent.name = parentName.trim();
          if (whatsapp !== undefined && whatsapp.trim()) parent.whatsapp = whatsapp.trim();
          parent.updatedAt = new Date().toISOString();
          student.parentId = parent.id;
        } else {
          const newParent: Parent = {
            id: db.generateId(),
            name: (parentName && parentName.trim()) || \`\${student.fullName}'s Guardian\`,
            phone: cleanParentPhone,
            whatsapp: (whatsapp && whatsapp.trim()) || cleanParentPhone,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          db.data.parents.push(newParent);
          student.parentId = newParent.id;
          parent = newParent;
        }

        // Link all other students sharing this parent phone to this same parent record
        db.data.students.forEach(otherStudent => {
          if (otherStudent.id !== student.id && otherStudent.parentPhone) {
            const otherDigits = otherStudent.parentPhone.replace(/\\D/g, '');
            if (otherStudent.parentPhone.trim() === cleanParentPhone || (last9.length >= 7 && otherDigits.endsWith(last9))) {
              otherStudent.parentId = parent!.id;
              if (parentName && parentName.trim() && (!otherStudent.parentName || otherStudent.parentName.includes("'s Guardian"))) {
                otherStudent.parentName = parentName.trim();
              }
            }
          }
        });

        // Sync or create PARENT user in db.data.users
        const parentRole = db.data.roles.find(r => r.name === 'PARENT');
        const roleId = parentRole?.id || 'role-parent';
        let parentUser = db.data.users.find(u =>
          u.roleId === roleId && (
            (u.phone && u.phone.replace(/\\D/g, '').endsWith(last9)) ||
            u.parentId === parent!.id
          )
        );

        if (parentUser) {
          parentUser.parentId = parent.id;
          parentUser.phone = cleanParentPhone;
          if (parentName && parentName.trim()) parentUser.name = parentName.trim();
          parentUser.updatedAt = new Date().toISOString();
        } else {
          const username = \`parent_\${last9}\`;
          db.data.users.push({
            id: db.generateId(),
            username,
            email: parent.email || \`guardian.\${last9}@parent.cams.lk\`,
            passwordHash: await bcrypt.hash('parent123', 10),
            name: parent.name,
            roleId,
            phone: cleanParentPhone,
            avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
            parentId: parent.id,
            isActive: true,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          });
        }
      }
    }

    if (parentName !== undefined) {
      const cleanParentName = parentName ? parentName.trim() : undefined;
      student.parentName = cleanParentName;
      if (student.parentId && cleanParentName) {
        const prt = db.data.parents.find(p => p.id === student.parentId);
        if (prt) prt.name = cleanParentName;
      }
    }`;

if (oldPutParentRegex.test(content)) {
  content = content.replace(oldPutParentRegex, newPutParentCode);
  console.log('Successfully patched PUT /:id parent logic');
} else {
  console.warn('Regex match for PUT /:id parent failed');
}

// 4. Return populated parent in PUT /:id response
const oldPutReturnRegex = /return res\.json\({\s*\.\.\.student,\s*enrollments: updatedEnrollments,\s*portalLinkResult\s*}\);/;
const newPutReturnCode = `const populatedParent = student.parentId ? db.data.parents.find(p => p.id === student.parentId) : null;

    return res.json({
      ...student,
      parent: populatedParent,
      enrollments: updatedEnrollments,
      portalLinkResult
    });`;

if (oldPutReturnRegex.test(content)) {
  content = content.replace(oldPutReturnRegex, newPutReturnCode);
  console.log('Successfully patched PUT /:id return to include parent');
} else {
  console.warn('Regex match for PUT /:id return failed');
}

fs.writeFileSync(targetPath, content, 'utf8');
console.log('Done updating server/src/routes/students.ts');
