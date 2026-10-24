const http = require('http');

const PORT = 5000;
const HOST = 'localhost';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = body ? JSON.parse(body) : null;
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(typeof data === 'string' ? data : JSON.stringify(data));
    }
    req.end();
  });
}

async function runTest() {
  console.log('--- Starting Multi-Student & Parent Contact Verification Test ---');

  // 1. Admin Login
  const loginRes = await request({
    host: HOST,
    port: PORT,
    path: '/api/auth/login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { username: 'admin', password: 'password123' });

  if (loginRes.status !== 200 || !loginRes.body?.token) {
    throw new Error('Admin login failed: ' + JSON.stringify(loginRes.body));
  }
  const adminToken = loginRes.body.token;
  console.log('✓ Admin authenticated successfully');

  // 2. Fetch existing students
  const studentsRes = await request({
    host: HOST,
    port: PORT,
    path: '/api/students',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${adminToken}` }
  });

  const students = studentsRes.body;
  if (!Array.isArray(students) || students.length < 2) {
    throw new Error('Need at least 2 students to test sibling multi-student linking');
  }

  const studentA = students[0];
  const studentB = students[1];
  console.log(`✓ Using Student A: ${studentA.fullName} (${studentA.studentIdNumber})`);
  console.log(`✓ Using Student B: ${studentB.fullName} (${studentB.studentIdNumber})`);

  const sharedParentPhone = '077 888 7777';
  const sharedParentName = 'Dr. Sunil Wickramasinghe';

  // 3. Update Student A parent details
  const updateARes = await request({
    host: HOST,
    port: PORT,
    path: `/api/students/${studentA.id}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    parentName: sharedParentName,
    parentPhone: sharedParentPhone
  });

  if (updateARes.status !== 200) {
    throw new Error(`Failed to update Student A parent: ${JSON.stringify(updateARes.body)}`);
  }
  if (!updateARes.body.parent || updateARes.body.parent.phone !== sharedParentPhone) {
    throw new Error(`Student A response did not include populated parent object: ${JSON.stringify(updateARes.body.parent)}`);
  }
  console.log('✓ Student A Parent Contact updated & populated in PUT response: ' + updateARes.body.parent.name);

  // 4. Update Student B parent details to the SAME number (Multi-student siblings)
  const updateBRes = await request({
    host: HOST,
    port: PORT,
    path: `/api/students/${studentB.id}`,
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    parentName: sharedParentName,
    parentPhone: sharedParentPhone
  });

  if (updateBRes.status !== 200) {
    throw new Error(`Failed to update Student B parent: ${JSON.stringify(updateBRes.body)}`);
  }
  if (!updateBRes.body.parent || updateBRes.body.parent.id !== updateARes.body.parent.id) {
    throw new Error(`Both students should share the exact same parentId! S1: ${updateARes.body.parent?.id}, S2: ${updateBRes.body.parent?.id}`);
  }
  console.log('✓ Student B successfully linked to the SAME parent record without conflict: ' + updateBRes.body.parent.id);

  // 5. Test Parent 1-Time Mobile Login with the shared phone number
  const parentLoginRes = await request({
    host: HOST,
    port: PORT,
    path: '/api/auth/parent-login',
    method: 'POST',
    headers: { 'Content-Type': 'application/json' }
  }, { phone: sharedParentPhone });

  if (parentLoginRes.status !== 200) {
    throw new Error(`Parent login failed: ${JSON.stringify(parentLoginRes.body)}`);
  }
  const parentToken = parentLoginRes.body.token;
  const loginChildren = parentLoginRes.body.children;
  console.log(`✓ Parent login successful! Found ${loginChildren.length} linked children in login response.`);

  const foundA = loginChildren.find(c => c.id === studentA.id);
  const foundB = loginChildren.find(c => c.id === studentB.id);
  if (!foundA || !foundB) {
    throw new Error('Both siblings must be present in parent login response!');
  }
  console.log(`✓ Both siblings verified in parent login: ${foundA.fullName} & ${foundB.fullName}`);

  // 6. Test GET /api/auth/parent-children with parent token
  const parentChildrenRes = await request({
    host: HOST,
    port: PORT,
    path: '/api/auth/parent-children',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });

  if (parentChildrenRes.status !== 200) {
    throw new Error(`GET /api/auth/parent-children failed: ${JSON.stringify(parentChildrenRes.body)}`);
  }
  const childrenList = parentChildrenRes.body;
  console.log(`✓ GET /api/auth/parent-children returned ${childrenList.length} children.`);

  const listHasA = childrenList.find(c => c.id === studentA.id);
  const listHasB = childrenList.find(c => c.id === studentB.id);
  if (!listHasA || !listHasB) {
    throw new Error('GET /api/auth/parent-children did not return both siblings!');
  }

  console.log(`✓ Child 1: ${listHasA.fullName} - ID: ${listHasA.studentIdNumber} - Attendances Count: ${listHasA.attendancesCount}`);
  console.log(`✓ Child 2: ${listHasB.fullName} - ID: ${listHasB.studentIdNumber} - Attendances Count: ${listHasB.attendancesCount}`);

  // 7. Test record attendance for Child A with FACE method
  const todayStr = new Date().toISOString().substring(0, 10);
  const markAttRes = await request({
    host: HOST,
    port: PORT,
    path: '/api/attendance/scan',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${adminToken}`,
      'Content-Type': 'application/json'
    }
  }, {
    studentId: studentA.id,
    method: 'FACE',
    classId: (studentA.enrollments?.[0]?.classId) || 'CLS-101'
  });

  console.log(`✓ Attendance scan result for Student A: HTTP ${markAttRes.status} (${markAttRes.body?.message || markAttRes.body?.status})`);

  // 8. Re-query parent children to check live attendance status
  const refreshedChildrenRes = await request({
    host: HOST,
    port: PORT,
    path: '/api/auth/parent-children',
    method: 'GET',
    headers: { 'Authorization': `Bearer ${parentToken}` }
  });

  const refreshedA = refreshedChildrenRes.body.find(c => c.id === studentA.id);
  const refreshedB = refreshedChildrenRes.body.find(c => c.id === studentB.id);

  console.log(`✓ Student A today gate status: ${refreshedA.todayAttendance ? (refreshedA.todayAttendance.status + ' via ' + refreshedA.todayAttendance.method) : 'No attendance'}`);
  console.log(`✓ Student B today gate status: ${refreshedB.todayAttendance ? (refreshedB.todayAttendance.status + ' via ' + refreshedB.todayAttendance.method) : 'No attendance (unattended as expected)'}`);

  console.log('\n============================================================');
  console.log('🎉 ALL MULTI-STUDENT & PARENT PORTAL VERIFICATIONS PASSED! 🎉');
  console.log('============================================================');
}

runTest().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
