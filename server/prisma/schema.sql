-- PostgreSQL Database Schema for Class Accounting Management System (CAMS)
-- Run this script on PostgreSQL 14+ for production deployments

-- 1. ROLES & PERMISSIONS
CREATE TABLE IF NOT EXISTS roles (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS permissions (
    id VARCHAR(36) PRIMARY KEY,
    role_id VARCHAR(36) REFERENCES roles(id) ON DELETE CASCADE,
    module VARCHAR(50) NOT NULL,
    can_read BOOLEAN DEFAULT TRUE,
    can_write BOOLEAN DEFAULT FALSE,
    can_delete BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. PARENTS
CREATE TABLE IF NOT EXISTS parents (
    id VARCHAR(36) PRIMARY KEY,
    name VARCHAR(150) NOT NULL,
    phone VARCHAR(30) NOT NULL,
    whatsapp VARCHAR(30),
    email VARCHAR(150),
    occupation VARCHAR(100),
    address TEXT,
    relationship VARCHAR(50) DEFAULT 'Parent',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 3. STUDENTS
CREATE TABLE IF NOT EXISTS students (
    id VARCHAR(36) PRIMARY KEY,
    student_id_number VARCHAR(30) UNIQUE NOT NULL,
    qr_code_token VARCHAR(64) UNIQUE NOT NULL,
    full_name VARCHAR(150) NOT NULL,
    date_of_birth DATE,
    gender VARCHAR(20),
    school VARCHAR(150),
    grade VARCHAR(50) NOT NULL,
    address TEXT,
    city VARCHAR(100),
    photo TEXT,
    phone VARCHAR(30),
    whatsapp VARCHAR(30),
    email VARCHAR(150),
    emergency_contact VARCHAR(100),
    registration_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    notes TEXT,
    parent_id VARCHAR(36) REFERENCES parents(id) ON DELETE SET NULL,
    parent_name VARCHAR(150),
    parent_phone VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_students_grade ON students(grade);
CREATE INDEX IF NOT EXISTS idx_students_status ON students(status);
CREATE INDEX IF NOT EXISTS idx_students_qr ON students(qr_code_token);
CREATE INDEX IF NOT EXISTS idx_students_id_num ON students(student_id_number);

-- 4. TEACHERS
CREATE TABLE IF NOT EXISTS teachers (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id_number VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    photo TEXT,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(150),
    address TEXT,
    qualifications TEXT,
    payment_rate NUMERIC(5,2) DEFAULT 70.00,
    payment_method VARCHAR(30) DEFAULT 'Percentage',
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 5. USERS
CREATE TABLE IF NOT EXISTS users (
    id VARCHAR(36) PRIMARY KEY,
    username VARCHAR(100) UNIQUE NOT NULL,
    email VARCHAR(150) UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    name VARCHAR(150) NOT NULL,
    role_id VARCHAR(36) REFERENCES roles(id) ON DELETE RESTRICT,
    phone VARCHAR(30),
    avatar TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    last_login TIMESTAMP WITH TIME ZONE,
    teacher_id VARCHAR(36) REFERENCES teachers(id) ON DELETE SET NULL,
    parent_id VARCHAR(36) REFERENCES parents(id) ON DELETE SET NULL,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 6. SUBJECTS
CREATE TABLE IF NOT EXISTS subjects (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 7. CLASSES
CREATE TABLE IF NOT EXISTS classes (
    id VARCHAR(36) PRIMARY KEY,
    class_code VARCHAR(30) UNIQUE NOT NULL,
    name VARCHAR(150) NOT NULL,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE RESTRICT,
    teacher_id VARCHAR(36) REFERENCES teachers(id) ON DELETE RESTRICT,
    grade VARCHAR(50) NOT NULL,
    class_group VARCHAR(50),
    day_of_week VARCHAR(20) NOT NULL,
    start_time VARCHAR(10) NOT NULL,
    end_time VARCHAR(10) NOT NULL,
    room VARCHAR(50),
    monthly_fee NUMERIC(10,2) NOT NULL,
    max_students INT DEFAULT 50,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 8. CLASS STUDENTS (Enrollment)
CREATE TABLE IF NOT EXISTS class_students (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) REFERENCES classes(id) ON DELETE CASCADE,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(20) DEFAULT 'ACTIVE',
    UNIQUE (class_id, student_id)
);

-- 9. ATTENDANCE SESSIONS & ATTENDANCE
CREATE TABLE IF NOT EXISTS attendance_sessions (
    id VARCHAR(36) PRIMARY KEY,
    class_id VARCHAR(36) REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    title VARCHAR(150),
    started_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP WITH TIME ZONE,
    taken_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_id, date)
);

CREATE TABLE IF NOT EXISTS attendance (
    id VARCHAR(36) PRIMARY KEY,
    session_id VARCHAR(36) REFERENCES attendance_sessions(id) ON DELETE CASCADE,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
    class_id VARCHAR(36) REFERENCES classes(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'PRESENT',
    scanned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    method VARCHAR(30) DEFAULT 'QR_CODE',
    remark TEXT,
    recorded_by VARCHAR(150),
    UNIQUE (student_id, class_id, date)
);

CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_status ON attendance(status);

-- 10. FEE RECORDS
CREATE TABLE IF NOT EXISTS fee_records (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
    class_id VARCHAR(36) REFERENCES classes(id) ON DELETE CASCADE,
    month VARCHAR(20) NOT NULL,
    base_fee NUMERIC(10,2) NOT NULL,
    discount NUMERIC(10,2) DEFAULT 0.00,
    previous_balance NUMERIC(10,2) DEFAULT 0.00,
    total_due NUMERIC(10,2) NOT NULL,
    paid_amount NUMERIC(10,2) DEFAULT 0.00,
    remaining_balance NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    due_date DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (student_id, class_id, month)
);

CREATE INDEX IF NOT EXISTS idx_fee_records_status ON fee_records(status);
CREATE INDEX IF NOT EXISTS idx_fee_records_month ON fee_records(month);

-- 11. PAYMENTS & PAYMENT ITEMS
CREATE TABLE IF NOT EXISTS payments (
    id VARCHAR(36) PRIMARY KEY,
    receipt_number VARCHAR(50) UNIQUE NOT NULL,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE RESTRICT,
    total_amount NUMERIC(10,2) NOT NULL,
    payment_method VARCHAR(50) NOT NULL,
    payment_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    cashier VARCHAR(150) NOT NULL,
    reference VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS payment_items (
    id VARCHAR(36) PRIMARY KEY,
    payment_id VARCHAR(36) REFERENCES payments(id) ON DELETE CASCADE,
    fee_record_id VARCHAR(36) REFERENCES fee_records(id) ON DELETE CASCADE,
    amount_paid NUMERIC(10,2) NOT NULL,
    balance_left NUMERIC(10,2) NOT NULL,
    description TEXT
);

-- 12. ACCOUNTING: INCOME & EXPENSES
CREATE TABLE IF NOT EXISTS income (
    id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    source VARCHAR(150),
    payment_id VARCHAR(36),
    receipt_no VARCHAR(50),
    date DATE DEFAULT CURRENT_DATE,
    description TEXT,
    received_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS expenses (
    id VARCHAR(36) PRIMARY KEY,
    category VARCHAR(50) NOT NULL,
    title VARCHAR(150) NOT NULL,
    amount NUMERIC(10,2) NOT NULL,
    date DATE DEFAULT CURRENT_DATE,
    paid_to VARCHAR(150),
    payment_method VARCHAR(50) DEFAULT 'Cash',
    receipt_no VARCHAR(50),
    description TEXT,
    recorded_by VARCHAR(150),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 13. TEACHER PAYOUTS
CREATE TABLE IF NOT EXISTS teacher_payments (
    id VARCHAR(36) PRIMARY KEY,
    teacher_id VARCHAR(36) REFERENCES teachers(id) ON DELETE RESTRICT,
    month VARCHAR(20) NOT NULL,
    class_id VARCHAR(36),
    total_revenue NUMERIC(10,2) NOT NULL,
    rate NUMERIC(5,2) NOT NULL,
    payout_amount NUMERIC(10,2) NOT NULL,
    status VARCHAR(20) DEFAULT 'PAID',
    paid_date DATE DEFAULT CURRENT_DATE,
    payment_method VARCHAR(50) DEFAULT 'Bank Transfer',
    reference_no VARCHAR(100),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 14. EXAMS & RESULTS
CREATE TABLE IF NOT EXISTS exams (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    exam_type VARCHAR(50) NOT NULL,
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id VARCHAR(36) REFERENCES classes(id) ON DELETE SET NULL,
    date DATE NOT NULL,
    total_marks NUMERIC(5,2) DEFAULT 100.00,
    pass_marks NUMERIC(5,2) DEFAULT 40.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS exam_results (
    id VARCHAR(36) PRIMARY KEY,
    exam_id VARCHAR(36) REFERENCES exams(id) ON DELETE CASCADE,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE CASCADE,
    marks NUMERIC(5,2) NOT NULL,
    grade VARCHAR(5) NOT NULL,
    rank INT,
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (exam_id, student_id)
);

-- 15. LEARNING MATERIALS
CREATE TABLE IF NOT EXISTS learning_materials (
    id VARCHAR(36) PRIMARY KEY,
    title VARCHAR(150) NOT NULL,
    description TEXT,
    file_type VARCHAR(50) NOT NULL,
    file_url TEXT NOT NULL,
    file_size VARCHAR(20),
    subject_id VARCHAR(36) REFERENCES subjects(id) ON DELETE RESTRICT,
    class_id VARCHAR(36) REFERENCES classes(id) ON DELETE SET NULL,
    teacher_id VARCHAR(36) REFERENCES teachers(id) ON DELETE SET NULL,
    grade VARCHAR(50),
    lesson_topic VARCHAR(150),
    upload_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 16. MESSAGING & NOTIFICATIONS
CREATE TABLE IF NOT EXISTS sms_logs (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
    recipient VARCHAR(30) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    status VARCHAR(20) DEFAULT 'SENT',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS whatsapp_logs (
    id VARCHAR(36) PRIMARY KEY,
    student_id VARCHAR(36) REFERENCES students(id) ON DELETE SET NULL,
    recipient VARCHAR(30) NOT NULL,
    template_name VARCHAR(100) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(20) DEFAULT 'DELIVERED',
    sent_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 17. AUDIT LOGS & SETTINGS
CREATE TABLE IF NOT EXISTS audit_logs (
    id VARCHAR(36) PRIMARY KEY,
    user_id VARCHAR(36),
    user_name VARCHAR(150),
    user_role VARCHAR(50),
    action VARCHAR(100) NOT NULL,
    details TEXT,
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS settings (
    id VARCHAR(36) PRIMARY KEY,
    key VARCHAR(100) UNIQUE NOT NULL,
    value TEXT NOT NULL,
    category VARCHAR(50) DEFAULT 'GENERAL',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
