import React, { useState } from 'react';
import {
  Lock,
  User as UserIcon,
  Eye,
  EyeOff,
  LogIn,
  ShieldCheck,
  Building2,
  AlertCircle,
  KeyRound,
  GraduationCap,
  Sparkles,
  BookOpen,
  ArrowRight
} from 'lucide-react';
import { User, SchoolSettings } from '../../types';
import { SchoolDataStore } from '../../lib/storage';

interface LoginViewProps {
  settings: SchoolSettings;
  onLoginSuccess: (user: User) => void;
}

type LoginMode = 'officer' | 'student';

export const LoginView: React.FC<LoginViewProps> = ({
  settings,
  onLoginSuccess
}) => {
  const [mode, setMode] = useState<LoginMode>('officer');
  const [username, setUsername] = useState<string>('Bunga1983');
  const [password, setPassword] = useState<string>('12345678');
  const [showPassword, setShowPassword] = useState<boolean>(false);
  const [rememberMe, setRememberMe] = useState<boolean>(true);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  const handleModeChange = (newMode: LoginMode) => {
    setMode(newMode);
    setErrorMsg('');
    if (newMode === 'officer') {
      setUsername('Bunga1983');
      setPassword('12345678');
    } else {
      setUsername('0081234567');
      setPassword('Siswa123');
    }
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setIsLoading(true);

    setTimeout(() => {
      const result = SchoolDataStore.authenticate(username, password);
      if (result.success && result.user) {
        onLoginSuccess(result.user);
      } else {
        setErrorMsg(result.message || 'Username atau password tidak sesuai.');
      }
      setIsLoading(false);
    }, 250);
  };

  const handleQuickFill = (user: string, pass: string) => {
    setUsername(user);
    setPassword(pass);
    setErrorMsg('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-emerald-950 flex flex-col justify-center py-10 sm:px-6 lg:px-8 font-['Plus_Jakarta_Sans',sans-serif] relative overflow-hidden">
      {/* Background ambient lighting */}
      <div className="absolute top-0 -left-40 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 -right-40 w-96 h-96 bg-teal-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Brand Header */}
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center z-10 px-4">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-400 text-white shadow-xl shadow-emerald-900/40 mb-3 border border-emerald-400/30">
          <span className="font-black text-2xl tracking-tight">ST</span>
        </div>
        <h1 className="text-2xl font-black text-white tracking-tight flex items-center justify-center gap-2">
          <span>SI-TABUNGAN</span>
          <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
            v1.0 Pro
          </span>
        </h1>
        <p className="text-sm font-semibold text-emerald-200 mt-1">
          {settings.schoolName}
        </p>
        <p className="text-xs text-slate-400 mt-0.5 max-w-sm mx-auto">
          Sistem Informasi Tabungan Siswa Terintegrasi & Pembukuan Kas Digital
        </p>
      </div>

      {/* Main Login Card */}
      <div className="mt-6 sm:mx-auto sm:w-full sm:max-w-md px-4 z-10">
        <div className="bg-white/95 backdrop-blur-md py-7 px-6 sm:px-8 shadow-2xl rounded-3xl border border-slate-200/80">
          
          {/* Mode Tabs: Petugas vs Siswa */}
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl mb-6">
            <button
              type="button"
              onClick={() => handleModeChange('officer')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
                mode === 'officer'
                  ? 'bg-white text-emerald-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
              <span>Petugas / Guru</span>
            </button>
            <button
              type="button"
              onClick={() => handleModeChange('student')}
              className={`flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-bold transition ${
                mode === 'student'
                  ? 'bg-emerald-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className={`w-4 h-4 ${mode === 'student' ? 'text-white' : 'text-emerald-600'}`} />
              <span>Login Siswa</span>
            </button>
          </div>

          <div className="mb-5">
            {mode === 'officer' ? (
              <>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Masuk Akun Petugas</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800">
                    Admin
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Akses pengelolaan setoran, penarikan, data siswa, dan audit keuangan
                </p>
              </>
            ) : (
              <>
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <span>Portal Mandiri Siswa</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-teal-100 text-teal-800">
                    Buku Tabungan
                  </span>
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Gunakan <strong className="text-slate-700">NISN</strong> Anda dan password <strong className="text-emerald-700 font-mono">Siswa123</strong> untuk cek saldo
                </p>
              </>
            )}
          </div>

          {errorMsg && (
            <div className="mb-5 p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5 animate-in fade-in duration-200">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-4 text-xs">
            {/* Username / NISN field */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5 flex items-center justify-between">
                <span>{mode === 'officer' ? 'Username Petugas' : 'User / Nomor NISN Siswa'}</span>
                {mode === 'student' && (
                  <span className="text-[10px] text-emerald-600 font-normal lowercase">bisa ketik "NISN" atau nomor NISN</span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  {mode === 'officer' ? <UserIcon className="w-4 h-4" /> : <GraduationCap className="w-4 h-4 text-emerald-600" />}
                </div>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  placeholder={mode === 'officer' ? 'Masukkan username (cth: Bunga1983)' : 'Ketik NISN (cth: 0081234567 atau NISN)'}
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-semibold text-slate-800 transition"
                />
              </div>
            </div>

            {/* Password field */}
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider text-[11px] mb-1.5 flex items-center justify-between">
                <span>Kata Sandi / Password</span>
                {mode === 'student' && (
                  <span className="text-[10px] text-slate-500 font-normal">Default: <strong className="font-mono text-emerald-700">Siswa123</strong></span>
                )}
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder={mode === 'officer' ? 'Masukkan kata sandi (cth: 12345678)' : 'Masukkan kata sandi (Siswa123)'}
                  className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs font-mono font-semibold text-slate-800 transition"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Remember & security note */}
            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={e => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 border-slate-300"
                />
                <span className="text-xs text-slate-600 font-medium">Ingat Sesi Login</span>
              </label>

              <span className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                Audit Trail Aktif
              </span>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading || !username || !password}
              className={`w-full mt-2 py-3 px-4 rounded-xl font-bold text-xs shadow-md flex items-center justify-center gap-2 transition disabled:opacity-50 text-white ${
                mode === 'officer'
                  ? 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 shadow-emerald-700/20'
                  : 'bg-gradient-to-r from-teal-600 to-emerald-700 hover:from-teal-500 hover:to-emerald-600 shadow-teal-700/20'
              }`}
            >
              <LogIn className="w-4 h-4" />
              <span>
                {isLoading
                  ? 'Memverifikasi Akun...'
                  : mode === 'officer'
                  ? 'Masuk ke Akun Petugas'
                  : 'Buka Buku Tabungan Siswa'}
              </span>
            </button>
          </form>

          {/* Quick Credential Card */}
          <div className="mt-5 pt-4 border-t border-slate-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <KeyRound className="w-3.5 h-3.5 text-emerald-600" />
                {mode === 'officer' ? 'Kredensial Petugas:' : 'Pilihan Akun Siswa:'}
              </span>
              <span className="text-[10px] text-slate-400">Klik untuk isi otomatis</span>
            </div>

            {mode === 'officer' ? (
              <div className="space-y-2">
                {/* Primary User requested: Bunga1983 */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('Bunga1983', '12345678')}
                  className="w-full text-left p-2.5 rounded-xl border border-emerald-300 bg-emerald-50/70 hover:bg-emerald-100/70 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-emerald-950 font-mono text-xs">Bunga1983</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-emerald-200 text-emerald-900 uppercase">
                        Admin Utama
                      </span>
                    </div>
                    <p className="text-[11px] text-emerald-800">Idjal Trisyanto Bunga, S.Pd</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-emerald-700 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-emerald-200">
                      12345678
                    </span>
                  </div>
                </button>

                {/* Secondary Roles */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('bendahara', 'bendahara123')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-[11px]"
                  >
                    <p className="font-bold text-slate-800">bendahara</p>
                    <p className="text-[10px] text-slate-400 font-mono">bendahara123</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('walikelas', 'guru123')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-[11px]"
                  >
                    <p className="font-bold text-slate-800">walikelas</p>
                    <p className="text-[10px] text-slate-400 font-mono">guru123</p>
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                {/* Default User 'NISN' & Pass 'Siswa123' as requested */}
                <button
                  type="button"
                  onClick={() => handleQuickFill('NISN', 'Siswa123')}
                  className="w-full text-left p-2.5 rounded-xl border border-teal-300 bg-teal-50/70 hover:bg-teal-100/70 transition flex items-center justify-between group"
                >
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-teal-950 font-mono text-xs">NISN</span>
                      <span className="px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-teal-200 text-teal-900 uppercase">
                        Siswa Demo
                      </span>
                    </div>
                    <p className="text-[11px] text-teal-800">Login instan dengan kata kunci "NISN"</p>
                  </div>
                  <div className="text-right">
                    <span className="font-mono text-[11px] text-teal-700 font-bold bg-white/80 px-2 py-0.5 rounded-md border border-teal-200">
                      Siswa123
                    </span>
                  </div>
                </button>

                {/* Specific Student NISN options */}
                <div className="grid grid-cols-2 gap-2 pt-0.5">
                  <button
                    type="button"
                    onClick={() => handleQuickFill('0081234567', 'Siswa123')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-[11px]"
                  >
                    <p className="font-bold text-slate-800 truncate">Ahmad Fauzi</p>
                    <p className="text-[10px] text-emerald-600 font-mono">NISN: 0081234567</p>
                  </button>
                  <button
                    type="button"
                    onClick={() => handleQuickFill('0081234568', 'Siswa123')}
                    className="text-left p-2 rounded-lg border border-slate-200 hover:bg-slate-50 transition text-[11px]"
                  >
                    <p className="font-bold text-slate-800 truncate">Siti Nurhaliza</p>
                    <p className="text-[10px] text-emerald-600 font-mono">NISN: 0081234568</p>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Security badge at bottom */}
        <p className="mt-4 text-center text-[11px] text-slate-400">
          Data tabungan dilindungi enkripsi SHA-256 dan verifikasi sesi aman.
        </p>
      </div>
    </div>
  );
};
