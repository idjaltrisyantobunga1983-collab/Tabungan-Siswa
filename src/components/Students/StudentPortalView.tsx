import React, { useState } from 'react';
import {
  User,
  SchoolSettings,
  Transaction,
  Student,
  ClassItem
} from '../../types';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  Calendar,
  Search,
  CheckCircle2,
  GraduationCap,
  LogOut,
  Sparkles,
  BookOpen,
  Info,
  ShieldCheck,
  FileText,
  User as UserIcon,
  X
} from 'lucide-react';

interface StudentPortalViewProps {
  currentUser: User;
  settings: SchoolSettings;
  transactions: Transaction[];
  students: Student[];
  classes: ClassItem[];
  onLogout: () => void;
  onRefresh: () => void;
}

export const StudentPortalView: React.FC<StudentPortalViewProps> = ({
  currentUser,
  settings,
  transactions,
  students,
  classes,
  onLogout,
  onRefresh
}) => {
  const [filterType, setFilterType] = useState<'ALL' | 'SETORAN' | 'PENARIKAN'>('ALL');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [showPrintModal, setShowPrintModal] = useState<boolean>(false);

  // Find the exact active student matching logged in user
  const currentStudent: Student | undefined =
    students.find(s => s.id === currentUser.studentId || s.nisn === currentUser.username) ||
    currentUser.studentData ||
    students[0];

  const studentClass = classes.find(c => c.id === currentStudent?.classId);

  // Filter transactions for this student only
  const studentTransactions = transactions
    .filter(t => t.studentId === currentStudent?.id || t.studentName.toLowerCase() === currentStudent?.name.toLowerCase())
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Calculate stats & running balances
  let running = 0;
  const transactionsWithBalance = studentTransactions.map(t => {
    if (t.type === 'PENARIKAN') {
      running -= t.amount;
    } else {
      running += t.amount;
    }
    return {
      ...t,
      runningBalance: running
    };
  });

  const totalDeposited = studentTransactions
    .filter(t => t.type !== 'PENARIKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawn = studentTransactions
    .filter(t => t.type === 'PENARIKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const depositCount = studentTransactions.filter(t => t.type !== 'PENARIKAN').length;
  const withdrawalCount = studentTransactions.filter(t => t.type === 'PENARIKAN').length;

  // Transactions to display (reverse for recent on top in UI)
  const displayTransactions = [...transactionsWithBalance]
    .reverse()
    .filter(t => {
      if (filterType === 'SETORAN' && t.type === 'PENARIKAN') return false;
      if (filterType === 'PENARIKAN' && t.type !== 'PENARIKAN') return false;
      if (searchTerm) {
        const q = searchTerm.toLowerCase();
        return (
          t.referenceNo.toLowerCase().includes(q) ||
          t.category.toLowerCase().includes(q) ||
          (t.notes && t.notes.toLowerCase().includes(q))
        );
      }
      return true;
    });

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      minimumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDate = (iso: string) => {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString('id-ID', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return iso;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-['Plus_Jakarta_Sans',sans-serif]">
      {/* Top Navbar Header */}
      <header className="bg-slate-900 border-b border-slate-800 text-white sticky top-0 z-40 shadow-md">
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
                  <span className="text-[10px] uppercase font-semibold px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-300 border border-teal-500/30">
                    Portal Siswa
                  </span>
                </div>
                <p className="text-xs text-slate-400 truncate max-w-[200px] sm:max-w-md">
                  {settings.schoolName}
                </p>
              </div>
            </div>

            {/* Student Profile Pill & Logout */}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-2.5 bg-slate-800/90 pl-3 pr-2 py-1.5 rounded-xl border border-slate-700/70 text-xs">
                <div className="w-7 h-7 rounded-lg bg-teal-500/30 text-teal-300 flex items-center justify-center font-bold text-xs border border-teal-500/30">
                  <GraduationCap className="w-4 h-4" />
                </div>
                <div className="text-left hidden sm:block">
                  <p className="font-bold text-slate-100 leading-tight">
                    {currentStudent?.name || currentUser.fullName}
                  </p>
                  <p className="text-[10px] text-teal-300 font-mono">
                    NISN: {currentStudent?.nisn || currentUser.username} • {studentClass?.name || 'Kelas Siswa'}
                  </p>
                </div>
                <button
                  onClick={onLogout}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-700 hover:bg-rose-900/40 text-slate-300 hover:text-rose-300 transition text-xs font-semibold"
                  title="Keluar dari Portal Siswa"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span className="hidden md:inline">Keluar</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Student Portal Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Welcome Greeting Banner */}
        <div className="bg-gradient-to-r from-emerald-800 via-teal-800 to-slate-900 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="absolute right-0 bottom-0 opacity-10 pointer-events-none transform translate-x-10 translate-y-10">
            <GraduationCap className="w-80 h-80 text-white" />
          </div>

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-semibold mb-3">
                <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                <span>Buku Tabungan Digital Siswa</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
                Halo, {currentStudent?.name || currentUser.fullName}! 👋
              </h1>
              <p className="text-emerald-100 text-xs sm:text-sm mt-1 max-w-xl">
                Pantau riwayat setoran, penarikan, dan akumulasi saldo tabungan sekolah Anda secara transparan dan aman setiap saat.
              </p>

              {/* Student details badge list */}
              <div className="flex flex-wrap items-center gap-2 mt-4 text-xs font-medium">
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  NIS: <strong>{currentStudent?.nis || '-'}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  NISN: <strong>{currentStudent?.nisn || '-'}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  Kelas: <strong>{studentClass?.name || 'Siswa'}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10">
                  Wali Kelas: <strong>{studentClass?.homeroomTeacher || '-'}</strong>
                </span>
                <span className="px-3 py-1 rounded-xl bg-emerald-500/30 text-emerald-200 border border-emerald-400/30 font-bold">
                  Status: {currentStudent?.status === 'ACTIVE' ? 'Aktif' : currentStudent?.status}
                </span>
              </div>
            </div>

            {/* Print Action Button */}
            <div className="shrink-0 flex flex-col sm:flex-row md:flex-col gap-2">
              <button
                onClick={() => setShowPrintModal(true)}
                className="flex items-center justify-center gap-2 px-5 py-3 rounded-2xl bg-white text-emerald-900 font-extrabold text-xs shadow-lg hover:bg-emerald-50 transition"
              >
                <Printer className="w-4 h-4 text-emerald-700" />
                <span>Cetak Buku Tabungan Siswa</span>
              </button>
            </div>
          </div>
        </div>

        {/* Financial Stat Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Card 1: Saldo Aktif */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Saldo Tabungan
              </p>
              <h2 className="text-2xl sm:text-3xl font-black text-emerald-950 mt-1 font-mono tracking-tight">
                {formatCurrency(currentStudent?.balance || 0)}
              </h2>
              <p className="text-[11px] text-emerald-600 font-semibold mt-1 flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Saldo aktif terverifikasi sekolah</span>
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0 border border-emerald-100">
              <Wallet className="w-6 h-6" />
            </div>
          </div>

          {/* Card 2: Total Setoran */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Uang Disetor ({depositCount}x)
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-slate-800 mt-1 font-mono tracking-tight">
                {formatCurrency(totalDeposited)}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Akumulasi seluruh setoran tabungan
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-teal-50 text-teal-600 flex items-center justify-center shrink-0 border border-teal-100">
              <ArrowDownLeft className="w-6 h-6" />
            </div>
          </div>

          {/* Card 3: Total Penarikan */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/80 shadow-xs flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Total Uang Ditarik ({withdrawalCount}x)
              </p>
              <h2 className="text-xl sm:text-2xl font-black text-amber-700 mt-1 font-mono tracking-tight">
                {formatCurrency(totalWithdrawn)}
              </h2>
              <p className="text-[11px] text-slate-500 font-medium mt-1">
                Pengambilan uang tabungan
              </p>
            </div>
            <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center shrink-0 border border-amber-100">
              <ArrowUpRight className="w-6 h-6" />
            </div>
          </div>
        </div>

        {/* Section: Riwayat Mutasi Tabungan */}
        <div className="bg-white rounded-3xl border border-slate-200/80 shadow-xs overflow-hidden">
          {/* Header & Controls */}
          <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                <BookOpen className="w-4 h-4 text-emerald-600" />
                <span>Riwayat Mutasi Buku Tabungan Siswa</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Rincian mutasi transaksi setoran dan penarikan yang tercatat dalam sistem
              </p>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Cari transaksi / keterangan..."
                  className="pl-8 pr-3 py-1.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl text-xs font-semibold">
                <button
                  onClick={() => setFilterType('ALL')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterType === 'ALL'
                      ? 'bg-white text-slate-900 shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Semua
                </button>
                <button
                  onClick={() => setFilterType('SETORAN')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterType === 'SETORAN'
                      ? 'bg-emerald-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Setoran
                </button>
                <button
                  onClick={() => setFilterType('PENARIKAN')}
                  className={`px-3 py-1 rounded-lg transition ${
                    filterType === 'PENARIKAN'
                      ? 'bg-amber-600 text-white shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Penarikan
                </button>
              </div>
            </div>
          </div>

          {/* Table of Transactions */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-slate-50/70 border-b border-slate-200 text-slate-600 font-bold uppercase tracking-wider text-[11px]">
                  <th className="p-3.5">Tanggal & Jam</th>
                  <th className="p-3.5">No. Referensi</th>
                  <th className="p-3.5">Kategori / Keterangan</th>
                  <th className="p-3.5">Petugas</th>
                  <th className="p-3.5 text-right">Setoran (+)</th>
                  <th className="p-3.5 text-right">Penarikan (-)</th>
                  <th className="p-3.5 text-right font-black text-slate-900">Saldo Berjalan</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayTransactions.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center py-10 text-slate-400">
                      <FileText className="w-8 h-8 mx-auto text-slate-300 mb-2" />
                      <p className="font-semibold">Belum ada riwayat transaksi yang sesuai.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Lakukan setoran melalui Petugas Tabungan atau Wali Kelas Anda.
                      </p>
                    </td>
                  </tr>
                ) : (
                  displayTransactions.map((trx, idx) => {
                    const isWdl = trx.type === 'PENARIKAN';
                    return (
                      <tr key={trx.id || idx} className="hover:bg-slate-50/80 transition">
                        <td className="p-3.5 text-slate-700 whitespace-nowrap">
                          {formatDate(trx.timestamp)}
                        </td>
                        <td className="p-3.5 font-mono text-[11px] font-bold text-slate-600">
                          {trx.referenceNo}
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                                isWdl
                                  ? 'bg-amber-100 text-amber-800'
                                  : 'bg-emerald-100 text-emerald-800'
                              }`}
                            >
                              {isWdl ? 'Penarikan' : 'Setoran'}
                            </span>
                            <span className="font-semibold text-slate-800">{trx.category}</span>
                          </div>
                          {trx.notes && (
                            <p className="text-[11px] text-slate-500 mt-0.5 truncate max-w-xs">
                              {trx.notes}
                            </p>
                          )}
                        </td>
                        <td className="p-3.5 text-slate-600 font-medium">
                          {trx.officerName || 'Petugas'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-emerald-600">
                          {!isWdl ? formatCurrency(trx.amount) : '-'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-bold text-amber-600">
                          {isWdl ? formatCurrency(trx.amount) : '-'}
                        </td>
                        <td className="p-3.5 text-right font-mono font-extrabold text-slate-900 bg-slate-50/30">
                          {formatCurrency(trx.runningBalance || 0)}
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          {/* Table Footer Summary */}
          <div className="p-4 bg-slate-50 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-600 gap-2">
            <span>
              Menampilkan <strong>{displayTransactions.length}</strong> transaksi tabungan
            </span>
            <div className="flex items-center gap-4 font-mono font-bold">
              <span className="text-emerald-700">Setor: {formatCurrency(totalDeposited)}</span>
              <span className="text-amber-700">Tarik: {formatCurrency(totalWithdrawn)}</span>
              <span className="text-slate-900 bg-white px-2.5 py-1 rounded-lg border border-slate-200">
                Saldo: {formatCurrency(currentStudent?.balance || 0)}
              </span>
            </div>
          </div>
        </div>

        {/* Info Guide Card for Students */}
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-3xl p-5 flex items-start gap-3 text-xs text-emerald-950">
          <Info className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-emerald-900">Petunjuk Setoran & Penarikan Siswa</h4>
            <p className="text-emerald-800 leading-relaxed">
              Untuk melakukan <strong>setor uang tabungan</strong> atau <strong>penarikan uang</strong>, silakan temui <strong>Wali Kelas</strong> atau <strong>Bendahara Tabungan ({settings.treasurerName})</strong> di ruang tata usaha sekolah pada jam operasional tabungan. Simpan slip bukti transaksi fisik atau unduh bukti digital ini sebagai tanda bukti sah.
            </p>
          </div>
        </div>
      </main>

      {/* ============================================================== */}
      {/* MODAL PRINT BUKU TABUNGAN DIGITAL SISWA */}
      {/* ============================================================== */}
      {showPrintModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-3xl w-full p-6 sm:p-8 border border-slate-200 my-8">
            {/* Modal header actions */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-200 print:hidden">
              <div className="flex items-center gap-2">
                <Printer className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-sm">
                  Pratinjau Cetak Buku Tabungan Siswa
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Sekarang</span>
                </button>
                <button
                  onClick={() => setShowPrintModal(false)}
                  className="p-2 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Printable Document Area */}
            <div className="pt-6 print:pt-0 space-y-6 text-slate-800">
              {/* Kop Surat Sekolah */}
              <div className="text-center pb-4 border-b-2 border-slate-900 space-y-1">
                <h2 className="text-lg font-black uppercase tracking-wider text-slate-900">
                  {settings.schoolName}
                </h2>
                <p className="text-xs text-slate-600 font-medium">
                  {settings.address} • Telp: {settings.phone}
                </p>
                <p className="text-[11px] text-slate-500">
                  Sistem Informasi Tabungan Siswa • Tahun Pelajaran {studentClass?.academicYear || '2026/2027'}
                </p>
              </div>

              {/* Document Title */}
              <div className="text-center py-1">
                <h3 className="text-base font-extrabold uppercase tracking-wide text-slate-900 border-b border-slate-400 inline-block pb-0.5">
                  BUKU REKAP TABUNGAN DIGITAL SISWA
                </h3>
              </div>

              {/* Student Biodata Box */}
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-xs">
                <div>
                  <span className="text-slate-500 font-medium">Nama Siswa:</span>
                  <p className="font-bold text-slate-900 text-sm">{currentStudent?.name}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Kelas / Rombel:</span>
                  <p className="font-bold text-slate-900 text-sm">{studentClass?.name || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Nomor Induk Siswa (NIS):</span>
                  <p className="font-mono font-bold text-slate-800">{currentStudent?.nis || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">NISN:</span>
                  <p className="font-mono font-bold text-slate-800">{currentStudent?.nisn || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Wali Kelas:</span>
                  <p className="font-semibold text-slate-800">{studentClass?.homeroomTeacher || '-'}</p>
                </div>
                <div>
                  <span className="text-slate-500 font-medium">Status Rekening:</span>
                  <p className="font-bold text-emerald-700">AKTIF</p>
                </div>
              </div>

              {/* Table of Mutations */}
              <div>
                <h4 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                  Rincian Mutasi Transaksi Tabungan
                </h4>
                <table className="w-full text-left border-collapse text-xs border border-slate-300">
                  <thead>
                    <tr className="bg-slate-100 border-b border-slate-300 font-bold text-slate-800">
                      <th className="p-2 border-r border-slate-300 w-8 text-center">No</th>
                      <th className="p-2 border-r border-slate-300">Tanggal</th>
                      <th className="p-2 border-r border-slate-300">No. Ref</th>
                      <th className="p-2 border-r border-slate-300">Keterangan</th>
                      <th className="p-2 border-r border-slate-300 text-right">Setor (Rp)</th>
                      <th className="p-2 border-r border-slate-300 text-right">Tarik (Rp)</th>
                      <th className="p-2 text-right">Saldo (Rp)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {transactionsWithBalance.map((trx, idx) => {
                      const isW = trx.type === 'PENARIKAN';
                      return (
                        <tr key={trx.id || idx}>
                          <td className="p-2 border-r border-slate-300 text-center font-mono">{idx + 1}</td>
                          <td className="p-2 border-r border-slate-300 whitespace-nowrap">{formatDate(trx.timestamp)}</td>
                          <td className="p-2 border-r border-slate-300 font-mono text-[11px]">{trx.referenceNo}</td>
                          <td className="p-2 border-r border-slate-300 font-medium">{trx.category}</td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-800">
                            {!isW ? formatCurrency(trx.amount) : '-'}
                          </td>
                          <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-800">
                            {isW ? formatCurrency(trx.amount) : '-'}
                          </td>
                          <td className="p-2 text-right font-mono font-bold text-slate-900">
                            {formatCurrency(trx.runningBalance)}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-300 font-bold text-slate-900">
                      <td colSpan={4} className="p-2 border-r border-slate-300 text-right uppercase">
                        Total Akumulasi
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-emerald-800">
                        {formatCurrency(totalDeposited)}
                      </td>
                      <td className="p-2 border-r border-slate-300 text-right font-mono text-amber-800">
                        {formatCurrency(totalWithdrawn)}
                      </td>
                      <td className="p-2 text-right font-mono font-black text-slate-900">
                        {formatCurrency(currentStudent?.balance || 0)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Total Saldo Akhir Banner */}
              <div className="p-3 bg-emerald-50 border border-emerald-300 rounded-xl flex items-center justify-between text-xs font-bold text-emerald-950">
                <span>SISA SALDO TABUNGAN AKTIF SAAT INI:</span>
                <span className="font-mono text-base font-black text-emerald-900">
                  {formatCurrency(currentStudent?.balance || 0)}
                </span>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-2 gap-8 pt-8 text-center text-xs">
                <div>
                  <p className="text-slate-500">Mengetahui,</p>
                  <p className="font-bold text-slate-800 mt-0.5">Orang Tua / Wali Murid</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-slate-400 inline-block px-8 pt-1">
                    ( ........................................... )
                  </p>
                </div>
                <div>
                  <p className="text-slate-500">
                    {(settings.address || 'Sekolah').split(',')[0]}, {new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </p>
                  <p className="font-bold text-slate-800 mt-0.5">Petugas Tabungan / Wali Kelas</p>
                  <div className="h-16" />
                  <p className="font-bold border-t border-slate-400 inline-block px-8 pt-1 text-slate-900">
                    {studentClass?.homeroomTeacher || settings.treasurerName}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
