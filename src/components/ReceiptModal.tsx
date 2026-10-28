import React from 'react';
import { Transaction, SchoolSettings } from '../types';
import { formatRupiah, formatDateIndo } from '../lib/formatters';
import { Printer, X, CheckCircle2, ShieldCheck } from 'lucide-react';

interface ReceiptModalProps {
  transaction: Transaction | null;
  settings: SchoolSettings;
  onClose: () => void;
  studentBalance?: number;
}

export const ReceiptModal: React.FC<ReceiptModalProps> = ({
  transaction,
  settings,
  onClose,
  studentBalance
}) => {
  if (!transaction) return null;

  const isDeposit = transaction.type === 'SETORAN' || transaction.type === 'SETORAN_AWAL';

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`p-1.5 rounded-lg ${isDeposit ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'}`}>
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold text-sm">Bukti Transaksi Tabungan</h3>
              <p className="text-xs text-slate-400">Ref: {transaction.referenceNo}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Receipt Paper */}
        <div id="printable-receipt" className="p-6 bg-slate-50/50">
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-xs relative overflow-hidden">
            {/* Watermark badge */}
            <div className="absolute -right-6 -bottom-6 opacity-5 pointer-events-none">
              <ShieldCheck className="w-40 h-40 text-emerald-900" />
            </div>

            {/* School Header */}
            <div className="text-center pb-4 border-b border-dashed border-slate-200">
              <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-600 text-white font-bold text-lg mb-2 shadow-xs">
                ST
              </div>
              <h4 className="font-bold text-slate-900 text-base leading-tight uppercase tracking-wide">
                {settings.schoolName}
              </h4>
              <p className="text-xs text-slate-500 mt-0.5">{settings.address}</p>
              <p className="text-[11px] text-slate-400">Telp: {settings.phone}</p>
              <div className="mt-2 inline-block px-2.5 py-0.5 bg-slate-100 rounded-full text-[11px] font-semibold text-slate-700 uppercase tracking-wider">
                {isDeposit ? 'BUKTI PENERIMAAN SETORAN' : 'BUKTI PENARIKAN TABUNGAN'}
              </div>
            </div>

            {/* Transaction Data */}
            <div className="py-4 space-y-2.5 text-xs border-b border-dashed border-slate-200">
              <div className="flex justify-between">
                <span className="text-slate-500">No. Referensi</span>
                <span className="font-mono font-semibold text-slate-800">{transaction.referenceNo}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Waktu Transaksi</span>
                <span className="text-slate-800">{formatDateIndo(transaction.timestamp)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Nama Siswa</span>
                <span className="font-semibold text-slate-900">{transaction.studentName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Kategori</span>
                <span className="text-slate-800">{transaction.category}</span>
              </div>
              {transaction.notes && (
                <div className="flex justify-between">
                  <span className="text-slate-500">Keterangan</span>
                  <span className="text-slate-700 italic max-w-[200px] text-right">{transaction.notes}</span>
                </div>
              )}
            </div>

            {/* Amount Banner */}
            <div className="py-4 text-center">
              <span className="text-xs uppercase tracking-wider text-slate-500 font-medium">Nominal Transaksi</span>
              <div className={`text-2xl font-extrabold mt-1 ${isDeposit ? 'text-emerald-600' : 'text-amber-600'}`}>
                {isDeposit ? '+' : '-'} {formatRupiah(transaction.amount)}
              </div>
              {studentBalance !== undefined && (
                <p className="text-xs text-slate-500 mt-1">
                  Saldo Terakhir Siswa: <span className="font-bold text-slate-800">{formatRupiah(studentBalance)}</span>
                </p>
              )}
            </div>

            {/* Signature Area */}
            <div className="pt-3 border-t border-dashed border-slate-200 grid grid-cols-2 gap-4 text-center text-[11px]">
              <div>
                <p className="text-slate-500">Siswa / Penyetor</p>
                <div className="h-12 flex items-end justify-center">
                  <span className="font-medium text-slate-700 underline truncate max-w-[130px]">{transaction.studentName}</span>
                </div>
              </div>
              <div>
                <p className="text-slate-500">Petugas Bendahara</p>
                <div className="h-12 flex items-end justify-center">
                  <span className="font-medium text-slate-700 underline">{transaction.officerName || 'Bendahara'}</span>
                </div>
              </div>
            </div>

            <p className="text-[10px] text-center text-slate-400 mt-4">
              Simpan bukti ini sebagai tanda terima tabungan yang sah.
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="bg-slate-100 px-6 py-3.5 flex items-center justify-between gap-3 border-t border-slate-200">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-200 rounded-lg transition"
          >
            Tutup
          </button>
          <button
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-xs transition"
          >
            <Printer className="w-4 h-4" />
            Cetak Struk
          </button>
        </div>
      </div>
    </div>
  );
};
