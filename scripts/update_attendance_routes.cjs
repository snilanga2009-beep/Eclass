const fs = require('fs');
const path = require('path');

const attPath = path.join(__dirname, '..', 'server', 'src', 'routes', 'attendance.ts');
let code = fs.readFileSync(attPath, 'utf8');

// 1. In router.post('/scan') add method enabled check & late rule
const oldScanStart = `    const scanDate = date || new Date().toISOString().substring(0, 10);
    const scanMethod = method || (rfidTag ? 'RFID' : 'QR_CODE');`;

const newScanStart = `    const scanDate = date || new Date().toISOString().substring(0, 10);
    const scanMethod = method || (rfidTag ? 'RFID' : 'QR_CODE');

    // Admin Method Access Control Check
    const methodCheckKey = 
      scanMethod === 'QR_CODE' ? 'ATTENDANCE_METHOD_QR' :
      scanMethod === 'BARCODE' ? 'ATTENDANCE_METHOD_BARCODE' :
      scanMethod === 'RFID' ? 'ATTENDANCE_METHOD_RFID' :
      scanMethod === 'FACE' ? 'ATTENDANCE_METHOD_FACE' : null;

    if (methodCheckKey) {
      const isMethodEnabled = db.data.settings.find(s => s.key === methodCheckKey)?.value !== 'false';
      if (!isMethodEnabled) {
        return res.status(403).json({
          scanResult: 'ERROR',
          message: \`\${scanMethod} attendance is currently disabled by administrator in System Settings.\`
        });
      }
    }`;

code = code.replace(oldScanStart, newScanStart);

// 2. In router.post('/scan') calculate late status and apply reviewStatus & confidenceScore
const oldNewAtt = `    const newAttendance: Attendance = {
      id: db.generateId(),
      sessionId: session.id,
      studentId: student.id,
      classId: targetClassId,
      date: scanDate,
      status: 'PRESENT',
      scannedAt: new Date().toISOString(),
      method: scanMethod as any,
      recordedBy: req.user?.name || 'Scanner'
    };`;

const newNewAtt = `    // Late Arrival Rule Evaluation
    const lateThresholdMinutes = Number(db.data.settings.find(s => s.key === 'LATE_THRESHOLD_MINUTES')?.value || '15');
    let attendanceStatus: 'PRESENT' | 'LATE' = 'PRESENT';

    if (currentClass.startTime) {
      try {
        const [startHours, startMinutes] = currentClass.startTime.split(':').map(Number);
        if (!isNaN(startHours) && !isNaN(startMinutes)) {
          const classStartDate = new Date(scanDate);
          classStartDate.setHours(startHours, startMinutes, 0, 0);
          const lateCutoffMs = classStartDate.getTime() + (lateThresholdMinutes * 60 * 1000);
          if (Date.now() > lateCutoffMs) {
            attendanceStatus = 'LATE';
          }
        }
      } catch {}
    }

    const { reviewStatus, confidenceScore } = req.body;

    const newAttendance: Attendance = {
      id: db.generateId(),
      sessionId: session.id,
      studentId: student.id,
      classId: targetClassId,
      date: scanDate,
      status: attendanceStatus,
      scannedAt: new Date().toISOString(),
      method: scanMethod as any,
      reviewStatus: reviewStatus || (scanMethod === 'FACE' ? 'AUTO_VERIFIED' : undefined),
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : undefined,
      recordedBy: req.user?.name || 'Scanner'
    };`;

code = code.replace(oldNewAtt, newNewAtt);

// 3. In /today-roster add method filter support
const oldRosterFilter = `    // Filter by classId if specified
    if (targetClassId && targetClassId !== 'ALL') {
      dayAttendances = dayAttendances.filter(a => a.classId === targetClassId);
    }`;

const newRosterFilter = `    // Filter by classId if specified
    if (targetClassId && targetClassId !== 'ALL') {
      dayAttendances = dayAttendances.filter(a => a.classId === targetClassId);
    }

    // Filter by method if specified (QR_CODE, BARCODE, RFID, FACE, MANUAL)
    const targetMethod = req.query.method ? String(req.query.method).toUpperCase() : null;
    if (targetMethod && targetMethod !== 'ALL') {
      dayAttendances = dayAttendances.filter(a => (a.method || 'QR_CODE').toUpperCase() === targetMethod);
    }`;

code = code.replace(oldRosterFilter, newRosterFilter);

// 4. In roster mapping include reviewStatus and confidenceScore
const oldRosterMapStatus = `        date: att.date,
        status: att.status, // 'PRESENT' | 'LATE'
        scannedAt: att.scannedAt,
        method: att.method || 'QR_CODE', // 'QR_CODE' | 'BARCODE' | 'RFID' | 'MANUAL'
        recordedBy: att.recordedBy || 'Staff',`;

const newRosterMapStatus = `        date: att.date,
        status: att.status, // 'PRESENT' | 'LATE'
        scannedAt: att.scannedAt,
        method: att.method || 'QR_CODE', // 'QR_CODE' | 'BARCODE' | 'RFID' | 'FACE' | 'MANUAL'
        reviewStatus: att.reviewStatus || 'AUTO_VERIFIED',
        confidenceScore: att.confidenceScore || null,
        recordedBy: att.recordedBy || 'Staff',`;

code = code.replace(oldRosterMapStatus, newRosterMapStatus);

// 5. In methodsBreakdown include FACE
const oldBreakdown = `    const methodsBreakdown = {
      QR_CODE: roster.filter(r => r.method === 'QR_CODE').length,
      BARCODE: roster.filter(r => r.method === 'BARCODE').length,
      RFID: roster.filter(r => r.method === 'RFID').length,
      MANUAL: roster.filter(r => r.method === 'MANUAL').length
    };`;

const newBreakdown = `    const methodsBreakdown = {
      QR_CODE: roster.filter(r => r.method === 'QR_CODE').length,
      BARCODE: roster.filter(r => r.method === 'BARCODE').length,
      RFID: roster.filter(r => r.method === 'RFID').length,
      FACE: roster.filter(r => r.method === 'FACE').length,
      MANUAL: roster.filter(r => r.method === 'MANUAL').length
    };`;

code = code.replace(oldBreakdown, newBreakdown);

fs.writeFileSync(attPath, code, 'utf8');
console.log('attendance.ts updated successfully with 4th method, admin controls and late rules');
