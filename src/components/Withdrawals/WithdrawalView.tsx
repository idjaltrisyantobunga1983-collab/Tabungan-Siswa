import React, { useState } from 'react';
import {
  ArrowUpRight,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  UserCheck,
  ShieldAlert
} from 'lucide-react';
import { Student, ClassItem, Withdrawal, Transaction, SchoolSettings, User } from '../../types';
import { formatRupiah } from '../../lib/formatters';

interface WithdrawalViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: SchoolSettings;
  currentUser: User;
  onWithdrawalComplete: (withdrawal: Withdrawal, trx: Transaction, student: Student) => void;
}

const COMMON_REASONS = [
  'Pembelian Buku / Modul Pelajaran',
  'Biaya Praktikum Kejuruan',
  'Keperluan Karya Wisata / Study Tour',
  'Kebutuhan Pribadi & Uang Saku',
  'Pengobatan Siswa Sakit',
  'Penutupan Tabungan / Lulus Sekolah'
];

const QUICK_WITHDRAWAL_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000, 75000, 100000];

export const WithdrawalView: React.FC<WithdrawalViewProps> = ({
  students,
  classes,
  settings,
  currentUser,
  onWithdrawalComplete
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [amountStr, setAmountStr] = useState<string>('50000');
  const [reason, setReason] = useState<string>(COMMON_REASONS[0]);
  const [isClosingAccount, setIsClosingAccount] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);
  const parsedAmount = Number(amountStr.replace(/[^0-9]/g, '')) || 0;

  const currentBalance = selectedStudent ? selectedStudent.balance : 0;
  const maxAllowedWithdrawal = isClosingAccount
    ? currentBalance
    : Math.max(0, currentBalance - settings.minBalance);

  const isExceeding = parsedAmount > maxAllowedWithdrawal;

  const filteredStudents = searchQuery.trim()
    ? students.filter(
        s =>
          s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          s.nis.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (s.className && s.className.toLowerCase().includes(searchQuery.toLowerCase()))
      ).slice(0, 8)
    : students.slice(0, 8);

  const handleSelectStudent = (s: Student) => {
    setSelectedStudentId(s.id);
    setSearchQuery(`${s.name} (${s.nis} - ${s.className || 'Kelas'})`);
  };

  const handleSetAmount = (amt: number) => {
    setAmountStr(String(amt));
  };

  const handleAddIncrement = (inc: number) => {
    const next = parsedAmount + inc;
    setAmountStr(String(next));
  };

  const handleTakeMax = () => {
    setAmountStr(String(maxAllowedWithdrawal));
  };

  const handleResetAmount = () => {
    setAmountStr('0');
  };

  const handleAmountInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    setAmountStr(rawVal);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedStudent) {
      setErrorMessage('Silakan pilih siswa yang akan menarik tabungan');
      return;
    }

    if (parsedAmount <= 0) {
      setErrorMessage('Nominal penarikan harus lebih dari Rp 0');
      return;
    }

    if (parsedAmount > currentBalance) {
      setErrorMessage(`Saldo tidak mencukupi! Saldo saat ini hanya ${formatRupiah(currentBalance)}.`);
      return;
    }

    if (!isClosingAccount && currentBalance - parsedAmount < settings.minBalance) {
      setErrorMessage(
        `Penarikan melanggar batas saldo minimum mengendap (${formatRupiah(settings.minBalance)}). Maksimal yang dapat ditarik: ${formatRupiah(maxAllowedWithdrawal)}.`
      );
      return;
    }

    setIsSubmitting(true);

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const result = SchoolDataStore.recordWithdrawal(
        selectedStudent.id,
        parsedAmount,
        reason,
        currentUser.fullName
      );

      if (result.success && result.withdrawal && result.transaction && result.student) {
        setSuccessMessage(`Penarikan ${formatRupiah(parsedAmount)} untuk ${result.student.name} berhasil disetujui!`);
        onWithdrawalComplete(result.withdrawal, result.transaction, result.student);
        // Reset fields
        setSearchQuery('');
        setSelectedStudentId('');
        setAmountStr('50000');
      } else {
        setErrorMessage(result.error || 'Terjadi kesalahan saat memproses penarikan.');
      }
      setIsSubmitting(false);
    });
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-amber-100 text-amber-700 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </span>
            Form Penarikan Saldo Tabungan Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Penarikan saldo tabungan dengan validasi saldo mengendap minimum dan approval petugas
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <ShieldAlert className="w-4 h-4 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Form Controls */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          {/* Step 1: Select Student */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Pilih Siswa Penarik *
            </label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => {
                  setSearchQuery(e.target.value);
                  if (selectedStudentId) setSelectedStudentId('');
                }}
                placeholder="Cari Nama Siswa atau NIS..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs"
              />
            </div>

            {/* Candidate List */}
            {!selectedStudentId && searchQuery.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white max-h-52 overflow-y-auto shadow-md">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">
                    Tidak ditemukan siswa yang cocok.
                  </div>
                ) : (
                  filteredStudents.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left p-3 hover:bg-amber-50 flex items-center justify-between transition text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-500">
                          NIS: {s.nis} | Rombel: {s.className || 'Kelas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Saldo Tersedia</span>
                        <p className="font-extrabold text-slate-800">{formatRupiah(s.balance)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Student Balance Notice if selected */}
          {selectedStudent && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500">Saldo Tabungan Saat Ini:</span>
                <p className="font-extrabold text-slate-900 text-base">{formatRupiah(currentBalance)}</p>
              </div>
              <div className="text-right">
                <span className="text-slate-500">Batas Penarikan Maksimal:</span>
                <p className="font-extrabold text-amber-600 text-base">{formatRupiah(maxAllowedWithdrawal)}</p>
                <span className="text-[10px] text-slate-400">
                  (Mengendap min: {formatRupiah(settings.minBalance)})
                </span>
              </div>
            </div>
          )}

          {/* Step 2: Withdrawal Amount */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Pilihan Angka Tarik (0 s/d 100.000 & Tak Terbatas) *
              </label>
              <div className="flex items-center gap-2">
                {selectedStudent && maxAllowedWithdrawal > 0 && (
                  <button
                    type="button"
                    onClick={handleTakeMax}
                    className="text-[11px] text-amber-700 hover:text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md"
                  >
                    Tarik Maksimal ({formatRupiah(maxAllowedWithdrawal)})
                  </button>
                )}
                <button
                  type="button"
                  onClick={handleResetAmount}
                  className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
                >
                  Reset (0)
                </button>
              </div>
            </div>

            {/* Presets 1.000 s/d 100.000 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
              {QUICK_WITHDRAWAL_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleSetAmount(amt)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                    parsedAmount === amt
                      ? 'bg-amber-600 border-amber-600 text-white shadow-xs'
                      : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  {formatRupiah(amt)}
                </button>
              ))}
            </div>

            {/* Quick Increment Adders */}
            <div className="flex flex-wrap items-center gap-1.5 mb-3">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-1">Tambah Cepat:</span>
              {[5000, 10000, 20000, 50000, 100000].map(inc => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddIncrement(inc)}
                  className="px-2 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 text-[11px] font-bold border border-amber-200 transition"
                >
                  +{inc >= 1000 ? `${inc / 1000}rb` : inc}
                </button>
              ))}
            </div>

            {/* Custom Input */}
            <div className="relative">
              <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">Rp</span>
              <input
                type="text"
                value={amountStr}
                onChange={handleAmountInput}
                placeholder="Ketik nominal penarikan bebas..."
                className={`w-full pl-10 pr-4 py-2.5 rounded-xl border text-sm font-bold text-slate-800 focus:outline-none focus:ring-2 ${
                  isExceeding
                    ? 'border-rose-400 focus:ring-rose-400 bg-rose-50/30'
                    : 'border-slate-200 focus:ring-amber-500'
                }`}
              />
            </div>
            {isExceeding ? (
              <p className="text-rose-600 text-xs mt-1.5 flex items-center gap-1 font-medium">
                <AlertTriangle className="w-3.5 h-3.5" />
                Nominal melebihi batas penarikan maksimal ({formatRupiah(maxAllowedWithdrawal)}).
              </p>
            ) : (
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>Terbaca: <strong className="text-amber-700">{formatRupiah(parsedAmount)}</strong></span>
                <span className="text-[10px] text-slate-400">Bebas tarik selama saldo mencukupi</span>
              </div>
            )}
          </div>

          {/* Reason */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Alasan / Keperluan Penarikan *
            </label>
            <select
              value={reason}
              onChange={e => setReason(e.target.value)}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-xs bg-white mb-2"
            >
              {COMMON_REASONS.map((r, i) => (
                <option key={i} value={r}>{r}</option>
              ))}
            </select>
          </div>

          {/* Special Toggle: Penutupan Rekening */}
          <div className="pt-2">
            <label className="flex items-center gap-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={isClosingAccount}
                onChange={e => setIsClosingAccount(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 focus:ring-amber-500"
              />
              <span className="text-xs text-slate-700 font-medium">
                Penarikan seluruh saldo (Penutupan Tabungan Siswa / Lulus Sekolah)
              </span>
            </label>
          </div>
        </div>

        {/* Right Column: Approval Card */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Verifikasi Penarikan</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-500/20 text-amber-300 font-semibold border border-amber-500/30">
                  Approval Bendahara
                </span>
              </div>

              {selectedStudent ? (
                <div className="py-4 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">Siswa:</span>
                    <p className="font-bold text-slate-100 text-sm">{selectedStudent.name}</p>
                    <p className="text-[11px] text-slate-400">{selectedStudent.nis} • {selectedStudent.className}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Nominal Penarikan:</span>
                    <p className="font-extrabold text-amber-400 text-lg">-{formatRupiah(parsedAmount)}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-slate-400">Sisa Saldo Setelah Penarikan:</span>
                    <p className="font-bold text-slate-200 text-sm">
                      {formatRupiah(Math.max(0, currentBalance - parsedAmount))}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <UserCheck className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                  <p>Pilih siswa di sebelah kiri untuk memvalidasi saldo dan limit penarikan</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-3 flex justify-between">
                <span>Disetujui Oleh:</span>
                <span className="text-slate-200 font-semibold">{currentUser.fullName}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !selectedStudent || parsedAmount <= 0 || isExceeding}
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowUpRight className="w-4 h-4" />
                {isSubmitting ? 'Memproses Penarikan...' : 'Setujui & Cetak Kwitansi'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-amber-50 border border-amber-100 rounded-2xl text-xs text-amber-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Bukti Penarikan Sah
            </p>
            <p className="text-[11px] text-amber-700 leading-relaxed">
              Setiap penarikan wajib ditandatangani oleh siswa/wali dan bendahara pada struk tanda terima yang diterbitkan.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
