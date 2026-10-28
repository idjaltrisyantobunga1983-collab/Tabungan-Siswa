import React, { useState } from 'react';
import {
  Code2,
  Copy,
  Check,
  Download,
  Database,
  ExternalLink,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Layers,
  Sparkles,
  RefreshCw,
  FolderTree,
  Terminal
} from 'lucide-react';
import { APPS_SCRIPT_SOURCE_FILES } from '../../lib/appsScriptFiles';
import { SchoolSettings } from '../../types';
import { pingAppsScript } from '../../lib/appsScriptClient';

interface AppsScriptStudioViewProps {
  settings: SchoolSettings;
  onUpdateSettings: (settings: SchoolSettings) => void;
  onTestConnection: (url: string) => Promise<boolean>;
}

export const AppsScriptStudioView: React.FC<AppsScriptStudioViewProps> = ({
  settings,
  onUpdateSettings,
  onTestConnection
}) => {
  const [activeFileName, setActiveFileName] = useState<string>('Code.gs');
  const [copied, setCopied] = useState<boolean>(false);
  const [appsScriptUrlInput, setAppsScriptUrlInput] = useState<string>(settings.appsScriptUrl || '');
  const [isTesting, setIsTesting] = useState<boolean>(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const activeFile = APPS_SCRIPT_SOURCE_FILES.find(f => f.name === activeFileName) || APPS_SCRIPT_SOURCE_FILES[0];

  const handleCopyCode = () => {
    navigator.clipboard.writeText(activeFile.code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadFile = () => {
    const element = document.createElement('a');
    const file = new Blob([activeFile.code], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = activeFile.name;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  const handleRunPingTest = async () => {
    setIsTesting(true);
    setTestResult(null);

    const res = await pingAppsScript(appsScriptUrlInput);
    if (res.success) {
      setTestResult({
        success: true,
        message: res.message || 'Koneksi ke Google Apps Script berhasil!'
      });
      onUpdateSettings({
        ...settings,
        appsScriptUrl: appsScriptUrlInput.trim(),
        syncMode: 'live'
      });
    } else {
      setTestResult({
        success: false,
        message: res.error || 'Gagal terhubung. Pastikan Web App di-deploy dengan akses Siapa Saja (Anyone).'
      });
    }
    setIsTesting(false);
  };

  const sheetsTables = [
    { name: 'USERS', cols: 'id, username, passwordHash, fullName, role, status, createdAt', desc: 'Pengguna, role, password hash' },
    { name: 'CLASSES', cols: 'id, name, grade, homeroomTeacher, academicYear, createdAt', desc: 'Daftar kelas / rombel' },
    { name: 'STUDENTS', cols: 'id, nis, nisn, name, classId, gender, parentPhone, balance, status, createdAt', desc: 'Data master siswa & saldo tabungan' },
    { name: 'TRANSACTIONS', cols: 'id, referenceNo, studentId, studentName, classId, type, amount, category, notes, officerName, timestamp', desc: 'Jurnal setoran masuk (kredit) & mutasi keluar' },
    { name: 'WITHDRAWALS', cols: 'id, referenceNo, studentId, studentName, classId, amount, reason, status, approvedBy, officerName, timestamp', desc: 'Permohonan & persetujuan penarikan saldo' },
    { name: 'AUDIT_LOGS', cols: 'id, timestamp, actor, action, entity, entityId, details', desc: 'Pencatatan jejak audit aktivitas yang tidak dapat diubah' },
    { name: 'SETTINGS', cols: 'key, value, updatedAt', desc: 'Pengaturan sekolah & saldo minimum' }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-teal-100 text-teal-700 rounded-xl">
              <Code2 className="w-5 h-5" />
            </span>
            Google Apps Script & Database Studio
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Lihat, salin kode berkas Apps Script, konfigurasi skema Google Sheets, dan uji koneksi Web App endpoint
          </p>
        </div>

        <div className="flex items-center gap-2">
          <a
            href="https://sheets.new"
            target="_blank"
            rel="noreferrer"
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-xs border border-slate-300 transition"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Buka Google Sheets Baru
          </a>
        </div>
      </div>

      {/* Connection & Live Tester Banner */}
      <div className="bg-slate-900 text-white rounded-2xl p-6 shadow-sm border border-slate-800 space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-400">
              Integrasi Backend Google Sheets
            </span>
            <h3 className="text-base font-bold text-white mt-0.5">
              Hubungkan Frontend dengan Google Apps Script Web App
            </h3>
            <p className="text-xs text-slate-400">
              Setelah mendeploy skrip di Google Sheets, tempelkan URL Web App (akhiran <code className="text-emerald-300 font-mono">/exec</code>) di bawah:
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
              settings.syncMode === 'live' && settings.appsScriptUrl
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
            }`}>
              <span className={`w-2 h-2 rounded-full ${settings.syncMode === 'live' && settings.appsScriptUrl ? 'bg-emerald-400' : 'bg-amber-400'}`} />
              {settings.syncMode === 'live' && settings.appsScriptUrl ? 'Mode Terhubung (Live)' : 'Mode Lokal (Demo Aktif)'}
            </span>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-2 pt-2">
          <div className="relative flex-1">
            <Terminal className="w-4 h-4 text-slate-500 absolute left-3.5 top-3" />
            <input
              type="url"
              value={appsScriptUrlInput}
              onChange={e => setAppsScriptUrlInput(e.target.value)}
              placeholder="https://script.google.com/macros/s/AKfycbx.../exec"
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <button
            onClick={handleRunPingTest}
            disabled={isTesting || !appsScriptUrlInput.trim()}
            className="flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md transition disabled:opacity-50"
          >
            {isTesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
            {isTesting ? 'Menguji...' : 'Uji Koneksi & Simpan'}
          </button>
        </div>

        {testResult && (
          <div className={`p-3 rounded-xl text-xs flex items-center gap-2 ${
            testResult.success
              ? 'bg-emerald-950/80 border border-emerald-600/50 text-emerald-200'
              : 'bg-rose-950/80 border border-rose-600/50 text-rose-200'
          }`}>
            {testResult.success ? <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" /> : <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
            <span>{testResult.message}</span>
          </div>
        )}
      </div>

      {/* Main Apps Script Code Inspector */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left File List */}
        <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <span className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
              <FolderTree className="w-4 h-4 text-emerald-600" />
              Berkas Apps Script
            </span>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-600">
              {APPS_SCRIPT_SOURCE_FILES.length} Files
            </span>
          </div>

          <div className="space-y-1">
            {APPS_SCRIPT_SOURCE_FILES.map(file => {
              const isSelected = file.name === activeFileName;
              return (
                <button
                  key={file.name}
                  onClick={() => setActiveFileName(file.name)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs font-mono flex items-center justify-between transition ${
                    isSelected
                      ? 'bg-emerald-600 text-white font-bold shadow-xs'
                      : 'text-slate-700 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <FileCode className={`w-3.5 h-3.5 ${isSelected ? 'text-white' : 'text-slate-400'}`} />
                    <span className="truncate">{file.name}</span>
                  </div>
                  <span className={`text-[9px] uppercase px-1.5 py-0.5 rounded-xs ${
                    isSelected ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'
                  }`}>
                    {file.category}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Quick Setup Instructions Box */}
          <div className="pt-3 border-t border-slate-100 text-[11px] text-slate-500 space-y-2">
            <p className="font-bold text-slate-700">Cara Pakai di Google Sheets:</p>
            <ol className="list-decimal pl-4 space-y-1">
              <li>Buka Google Sheets &gt; <b>Ekstensi</b> &gt; <b>Apps Script</b>.</li>
              <li>Buat file sesuai nama di atas lalu salin isinya.</li>
              <li>Pilih fungsi <code>setupDatabase</code> lalu klik <b>Run</b>.</li>
              <li>Deploy &gt; New Deployment &gt; Web app (Akses: Anyone).</li>
            </ol>
          </div>
        </div>

        {/* Right Code Viewer */}
        <div className="lg:col-span-3 bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden shadow-sm flex flex-col">
          {/* Code Viewer Header */}
          <div className="bg-slate-950/80 px-5 py-3 border-b border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-rose-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-amber-500 inline-block" />
              <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block" />
              <span className="font-mono font-bold text-slate-200 ml-2">{activeFile.name}</span>
              <span className="text-[11px] text-slate-500 hidden sm:inline">— {activeFile.description}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 font-semibold transition"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Tersalin!' : 'Salin Kode'}</span>
              </button>
              <button
                onClick={handleDownloadFile}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition"
                title="Unduh Berkas Ini"
              >
                <Download className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* Code Body */}
          <div className="p-4 overflow-x-auto max-h-[550px] font-mono text-xs text-emerald-300/90 leading-relaxed scrollbar-thin">
            <pre>{activeFile.code}</pre>
          </div>
        </div>
      </div>

      {/* Database Schema Reference Table */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              Struktur & Skema Tabel Google Sheets (Auto-Generated)
            </h3>
            <p className="text-xs text-slate-500">
              Fungsi <code className="font-mono text-emerald-700 bg-emerald-50 px-1 py-0.5 rounded-xs">setupDatabase()</code> otomatis mengonstruksi 7 sheet tabel berikut beserta kolom header-nya
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-700 border-collapse">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold border-b border-slate-200">
              <tr>
                <th className="py-2.5 px-3">Nama Sheet (Tabel)</th>
                <th className="py-2.5 px-3">Kolom-Kolom Header</th>
                <th className="py-2.5 px-3">Fungsi / Deskripsi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {sheetsTables.map((t, i) => (
                <tr key={i} className="hover:bg-slate-50/70">
                  <td className="py-2.5 px-3 font-mono font-bold text-emerald-700">{t.name}</td>
                  <td className="py-2.5 px-3 font-mono text-[11px] text-slate-600">{t.cols}</td>
                  <td className="py-2.5 px-3 text-slate-600">{t.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
