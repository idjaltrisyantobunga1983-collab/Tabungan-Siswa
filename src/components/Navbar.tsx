import React from 'react';
import {
  LayoutDashboard,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  FileSpreadsheet,
  ShieldCheck,
  Code2,
  Settings,
  CircleCheck,
  HelpCircle,
  Database,
  LogOut
} from 'lucide-react';
import { User, SchoolSettings } from '../types';

export type ActiveTab =
  | 'dashboard'
  | 'deposit'
  | 'withdrawal'
  | 'students'
  | 'reports'
  | 'audit'
  | 'appsScript'
  | 'settings';

interface NavbarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  currentUser: User;
  settings: SchoolSettings;
  isConnectedLive: boolean;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  currentUser,
  settings,
  isConnectedLive,
  onLogout
}) => {
  const navItems: { id: ActiveTab; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: 'deposit', label: 'Setoran Kas', icon: <ArrowDownLeft className="w-4 h-4 text-emerald-400" /> },
    { id: 'withdrawal', label: 'Penarikan', icon: <ArrowUpRight className="w-4 h-4 text-amber-400" /> },
    { id: 'students', label: 'Data Siswa', icon: <Users className="w-4 h-4" /> },
    { id: 'reports', label: 'Laporan & Mutasi', icon: <FileSpreadsheet className="w-4 h-4" /> },
    { id: 'audit', label: 'Audit Trail', icon: <ShieldCheck className="w-4 h-4" /> },
    { id: 'appsScript', label: 'Apps Script & DB', icon: <Code2 className="w-4 h-4 text-teal-300" /> },
    { id: 'settings', label: 'Pengaturan', icon: <Settings className="w-4 h-4" /> }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
      {/* Upper bar with school branding & sync status */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-400 flex items-center justify-center font-black text-white text-lg shadow-lg shadow-emerald-900/30">
              ST
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold tracking-tight text-white text-base">
                  SI-TABUNGAN
                </span>
                <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  v1.0 Pro
                </span>
              </div>
              <p className="text-xs text-slate-400 truncate max-w-[220px] sm:max-w-md">
                {settings.schoolName}
              </p>
            </div>
          </div>

          {/* Right controls */}
          <div className="flex items-center gap-3">
            {/* Backend connection pill */}
            <button
              onClick={() => setActiveTab('appsScript')}
              className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium border transition ${
                isConnectedLive
                  ? 'bg-emerald-950/60 border-emerald-600/50 text-emerald-300 hover:bg-emerald-900/40'
                  : 'bg-slate-800/80 border-slate-700 text-slate-300 hover:bg-slate-800'
              }`}
              title="Klik untuk konfigurasi Google Apps Script backend"
            >
              <Database className="w-3.5 h-3.5 text-emerald-400" />
              <span>{isConnectedLive ? 'Google Sheets Live' : 'Mode Offline / Demo'}</span>
              <span className={`w-2 h-2 rounded-full ${isConnectedLive ? 'bg-emerald-400 animate-pulse' : 'bg-amber-400'}`} />
            </button>

            {/* Officer Profile & Logout */}
            <div className="flex items-center gap-1.5 bg-slate-800/90 pl-2.5 pr-1.5 py-1.5 rounded-xl border border-slate-700/70 text-xs">
              <div className="w-7 h-7 rounded-lg bg-emerald-600/30 text-emerald-300 flex items-center justify-center font-bold text-xs border border-emerald-500/30">
                {currentUser.fullName.charAt(0)}
              </div>
              <div className="text-left hidden md:block px-1">
                <p className="font-semibold text-slate-200 leading-tight truncate max-w-[130px]">
                  {currentUser.fullName}
                </p>
                <div className="flex items-center gap-1 text-[10px]">
                  <span className="text-emerald-400 font-medium">{currentUser.role}</span>
                  <span className="text-slate-400 font-mono">@{currentUser.username}</span>
                </div>
              </div>

              <button
                onClick={onLogout}
                className="p-1.5 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-rose-300 transition ml-1"
                title="Keluar / Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex space-x-1 overflow-x-auto py-1 scrollbar-none border-t border-slate-800/60">
          {navItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-slate-800/70'
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
