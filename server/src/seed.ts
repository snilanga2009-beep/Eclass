import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import db, {
  Role, Permission, User, Teacher, Subject, Class,
  Student, Parent, ClassStudent, AttendanceSession, Attendance,
  FeeRecord, Payment, PaymentItem, Income, Expense, TeacherPayment,
  Exam, ExamResult, LearningMaterial, Announcement, SystemSetting
} from './db';

export async function seedDatabase() {
  console.log('--- Initializing CAMS Database Seeding ---');

  // Check if data already exists
  if (db.data.students.length >= 50 && db.data.users.length >= 7) {
    console.log('Database already has rich sample data. Skipping seed.');
    return;
  }

  // 1. Roles & Permissions
  const roleNames = ['SUPER_ADMIN', 'ADMIN', 'ACCOUNTANT', 'TEACHER', 'RECEPTIONIST', 'PARENT', 'STUDENT'];
  const roles: Role[] = roleNames.map(name => ({
    id: 'role-' + name.toLowerCase(),
    name,
    description: `${name.replace('_', ' ')} role with pre-configured access rights`,
    createdAt: new Date().toISOString()
  }));

  const modules = ['dashboard', 'students', 'classes', 'attendance', 'payments', 'pending-fees', 'accounting', 'teachers', 'assessments', 'materials', 'messaging', 'reports', 'settings', 'audit'];
  const permissions: Permission[] = [];

  roles.forEach(role => {
    modules.forEach(mod => {
      const isSuper = role.name === 'SUPER_ADMIN' || role.name === 'ADMIN';
      const isAccountant = role.name === 'ACCOUNTANT' && ['dashboard', 'payments', 'pending-fees', 'accounting', 'reports'].includes(mod);
      const isTeacher = role.name === 'TEACHER' && ['dashboard', 'classes', 'attendance', 'assessments', 'materials', 'students'].includes(mod);
      const isReceptionist = role.name === 'RECEPTIONIST' && ['dashboard', 'students', 'classes', 'attendance', 'payments'].includes(mod);
      const isStudentParent = (role.name === 'STUDENT' || role.name === 'PARENT') && ['dashboard', 'attendance', 'payments', 'assessments', 'materials'].includes(mod);

      permissions.push({
        id: db.generateId(),
        roleId: role.id,
        module: mod,
        canRead: isSuper || isAccountant || isTeacher || isReceptionist || isStudentParent,
        canWrite: isSuper || isAccountant || (isTeacher && ['attendance', 'assessments', 'materials'].includes(mod)) || (isReceptionist && ['students', 'attendance', 'payments'].includes(mod)),
        canDelete: isSuper,
        createdAt: new Date().toISOString()
      });
    });
  });

  // 2. Subjects
  const subjects: Subject[] = [
    { id: 'subj-math', code: 'MTH-AL', name: 'Combined Mathematics', description: 'G.C.E. Advanced Level Combined Mathematics', createdAt: new Date().toISOString() },
    { id: 'subj-phy', code: 'PHY-AL', name: 'Physics', description: 'G.C.E. Advanced Level Physics Theory & Practical Revision', createdAt: new Date().toISOString() },
    { id: 'subj-chem', code: 'CHM-AL', name: 'Chemistry', description: 'G.C.E. Advanced Level Chemistry Theory & Mechanics', createdAt: new Date().toISOString() },
    { id: 'subj-eng', code: 'ENG-OL', name: 'English Language', description: 'G.C.E. Ordinary Level English & Literature', createdAt: new Date().toISOString() },
    { id: 'subj-ict', code: 'ICT-AL', name: 'Information & Communication Tech', description: 'G.C.E. Advanced Level ICT & Software Engineering', createdAt: new Date().toISOString() }
  ];

  // 3. Teachers
  const teachersData = [
    { id: 'tch-1', teacherIdNumber: 'TCH-001', name: 'Dr. K. Silva', phone: '+94 77 111 2233', email: 'ksilva@apex.edu.lk', qualifications: 'B.Sc. (Hons) Eng, Ph.D (Maths)', paymentRate: 75.0, paymentMethod: 'Percentage' as const, photo: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80' },
    { id: 'tch-2', teacherIdNumber: 'TCH-002', name: 'Mrs. Menaka Perera', phone: '+94 71 222 3344', email: 'mperera@apex.edu.lk', qualifications: 'B.Sc. Physics (1st Class), M.Sc.', paymentRate: 70.0, paymentMethod: 'Percentage' as const, photo: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80' },
    { id: 'tch-3', teacherIdNumber: 'TCH-003', name: 'Mr. Dinesh Fernando', phone: '+94 76 333 4455', email: 'dfernando@apex.edu.lk', qualifications: 'B.Sc. Chemistry, M.Phil', paymentRate: 70.0, paymentMethod: 'Percentage' as const, photo: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80' },
    { id: 'tch-4', teacherIdNumber: 'TCH-004', name: 'Ms. Sanduni Jayasinghe', phone: '+94 72 444 5566', email: 'sjayasinghe@apex.edu.lk', qualifications: 'B.A. English (Hons), CELTA', paymentRate: 70.0, paymentMethod: 'Percentage' as const, photo: 'https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80' },
    { id: 'tch-5', teacherIdNumber: 'TCH-005', name: 'Mr. Nuwan Bandara', phone: '+94 78 555 6677', email: 'nbandara@apex.edu.lk', qualifications: 'B.Sc. (Hons) IT, MCS', paymentRate: 72.0, paymentMethod: 'Percentage' as const, photo: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80' }
  ];

  const teachers: Teacher[] = teachersData.map(t => ({
    ...t,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // 4. Classes (10 Classes)
  const classesData = [
    { id: 'cls-1', classCode: 'CLS-MAT-12A', name: 'Grade 12 Combined Mathematics (Theory)', subjectId: 'subj-math', teacherId: 'tch-1', grade: 'Grade 12', classGroup: 'Theory Group A', dayOfWeek: 'Saturday', startTime: '08:00', endTime: '12:00', room: 'Auditorium Hall A', monthlyFee: 3500, maxStudents: 80 },
    { id: 'cls-2', classCode: 'CLS-MAT-13R', name: 'Grade 13 Combined Maths (Paper Revision)', subjectId: 'subj-math', teacherId: 'tch-1', grade: 'Grade 13', classGroup: 'Revision Master', dayOfWeek: 'Sunday', startTime: '08:00', endTime: '12:00', room: 'Auditorium Hall A', monthlyFee: 3000, maxStudents: 80 },
    { id: 'cls-3', classCode: 'CLS-PHY-12A', name: 'Grade 12 Physics (Theory & Mechanics)', subjectId: 'subj-phy', teacherId: 'tch-2', grade: 'Grade 12', classGroup: 'Main Theory', dayOfWeek: 'Sunday', startTime: '13:00', endTime: '17:00', room: 'Science Hall 1', monthlyFee: 3500, maxStudents: 60 },
    { id: 'cls-4', classCode: 'CLS-PHY-13R', name: 'Grade 13 Physics (Paper Class & MCQ)', subjectId: 'subj-phy', teacherId: 'tch-2', grade: 'Grade 13', classGroup: 'Speed Revision', dayOfWeek: 'Tuesday', startTime: '15:30', endTime: '18:30', room: 'Science Hall 1', monthlyFee: 2800, maxStudents: 60 },
    { id: 'cls-5', classCode: 'CLS-CHM-12A', name: 'Grade 12 Chemistry (General & Physical)', subjectId: 'subj-chem', teacherId: 'tch-3', grade: 'Grade 12', classGroup: 'Comprehensive', dayOfWeek: 'Saturday', startTime: '13:00', endTime: '17:00', room: 'Chemistry Hall 2', monthlyFee: 3500, maxStudents: 70 },
    { id: 'cls-6', classCode: 'CLS-CHM-13R', name: 'Grade 13 Chemistry (Organic Chemistry Special)', subjectId: 'subj-chem', teacherId: 'tch-3', grade: 'Grade 13', classGroup: 'Revision', dayOfWeek: 'Thursday', startTime: '15:30', endTime: '18:30', room: 'Chemistry Hall 2', monthlyFee: 3000, maxStudents: 70 },
    { id: 'cls-7', classCode: 'CLS-ENG-10A', name: 'Grade 10 English Masterclass', subjectId: 'subj-eng', teacherId: 'tch-4', grade: 'Grade 10', classGroup: 'Grammar & Writing', dayOfWeek: 'Wednesday', startTime: '16:00', endTime: '18:30', room: 'Language Room B', monthlyFee: 2200, maxStudents: 45 },
    { id: 'cls-8', classCode: 'CLS-ENG-11A', name: 'Grade 11 English (O/L Target Batch)', subjectId: 'subj-eng', teacherId: 'tch-4', grade: 'Grade 11', classGroup: 'O/L Accelerator', dayOfWeek: 'Friday', startTime: '15:30', endTime: '18:30', room: 'Language Room B', monthlyFee: 2500, maxStudents: 50 },
    { id: 'cls-9', classCode: 'CLS-ICT-12A', name: 'Grade 12 ICT (Programming & Data)', subjectId: 'subj-ict', teacherId: 'tch-5', grade: 'Grade 12', classGroup: 'Theory & Practical', dayOfWeek: 'Monday', startTime: '15:30', endTime: '18:30', room: 'Computer Lab 1', monthlyFee: 3000, maxStudents: 40 },
    { id: 'cls-10', classCode: 'CLS-ICT-13R', name: 'Grade 13 ICT (Past Papers & Models)', subjectId: 'subj-ict', teacherId: 'tch-5', grade: 'Grade 13', classGroup: 'Exam Intensive', dayOfWeek: 'Sunday', startTime: '17:30', endTime: '20:00', room: 'Computer Lab 1', monthlyFee: 3200, maxStudents: 40 }
  ];

  const classes: Class[] = classesData.map(c => ({
    ...c,
    status: 'ACTIVE',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }));

  // 5. Generate 55 Students & Parents
  const studentNames = [
    { first: 'Kasun', last: 'Kalhara', gender: 'Male', grade: 'Grade 12', school: 'Ananda College, Colombo' },
    { first: 'Nimali', last: 'Senanayake', gender: 'Female', grade: 'Grade 12', school: 'Visakha Vidyalaya' },
    { first: 'Tharindu', last: 'Perera', gender: 'Male', grade: 'Grade 13', school: 'Royal College, Colombo' },
    { first: 'Sachini', last: 'Ranasinghe', gender: 'Female', grade: 'Grade 12', school: 'Sirimavo Bandaranaike Vidyalaya' },
    { first: 'Chamara', last: 'Jayawardena', gender: 'Male', grade: 'Grade 13', school: 'Nalanda College' },
    { first: 'Dulani', last: 'Wijesinghe', gender: 'Female', grade: 'Grade 11', school: 'Musaeus College' },
    { first: 'Janith', last: 'Abeykoon', gender: 'Male', grade: 'Grade 10', school: 'D.S. Senanayake College' },
    { first: 'Kavindi', last: 'De Silva', gender: 'Female', grade: 'Grade 12', school: 'Devi Balika Vidyalaya' },
    { first: 'Roshan', last: 'Gunathilaka', gender: 'Male', grade: 'Grade 13', school: 'Mahanama College' },
    { first: 'Sanduni', last: 'Karunaratne', gender: 'Female', grade: 'Grade 12', school: 'Anula Vidyalaya' },
    { first: 'Bhanuka', last: 'Rajapaksha', gender: 'Male', grade: 'Grade 11', school: 'St. Joseph\'s College' },
    { first: 'Harini', last: 'Liyanage', gender: 'Female', grade: 'Grade 10', school: 'Holy Family Convent' },
    { first: 'Oshada', last: 'Dissanayake', gender: 'Male', grade: 'Grade 13', school: 'Thurstan College' },
    { first: 'Shenali', last: 'Athukorala', gender: 'Female', grade: 'Grade 12', school: 'Ladies\' College' },
    { first: 'Avishka', last: 'Fernando', gender: 'Male', grade: 'Grade 12', school: 'St. Peter\'s College' },
    { first: 'Praveen', last: 'Mendis', gender: 'Male', grade: 'Grade 13', school: 'Wesley College' },
    { first: 'Malsha', last: 'Wickramasinghe', gender: 'Female', grade: 'Grade 11', school: 'Bishop\'s College' },
    { first: 'Dinuka', last: 'Rathnayake', gender: 'Male', grade: 'Grade 10', school: 'Isipathana College' },
    { first: 'Ayesha', last: 'Samarasinghe', gender: 'Female', grade: 'Grade 12', school: 'St. Paul\'s Girls School' },
    { first: 'Lahiru', last: 'Madushanka', gender: 'Male', grade: 'Grade 13', school: 'Dharmaraja College' },
    { first: 'Chathurika', last: 'Alwis', gender: 'Female', grade: 'Grade 12', school: 'Southlands College' },
    { first: 'Sithum', last: 'Dharmapala', gender: 'Male', grade: 'Grade 12', school: 'Rahula College' },
    { first: 'Kavindu', last: 'Tennakoon', gender: 'Male', grade: 'Grade 11', school: 'Trinity College' },
    { first: 'Methmi', last: 'Illangakoon', gender: 'Female', grade: 'Grade 10', school: 'Hillwood College' },
    { first: 'Ravindu', last: 'Bogahawatta', gender: 'Male', grade: 'Grade 13', school: 'Kingswood College' },
    { first: 'Supun', last: 'Wijeratne', gender: 'Male', grade: 'Grade 12', school: 'Richmond College' },
    { first: 'Hasini', last: 'Gamage', gender: 'Female', grade: 'Grade 12', school: 'Mahinda College' },
    { first: 'Isuru', last: 'Kumarasinghe', gender: 'Male', grade: 'Grade 13', school: 'St. Thomas\' College' },
    { first: 'Naduni', last: 'Fonseka', gender: 'Female', grade: 'Grade 11', school: 'Methodist College' },
    { first: 'Kusal', last: 'Jayatissa', gender: 'Male', grade: 'Grade 10', school: 'Asoka Vidyalaya' },
    { first: 'Poornima', last: 'Hettiarachchi', gender: 'Female', grade: 'Grade 12', school: 'Visakha Vidyalaya' },
    { first: 'Yohan', last: 'Subasinghe', gender: 'Male', grade: 'Grade 13', school: 'Ananda College' },
    { first: 'Thilini', last: 'Vithanage', gender: 'Female', grade: 'Grade 12', school: 'Devi Balika Vidyalaya' },
    { first: 'Akash', last: 'Nanayakkara', gender: 'Male', grade: 'Grade 12', school: 'Royal College' },
    { first: 'Nimna', last: 'Weerakkody', gender: 'Female', grade: 'Grade 11', school: 'Musaeus College' },
    { first: 'Ashen', last: 'Priyashantha', gender: 'Male', grade: 'Grade 10', school: 'Nalanda College' },
    { first: 'Madara', last: 'Gunasekara', gender: 'Female', grade: 'Grade 13', school: 'Sirimavo Bandaranaike' },
    { first: 'Chiran', last: 'Ekanayake', gender: 'Male', grade: 'Grade 12', school: 'D.S. Senanayake' },
    { first: 'Sashini', last: 'Mallawarachchi', gender: 'Female', grade: 'Grade 12', school: 'Anula Vidyalaya' },
    { first: 'Prabhash', last: 'Chandrasena', gender: 'Male', grade: 'Grade 13', school: 'St. Joseph\'s College' },
    { first: 'Nirmani', last: 'Seneviratne', gender: 'Female', grade: 'Grade 11', school: 'Holy Family Convent' },
    { first: 'Dilan', last: 'Edirisinghe', gender: 'Male', grade: 'Grade 10', school: 'Thurstan College' },
    { first: 'Gimhani', last: 'Wanniarachchi', gender: 'Female', grade: 'Grade 12', school: 'Ladies\' College' },
    { first: 'Pasan', last: 'Gajanayake', gender: 'Male', grade: 'Grade 13', school: 'St. Peter\'s College' },
    { first: 'Imasha', last: 'Kaluarachchi', gender: 'Female', grade: 'Grade 12', school: 'Bishop\'s College' },
    { first: 'Charith', last: 'Welgama', gender: 'Male', grade: 'Grade 12', school: 'Wesley College' },
    { first: 'Nelum', last: 'Premadasa', gender: 'Female', grade: 'Grade 11', school: 'Southlands College' },
    { first: 'Danushka', last: 'Lokuge', gender: 'Male', grade: 'Grade 10', school: 'Isipathana College' },
    { first: 'Shyami', last: 'Goonewardena', gender: 'Female', grade: 'Grade 13', school: 'Devi Balika Vidyalaya' },
    { first: 'Nuwan', last: 'Kulatunga', gender: 'Male', grade: 'Grade 12', school: 'Royal College' },
    { first: 'Hansika', last: 'Bogoda', gender: 'Female', grade: 'Grade 12', school: 'Visakha Vidyalaya' },
    { first: 'Dinesh', last: 'Herath', gender: 'Male', grade: 'Grade 13', school: 'Ananda College' }
  ];

  const students: Student[] = [];
  const parents: Parent[] = [];
  const classStudents: ClassStudent[] = [];
  const feeRecords: FeeRecord[] = [];
  const payments: Payment[] = [];
  const paymentItems: PaymentItem[] = [];
  const attendances: Attendance[] = [];
  const attendanceSessions: AttendanceSession[] = [];
  const examResults: ExamResult[] = [];
  const income: Income[] = [];

  // Generate today and recent session dates
  const today = '2026-09-25';
  const yesterday = '2026-09-24';
  const currentMonth = '2026-09';
  const lastMonth = '2026-08';

  // Create attendance sessions for active classes
  classes.slice(0, 5).forEach((cls, i) => {
    const sessId = `sess-${cls.id}-${today}`;
    attendanceSessions.push({
      id: sessId,
      classId: cls.id,
      date: today,
      title: `${cls.name} - Session ${i + 1}`,
      startedAt: `${today}T08:00:00.000Z`,
      takenBy: 'Dr. K. Silva',
      createdAt: new Date().toISOString()
    });
  });

  studentNames.forEach((sData, idx) => {
    const studentIdx = idx + 1;
    const stuNumStr = String(studentIdx).padStart(4, '0');
    const studentId = `stu-${studentIdx}`;
    const studentIdNumber = `STU-2026-${stuNumStr}`;
    const qrCodeToken = `CAMS-STU-${crypto.randomBytes(6).toString('hex').toUpperCase()}`;
    const parentPhone = `+94 77 ${100 + studentIdx} ${2000 + studentIdx}`;

    const parentId = `prt-${studentIdx}`;
    const parent: Parent = {
      id: parentId,
      name: `Mr./Mrs. ${sData.last}`,
      phone: parentPhone,
      whatsapp: parentPhone,
      email: `${sData.last.toLowerCase()}.${studentIdx}@mail.lk`,
      relationship: idx % 2 === 0 ? 'Father' : 'Mother',
      address: `No. ${studentIdx * 4}, High Level Road, Colombo`,
      occupation: idx % 3 === 0 ? 'Engineer' : (idx % 3 === 1 ? 'Doctor' : 'Banker'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    parents.push(parent);

    const rfidTag = `000${String(4928100 + studentIdx).padStart(7, '0')}`; // Standard 10-digit 125kHz EM4100 UID

    const student: Student = {
      id: studentId,
      studentIdNumber,
      qrCodeToken,
      rfidTag,
      fullName: `${sData.first} ${sData.last}`,
      dateOfBirth: `2008-0${(idx % 9) + 1}-15`,
      gender: sData.gender,
      school: sData.school,
      grade: sData.grade,
      address: `No. ${studentIdx * 4}, High Level Road, Colombo`,
      city: 'Colombo',
      photo: `https://images.unsplash.com/photo-${1500000000000 + (studentIdx * 1000000)}?w=150&auto=format&fit=crop&q=80`,
      phone: `+94 71 ${300 + studentIdx} ${5000 + studentIdx}`,
      whatsapp: `+94 71 ${300 + studentIdx} ${5000 + studentIdx}`,
      email: `${sData.first.toLowerCase()}.${sData.last.toLowerCase()}@student.apex.lk`,
      emergencyContact: parentPhone,
      registrationDate: `2026-01-10T08:00:00.000Z`,
      status: 'ACTIVE',
      notes: studentIdx <= 3 ? 'Excelling in mathematical problem solving' : 'Regular student',
      parentId: parent.id,
      parentName: parent.name,
      parentPhone: parent.phone,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    students.push(student);

    // Enroll students in matching grade classes
    const eligibleClasses = classes.filter(c => c.grade === student.grade);
    eligibleClasses.forEach(c => {
      classStudents.push({
        id: db.generateId(),
        classId: c.id,
        studentId: student.id,
        enrolledAt: new Date().toISOString(),
        status: 'ACTIVE'
      });

      // Create Fee Record for Current Month (2026-09)
      const feeId = `fee-${student.id}-${c.id}-${currentMonth}`;
      
      // Seed some students as fully paid, some partial, some pending
      let paid = 0;
      let status: 'PAID' | 'PARTIAL' | 'PENDING' = 'PENDING';
      
      if (studentIdx % 3 === 0) {
        paid = c.monthlyFee;
        status = 'PAID';
      } else if (studentIdx % 3 === 1) {
        paid = Math.floor(c.monthlyFee / 2); // Partial payment!
        status = 'PARTIAL';
      } else {
        paid = 0;
        status = 'PENDING';
      }

      const remainingBalance = c.monthlyFee - paid;

      const feeRec: FeeRecord = {
        id: feeId,
        studentId: student.id,
        classId: c.id,
        month: currentMonth,
        baseFee: c.monthlyFee,
        discount: 0,
        previousBalance: 0,
        totalDue: c.monthlyFee,
        paidAmount: paid,
        remainingBalance,
        status,
        dueDate: `${currentMonth}-10`,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      feeRecords.push(feeRec);

      // If paid or partial, create Payment & Receipt record
      if (paid > 0) {
        const receiptNo = `REC-2026-${String(payments.length + 1).padStart(4, '0')}`;
        const payId = `pay-${payments.length + 1}`;
        const paymentRecord: Payment = {
          id: payId,
          receiptNumber: receiptNo,
          studentId: student.id,
          totalAmount: paid,
          paymentMethod: studentIdx % 2 === 0 ? 'Cash' : 'Bank Transfer',
          paymentDate: `${currentMonth}-08T10:30:00.000Z`,
          cashier: 'A. Jayawardena (Cashier 1)',
          reference: studentIdx % 2 === 0 ? undefined : `BOC-TXN-${88290 + studentIdx}`,
          notes: status === 'PARTIAL' ? 'Part payment for tuition fee' : 'Full tuition fee payment',
          createdAt: new Date().toISOString()
        };
        payments.push(paymentRecord);

        paymentItems.push({
          id: db.generateId(),
          paymentId: payId,
          feeRecordId: feeRec.id,
          amountPaid: paid,
          balanceLeft: remainingBalance,
          description: `${c.name} - Tuition Fee (${currentMonth})`
        });

        // Record in Income table
        income.push({
          id: db.generateId(),
          category: 'Student Fees',
          amount: paid,
          source: `${student.fullName} (${student.studentIdNumber})`,
          paymentId: payId,
          receiptNo,
          date: `${currentMonth}-08`,
          description: `Fee payment for ${c.classCode}`,
          receivedBy: 'A. Jayawardena (Cashier 1)',
          createdAt: new Date().toISOString()
        });
      }

      // Add Attendance records
      attendanceSessions.forEach(sess => {
        if (sess.classId === c.id) {
          const isPresent = studentIdx % 5 !== 0;
          attendances.push({
            id: db.generateId(),
            sessionId: sess.id,
            studentId: student.id,
            classId: c.id,
            date: sess.date,
            status: isPresent ? 'PRESENT' : 'ABSENT',
            scannedAt: isPresent ? `${sess.date}T08:15:00.000Z` : `${sess.date}T08:00:00.000Z`,
            method: studentIdx % 2 === 0 ? 'QR_CODE' : 'ID_CARD',
            recordedBy: 'Dr. K. Silva'
          });
        }
      });
    });
  });

  // 6. Expenses
  const expenses: Expense[] = [
    { id: 'exp-1', category: 'Rent', title: 'Monthly Branch Auditorium Lease', amount: 150000, date: '2026-09-01', paidTo: 'Colombo Realty Holdings', paymentMethod: 'Bank Transfer', receiptNo: 'RNT-2026-09', recordedBy: 'Admin', createdAt: new Date().toISOString() },
    { id: 'exp-2', category: 'Electricity', title: 'CEB Electricity Bill (Central AC & Lab)', amount: 65400, date: '2026-09-05', paidTo: 'Ceylon Electricity Board', paymentMethod: 'Bank Transfer', receiptNo: 'CEB-98744', recordedBy: 'Accountant', createdAt: new Date().toISOString() },
    { id: 'exp-3', category: 'Internet', title: 'Dialog Fiber 1 Gbps Dedicated Link', amount: 28500, date: '2026-09-06', paidTo: 'Dialog Broadband Networks', paymentMethod: 'Bank Transfer', receiptNo: 'DLG-11029', recordedBy: 'Accountant', createdAt: new Date().toISOString() },
    { id: 'exp-4', category: 'Printing', title: 'Term 1 Past Papers & Model Papers Print Run (1000 Booklets)', amount: 45000, date: '2026-09-12', paidTo: 'Samayawardhana Printers', paymentMethod: 'Cash', receiptNo: 'PRN-4491', recordedBy: 'Receptionist', createdAt: new Date().toISOString() },
    { id: 'exp-5', category: 'Advertising', title: 'Facebook & Instagram A/L 2026 Admission Campaigns', amount: 35000, date: '2026-09-14', paidTo: 'Meta Ads Ireland', paymentMethod: 'Card', receiptNo: 'META-99120', recordedBy: 'Admin', createdAt: new Date().toISOString() },
    { id: 'exp-6', category: 'Equipment', title: 'BenQ Interactive Smart Projector Replacement Hall 2', amount: 125000, date: '2026-09-15', paidTo: 'Metropolitan Technologies', paymentMethod: 'Bank Transfer', receiptNo: 'INV-MT-8812', recordedBy: 'Admin', createdAt: new Date().toISOString() },
    { id: 'exp-7', category: 'Other Expenses', title: 'Sanitation, Refreshments & Water Dispenser Refills', amount: 18500, date: '2026-09-18', paidTo: 'Office Supplies Ltd', paymentMethod: 'Cash', receiptNo: 'VCH-0091', recordedBy: 'Receptionist', createdAt: new Date().toISOString() }
  ];

  // 7. Teacher Payouts
  const teacherPayments: TeacherPayment[] = teachers.map((t, idx) => {
    const rev = 240000 + (idx * 35000);
    const payout = Math.round(rev * (t.paymentRate / 100));
    return {
      id: `tp-${idx + 1}`,
      teacherId: t.id,
      month: lastMonth,
      totalRevenue: rev,
      rate: t.paymentRate,
      payoutAmount: payout,
      status: 'PAID',
      paidDate: '2026-09-02',
      paymentMethod: 'Bank Transfer',
      referenceNo: `SLIPS-TXN-998${idx}`,
      notes: `August 2026 Tuition Commission (${t.paymentRate}%)`,
      createdAt: new Date().toISOString()
    };
  });

  // 8. Assessments & Exams
  const exams: Exam[] = [
    { id: 'ex-1', title: 'Grade 12 Combined Mathematics - Mid Term Evaluation', examType: 'Term Exam', subjectId: 'subj-math', classId: 'cls-1', date: '2026-09-15', totalMarks: 100, passMarks: 40, createdAt: new Date().toISOString() },
    { id: 'ex-2', title: 'Grade 12 Physics - Mechanics & Motion Unit Test', examType: 'Monthly Test', subjectId: 'subj-phy', classId: 'cls-3', date: '2026-09-18', totalMarks: 100, passMarks: 40, createdAt: new Date().toISOString() },
    { id: 'ex-3', title: 'Grade 11 English - Essay & Grammar Assessment', examType: 'Class Test', subjectId: 'subj-eng', classId: 'cls-8', date: '2026-09-20', totalMarks: 100, passMarks: 40, createdAt: new Date().toISOString() }
  ];

  // Exam Results for first 25 students
  students.slice(0, 25).forEach((stu, sIdx) => {
    const marks = Math.min(100, Math.max(35, 95 - (sIdx * 2.2) + ((sIdx % 4) * 3)));
    let grade: 'A' | 'B' | 'C' | 'S' | 'F' = 'A';
    if (marks >= 75) grade = 'A';
    else if (marks >= 65) grade = 'B';
    else if (marks >= 55) grade = 'C';
    else if (marks >= 40) grade = 'S';
    else grade = 'F';

    examResults.push({
      id: db.generateId(),
      examId: 'ex-1',
      studentId: stu.id,
      marks: Math.round(marks),
      grade,
      rank: sIdx + 1,
      comment: marks >= 75 ? 'Exceptional analytical accuracy' : 'Good effort, revise integration techniques',
      createdAt: new Date().toISOString()
    });
  });

  // 9. Learning Materials
  const learningMaterials: LearningMaterial[] = [
    { id: 'mat-1', title: 'Combined Mathematics 2026 Pure Math Theory Handbook', description: 'Comprehensive notes covering Quadratic Equations, Matrices & Complex Numbers', fileType: 'PDF', fileUrl: '/materials/pure_math_handbook_2026.pdf', fileSize: '14.2 MB', subjectId: 'subj-math', classId: 'cls-1', teacherId: 'tch-1', grade: 'Grade 12', lessonTopic: 'Pure Mathematics', uploadDate: '2026-09-02' },
    { id: 'mat-2', title: 'Rotational Motion & Circular Dynamics Illustrated Guide', description: 'Step-by-step vector calculations and solved past paper questions', fileType: 'PDF', fileUrl: '/materials/rotational_dynamics.pdf', fileSize: '8.7 MB', subjectId: 'subj-phy', classId: 'cls-3', teacherId: 'tch-2', grade: 'Grade 12', lessonTopic: 'Mechanics', uploadDate: '2026-09-08' },
    { id: 'mat-3', title: 'Organic Chemistry Reaction Mechanisms Chart', description: 'All major nucleophilic and electrophilic reaction pathways', fileType: 'Image', fileUrl: '/materials/organic_pathways.png', fileSize: '4.5 MB', subjectId: 'subj-chem', classId: 'cls-5', teacherId: 'tch-3', grade: 'Grade 12', lessonTopic: 'Organic Chemistry', uploadDate: '2026-09-10' },
    { id: 'mat-4', title: 'O/L English Formal Letter & Report Writing Templates', description: 'Model answers with band 9 vocabulary and structure guidelines', fileType: 'PDF', fileUrl: '/materials/ol_english_writing.pdf', fileSize: '3.1 MB', subjectId: 'subj-eng', classId: 'cls-8', teacherId: 'tch-4', grade: 'Grade 11', lessonTopic: 'Writing Skills', uploadDate: '2026-09-14' },
    { id: 'mat-5', title: 'Database Normalization & SQL Complete Walkthrough', description: '1NF, 2NF, 3NF and BCNF with hands-on SQLite exercises', fileType: 'Past Paper', fileUrl: '/materials/al_ict_databases.pdf', fileSize: '6.4 MB', subjectId: 'subj-ict', classId: 'cls-9', teacherId: 'tch-5', grade: 'Grade 12', lessonTopic: 'Database Systems', uploadDate: '2026-09-17' }
  ];

  // 10. Announcements
  const announcements: Announcement[] = [
    { id: 'ann-1', title: 'Term 1 Mid-Evaluation Exams Schedule Released', content: 'The timetable for the Grade 12 and 13 Mid-Term Assessments has been published. Please ensure all student ID cards are brought to the exam halls.', targetRole: 'ALL', priority: 'URGENT', postedBy: 'Academic Director', createdAt: new Date().toISOString() },
    { id: 'ann-2', title: 'Upcoming Poya Day Holiday Notice', content: 'The Institute will remain closed on the upcoming Full Moon Poya Day. Special revision classes scheduled for Sunday will proceed as normal.', targetRole: 'ALL', priority: 'NORMAL', postedBy: 'Administration Office', createdAt: new Date().toISOString() }
  ];

  // 11. System Settings
  const settings: SystemSetting[] = [
    { id: 'st-1', key: 'INSTITUTE_NAME', value: 'Apex Higher Education Institute', category: 'BRANDING', updatedAt: new Date().toISOString() },
    { id: 'st-2', key: 'INSTITUTE_TAGLINE', value: 'Excellence in Tuition & Academic Mentorship', category: 'BRANDING', updatedAt: new Date().toISOString() },
    { id: 'st-3', key: 'ADDRESS', value: 'No. 45, Galle Road, Bambalapitiya, Colombo 03, Sri Lanka', category: 'GENERAL', updatedAt: new Date().toISOString() },
    { id: 'st-4', key: 'PHONE', value: '+94 11 234 5678 / +94 77 987 6543', category: 'GENERAL', updatedAt: new Date().toISOString() },
    { id: 'st-5', key: 'EMAIL', value: 'info@apexeducation.lk', category: 'GENERAL', updatedAt: new Date().toISOString() },
    { id: 'st-6', key: 'CURRENCY_CODE', value: 'LKR', category: 'FINANCIAL', updatedAt: new Date().toISOString() },
    { id: 'st-7', key: 'CURRENCY_SYMBOL', value: 'Rs. ', category: 'FINANCIAL', updatedAt: new Date().toISOString() },
    { id: 'st-8', key: 'ACADEMIC_YEAR', value: '2026/2027', category: 'GENERAL', updatedAt: new Date().toISOString() },
    { id: 'st-9', key: 'SMS_PROVIDER', value: 'text.lk', category: 'SMS', updatedAt: new Date().toISOString() },
    { id: 'st-10', key: 'TEXTLK_SENDER_ID', value: 'ApexEdu', category: 'SMS', updatedAt: new Date().toISOString() },
    { id: 'st-10-token', key: 'TEXTLK_API_TOKEN', value: 'textlk_live_sec_demo_984712984', category: 'SMS', updatedAt: new Date().toISOString() },
    { id: 'st-10-endpoint', key: 'TEXTLK_ENDPOINT', value: 'https://app.text.lk/api/v3/sms/send', category: 'SMS', updatedAt: new Date().toISOString() },
    { id: 'st-11', key: 'WHATSAPP_ENABLED', value: 'true', category: 'WHATSAPP', updatedAt: new Date().toISOString() },
    { id: 'st-12', key: 'WHATSAPP_PHONE_NUMBER_ID', value: '109283746592019', category: 'WHATSAPP', updatedAt: new Date().toISOString() }
  ];

  // 12. Create Users for all 7 Roles
  const passwordHash = await bcrypt.hash('password123', 10);
  const users: User[] = [
    {
      id: 'usr-superadmin',
      username: 'superadmin',
      email: 'director@apexeducation.lk',
      passwordHash,
      name: 'Dr. Rohan De Silva (Super Admin)',
      roleId: 'role-super_admin',
      phone: '+94 77 100 0001',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-admin',
      username: 'admin',
      email: 'admin@apexeducation.lk',
      passwordHash,
      name: 'Sunil Jayawardena (Campus Admin)',
      roleId: 'role-admin',
      phone: '+94 77 100 0002',
      avatar: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-accountant',
      username: 'accountant',
      email: 'accounts@apexeducation.lk',
      passwordHash,
      name: 'Nalaka Wickramaratne (Chief Accountant)',
      roleId: 'role-accountant',
      phone: '+94 77 100 0003',
      avatar: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-teacher',
      username: 'teacher',
      email: 'ksilva@apex.edu.lk',
      passwordHash,
      name: 'Dr. K. Silva (Senior Lecturer - Math)',
      roleId: 'role-teacher',
      phone: '+94 77 111 2233',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
      teacherId: 'tch-1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-receptionist',
      username: 'receptionist',
      email: 'frontdesk@apexeducation.lk',
      passwordHash,
      name: 'Kumari Ekanayake (Front Office)',
      roleId: 'role-receptionist',
      phone: '+94 77 100 0004',
      avatar: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&auto=format&fit=crop&q=80',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-parent',
      username: 'parent',
      email: 'parent.kalhara@mail.lk',
      passwordHash,
      name: 'Mr. Sarath Kalhara (Guardian)',
      roleId: 'role-parent',
      phone: '+94 77 101 2001',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&auto=format&fit=crop&q=80',
      parentId: 'prt-1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: 'usr-student',
      username: 'student',
      email: 'kasun.kalhara@student.apex.lk',
      passwordHash,
      name: 'Kasun Kalhara (Grade 12 Student)',
      roleId: 'role-student',
      phone: '+94 71 301 5001',
      avatar: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
      studentId: 'stu-1',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  // Save everything into database
  db.data.roles = roles;
  db.data.permissions = permissions;
  db.data.users = users;
  db.data.subjects = subjects;
  db.data.teachers = teachers;
  db.data.classes = classes;
  db.data.parents = parents;
  db.data.students = students;
  db.data.classStudents = classStudents;
  db.data.attendanceSessions = attendanceSessions;
  db.data.attendances = attendances;
  db.data.feeRecords = feeRecords;
  db.data.payments = payments;
  db.data.paymentItems = paymentItems;
  db.data.income = income;
  db.data.expenses = expenses;
  db.data.teacherPayments = teacherPayments;
  db.data.exams = exams;
  db.data.examResults = examResults;
  db.data.learningMaterials = learningMaterials;
  db.data.announcements = announcements;
  db.data.settings = settings;

  db.save();
  console.log(`Database successfully seeded with:
    - ${students.length} Students
    - ${parents.length} Parents
    - ${teachers.length} Teachers
    - ${classes.length} Classes
    - ${attendances.length} Attendance Records
    - ${feeRecords.length} Fee Records
    - ${payments.length} Payments & Receipts
    - ${expenses.length} Expense items
    - ${teacherPayments.length} Teacher Commission Payouts
    - ${examResults.length} Exam Marks entries
    - ${users.length} Pre-configured Demo Users for all 7 Roles`);
}
