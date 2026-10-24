const fs = require('fs');
const path = require('path');

const dbPath = path.join(__dirname, '..', 'server', 'src', 'db.ts');
let code = fs.readFileSync(dbPath, 'utf8');

// 1. Add hasFaceEnrolled to Student
code = code.replace(
  'rfidTag?: string; // 125kHz HID RFID Card / Keyfob UID (e.g. 10-digit decimal or 8-digit hex)',
  'rfidTag?: string; // 125kHz HID RFID Card / Keyfob UID (e.g. 10-digit decimal or 8-digit hex)\r\n  hasFaceEnrolled?: boolean;\r\n  faceEnrolledAt?: string;'
);

// 2. Add FaceTemplate interface before Attendance
const faceTemplateDef = `
export interface FaceTemplate {
  id: string;
  studentId: string;
  studentIdNumber: string;
  label: string;
  descriptor: number[]; // 128-d facial embedding vector
  descriptors?: number[][];
  consentGiven: boolean;
  consentDate: string;
  consentBy: string;
  photoSampleUrl?: string;
  qualityScore?: number;
  enrolledBy: string;
  createdAt: string;
  updatedAt: string;
}
`;

code = code.replace('export interface Attendance {', faceTemplateDef + 'export interface Attendance {');

// 3. Update Attendance method and add reviewStatus
code = code.replace(
  "method: 'QR_CODE' | 'BARCODE' | 'RFID' | 'MANUAL' | 'ID_CARD';",
  "method: 'QR_CODE' | 'BARCODE' | 'RFID' | 'MANUAL' | 'ID_CARD' | 'FACE';\r\n  reviewStatus?: 'AUTO_VERIFIED' | 'MANUAL_CONFIRMED' | 'UNCERTAIN';\r\n  confidenceScore?: number;"
);

// 4. Update DatabaseData
code = code.replace(
  'attendanceSessions: AttendanceSession[];',
  'attendanceSessions: AttendanceSession[];\r\n  faceTemplates: FaceTemplate[];'
);

// 5. Update getDefaultData()
code = code.replace(
  'attendanceSessions: [],',
  'attendanceSessions: [],\r\n      faceTemplates: [],'
);

// 6. Update load()
code = code.replace(
  'if (Array.isArray(parsed.students)) {',
  'if (!Array.isArray(parsed.faceTemplates)) { parsed.faceTemplates = []; }\r\n        if (Array.isArray(parsed.students)) {'
);

fs.writeFileSync(dbPath, code, 'utf8');
console.log('db.ts updated successfully');
