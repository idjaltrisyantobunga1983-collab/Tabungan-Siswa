import React from 'react';
import {
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  Users,
  TrendingUp,
  Receipt,
  PlusCircle,
  FileText,
  Building2,
  CalendarDays
} from 'lucide-react';
import { DashboardSummary, Transaction, SchoolSettings } from '../../types';
import { formatRupiah, formatDateIndo } from '../../lib/formatters';
import { ActiveTab } from '../Navbar';

interface DashboardViewProps {
  summary: DashboardSummary;
  recentTransactions: Transaction[];
  settings: SchoolSettings;
  setActiveTab: (tab: ActiveTab) => void;
  onSelectTransaction: (trx: Transaction) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  summary,
  recentTransactions,
  settings,
  setActiveTab,
  onSelectTransaction
}) => {
  const maxDayAmount = Math.max(
    ...summary.chartData.map(d => Math.max(d.deposits, d.withdrawals)),
    100000
  );

  return (
    <div className="space-y-6">
      {/* Top Welcome / Header */}
      <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-2xl p-6 text-white shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-500/20 text-emerald-200 text-xs font-semibold mb-2 border border-emerald-400/20">
            <Building2 className="w-3.5 h-3.5" />
            <span>Sistem Informasi Tabungan Siswa Terintegrasi</span>
          </div>
          <h1 className="text-2xl font-black tracking-tight">{settings.schoolName}</h1>
          <p className="text-sm text-emerald-100/80 mt-1 max-w-xl">
            {settings.schoolMotto}
          </p>
        </div>

        {/* Quick action buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setActiveTab('deposit')}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-bold rounded-xl text-xs shadow-md transition"
          >
            <PlusCircle className="w-4 h-4" />
            Setor Tabungan
          </button>
          <button
            onClick={() => setActiveTab('withdrawal')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs backdrop-blur-xs border border-white/20 transition"
          >
            <ArrowUpRight className="w-4 h-4 text-amber-300" />
            Tarik Saldo
          </button>
          <button
            onClick={() => setActiveTab('reports')}
            className="flex items-center gap-2 px-4 py-2.5 bg-white/10 hover:bg-white/20 text-white font-semibold rounded-xl text-xs backdrop-blur-xs border border-white/20 transition"
          >
            <FileText className="w-4 h-4 text-teal-300" />
            Buku Kas
          </button>
        </div>
      </div>

      {/* Primary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Saldo */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Saldo Terkumpul</span>
            <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-slate-900 mt-3 tracking-tight">
            {formatRupiah(summary.totalBalance)}
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500 mt-2">
            <Users className="w-3.5 h-3.5 text-slate-400" />
            <span>{summary.activeStudentsCount} siswa aktif menabung</span>
          </div>
        </div>

        {/* Setoran Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Setoran Hari Ini</span>
            <div className="p-2.5 bg-teal-50 text-teal-600 rounded-xl">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-emerald-600 mt-3 tracking-tight">
            +{formatRupiah(summary.todayDeposits)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <CalendarDays className="w-3.5 h-3.5 text-slate-400" />
            <span>Kas masuk hari ini</span>
          </div>
        </div>

        {/* Penarikan Hari Ini */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Penarikan Hari Ini</span>
            <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <p className="text-2xl font-black text-amber-600 mt-3 tracking-tight">
            -{formatRupiah(summary.todayWithdrawals)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Kas keluar hari ini</span>
          </div>
        </div>

        {/* Arus Kas Bersih */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Net Arus Kas Hari Ini</span>
            <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-xl">
              <TrendingUp className="w-5 h-5" />
            </div>
          </div>
          <p className={`text-2xl font-black mt-3 tracking-tight ${summary.todayNet >= 0 ? 'text-indigo-600' : 'text-rose-600'}`}>
            {summary.todayNet >= 0 ? '+' : ''}{formatRupiah(summary.todayNet)}
          </p>
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-2">
            <span>Surplus / Defisit harian</span>
          </div>
        </div>
      </div>

      {/* Middle Section: 7-Day Chart & Class Leaderboard */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Trend Bar Chart */}
        <div className="lg:col-span-2 bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="font-bold text-slate-900 text-base">Aktivitas Kas 7 Hari Terakhir</h2>
              <p className="text-xs text-slate-500">Perbandingan setoran masuk dan penarikan siswa</p>
            </div>
            <div className="flex items-center gap-4 text-xs">
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-emerald-500 inline-block" /> Setoran
              </span>
              <span className="inline-flex items-center gap-1.5 text-slate-600">
                <span className="w-3 h-3 rounded-xs bg-amber-400 inline-block" /> Penarikan
              </span>
            </div>
          </div>

          {/* Bar Chart Visualization */}
          <div className="h-48 flex items-end justify-between gap-3 pt-6 border-b border-slate-100">
            {summary.chartData.map((day, idx) => {
              const depositHeightPercent = Math.min(100, Math.max(8, (day.deposits / maxDayAmount) * 100));
              const withdrawalHeightPercent = Math.min(100, Math.max(day.withdrawals > 0 ? 8 : 0, (day.withdrawals / maxDayAmount) * 100));

              return (
                <div key={idx} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                  {/* Tooltip on hover */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -translate-y-24 bg-slate-800 text-white text-[11px] px-2 py-1.5 rounded-lg shadow-lg pointer-events-none z-10 whitespace-nowrap">
                    <div>Masuk: {formatRupiah(day.deposits)}</div>
                    <div>Keluar: {formatRupiah(day.withdrawals)}</div>
                  </div>

                  {/* Bars */}
                  <div className="w-full flex items-end justify-center gap-1 h-36">
                    {/* Deposit Bar */}
                    <div
                      style={{ height: `${depositHeightPercent}%` }}
                      className="w-1/2 max-w-[20px] bg-emerald-500 hover:bg-emerald-600 rounded-t-md transition-all cursor-pointer"
                    />
                    {/* Withdrawal Bar */}
                    <div
                      style={{ height: `${withdrawalHeightPercent}%` }}
                      className="w-1/2 max-w-[20px] bg-amber-400 hover:bg-amber-500 rounded-t-md transition-all cursor-pointer"
                    />
                  </div>

                  <span className="text-[11px] text-slate-500 font-medium truncate">
                    {day.label}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="flex items-center justify-between pt-3 text-xs text-slate-400">
            <span>Rata-rata setoran harian aktif</span>
            <span className="font-semibold text-slate-700">
              Total Kumulatif Masuk: {formatRupiah(summary.totalDeposits)}
            </span>
          </div>
        </div>

        {/* Class Leaderboard */}
        <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-slate-900 text-base">Saldo per Rombel / Kelas</h2>
              <button
                onClick={() => setActiveTab('students')}
                className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold"
              >
                Lihat Semua
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Akumulasi tabungan siswa berdasarkan kelas</p>

            <div className="space-y-3">
              {summary.classBreakdown.slice(0, 5).map((c, i) => {
                const percentOfTotal = summary.totalBalance > 0
                  ? Math.round((c.balance / summary.totalBalance) * 100)
                  : 0;

                return (
                  <div key={i} className="p-3 rounded-xl bg-slate-50 border border-slate-100 hover:bg-slate-100/70 transition">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 font-bold flex items-center justify-center text-[10px]">
                          {i + 1}
                        </span>
                        <span className="font-bold text-slate-800">{c.className}</span>
                        <span className="text-slate-400">({c.studentCount} siswa)</span>
                      </div>
                      <span className="font-extrabold text-slate-900">{formatRupiah(c.balance)}</span>
                    </div>
                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 rounded-full h-1.5 mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-600 h-1.5 rounded-full transition-all"
                        style={{ width: `${percentOfTotal}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 mt-4 text-xs text-slate-500 flex justify-between">
            <span>Total Rombongan Belajar:</span>
            <span className="font-bold text-slate-800">{summary.totalClassesCount} Kelas</span>
          </div>
        </div>
      </div>

      {/* Recent Transactions Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-bold text-slate-900 text-base">Transaksi Tabungan Terbaru</h2>
            <p className="text-xs text-slate-500">Mutasi setoran dan penarikan yang baru diproses petugas</p>
          </div>
          <button
            onClick={() => setActiveTab('reports')}
            className="text-xs text-emerald-600 hover:text-emerald-700 font-semibold flex items-center gap-1"
          >
            <span>Selengkapnya</span>
            <ArrowUpRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">No. Bukti</th>
                <th className="py-3 px-4">Tanggal & Jam</th>
                <th className="py-3 px-4">Nama Siswa</th>
                <th className="py-3 px-4">Jenis Transaksi</th>
                <th className="py-3 px-4">Kategori / Keterangan</th>
                <th className="py-3 px-4 text-right">Nominal</th>
                <th className="py-3 px-4 text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentTransactions.slice(0, 6).map(trx => {
                const isDeposit = trx.type === 'SETORAN' || trx.type === 'SETORAN_AWAL';
                return (
                  <tr key={trx.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3 px-4 font-mono font-medium text-slate-800">{trx.referenceNo}</td>
                    <td className="py-3 px-4 text-slate-500">{formatDateIndo(trx.timestamp)}</td>
                    <td className="py-3 px-4 font-semibold text-slate-900">{trx.studentName}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          isDeposit
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-amber-50 text-amber-700 border border-amber-200'
                        }`}
                      >
                        {isDeposit ? <ArrowDownLeft className="w-3 h-3" /> : <ArrowUpRight className="w-3 h-3" />}
                        {trx.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">{trx.category}</td>
                    <td className={`py-3 px-4 font-bold text-right ${isDeposit ? 'text-emerald-600' : 'text-amber-600'}`}>
                      {isDeposit ? '+' : '-'} {formatRupiah(trx.amount)}
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => onSelectTransaction(trx)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-[11px] transition"
                        title="Lihat & Cetak Bukti"
                      >
                        <Receipt className="w-3 h-3 text-slate-500" />
                        Struk
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
