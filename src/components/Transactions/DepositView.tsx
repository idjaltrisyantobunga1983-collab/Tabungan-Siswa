import React, { useState } from 'react';
import {
  ArrowDownLeft,
  Search,
  CheckCircle2,
  AlertCircle,
  Sparkles,
  Wallet,
  Receipt,
  UserCheck
} from 'lucide-react';
import { Student, ClassItem, Transaction, SchoolSettings, User } from '../../types';
import { formatRupiah } from '../../lib/formatters';

interface DepositViewProps {
  students: Student[];
  classes: ClassItem[];
  settings: SchoolSettings;
  currentUser: User;
  onDepositComplete: (trx: Transaction, student: Student) => void;
}

const QUICK_AMOUNTS = [1000, 2000, 5000, 10000, 20000, 50000, 75000, 100000];
const INCREMENT_AMOUNTS = [1000, 5000, 10000, 20000, 50000, 100000, 500000, 1000000];

export const DepositView: React.FC<DepositViewProps> = ({
  students,
  classes,
  currentUser,
  onDepositComplete
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [amount, setAmount] = useState<number>(20000);
  const [customAmountStr, setCustomAmountStr] = useState<string>('20000');
  const [category, setCategory] = useState<string>('Tabungan Rutin Harian');
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [successMessage, setSuccessMessage] = useState<string>('');

  const selectedStudent = students.find(s => s.id === selectedStudentId);

  // Filter student candidates
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

  const handleAmountChange = (num: number) => {
    setAmount(num);
    setCustomAmountStr(String(num));
  };

  const handleAddIncrement = (inc: number) => {
    const next = amount + inc;
    setAmount(next);
    setCustomAmountStr(String(next));
  };

  const handleResetAmount = () => {
    setAmount(0);
    setCustomAmountStr('0');
  };

  const handleCustomInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    const num = Number(rawVal) || 0;
    setCustomAmountStr(rawVal);
    setAmount(num);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    if (!selectedStudent) {
      setErrorMessage('Silakan pilih siswa yang akan melakukan setoran tabungan');
      return;
    }

    if (!amount || amount <= 0) {
      setErrorMessage('Nominal setoran harus lebih dari Rp 0');
      return;
    }

    setIsSubmitting(true);

    try {
      // Dynamic import or direct call handled via props
      import('../../lib/storage').then(({ SchoolDataStore }) => {
        const result = SchoolDataStore.recordDeposit(
          selectedStudent.id,
          amount,
          category,
          notes,
          currentUser.fullName
        );

        if (result.success && result.transaction && result.student) {
          setSuccessMessage(`Setoran ${formatRupiah(amount)} untuk ${result.student.name} berhasil disimpan!`);
          onDepositComplete(result.transaction, result.student);
          // Reset form fields
          setNotes('');
          setSearchQuery('');
          setSelectedStudentId('');
        } else {
          setErrorMessage(result.error || 'Terjadi kesalahan saat memproses setoran.');
        }
        setIsSubmitting(false);
      });
    } catch (err: unknown) {
      setErrorMessage(err instanceof Error ? err.message : 'Gagal menyimpan transaksi.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Title */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </span>
            Form Setoran Kas Tabungan Siswa
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Pencatatan kas masuk tabungan siswa dengan penerbitan bukti struk instan
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 shrink-0" />
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
        {/* Left Column: Student Selection */}
        <div className="md:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              1. Pilih Siswa Penyetor *
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
                placeholder="Ketik Nama Siswa, NIS, atau Rombel..."
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            {/* Candidate list */}
            {!selectedStudentId && searchQuery.length > 0 && (
              <div className="mt-2 border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 bg-white max-h-52 overflow-y-auto shadow-md">
                {filteredStudents.length === 0 ? (
                  <div className="p-4 text-xs text-slate-400 text-center">
                    Tidak ditemukan siswa dengan kata kunci tersebut.
                  </div>
                ) : (
                  filteredStudents.map(s => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => handleSelectStudent(s)}
                      className="w-full text-left p-3 hover:bg-emerald-50 flex items-center justify-between transition text-xs"
                    >
                      <div>
                        <p className="font-bold text-slate-800">{s.name}</p>
                        <p className="text-[11px] text-slate-500">
                          NIS: {s.nis} | Rombel: {s.className || 'Kelas'}
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-[11px] text-slate-400">Saldo Saat Ini</span>
                        <p className="font-extrabold text-emerald-600">{formatRupiah(s.balance)}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Quick Denominations */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
                2. Pilihan Angka Setor (0 s/d 100.000 & Tak Terbatas) *
              </label>
              <button
                type="button"
                onClick={handleResetAmount}
                className="text-[11px] text-rose-600 hover:text-rose-700 font-semibold"
              >
                Reset ke Rp 0
              </button>
            </div>

            {/* Presets 1.000 s/d 100.000 */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-2.5">
              {QUICK_AMOUNTS.map(amt => (
                <button
                  key={amt}
                  type="button"
                  onClick={() => handleAmountChange(amt)}
                  className={`py-2 px-2.5 rounded-xl text-xs font-bold border transition ${
                    amount === amt
                      ? 'bg-emerald-600 border-emerald-600 text-white shadow-xs'
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
              {INCREMENT_AMOUNTS.map(inc => (
                <button
                  key={inc}
                  type="button"
                  onClick={() => handleAddIncrement(inc)}
                  className="px-2 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-[11px] font-bold border border-emerald-200 transition"
                >
                  +{inc >= 1000000 ? `${inc / 1000000} Juta` : inc >= 1000 ? `${inc / 1000}rb` : inc}
                </button>
              ))}
            </div>

            {/* Custom Amount Input (Unlimited) */}
            <div>
              <label className="block text-[11px] font-semibold text-slate-500 mb-1">
                Ketik Nominal Bebas (Jumlah Tak Terbatas):
              </label>
              <div className="relative">
                <span className="absolute left-3 top-3 text-xs font-bold text-slate-500">Rp</span>
                <input
                  type="text"
                  value={customAmountStr}
                  onChange={handleCustomInput}
                  placeholder="Ketik angka bebas tanpa batasan (cth: 75000, 2500000)"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-sm font-bold text-slate-800"
                />
              </div>
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1.5">
                <span>Terbaca: <strong className="text-emerald-700">{formatRupiah(amount)}</strong></span>
                <span className="text-[10px] text-slate-400">Bebas input nominal tanpa batas maksimal</span>
              </div>
            </div>
          </div>

          {/* Category & Notes */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Kategori Tabungan
              </label>
              <select
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white"
              >
                <option value="Tabungan Rutin Harian">Tabungan Rutin Harian</option>
                <option value="Tabungan Rutin Mingguan">Tabungan Rutin Mingguan</option>
                <option value="Tabungan Kurban / Khusus">Tabungan Kurban / Khusus</option>
                <option value="Tabungan Wisuda / Kelulusan">Tabungan Wisuda / Kelulusan</option>
                <option value="Tabungan Karya Wisata">Tabungan Karya Wisata</option>
                <option value="Saldo Awal Pembukaan">Saldo Awal Pembukaan</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Catatan Transaksi (Opsional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="Cth: Titipan orang tua..."
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>
          </div>
        </div>

        {/* Right Column: Student Summary Card & Submit */}
        <div className="space-y-4">
          <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-slate-800">
                <span className="text-xs uppercase tracking-wider text-slate-400 font-bold">Ringkasan Setoran</span>
                <Sparkles className="w-4 h-4 text-emerald-400" />
              </div>

              {selectedStudent ? (
                <div className="py-4 space-y-3 text-xs">
                  <div>
                    <span className="text-slate-400">Nama Siswa:</span>
                    <p className="font-bold text-slate-100 text-sm">{selectedStudent.name}</p>
                    <p className="text-[11px] text-slate-400">NIS: {selectedStudent.nis} • {selectedStudent.className}</p>
                  </div>
                  <div>
                    <span className="text-slate-400">Saldo Saat Ini:</span>
                    <p className="font-bold text-slate-200 text-sm">{formatRupiah(selectedStudent.balance)}</p>
                  </div>
                  <div className="pt-2 border-t border-slate-800">
                    <span className="text-emerald-400 font-semibold">Estimasi Saldo Baru:</span>
                    <p className="font-extrabold text-emerald-400 text-lg">
                      {formatRupiah(selectedStudent.balance + amount)}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-xs text-slate-500">
                  <UserCheck className="w-10 h-10 mx-auto text-slate-700 mb-2" />
                  <p>Pilih siswa di sebelah kiri untuk melihat ringkasan akun & kalkulasi saldo</p>
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-slate-800">
              <div className="text-xs text-slate-400 mb-3 flex justify-between">
                <span>Petugas:</span>
                <span className="text-slate-200 font-semibold">{currentUser.fullName}</span>
              </div>
              <button
                type="submit"
                disabled={isSubmitting || !selectedStudent || amount <= 0}
                className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowDownLeft className="w-4 h-4" />
                {isSubmitting ? 'Memproses Setoran...' : 'Simpan & Cetak Struk'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-xs text-emerald-800 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <Receipt className="w-3.5 h-3.5" /> Penerbitan Struk Otomatis
            </p>
            <p className="text-[11px] text-emerald-700 leading-relaxed">
              Setelah setoran disimpan, jendela cetak struk kwitansi akan langsung terbuka otomatis untuk diberikan kepada siswa/wali murid.
            </p>
          </div>
        </div>
      </form>
    </div>
  );
};
