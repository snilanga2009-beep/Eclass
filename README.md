# Class Accounting & Management System (CAMS) / Eclass

A comprehensive, full-stack Tuition Class Accounting and Management System (CAMS) Progressive Web Application (PWA).

## 🚀 Key Features

- **Multi-Role Access Control**: Roles for Super Admin, Campus Admin, Accountant, Teacher, Receptionist, Parent, and Student.
- **Teacher & Faculty Management**: Faculty directory, subject specializations, class assignments, and flexible remuneration schemes (Percentage Commission, Flat Monthly, Per Student, Hourly Rate, and Custom).
- **Student Information & RFID/QR Code**: Student profiles, smart ID cards, QR/Barcode generation, and RFID scanning for instant attendance.
- **Smart Attendance Management**: Class session logs, multi-modal attendance marking (QR code scanner, RFID card tap, ID card barcode, manual batch).
- **Class & Schedule Management**: Class schedules, halls/rooms, batch capacities, fee structures, and timetable calendar.
- **Tuition Fee & Payment Processing**: Multi-class invoice generation, monthly payment collection, instant receipts, partial payments, and overdue fee tracking.
- **Comprehensive Accounting**: Income recording, expense tracking, teacher commission auto-calculation & payouts, and cash flow summaries.
- **Assessments & Examination Marks**: Exam scheduling, mark entry, grade distribution, and student rank reports.
- **Learning Materials & Digital Library**: Class materials, past papers, notes, homework uploads, and downloadable student attachments.
- **SMS & WhatsApp Communications**: Automated attendance alerts, payment receipt notifications, and fee due reminders.
- **Audit Logs & Security**: Complete system activity tracking with timestamps, IP addresses, and user roles.

---

## 🛠️ Tech Stack

- **Frontend**: React 18, TypeScript, Tailwind CSS, Vite, Lucide Icons, Recharts, Vite PWA
- **Backend**: Node.js, Express, TypeScript, tsx, JWT Authentication, bcryptjs, Multer, QRCode
- **Database / Storage**: Lowdb JSON database / Prisma ORM ready schema

---

## 💻 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- `npm` (comes with Node.js)

### Installation
1. Clone the repository:
   ```bash
   git clone https://github.com/snilanga2009-beep/Eclass.git
   cd Eclass
   ```

2. Install all dependencies for root, server, and client:
   ```bash
   npm run install:all
   ```
   *Or install individually in `server` and `client` directories:*
   ```bash
   cd server && npm install
   cd ../client && npm install
   ```

3. Setup environment variables:
   Copy `.env.example` in the `server` directory to `.env`:
   ```bash
   cp server/.env.example server/.env
   ```

4. Run development servers (Frontend & Backend):
   ```bash
   npm run dev
   ```
   - **Frontend App**: `http://localhost:3000`
   - **Backend API**: `http://localhost:5000`

---

## 🔑 Demo Login Accounts

Default password for all demo accounts: **`password123`**

| Role | Username | Password |
| :--- | :--- | :--- |
| **Super Admin** | `superadmin` | `password123` |
| **Campus Admin** | `admin` | `password123` |
| **Accountant** | `accountant` | `password123` |
| **Teacher** | `teacher` | `password123` |
| **Receptionist** | `receptionist` | `password123` |
| **Parent** | `parent` | `password123` |
| **Student** | `student` | `password123` |

---

## 📄 License
Private & Proprietary. All rights reserved.
