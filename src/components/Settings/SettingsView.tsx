import React, { useState } from 'react';
import {
  Settings,
  Building2,
  ShieldAlert,
  Save,
  CheckCircle2,
  RefreshCw,
  Users,
  Coins
} from 'lucide-react';
import { SchoolSettings, User } from '../../types';
import { INITIAL_USERS } from '../../lib/mockData';
import { formatRupiah } from '../../lib/formatters';

interface SettingsViewProps {
  settings: SchoolSettings;
  currentUser: User;
  onUpdateSettings: (settings: SchoolSettings) => void;
  onSwitchUser: (user: User) => void;
  onResetData: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  currentUser,
  onUpdateSettings,
  onSwitchUser,
  onResetData
}) => {
  const [formData, setFormData] = useState<SchoolSettings>({ ...settings });
  const [successNotice, setSuccessNotice] = useState<string>('');

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings(formData);
    setSuccessNotice('Pengaturan sekolah berhasil disimpan!');
    setTimeout(() => setSuccessNotice(''), 3000);
  };

  const handleReset = () => {
    if (window.confirm('Apakah Anda yakin ingin mereset seluruh database lokal ke data simulasi awal? Seluruh transaksi baru akan direset.')) {
      onResetData();
      setSuccessNotice('Database berhasil direset ke status awal!');
      setTimeout(() => setSuccessNotice(''), 3000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span className="p-2 bg-slate-100 text-slate-700 rounded-xl">
            <Settings className="w-5 h-5" />
          </span>
          Pengaturan Sekolah & Kebijakan Tabungan
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Kustomisasi profil sekolah pada kop surat/struk bukti, saldo minimum, dan simulasi pergantian akun
        </p>
      </div>

      {successNotice && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Account Switcher Demo */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Users className="w-4 h-4 text-emerald-600" />
              Ganti Akun Operator (Simulasi Peran)
            </h3>
            <p className="text-xs text-slate-500">Pilih akun untuk menguji fitur dengan peran dan nama petugas berbeda</p>
          </div>
          <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
            Aktif: {currentUser.fullName} ({currentUser.role})
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {INITIAL_USERS.map(user => {
            const isCurrent = currentUser.id === user.id;
            return (
              <button
                key={user.id}
                type="button"
                onClick={() => onSwitchUser(user)}
                className={`p-3.5 rounded-xl border text-left transition ${
                  isCurrent
                    ? 'border-emerald-500 bg-emerald-50/60 ring-2 ring-emerald-500/30'
                    : 'border-slate-200 hover:bg-slate-50'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">{user.fullName}</span>
                  {isCurrent && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                </div>
                <div className="flex items-center gap-2 mt-1">
                  <span className="text-[10px] font-mono text-slate-400">@{user.username}</span>
                  <span className="text-[10px] uppercase font-bold text-slate-500">• {user.role}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Settings */}
      <form onSubmit={handleSave} className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-6 text-xs">
        <div>
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
            <Building2 className="w-4 h-4 text-emerald-600" />
            Informasi Instansi Sekolah
          </h3>
          <p className="text-slate-500 text-xs">Data ini dicetak otomatis pada struk kwitansi dan laporan rekap kas</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Nama Sekolah *</label>
            <input
              type="text"
              required
              value={formData.schoolName}
              onChange={e => setFormData({ ...formData, schoolName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block font-bold text-slate-700 mb-1">Slogan / Motto Sekolah</label>
            <input
              type="text"
              value={formData.schoolMotto}
              onChange={e => setFormData({ ...formData, schoolMotto: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Alamat Lengkap *</label>
            <input
              type="text"
              required
              value={formData.address}
              onChange={e => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nomor Telepon / Kontak</label>
            <input
              type="text"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Kepala Sekolah (Penandatangan)</label>
            <input
              type="text"
              value={formData.principalName}
              onChange={e => setFormData({ ...formData, principalName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Nama Bendahara Tabungan</label>
            <input
              type="text"
              value={formData.treasurerName}
              onChange={e => setFormData({ ...formData, treasurerName: e.target.value })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {/* Financial Rules */}
        <div className="pt-4 border-t border-slate-100">
          <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2 mb-1">
            <Coins className="w-4 h-4 text-emerald-600" />
            Kebijakan Rekening & Saldo Tabungan
          </h3>
          <p className="text-slate-500 text-xs mb-3">Ketentuan saldo mengendap untuk proteksi penarikan tabungan</p>

          <div className="max-w-xs">
            <label className="block font-bold text-slate-700 mb-1">Saldo Mengendap Minimum (Rp)</label>
            <input
              type="number"
              step="5000"
              min="0"
              value={formData.minBalance}
              onChange={e => setFormData({ ...formData, minBalance: Number(e.target.value) || 0 })}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Saat ini: {formatRupiah(formData.minBalance)}. Siswa tidak bisa menarik saldo di bawah batas ini kecuali penutupan rekening.
            </p>
          </div>
        </div>

        {/* Submit */}
        <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-rose-700 hover:bg-rose-50 border border-rose-200 font-semibold transition"
          >
            <RefreshCw className="w-4 h-4" />
            Reset Database Simulasi
          </button>

          <button
            type="submit"
            className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs transition"
          >
            <Save className="w-4 h-4" />
            Simpan Pengaturan
          </button>
        </div>
      </form>
    </div>
  );
};
