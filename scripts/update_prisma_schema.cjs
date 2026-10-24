const fs = require('fs');
const path = require('path');

const prismaPath = path.join(__dirname, '..', 'server', 'prisma', 'schema.prisma');
let prismaContent = fs.readFileSync(prismaPath, 'utf8');

// 1. In Student model, add hasFaceEnrolled and faceTemplates
if (!prismaContent.includes('faceTemplates FaceTemplate[]')) {
  prismaContent = prismaContent.replace(
    '  whatsappLogs     WhatsAppLog[]',
    '  whatsappLogs     WhatsAppLog[]\r\n  hasFaceEnrolled  Boolean           @default(false)\r\n  faceTemplates    FaceTemplate[]'
  );
}

// 2. In Attendance model, add method comment including FACE and reviewStatus, confidenceScore
if (!prismaContent.includes('// QR_CODE, BARCODE, RFID, FACE, MANUAL, ID_CARD')) {
  prismaContent = prismaContent.replace(
    "  method     String            @default(\"QR_CODE\") // QR_CODE, BARCODE, RFID, MANUAL, ID_CARD",
    "  method     String            @default(\"QR_CODE\") // QR_CODE, BARCODE, RFID, FACE, MANUAL, ID_CARD\r\n  reviewStatus String?          // AUTO_VERIFIED, MANUAL_CONFIRMED, UNCERTAIN\r\n  confidenceScore Float?        // Match confidence/distance"
  );
}

// 3. Add FaceTemplate model if not present
if (!prismaContent.includes('model FaceTemplate')) {
  const faceTemplateModel = `
// 9b. Face Recognition Biometric Templates
model FaceTemplate {
  id              String   @id @default(uuid())
  studentId       String
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  studentIdNumber String
  label           String   @default("Primary")
  descriptor      String   // JSON stringified 128-d Float32Array embedding vector
  consentGiven    Boolean  @default(false)
  consentDate     DateTime @default(now())
  consentBy       String
  photoSampleUrl  String?
  qualityScore    Float?   @default(1.0)
  enrolledBy      String
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  @@index([studentId])
  @@index([studentIdNumber])
}
`;
  prismaContent = prismaContent + faceTemplateModel;
}

fs.writeFileSync(prismaPath, prismaContent, 'utf8');
console.log('schema.prisma updated successfully');

// Update schema.sql
const sqlPath = path.join(__dirname, '..', 'server', 'prisma', 'schema.sql');
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

if (!sqlContent.includes('CREATE TABLE IF NOT EXISTS face_templates')) {
  const faceSql = `
-- 9b. FACE RECOGNITION TEMPLATES
CREATE TABLE IF NOT EXISTS face_templates (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
    student_id_number VARCHAR(30) NOT NULL,
    label VARCHAR(50) DEFAULT 'Primary',
    descriptor JSONB NOT NULL,
    consent_given BOOLEAN DEFAULT FALSE,
    consent_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    consent_by VARCHAR(150) NOT NULL,
    photo_sample_url TEXT,
    quality_score NUMERIC(5,4) DEFAULT 1.0,
    enrolled_by VARCHAR(150) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_face_templates_student_id ON face_templates(student_id);
CREATE INDEX IF NOT EXISTS idx_face_templates_id_num ON face_templates(student_id_number);
`;
  sqlContent = sqlContent + faceSql;
  fs.writeFileSync(sqlPath, sqlContent, 'utf8');
  console.log('schema.sql updated successfully');
}
