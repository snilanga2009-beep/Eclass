const fs = require('fs');
const path = require('path');

const reportPath = path.join(__dirname, '..', 'server', 'src', 'routes', 'reports.ts');
let code = fs.readFileSync(reportPath, 'utf8');

const oldAttReport = `  if (reportId === 'attendance') {
    const data = db.data.attendances.map(a => {
      const student = db.data.students.find(s => s.id === a.studentId);
      const cls = db.data.classes.find(c => c.id === a.classId);
      return {
        'Date': a.date,
        'Student ID': student?.studentIdNumber || 'N/A',
        'Student Name': student?.fullName || 'N/A',
        'Class': cls?.name || 'N/A',
        'Status': a.status,
        'Method': a.method,
        'Scanned Time': new Date(a.scannedAt).toLocaleTimeString(),
        'Recorded By': a.recordedBy || 'N/A'
      };
    });
    return res.json({ title: 'Attendance Ledger', data });
  }`;

const newAttReport = `  if (reportId === 'attendance') {
    const methodFilter = req.query.method ? String(req.query.method).toUpperCase() : null;
    let list = db.data.attendances;
    if (methodFilter && methodFilter !== 'ALL') {
      list = list.filter(a => (a.method || 'QR_CODE').toUpperCase() === methodFilter);
    }
    const data = list.map(a => {
      const student = db.data.students.find(s => s.id === a.studentId);
      const cls = db.data.classes.find(c => c.id === a.classId);
      return {
        'Date': a.date,
        'Student ID': student?.studentIdNumber || 'N/A',
        'Student Name': student?.fullName || 'N/A',
        'Class': cls?.name || 'N/A',
        'Status': a.status,
        'Method': a.method || 'QR_CODE',
        'Review Status': a.reviewStatus || 'AUTO_VERIFIED',
        'Confidence': a.confidenceScore ? \`\${Math.round(a.confidenceScore * 100)}%\` : 'N/A',
        'Scanned Time': new Date(a.scannedAt).toLocaleTimeString(),
        'Recorded By': a.recordedBy || 'N/A'
      };
    });
    return res.json({ title: 'Attendance Ledger', data });
  }`;

code = code.replace(oldAttReport, newAttReport);

// Add GET /api/reports/attendance-analytics endpoint before export default router
const analyticsEndpoint = `
// GET /api/reports/attendance-analytics - Method-filtered attendance statistics & breakdown
router.get('/attendance-analytics', authenticateToken, (req: AuthRequest, res: Response) => {
  const { startDate, endDate, classId, method } = req.query;

  let list = db.data.attendances;

  if (startDate) {
    list = list.filter(a => a.date >= String(startDate));
  }
  if (endDate) {
    list = list.filter(a => a.date <= String(endDate));
  }
  if (classId && classId !== 'ALL') {
    list = list.filter(a => a.classId === classId);
  }
  if (method && method !== 'ALL') {
    list = list.filter(a => (a.method || 'QR_CODE').toUpperCase() === String(method).toUpperCase());
  }

  const total = list.length;
  const present = list.filter(a => a.status === 'PRESENT').length;
  const late = list.filter(a => a.status === 'LATE').length;

  const byMethod = {
    QR_CODE: list.filter(a => a.method === 'QR_CODE').length,
    BARCODE: list.filter(a => a.method === 'BARCODE').length,
    RFID: list.filter(a => a.method === 'RFID').length,
    FACE: list.filter(a => a.method === 'FACE').length,
    MANUAL: list.filter(a => a.method === 'MANUAL').length
  };

  const methodPercentages = {
    QR_CODE: total > 0 ? Math.round((byMethod.QR_CODE / total) * 100) : 0,
    BARCODE: total > 0 ? Math.round((byMethod.BARCODE / total) * 100) : 0,
    RFID: total > 0 ? Math.round((byMethod.RFID / total) * 100) : 0,
    FACE: total > 0 ? Math.round((byMethod.FACE / total) * 100) : 0,
    MANUAL: total > 0 ? Math.round((byMethod.MANUAL / total) * 100) : 0
  };

  return res.json({
    total,
    present,
    late,
    onTimeRate: total > 0 ? Math.round((present / total) * 100) : 100,
    byMethod,
    methodPercentages,
    records: list.slice(0, 100).map(a => {
      const student = db.data.students.find(s => s.id === a.studentId);
      const cls = db.data.classes.find(c => c.id === a.classId);
      return {
        id: a.id,
        date: a.date,
        scannedAt: a.scannedAt,
        studentName: student?.fullName || 'Student',
        studentIdNumber: student?.studentIdNumber || '',
        className: cls?.name || 'Class',
        status: a.status,
        method: a.method || 'QR_CODE',
        reviewStatus: a.reviewStatus || 'AUTO_VERIFIED',
        confidenceScore: a.confidenceScore || null
      };
    })
  });
});
`;

code = code.replace('export default router;', analyticsEndpoint + '\r\nexport default router;');

fs.writeFileSync(reportPath, code, 'utf8');
console.log('reports.ts updated successfully with method filtering and analytics');
