import React, { useState } from 'react';
import { ShieldCheck, Search, Filter, History, Eye, CheckCircle2, Lock } from 'lucide-react';
import { AuditLog } from '../../types';
import { formatDateIndo } from '../../lib/formatters';

interface AuditViewProps {
  logs: AuditLog[];
}

export const AuditView: React.FC<AuditViewProps> = ({ logs }) => {
  const [search, setSearch] = useState<string>('');
  const [filterAction, setFilterAction] = useState<string>('ALL');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  const filteredLogs = logs.filter(log => {
    if (filterAction !== 'ALL' && log.action !== filterAction) return false;
    const q = search.toLowerCase();
    return (
      !search ||
      log.actor.toLowerCase().includes(q) ||
      log.action.toLowerCase().includes(q) ||
      log.entity.toLowerCase().includes(q) ||
      log.entityId.toLowerCase().includes(q)
    );
  });

  const getActionBadgeClass = (action: string) => {
    switch (action) {
      case 'SETORAN':
        return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENARIKAN':
        return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'CREATE':
        return 'bg-teal-100 text-teal-800 border-teal-200';
      case 'UPDATE':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE':
        return 'bg-rose-100 text-rose-800 border-rose-200';
      default:
        return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <ShieldCheck className="w-5 h-5" />
            </span>
            Jejak Audit Keamanan (Audit Trail)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Log rekaman seluruh aktivitas mutasi saldo, perubahan data siswa, dan akses sistem yang tidak dapat diubah
          </p>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-900 text-white rounded-xl text-xs font-semibold self-start sm:self-auto">
          <Lock className="w-3.5 h-3.5 text-emerald-400" />
          <span>Immutable Ledger Integrity</span>
        </div>
      </div>

      {/* Filter bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Cari aktor, nomor referensi, atau entitas..."
            className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterAction}
            onChange={e => setFilterAction(e.target.value)}
            className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-slate-700 font-medium"
          >
            <option value="ALL">Semua Aksi</option>
            <option value="SETORAN">Setoran (Kredit)</option>
            <option value="PENARIKAN">Penarikan (Debit)</option>
            <option value="CREATE">Pendaftaran Siswa Baru</option>
            <option value="UPDATE">Pembaruan Data</option>
            <option value="LOGIN_SUCCESS">Login Berhasil</option>
          </select>
        </div>
      </div>

      {/* Audit Log Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Waktu</th>
                <th className="py-3 px-4">Operator / Petugas</th>
                <th className="py-3 px-4">Aksi</th>
                <th className="py-3 px-4">Entitas</th>
                <th className="py-3 px-4">ID Referensi</th>
                <th className="py-3 px-4">Rincian Perubahan</th>
                <th className="py-3 px-4 text-center">Detail</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-400">
                    Tidak ada jejak audit yang ditemukan.
                  </td>
                </tr>
              ) : (
                filteredLogs.map(log => {
                  const detailsPreview = typeof log.details === 'object'
                    ? JSON.stringify(log.details)
                    : String(log.details || '-');

                  return (
                    <tr key={log.id} className="hover:bg-slate-50/80 transition">
                      <td className="py-3 px-4 font-mono text-slate-500 whitespace-nowrap">
                        {formatDateIndo(log.timestamp)}
                      </td>
                      <td className="py-3 px-4 font-bold text-slate-900">{log.actor}</td>
                      <td className="py-3 px-4">
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider ${getActionBadgeClass(
                            log.action
                          )}`}
                        >
                          {log.action}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-slate-600 font-semibold">{log.entity}</td>
                      <td className="py-3 px-4 font-mono text-slate-800">{log.entityId || '-'}</td>
                      <td className="py-3 px-4 text-slate-600 max-w-xs truncate font-mono text-[11px]">
                        {detailsPreview}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <button
                          onClick={() => setSelectedLog(log)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Lihat Payload Lengkap"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Detail JSON Modal */}
      {selectedLog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <History className="w-4 h-4 text-emerald-400" />
                Audit Payload ID: {selectedLog.id}
              </h3>
              <button
                onClick={() => setSelectedLog(null)}
                className="text-slate-400 hover:text-white text-xs font-bold"
              >
                Tutup
              </button>
            </div>
            <div className="p-6 space-y-3 text-xs">
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Waktu:</span>
                <span className="font-semibold text-slate-800">{formatDateIndo(selectedLog.timestamp)}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Operator:</span>
                <span className="font-semibold text-slate-800">{selectedLog.actor}</span>
              </div>
              <div className="flex justify-between border-b pb-2">
                <span className="text-slate-500">Aksi & Entitas:</span>
                <span className="font-semibold text-slate-800">{selectedLog.action} ({selectedLog.entity})</span>
              </div>

              <div>
                <span className="text-slate-500 font-bold block mb-1.5">Data Payload / Jejak Rekaman:</span>
                <pre className="p-3 bg-slate-900 text-emerald-300 rounded-xl overflow-x-auto text-[11px] font-mono leading-relaxed">
                  {JSON.stringify(selectedLog.details, null, 2)}
                </pre>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
