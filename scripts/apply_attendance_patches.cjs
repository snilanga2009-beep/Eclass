const fs = require('fs');
const path = require('path');

const attPath = path.join(__dirname, '..', 'server', 'src', 'routes', 'attendance.ts');
let code = fs.readFileSync(attPath, 'utf8').replace(/\r\n/g, '\n');

// 1. Scan method check
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

if (code.includes(oldScanStart)) {
  code = code.replace(oldScanStart, newScanStart);
  console.log('1. Scan method check applied');
} else {
  console.log('1. Scan method check already present or not found');
}

// 2. newAttendance with late rule and reviewStatus/confidenceScore
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

    const newAttendance: Attendance = {
      id: db.generateId(),
      sessionId: session.id,
      studentId: student.id,
      classId: targetClassId,
      date: scanDate,
      status: attendanceStatus,
      scannedAt: new Date().toISOString(),
      method: scanMethod as any,
      reviewStatus: reviewStatus || (scanMethod === 'FACE' ? 'AUTO_CONFIRMED' : undefined),
      confidenceScore: typeof confidenceScore === 'number' ? confidenceScore : undefined,
      recordedBy: req.user?.name || 'Scanner'
    };`;

if (code.includes(oldNewAtt)) {
  code = code.replace(oldNewAtt, newNewAtt);
  console.log('2. newAttendance late rule & face status applied');
} else {
  console.log('2. newAttendance already present or not found');
}

// 3. /today-roster filter
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

if (code.includes(oldRosterFilter)) {
  code = code.replace(oldRosterFilter, newRosterFilter);
  console.log('3. /today-roster method filter applied');
} else {
  console.log('3. /today-roster filter already present or not found');
}

// 4. roster mapping
const oldRosterMapStatus = `        date: att.date,
        status: att.status, // 'PRESENT' | 'LATE'
        scannedAt: att.scannedAt,
        method: att.method || 'QR_CODE', // 'QR_CODE' | 'BARCODE' | 'RFID' | 'MANUAL'
        recordedBy: att.recordedBy || 'Staff',`;

const newRosterMapStatus = `        date: att.date,
        status: att.status, // 'PRESENT' | 'LATE'
        scannedAt: att.scannedAt,
        method: att.method || 'QR_CODE', // 'QR_CODE' | 'BARCODE' | 'RFID' | 'FACE' | 'MANUAL'
        reviewStatus: att.reviewStatus || 'AUTO_CONFIRMED',
        confidenceScore: att.confidenceScore || null,
        recordedBy: att.recordedBy || 'Staff',`;

if (code.includes(oldRosterMapStatus)) {
  code = code.replace(oldRosterMapStatus, newRosterMapStatus);
  console.log('4. roster mapping updated');
} else {
  console.log('4. roster mapping already present or not found');
}

// 5. methodsBreakdown include FACE
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

if (code.includes(oldBreakdown)) {
  code = code.replace(oldBreakdown, newBreakdown);
  console.log('5. methodsBreakdown updated');
} else {
  console.log('5. methodsBreakdown already present or not found');
}

fs.writeFileSync(attPath, code.replace(/\n/g, '\r\n'), 'utf8');
console.log('attendance.ts successfully updated');
