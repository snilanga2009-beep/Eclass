const http = require('http');
const path = require('path');
const jwt = require('jsonwebtoken');

// Change working directory to server directory so relative paths work
process.chdir(path.join(__dirname, '..', 'server'));
process.env.PORT = '5099';
process.env.JWT_SECRET = 'cams_super_secure_jwt_secret_key_2026_lk';

async function runTests() {
  console.log('===============================================================');
  console.log('🧪 Starting End-to-End Attendance Suite (All 4 Methods)        ');
  console.log('===============================================================');

  // Require db and server
  const dbModule = require('../server/dist/db.js');
  const db = dbModule.default || dbModule;
  const app = require('../server/dist/index.js').default || require('../server/dist/index.js');

  const server = http.createServer(app);
  await new Promise(resolve => server.listen(5099, '127.0.0.1', resolve));
  console.log('✅ Test Server running on http://127.0.0.1:5099');

  const baseUrl = 'http://127.0.0.1:5099';

  // Create Admin JWT Token
  const adminUser = db.data.users.find(u => u.username === 'admin') || db.data.users[0];
  const adminToken = jwt.sign(
    { userId: adminUser.id, username: adminUser.username, role: 'ADMIN' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  const authHeaders = {
    'Authorization': `Bearer ${adminToken}`,
    'Content-Type': 'application/json'
  };

  // Helper request function
  async function api(endpoint, options = {}) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      ...options,
      headers: {
        ...authHeaders,
        ...(options.headers || {})
      }
    });
    const text = await res.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }
    return { status: res.status, ok: res.ok, data };
  }

  let passed = 0;
  let failed = 0;

  function assert(condition, message) {
    if (condition) {
      console.log(`  ✅ PASS: ${message}`);
      passed++;
    } else {
      console.error(`  ❌ FAIL: ${message}`);
      failed++;
    }
  }

  try {
    // 1. Setup test class and students
    console.log('\n--- Test 1: Setup Test Students & Class Session ---');
    const today = new Date().toISOString().split('T')[0];
    
    // Pick or create class
    let testClass = db.data.classes[0];
    if (!testClass) {
      testClass = {
        id: 'cls_test_' + Date.now(),
        classCode: 'CLS-TEST-01',
        name: 'Automated Test Class',
        subjectId: 'sub_test',
        teacherId: 'tch_test',
        grade: '11',
        dayOfWeek: 'Monday',
        startTime: '08:00',
        endTime: '10:00',
        room: 'Lab 1',
        status: 'ACTIVE',
        monthlyFee: 1000,
        maxStudents: 50,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      db.data.classes.push(testClass);
      db.save();
    }
    assert(testClass && testClass.id, `Test class available: ${testClass.name} (${testClass.id})`);

    // Ensure we have 4 test students
    const studentStubs = [
      { id: 'std_qr_test', studentIdNumber: 'STU-QR-001', name: 'Kasun Perera (QR Test)', qr: 'QR-TOKEN-999001' },
      { id: 'std_bar_test', studentIdNumber: 'STU-BAR-002', name: 'Nimal Silva (Barcode Test)' },
      { id: 'std_rfid_test', studentIdNumber: 'STU-RFID-003', name: 'Kamal Bandara (RFID Test)', rfid: '0009998881' },
      { id: 'std_face_test', studentIdNumber: 'STU-FACE-004', name: 'Dilshan Fonseka (Face Test)' }
    ];

    for (const stub of studentStubs) {
      let st = db.data.students.find(s => s.id === stub.id || s.studentIdNumber === stub.studentIdNumber);
      if (!st) {
        st = {
          id: stub.id,
          studentIdNumber: stub.studentIdNumber,
          fullName: stub.name,
          phone: '0771234567',
          grade: '11',
          registrationDate: today,
          status: 'ACTIVE',
          rfidTag: stub.rfid,
          qrCodeToken: stub.qr,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        db.data.students.push(st);
      } else {
        st.status = 'ACTIVE';
        st.fullName = stub.name;
        if (stub.rfid) st.rfidTag = stub.rfid;
        if (stub.qr) st.qrCodeToken = stub.qr;
      }

      // Ensure class student enrollment
      if (!db.data.classStudents.some(cs => cs.studentId === stub.id && cs.classId === testClass.id)) {
        db.data.classStudents.push({
          id: 'cs_' + stub.id,
          classId: testClass.id,
          studentId: stub.id,
          enrolledAt: today,
          status: 'ACTIVE'
        });
      }
    }

    // Clean out prior attendance records for today's test
    db.data.attendances = (db.data.attendances || []).filter(a => !(
      a.date === today && a.classId === testClass.id && 
      studentStubs.some(s => s.id === a.studentId)
    ));
    // Clean out previous face templates for clean slate
    db.data.faceTemplates = (db.data.faceTemplates || []).filter(t => t.studentId !== 'std_face_test');
    db.save();
    assert(true, 'Test students and clean attendance roster ready');

    // 2. Test Admin Settings for all 4 methods
    console.log('\n--- Test 2: Admin Settings & Configuration ---');
    // Ensure all 4 methods are enabled
    const ensureSettings = [
      { key: 'ATTENDANCE_METHOD_QR', value: 'true' },
      { key: 'ATTENDANCE_METHOD_BARCODE', value: 'true' },
      { key: 'ATTENDANCE_METHOD_RFID', value: 'true' },
      { key: 'ATTENDANCE_METHOD_FACE', value: 'true' },
      { key: 'FACE_MATCH_THRESHOLD', value: '0.45' },
      { key: 'FACE_REVIEW_THRESHOLD', value: '0.58' },
      { key: 'LATE_THRESHOLD_MINUTES', value: '15' }
    ];
    for (const s of ensureSettings) {
      const idx = db.data.settings.findIndex(item => item.key === s.key);
      if (idx >= 0) db.data.settings[idx].value = s.value;
      else db.data.settings.push(s);
    }
    db.save();
    assert(true, 'All 4 attendance methods (QR, Barcode, RFID, Face) enabled in Admin Settings');

    // 3. Test QR Code Attendance
    console.log('\n--- Test 3: Method 1 - QR Code Scan Attendance ---');
    const qrRes = await api('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        token: 'QR-TOKEN-999001',
        classId: testClass.id,
        method: 'QR_CODE'
      })
    });
    assert(qrRes.status === 200 || qrRes.status === 201, `QR Code scan succeeded with HTTP ${qrRes.status}`);
    assert(qrRes.data.attendance && qrRes.data.attendance.method === 'QR_CODE', `Attendance method recorded as 'QR_CODE'`);
    const originalTimestamp = qrRes.data.attendance ? qrRes.data.attendance.scannedAt : null;

    // 4. Test Duplicate Prevention Across Methods
    console.log('\n--- Test 4: Cross-Method Duplicate Prevention ---');
    const dupRes = await api('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        token: 'STU-QR-001',
        classId: testClass.id,
        method: 'RFID' // Attempt duplicate scan with RFID
      })
    });
    assert(dupRes.data.scanResult === 'ALREADY_RECORDED', 'Duplicate scan prevented with scanResult: ALREADY_RECORDED');
    assert(dupRes.data.attendance && dupRes.data.attendance.scannedAt === originalTimestamp, 'Original arrival timestamp strictly preserved');

    // 5. Test Barcode Attendance
    console.log('\n--- Test 5: Method 2 - Barcode Reader Attendance ---');
    const barRes = await api('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        token: 'STU-BAR-002',
        classId: testClass.id,
        method: 'BARCODE'
      })
    });
    assert(barRes.status === 200 || barRes.status === 201, `Barcode scan succeeded with HTTP ${barRes.status}`);
    assert(barRes.data.attendance && barRes.data.attendance.method === 'BARCODE', `Attendance method recorded as 'BARCODE'`);

    // 6. Test RFID Attendance
    console.log('\n--- Test 6: Method 3 - RFID Card Reader Attendance ---');
    const rfidRes = await api('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        token: '0009998881',
        classId: testClass.id,
        method: 'RFID'
      })
    });
    assert(rfidRes.status === 200 || rfidRes.status === 201, `RFID card tap succeeded with HTTP ${rfidRes.status}`);
    assert(rfidRes.data.attendance && rfidRes.data.attendance.method === 'RFID', `Attendance method recorded as 'RFID'`);

    // 7. Test Face Recognition Enrollment (Consent-based)
    console.log('\n--- Test 7: Method 4 - Consent-Based Face Enrollment ---');
    // Generate normalized simulated 128-d face descriptor vector
    const rawVec = Array.from({ length: 128 }, (_, i) => Math.sin(i * 0.1) * 0.05 + 0.05);
    const norm = Math.sqrt(rawVec.reduce((sum, v) => sum + v * v, 0));
    const mock128Descriptor = rawVec.map(v => v / norm);

    // Test rejection without consent
    const noConsentRes = await api('/api/face/enroll', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 'std_face_test',
        descriptor: mock128Descriptor,
        consentGiven: false
      })
    });
    assert(noConsentRes.status === 400, 'Rejection of enrollment without explicit parental/student consent');

    // Test successful enrollment with consent
    const enrollRes = await api('/api/face/enroll', {
      method: 'POST',
      body: JSON.stringify({
        studentId: 'std_face_test',
        descriptor: mock128Descriptor,
        consentGiven: true,
        consentBy: 'Parent (K. Fonseka)'
      })
    });
    assert(enrollRes.status === 200, `Face enrollment succeeded with HTTP ${enrollRes.status}`);
    assert(enrollRes.data.template && enrollRes.data.template.consentGiven === true, 'Face enrollment response returned consent confirmation');
    const storedTemplate = db.data.faceTemplates.find(t => t.studentId === 'std_face_test');
    assert(storedTemplate && storedTemplate.descriptor.length === 128, '128-d biometric template securely stored in database');

    // Verify student profile shows face enrolled
    const studentFaceRes = await api('/api/face/student/std_face_test');
    assert(studentFaceRes.data.hasFaceEnrolled === true, 'Student profile accurately reflects hasFaceEnrolled: true');

    // 8. Test Face Matching Verification (Exact match, Uncertain match, No match)
    console.log('\n--- Test 8: Face Recognition Descriptor Verification ---');
    // High similarity match (small perturbation, distance < 0.45)
    const matchingQuery = mock128Descriptor.map(v => v + 0.005);
    const mNorm = Math.sqrt(matchingQuery.reduce((s, v) => s + v * v, 0));
    const normalizedMatch = matchingQuery.map(v => v / mNorm);

    const verifyMatchRes = await api('/api/face/verify', {
      method: 'POST',
      body: JSON.stringify({ descriptor: normalizedMatch })
    });
    assert(verifyMatchRes.data.matchStatus === 'MATCH', `High similarity query evaluated to 'MATCH' (status: ${verifyMatchRes.data.matchStatus}, distance: ${verifyMatchRes.data.distance})`);
    assert(verifyMatchRes.data.student && verifyMatchRes.data.student.studentIdNumber === 'STU-FACE-004', 'Identified candidate is STU-FACE-004');

    // Borderline similarity query for manual review (distance ~0.50, between 0.45 and 0.58)
    // Create vector with distance exactly ~0.50
    const borderlineQuery = mock128Descriptor.map((v, i) => v + (i % 2 === 0 ? 0.044 : -0.044));
    const bNorm = Math.sqrt(borderlineQuery.reduce((s, v) => s + v * v, 0));
    const normalizedBorderline = borderlineQuery.map(v => v / bNorm);

    const verifyUncertainRes = await api('/api/face/verify', {
      method: 'POST',
      body: JSON.stringify({ descriptor: normalizedBorderline })
    });
    assert(verifyUncertainRes.data.matchStatus === 'UNCERTAIN', `Borderline query correctly triggers 'UNCERTAIN' for manual review (status: ${verifyUncertainRes.data.matchStatus}, distance: ${verifyUncertainRes.data.distance})`);

    // 9. Test Face Recognition Attendance Scan
    console.log('\n--- Test 9: Method 4 - Live Face Recognition Attendance Scan ---');
    const faceScanRes = await api('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        token: 'STU-FACE-004',
        classId: testClass.id,
        method: 'FACE',
        confidenceScore: 0.96,
        reviewStatus: 'AUTO_CONFIRMED'
      })
    });
    assert(faceScanRes.status === 200 || faceScanRes.status === 201, `Face recognition scan recorded with HTTP ${faceScanRes.status}`);
    assert(faceScanRes.data.attendance && faceScanRes.data.attendance.method === 'FACE', `Attendance method recorded as 'FACE'`);
    assert(faceScanRes.data.attendance && faceScanRes.data.attendance.confidenceScore === 0.96, 'Confidence score tracked on attendance record');
    assert(faceScanRes.data.attendance && faceScanRes.data.attendance.reviewStatus === 'AUTO_CONFIRMED', 'Review status tracked on attendance record');

    // 10. Test Admin Method Disabling / Access Control
    console.log('\n--- Test 10: Admin Controls - Disable Method Access ---');
    // Disable Face method in settings
    const faceSettingIdx = db.data.settings.findIndex(s => s.key === 'ATTENDANCE_METHOD_FACE');
    if (faceSettingIdx >= 0) db.data.settings[faceSettingIdx].value = 'false';
    db.save();

    // Attempt face attendance while disabled
    const disabledScanRes = await api('/api/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        token: 'STU-FACE-004',
        classId: testClass.id,
        method: 'FACE'
      })
    });
    assert(disabledScanRes.status === 403, `Blocked disabled attendance method with HTTP 403 (${disabledScanRes.data.message})`);

    // Re-enable Face method
    if (faceSettingIdx >= 0) db.data.settings[faceSettingIdx].value = 'true';
    db.save();

    // 11. Test Reports & Analytics Method Filtering
    console.log('\n--- Test 11: Reports & Method-Filtered Analytics ---');
    const analyticsRes = await api('/api/reports/attendance-analytics');
    assert(analyticsRes.status === 200, 'Attendance analytics endpoint returned HTTP 200');
    assert(analyticsRes.data.byMethod && analyticsRes.data.byMethod.FACE >= 1, `Analytics reports Face attendance: ${analyticsRes.data.byMethod?.FACE}`);
    assert(analyticsRes.data.byMethod && analyticsRes.data.byMethod.QR_CODE >= 1, `Analytics reports QR attendance: ${analyticsRes.data.byMethod?.QR_CODE}`);
    assert(analyticsRes.data.byMethod && analyticsRes.data.byMethod.BARCODE >= 1, `Analytics reports Barcode attendance: ${analyticsRes.data.byMethod?.BARCODE}`);
    assert(analyticsRes.data.byMethod && analyticsRes.data.byMethod.RFID >= 1, `Analytics reports RFID attendance: ${analyticsRes.data.byMethod?.RFID}`);

    // Today roster filtered by FACE
    const faceRosterRes = await api(`/api/attendance/today-roster?classId=${testClass.id}&method=FACE`);
    assert(faceRosterRes.status === 200, 'Today roster method filtering returned HTTP 200');
    assert(Array.isArray(faceRosterRes.data.roster) && faceRosterRes.data.roster.some(r => r.method === 'FACE'), 'Roster contains FACE attendance records');

    console.log('\n===============================================================');
    console.log(`🎉 TEST SUMMARY: ${passed} Passed, ${failed} Failed`);
    console.log('===============================================================');
  } catch (err) {
    console.error('Fatal error during test run:', err);
    failed++;
  } finally {
    server.close();
    process.exit(failed > 0 ? 1 : 0);
  }
}

runTests();
