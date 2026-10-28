import React, { useState, useEffect } from 'react';
import { Navbar, ActiveTab } from './components/Navbar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { DepositView } from './components/Transactions/DepositView';
import { WithdrawalView } from './components/Withdrawals/WithdrawalView';
import { StudentsView } from './components/Students/StudentsView';
import { ReportsView } from './components/Reports/ReportsView';
import { AuditView } from './components/Audit/AuditView';
import { AppsScriptStudioView } from './components/AppsScriptStudio/AppsScriptStudioView';
import { SettingsView } from './components/Settings/SettingsView';
import { ReceiptModal } from './components/ReceiptModal';
import { LoginView } from './components/Auth/LoginView';
import { StudentPortalView } from './components/Students/StudentPortalView';
import { SchoolDataStore } from './lib/storage';
import {
  Student,
  ClassItem,
  Transaction,
  Withdrawal,
  AuditLog,
  SchoolSettings,
  User,
  DashboardSummary
} from './types';
import { pingAppsScript } from './lib/appsScriptClient';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [settings, setSettings] = useState<SchoolSettings>(SchoolDataStore.getSettings());
  const [currentUser, setCurrentUser] = useState<User | null>(SchoolDataStore.getCurrentUser());
  const [summary, setSummary] = useState<DashboardSummary>(SchoolDataStore.getSummary());

  // Receipt modal state
  const [activeReceipt, setActiveReceipt] = useState<Transaction | null>(null);
  const [activeStudentBalance, setActiveStudentBalance] = useState<number | undefined>(undefined);

  // Connection state
  const [isConnectedLive, setIsConnectedLive] = useState<boolean>(false);

  // Load data on startup
  const reloadData = () => {
    const s = SchoolDataStore.getStudents();
    const c = SchoolDataStore.getClasses();
    const t = SchoolDataStore.getTransactions();
    const w = SchoolDataStore.getWithdrawals();
    const a = SchoolDataStore.getAuditLogs();
    const cfg = SchoolDataStore.getSettings();
    const u = SchoolDataStore.getCurrentUser();
    const sum = SchoolDataStore.getSummary();

    setStudents(s);
    setClasses(c);
    setTransactions(t);
    setWithdrawals(w);
    setAuditLogs(a);
    setSettings(cfg);
    setCurrentUser(u);
    setSummary(sum);
  };

  useEffect(() => {
    reloadData();
  }, []);

  // Check Apps Script connection if configured
  useEffect(() => {
    if (settings.appsScriptUrl && settings.syncMode === 'live') {
      pingAppsScript(settings.appsScriptUrl).then(res => {
        setIsConnectedLive(res.success);
      });
    } else {
      setIsConnectedLive(false);
    }
  }, [settings.appsScriptUrl, settings.syncMode]);

  const handleDepositComplete = (trx: Transaction, student: Student) => {
    reloadData();
    setActiveReceipt(trx);
    setActiveStudentBalance(student.balance);
  };

  const handleWithdrawalComplete = (wdl: Withdrawal, trx: Transaction, student: Student) => {
    reloadData();
    setActiveReceipt(trx);
    setActiveStudentBalance(student.balance);
  };

  const handleUpdateSettings = (newSettings: SchoolSettings) => {
    SchoolDataStore.saveSettings(newSettings);
    setSettings(newSettings);
    reloadData();
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    reloadData();
  };

  const handleLogout = () => {
    SchoolDataStore.logout();
    setCurrentUser(null);
  };

  const handleSwitchUser = (user: User) => {
    SchoolDataStore.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleResetData = () => {
    SchoolDataStore.resetDatabase();
    reloadData();
  };

  const handleQuickDeposit = (student: Student) => {
    setActiveTab('deposit');
  };

  const handleQuickWithdrawal = (student: Student) => {
    setActiveTab('withdrawal');
  };

  const handleTestConnection = async (url: string) => {
    const res = await pingAppsScript(url);
    setIsConnectedLive(res.success);
    return res.success;
  };

  // If not authenticated, display login screen
  if (!currentUser) {
    return (
      <LoginView
        settings={settings}
        onLoginSuccess={handleLoginSuccess}
      />
    );
  }

  // If logged in as SISWA (Student Portal)
  if (currentUser.role === 'SISWA') {
    return (
      <StudentPortalView
        currentUser={currentUser}
        settings={settings}
        transactions={transactions}
        students={students}
        classes={classes}
        onLogout={handleLogout}
        onRefresh={reloadData}
      />
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navigation */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        currentUser={currentUser}
        settings={settings}
        isConnectedLive={isConnectedLive}
        onLogout={handleLogout}
      />

      {/* Main View Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            summary={summary}
            recentTransactions={transactions}
            settings={settings}
            setActiveTab={setActiveTab}
            onSelectTransaction={trx => {
              const matchedStudent = students.find(s => s.id === trx.studentId);
              setActiveReceipt(trx);
              setActiveStudentBalance(matchedStudent?.balance);
            }}
          />
        )}

        {activeTab === 'deposit' && (
          <DepositView
            students={students}
            classes={classes}
            settings={settings}
            currentUser={currentUser}
            onDepositComplete={handleDepositComplete}
          />
        )}

        {activeTab === 'withdrawal' && (
          <WithdrawalView
            students={students}
            classes={classes}
            settings={settings}
            currentUser={currentUser}
            onWithdrawalComplete={handleWithdrawalComplete}
          />
        )}

        {activeTab === 'students' && (
          <StudentsView
            students={students}
            classes={classes}
            transactions={transactions}
            settings={settings}
            currentUser={currentUser}
            onRefresh={reloadData}
            onQuickDeposit={handleQuickDeposit}
            onQuickWithdrawal={handleQuickWithdrawal}
          />
        )}

        {activeTab === 'reports' && (
          <ReportsView
            transactions={transactions}
            classes={classes}
            settings={settings}
            onSelectReceipt={trx => {
              const matchedStudent = students.find(s => s.id === trx.studentId);
              setActiveReceipt(trx);
              setActiveStudentBalance(matchedStudent?.balance);
            }}
          />
        )}

        {activeTab === 'audit' && (
          <AuditView logs={auditLogs} />
        )}

        {activeTab === 'appsScript' && (
          <AppsScriptStudioView
            settings={settings}
            onUpdateSettings={handleUpdateSettings}
            onTestConnection={handleTestConnection}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsView
            settings={settings}
            currentUser={currentUser}
            onUpdateSettings={handleUpdateSettings}
            onSwitchUser={handleSwitchUser}
            onResetData={handleResetData}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-xs text-slate-500 text-center">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            &copy; {new Date().getFullYear()} {settings.schoolName} — Sistem Informasi Manajemen Tabungan Siswa
          </p>
          <p className="text-[11px] text-slate-400">
            Terintegrasi dengan Google Sheets & Google Apps Script API
          </p>
        </div>
      </footer>

      {/* Transaction Receipt Modal */}
      <ReceiptModal
        transaction={activeReceipt}
        settings={settings}
        studentBalance={activeStudentBalance}
        onClose={() => {
          setActiveReceipt(null);
          setActiveStudentBalance(undefined);
        }}
      />
    </div>
  );
}
