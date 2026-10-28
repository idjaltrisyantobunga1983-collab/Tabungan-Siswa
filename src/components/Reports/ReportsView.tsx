import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Download,
  Printer,
  Calendar,
  Filter,
  ArrowDownLeft,
  ArrowUpRight,
  Receipt,
  FileCheck2
} from 'lucide-react';
import { Transaction, ClassItem, SchoolSettings } from '../../types';
import { formatRupiah, formatDateIndo } from '../../lib/formatters';

interface ReportsViewProps {
  transactions: Transaction[];
  classes: ClassItem[];
  settings: SchoolSettings;
  onSelectReceipt: (trx: Transaction) => void;
}

export const ReportsView: React.FC<ReportsViewProps> = ({
  transactions,
  classes,
  settings,
  onSelectReceipt
}) => {
  const [filterType, setFilterType] = useState<string>('ALL');
  const [filterClass, setFilterClass] = useState<string>('ALL');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  const filteredTransactions = transactions.filter(t => {
    if (filterType === 'SETORAN' && t.type === 'PENARIKAN') return false;
    if (filterType === 'PENARIKAN' && t.type !== 'PENARIKAN') return false;
    if (filterClass !== 'ALL' && t.classId !== filterClass) return false;

    if (startDate) {
      const trxDate = t.timestamp.substring(0, 10);
      if (trxDate < startDate) return false;
    }
    if (endDate) {
      const trxDate = t.timestamp.substring(0, 10);
      if (trxDate > endDate) return false;
    }
    return true;
  });

  const totalDeposits = filteredTransactions
    .filter(t => t.type !== 'PENARIKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = filteredTransactions
    .filter(t => t.type === 'PENARIKAN')
    .reduce((sum, t) => sum + t.amount, 0);

  const netCashflow = totalDeposits - totalWithdrawals;

  // Quick Date presets
  const handlePresetToday = () => {
    const today = new Date().toISOString().substring(0, 10);
    setStartDate(today);
    setEndDate(today);
  };

  const handlePresetThisMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().substring(0, 10);
    const lastDay = new Date().toISOString().substring(0, 10);
    setStartDate(firstDay);
    setEndDate(lastDay);
  };

  const handlePresetAll = () => {
    setStartDate('');
    setEndDate('');
  };

  const handleExportCSV = () => {
    const headers = ['No. Referensi', 'Tanggal', 'Nama Siswa', 'Tipe Transaksi', 'Kategori', 'Kredit (Masuk)', 'Debit (Keluar)', 'Petugas', 'Catatan'];
    const rows = filteredTransactions.map(t => [
      `"${t.referenceNo}"`,
      `"${t.timestamp}"`,
      `"${t.studentName}"`,
      `"${t.type}"`,
      `"${t.category}"`,
      t.type !== 'PENARIKAN' ? t.amount : 0,
      t.type === 'PENARIKAN' ? t.amount : 0,
      `"${t.officerName}"`,
      `"${t.notes || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Rekap-Kas-Tabungan-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <FileSpreadsheet className="w-5 h-5" />
            </span>
            Rekapitulasi Laporan Kas Tabungan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Jurnal pembukuan mutasi setoran dan penarikan tabungan siswa serta ekspor berkas
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-300 transition"
          >
            <Download className="w-4 h-4 text-slate-600" />
            Export CSV
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Laporan
          </button>
        </div>
      </div>

      {/* Filter Card */}
      <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-bold uppercase tracking-wider text-[11px]">
          <Filter className="w-4 h-4 text-emerald-600" />
          Filter & Periode Laporan
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Jenis Transaksi</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">Semua Jenis (Masuk & Keluar)</option>
              <option value="SETORAN">Hanya Setoran (Kredit)</option>
              <option value="PENARIKAN">Hanya Penarikan (Debit)</option>
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Rombel / Kelas</label>
            <select
              value={filterClass}
              onChange={e => setFilterClass(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
            >
              <option value="ALL">Semua Kelas</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Dari Tanggal</label>
            <input
              type="date"
              value={startDate}
              onChange={e => setStartDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-slate-500 mb-1 font-semibold">Sampai Tanggal</label>
            <input
              type="date"
              value={endDate}
              onChange={e => setEndDate(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Preset buttons */}
        <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
          <span className="text-slate-400 text-[11px]">Preset Cepat:</span>
          <button
            onClick={handlePresetToday}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
          >
            Hari Ini
          </button>
          <button
            onClick={handlePresetThisMonth}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
          >
            Bulan Ini
          </button>
          <button
            onClick={handlePresetAll}
            className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-[11px] font-semibold"
          >
            Semua Periode
          </button>
        </div>
      </div>

      {/* Financial Summary KPI for selected filter */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-emerald-50/70 border border-emerald-200 rounded-2xl p-4">
          <span className="text-xs uppercase font-bold text-emerald-700">Total Setoran (Kredit)</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">+{formatRupiah(totalDeposits)}</p>
          <span className="text-[11px] text-emerald-600">Arus kas masuk tabungan</span>
        </div>

        <div className="bg-amber-50/70 border border-amber-200 rounded-2xl p-4">
          <span className="text-xs uppercase font-bold text-amber-700">Total Penarikan (Debit)</span>
          <p className="text-2xl font-black text-amber-700 mt-1">-{formatRupiah(totalWithdrawals)}</p>
          <span className="text-[11px] text-amber-600">Arus kas keluar tabungan</span>
        </div>

        <div className="bg-slate-900 text-white rounded-2xl p-4 shadow-sm">
          <span className="text-xs uppercase font-bold text-slate-400">Saldo Bersih / Net Mutasi</span>
          <p className="text-2xl font-black text-emerald-400 mt-1">
            {netCashflow >= 0 ? '+' : ''}{formatRupiah(netCashflow)}
          </p>
          <span className="text-[11px] text-slate-400">{filteredTransactions.length} transaksi tercatat</span>
        </div>
      </div>

      {/* Main Printable Ledger Report */}
      <div id="printable-report" className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-6">
        {/* Printable Formal Header */}
        <div className="text-center pb-6 border-b-2 border-slate-800">
          <h2 className="text-lg font-black uppercase text-slate-900 tracking-wider">
            {settings.schoolName}
          </h2>
          <p className="text-xs font-semibold text-slate-700 uppercase tracking-widest mt-0.5">
            LAPORAN REKAPITULASI BUKU KAS TABUNGAN SISWA
          </p>
          <p className="text-xs text-slate-500 mt-1">{settings.address} • Telp: {settings.phone}</p>
          <div className="mt-2 inline-block px-3 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-700">
            Periode: {startDate ? formatDateIndo(startDate, false) : 'Awal Pembukuan'} s/d {endDate ? formatDateIndo(endDate, false) : 'Sekarang'}
          </div>
        </div>

        {/* Ledger Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-800 border-collapse">
            <thead>
              <tr className="bg-slate-100 border-y border-slate-300 font-bold uppercase text-[10px] text-slate-600">
                <th className="py-2.5 px-3">No.</th>
                <th className="py-2.5 px-3">No. Referensi</th>
                <th className="py-2.5 px-3">Tanggal</th>
                <th className="py-2.5 px-3">Nama Siswa</th>
                <th className="py-2.5 px-3">Kategori</th>
                <th className="py-2.5 px-3 text-right">Debit (Keluar)</th>
                <th className="py-2.5 px-3 text-right">Kredit (Masuk)</th>
                <th className="py-2.5 px-3">Petugas</th>
                <th className="py-2.5 px-3 text-center print:hidden">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-8 text-center text-slate-400">
                    Tidak ada transaksi pada filter periode ini.
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((t, idx) => {
                  const isDeposit = t.type !== 'PENARIKAN';
                  return (
                    <tr key={t.id} className="hover:bg-slate-50 transition">
                      <td className="py-2.5 px-3 font-mono text-slate-500">{idx + 1}</td>
                      <td className="py-2.5 px-3 font-mono font-semibold">{t.referenceNo}</td>
                      <td className="py-2.5 px-3 text-slate-600">{formatDateIndo(t.timestamp)}</td>
                      <td className="py-2.5 px-3 font-bold">{t.studentName}</td>
                      <td className="py-2.5 px-3 text-slate-600">{t.category}</td>
                      <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                        {!isDeposit ? formatRupiah(t.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-bold text-emerald-700">
                        {isDeposit ? formatRupiah(t.amount) : '-'}
                      </td>
                      <td className="py-2.5 px-3 text-slate-600">{t.officerName}</td>
                      <td className="py-2.5 px-3 text-center print:hidden">
                        <button
                          onClick={() => onSelectReceipt(t)}
                          className="p-1 hover:bg-slate-100 rounded text-slate-500 hover:text-slate-800"
                          title="Cetak Bukti Transaksi"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
            <tfoot>
              <tr className="bg-slate-100 font-black border-t-2 border-slate-400 text-xs">
                <td colSpan={5} className="py-3 px-3 text-right uppercase">Total Rekapitulasi:</td>
                <td className="py-3 px-3 text-right text-amber-700 font-extrabold">{formatRupiah(totalWithdrawals)}</td>
                <td className="py-3 px-3 text-right text-emerald-700 font-extrabold">{formatRupiah(totalDeposits)}</td>
                <td colSpan={2}></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {/* Formal Signatures Section */}
        <div className="pt-8 grid grid-cols-2 gap-8 text-center text-xs">
          <div>
            <p className="text-slate-500">Mengetahui,</p>
            <p className="font-bold text-slate-800">Kepala Sekolah</p>
            <div className="h-20 flex items-end justify-center">
              <span className="font-bold underline text-slate-900">{settings.principalName}</span>
            </div>
            <p className="text-[10px] text-slate-400">NIP: 19780512 200501 1 004</p>
          </div>
          <div>
            <p className="text-slate-500">Dicetak pada: {formatDateIndo(new Date(), false)}</p>
            <p className="font-bold text-slate-800">Bendahara Tabungan Siswa</p>
            <div className="h-20 flex items-end justify-center">
              <span className="font-bold underline text-slate-900">{settings.treasurerName}</span>
            </div>
            <p className="text-[10px] text-slate-400">NIP: 19830219 200801 2 007</p>
          </div>
        </div>
      </div>
    </div>
  );
};
