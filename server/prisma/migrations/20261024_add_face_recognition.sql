-- Migration: Add Face Recognition Biometrics & Method Support
-- Class Accounting Management System (CAMS)

-- 1. Create face_templates table
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

-- 2. Alter students table to add biometric tracking flags if not already present
ALTER TABLE students ADD COLUMN IF NOT EXISTS has_face_enrolled BOOLEAN DEFAULT FALSE;
ALTER TABLE students ADD COLUMN IF NOT EXISTS face_enrolled_at TIMESTAMP WITH TIME ZONE;

-- 3. Alter attendance table to add review status and confidence score if not already present
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS review_status VARCHAR(30) DEFAULT 'AUTO_VERIFIED';
ALTER TABLE attendance ADD COLUMN IF NOT EXISTS confidence_score NUMERIC(5,4);

-- 4. Insert default system settings for attendance method control if missing
INSERT INTO cams_kv_store (key, data, updated_at)
VALUES ('app_data', '{}'::jsonb, NOW())
ON CONFLICT (key) DO NOTHING;
