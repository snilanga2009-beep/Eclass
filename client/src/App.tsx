import React, { useState } from 'react';
import { useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { GlobalSearchModal } from './components/GlobalSearchModal';
import { ReceiptModal } from './components/ReceiptModal';
import { StudentIDCardModal } from './components/StudentIDCardModal';
import { StudentProfileModal } from './components/StudentProfileModal';
import { PaymentCollectModal } from './components/PaymentCollectModal';
import { MobileSplashScreen } from './components/MobileSplashScreen';
import { PWAInstallPrompt } from './components/PWAInstallPrompt';
import { ConnectionStatusBanner } from './components/ConnectionStatusBanner';
import { MobileBottomNav } from './components/MobileBottomNav';
import { QRScannerModal } from './components/QRScannerModal';
import { apiRequest } from './api';

// Pages
import { Dashboard } from './pages/Dashboard';
import { Students } from './pages/Students';
import { Classes } from './pages/Classes';
import { Attendance } from './pages/Attendance';
import { Payments } from './pages/Payments';
import { DailyEarnings } from './pages/DailyEarnings';
import { PendingFees } from './pages/PendingFees';
import { Accounting } from './pages/Accounting';
import { Teachers } from './pages/Teachers';
import { Assessments } from './pages/Assessments';
import { Materials } from './pages/Materials';
import { Messaging } from './pages/Messaging';
import { Reports } from './pages/Reports';
import { Settings } from './pages/Settings';
import { AuditLogs } from './pages/AuditLogs';
import { ParentPortal } from './pages/ParentPortal';
import { StudentPortal } from './pages/StudentPortal';
import { Login } from './pages/Login';

export const App: React.FC = () => {
  const { user, loading } = useAuth();

  // Layout & Navigation State
  const [currentTab, setCurrentTab] = useState<string>('dashboard');
  const [collapsed, setCollapsed] = useState<boolean>(false);
  const [isMobileOpen, setIsMobileOpen] = useState<boolean>(false);

  // Modals State
  const [isSearchOpen, setIsSearchOpen] = useState<boolean>(false);
  const [isGlobalScannerOpen, setIsGlobalScannerOpen] = useState<boolean>(false);
  const [activeReceiptNumber, setActiveReceiptNumber] = useState<string | null>(null);
  const [activeIDCardStudentId, setActiveIDCardStudentId] = useState<string | null>(null);
  const [activeProfileStudentId, setActiveProfileStudentId] = useState<string | null>(null);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<boolean>(false);
  const [preselectedPayStudentId, setPreselectedPayStudentId] = useState<string | null>(null);
  const [preselectedPayFeeId, setPreselectedPayFeeId] = useState<string | null>(null);
  const [todayClasses, setTodayClasses] = useState<any[]>([]);

  // Load today classes for quick scanner
  React.useEffect(() => {
    if (user) {
      apiRequest<any[]>('/attendance/today-classes').then(res => {
        if (res && res.length > 0) setTodayClasses(res);
      }).catch(() => {});
    }
  }, [user]);

  // If user role changes to STUDENT or PARENT, automatically switch tab
  React.useEffect(() => {
    if (user?.role === 'STUDENT') {
      setCurrentTab('student-portal');
    } else if (user?.role === 'PARENT') {
      setCurrentTab('parent-portal');
    } else if (currentTab === 'student-portal' || currentTab === 'parent-portal') {
      setCurrentTab('dashboard');
    }
  }, [user?.role]);

  // Open fee collection prefilled for a student and fee record
  const handleOpenPayFee = (studentId: string, feeRecordId?: string) => {
    setPreselectedPayStudentId(studentId);
    setPreselectedPayFeeId(feeRecordId || null);
    setIsPaymentModalOpen(true);
  };

  const handleOpenQuickScan = () => {
    setIsGlobalScannerOpen(true);
  };

  const handleGlobalScanSuccess = async (token: string) => {
    const targetClassId = todayClasses[0]?.id || 'class-1';
    const today = new Date().toISOString().substring(0, 10);
    return await apiRequest('/attendance/scan', {
      method: 'POST',
      body: JSON.stringify({
        qrToken: token,
        classId: targetClassId,
        date: today,
        method: 'QR_CODE'
      })
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-900 text-white">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 border-4 border-brand-400 border-t-brand-600 rounded-full animate-spin" />
          <p className="text-sm font-semibold tracking-wide">Starting Class Accounting System...</p>
        </div>
      </div>
    );
  }

  // If not logged in, display modern Login screen
  if (!user) {
    return (
      <Login 
        onLoginSuccess={(role) => {
          if (role === 'RECEPTIONIST') {
            setCurrentTab('students');
          } else if (role === 'TEACHER') {
            setCurrentTab('dashboard');
          } else if (role === 'ACCOUNTANT') {
            setCurrentTab('payments');
          } else if (role === 'STUDENT') {
            setCurrentTab('student-portal');
          } else if (role === 'PARENT') {
            setCurrentTab('parent-portal');
          } else {
            setCurrentTab('dashboard');
          }
        }} 
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 flex flex-col">
      {/* Mobile Splash Screen on App Launch */}
      <MobileSplashScreen />

      {/* Online / Offline Sync Alert Bar */}
      <ConnectionStatusBanner />

      <div className="flex flex-1 w-full">
        {/* Sidebar Navigation */}
        <Sidebar
          currentTab={currentTab}
          setCurrentTab={setCurrentTab}
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          isMobileOpen={isMobileOpen}
          setIsMobileOpen={setIsMobileOpen}
        />

        {/* Main Content Area */}
        <div className={`flex-1 flex flex-col transition-all duration-300 ${collapsed ? 'lg:ml-20' : 'lg:ml-64'}`}>
          {/* Top Header */}
          <Header
            onOpenMobileMenu={() => setIsMobileOpen(true)}
            onOpenSearch={() => setIsSearchOpen(true)}
            onOpenQuickScan={handleOpenQuickScan}
            onOpenQuickPayment={() => handleOpenPayFee('')}
          />

          {/* Page Content Body */}
          <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-28 md:pb-8">
          {currentTab === 'dashboard' && (
            <Dashboard 
              onNavigate={setCurrentTab} 
              onOpenReceipt={(r) => setActiveReceiptNumber(r)}
              onOpenQuickScan={handleOpenQuickScan}
              onOpenStudentProfile={(id) => setActiveProfileStudentId(id)}
            />
          )}

          {currentTab === 'students' && (
            <Students 
              onOpenProfile={(id) => setActiveProfileStudentId(id)}
              onOpenIDCard={(id) => setActiveIDCardStudentId(id)}
            />
          )}

          {currentTab === 'classes' && (
            <Classes 
              onOpenQuickScan={handleOpenQuickScan}
              onOpenStudentProfile={(id) => setActiveProfileStudentId(id)}
            />
          )}

          {currentTab === 'attendance' && (
            <Attendance 
              onOpenStudentProfile={(id) => setActiveProfileStudentId(id)}
            />
          )}

          {currentTab === 'daily-earnings' && (
            <DailyEarnings 
              onOpenReceipt={(r) => setActiveReceiptNumber(r)}
            />
          )}

          {currentTab === 'payments' && (
            <Payments 
              onOpenReceipt={(r) => setActiveReceiptNumber(r)}
              onOpenPaymentModal={() => handleOpenPayFee('')}
            />
          )}

          {currentTab === 'pending-fees' && (
            <PendingFees 
              onOpenPaymentModal={(stuId, feeId) => handleOpenPayFee(stuId, feeId)}
              onOpenStudentProfile={(id) => setActiveProfileStudentId(id)}
            />
          )}

          {currentTab === 'accounting' && (
            <Accounting />
          )}

          {currentTab === 'teachers' && (
            <Teachers />
          )}

          {currentTab === 'assessments' && (
            <Assessments />
          )}

          {currentTab === 'materials' && (
            <Materials />
          )}

          {currentTab === 'messaging' && (
            <Messaging />
          )}

          {currentTab === 'reports' && (
            <Reports />
          )}

          {currentTab === 'audit' && (
            <AuditLogs />
          )}

          {currentTab === 'settings' && (
            <Settings />
          )}

          {currentTab === 'parent-portal' && (
            <ParentPortal 
              onOpenReceipt={(r) => setActiveReceiptNumber(r)}
              onOpenIDCard={(id) => setActiveIDCardStudentId(id)}
            />
          )}

          {currentTab === 'student-portal' && (
            <StudentPortal 
              onOpenReceipt={(r) => setActiveReceiptNumber(r)}
              onOpenIDCard={(id) => setActiveIDCardStudentId(id)}
            />
          )}
        </main>
      </div>
    </div>

      {/* Global Command Search Modal (Ctrl+K) */}
      <GlobalSearchModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
        onSelectStudent={(id) => setActiveProfileStudentId(id)}
        onSelectClass={() => setCurrentTab('classes')}
        onSelectReceipt={(receiptNo) => setActiveReceiptNumber(receiptNo)}
      />

      {/* Printable Receipt Modal */}
      <ReceiptModal
        receiptNumber={activeReceiptNumber}
        onClose={() => setActiveReceiptNumber(null)}
      />

      {/* Printable QR Student ID Card Modal */}
      <StudentIDCardModal
        studentId={activeIDCardStudentId}
        onClose={() => setActiveIDCardStudentId(null)}
      />

      {/* 10-Tab Deep Student Profile Modal */}
      <StudentProfileModal
        studentId={activeProfileStudentId}
        onClose={() => setActiveProfileStudentId(null)}
        onOpenReceipt={(r) => setActiveReceiptNumber(r)}
        onOpenIDCard={(id) => setActiveIDCardStudentId(id)}
        onOpenPayFee={(stuId, feeId) => handleOpenPayFee(stuId, feeId)}
      />

      {/* Collect Fee & Balance Reconciliation Modal */}
      <PaymentCollectModal
        isOpen={isPaymentModalOpen}
        onClose={() => setIsPaymentModalOpen(false)}
        preselectedStudentId={preselectedPayStudentId}
        preselectedFeeRecordId={preselectedPayFeeId}
        onPaymentSuccess={(receiptNumber) => {
          setActiveReceiptNumber(receiptNumber);
        }}
      />

      {/* PWA 1-Click Install Banner (Android / Chrome / iOS Safari) */}
      <PWAInstallPrompt />

      {/* Mobile-First Fixed Bottom Navigation (visible only on mobile md:hidden) */}
      <MobileBottomNav
        currentTab={currentTab}
        onNavigate={setCurrentTab}
        onOpenQuickScan={handleOpenQuickScan}
        onOpenQuickPayment={() => handleOpenPayFee('')}
      />

      {/* Global High-Tech Mobile Camera QR Scanner Popup Modal */}
      <QRScannerModal
        isOpen={isGlobalScannerOpen}
        onClose={() => setIsGlobalScannerOpen(false)}
        onScanSuccess={handleGlobalScanSuccess}
        selectedClassName={todayClasses[0]?.name || "Today's Class"}
      />
    </div>
  );
};
