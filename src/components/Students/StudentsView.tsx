import React, { useState, useRef } from 'react';
import {
  Users,
  Search,
  Plus,
  BookOpen,
  Edit2,
  Phone,
  ArrowDownLeft,
  ArrowUpRight,
  Printer,
  X,
  CreditCard,
  QrCode,
  FileSpreadsheet,
  Download,
  Upload,
  FileText,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Building2,
  FileCheck2,
  HelpCircle,
  Filter,
  GraduationCap,
  Trash2,
  Layers
} from 'lucide-react';
import { Student, ClassItem, Transaction, SchoolSettings, User } from '../../types';
import { formatRupiah, formatDateIndo } from '../../lib/formatters';

interface StudentsViewProps {
  students: Student[];
  classes: ClassItem[];
  transactions: Transaction[];
  settings: SchoolSettings;
  currentUser: User;
  onRefresh: () => void;
  onQuickDeposit: (student: Student) => void;
  onQuickWithdrawal: (student: Student) => void;
}

type SubTab = 'list' | 'classes' | 'exportImport' | 'printReceipts';

export const StudentsView: React.FC<StudentsViewProps> = ({
  students,
  classes,
  transactions,
  settings,
  currentUser,
  onRefresh,
  onQuickDeposit,
  onQuickWithdrawal
}) => {
  const [activeSubTab, setActiveSubTab] = useState<SubTab>('list');

  // Search & Filter state for List
  const [search, setSearch] = useState<string>('');
  const [selectedClassId, setSelectedClassId] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');

  // Modals state
  const [showAddModal, setShowAddModal] = useState<boolean>(false);
  const [showEditModal, setShowEditModal] = useState<boolean>(false);
  const [showPassbookModal, setShowPassbookModal] = useState<boolean>(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  // Form state
  const [formData, setFormData] = useState({
    nis: '',
    nisn: '',
    name: '',
    classId: classes[0]?.id || '',
    gender: 'L' as 'L' | 'P',
    parentPhone: '',
    initialBalance: 0
  });

  // Class management state (Input Kelas & Kuota Siswa)
  const [showAddClassModal, setShowAddClassModal] = useState<boolean>(false);
  const [showEditClassModal, setShowEditClassModal] = useState<boolean>(false);
  const [selectedClassForEdit, setSelectedClassForEdit] = useState<ClassItem | null>(null);
  const [classFormData, setClassFormData] = useState({
    name: '',
    grade: 'X',
    homeroomTeacher: '',
    academicYear: '2026/2027',
    capacity: 36
  });
  const [classNotice, setClassNotice] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  // Export / Import state
  const [exportClassFilter, setExportClassFilter] = useState<string>('ALL');
  const [importText, setImportText] = useState<string>('');
  const [importClassId, setImportClassId] = useState<string>(classes[0]?.id || '');
  const [parsedImportRows, setParsedImportRows] = useState<Array<{
    nis: string;
    nisn: string;
    name: string;
    gender: 'L' | 'P';
    parentPhone: string;
    initialBalance: number;
    isValid: boolean;
    error?: string;
  }>>([]);
  const [importNotification, setImportNotification] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Print Proof of Deposit (Cetak Bukti Setor) State
  const [printMode, setPrintMode] = useState<'student' | 'class'>('student');
  const [printStudentId, setPrintStudentId] = useState<string>(students[0]?.id || '');
  const [printClassId, setPrintClassId] = useState<string>(classes[0]?.id || '');
  const [printStartDate, setPrintStartDate] = useState<string>('');
  const [printEndDate, setPrintEndDate] = useState<string>('');

  // Filtering for students list
  const filteredStudents = students.filter(s => {
    const matchClass = selectedClassId === 'ALL' || s.classId === selectedClassId;
    const matchStatus = selectedStatus === 'ALL' || s.status === selectedStatus;
    const q = search.toLowerCase();
    const matchSearch =
      !search ||
      s.name.toLowerCase().includes(q) ||
      s.nis.toLowerCase().includes(q) ||
      s.nisn.toLowerCase().includes(q);
    return matchClass && matchStatus && matchSearch;
  });

  const totalFilteredBalance = filteredStudents.reduce((acc, s) => acc + (s.balance || 0), 0);

  // Handlers for Add/Edit
  const handleOpenAddModal = () => {
    setFormData({
      nis: String(Math.floor(26000 + students.length + 1)),
      nisn: '00' + Math.floor(10000000 + Math.random() * 90000000),
      name: '',
      classId: classes[0]?.id || '',
      gender: 'L',
      parentPhone: '08',
      initialBalance: 20000
    });
    setShowAddModal(true);
  };

  const handleOpenEditModal = (student: Student) => {
    setSelectedStudent(student);
    setFormData({
      nis: student.nis,
      nisn: student.nisn || '',
      name: student.name,
      classId: student.classId,
      gender: student.gender,
      parentPhone: student.parentPhone || '',
      initialBalance: 0
    });
    setShowEditModal(true);
  };

  const handleOpenPassbook = (student: Student) => {
    setSelectedStudent(student);
    setShowPassbookModal(true);
  };

  const handleOpenPrintStudentDeposit = (student: Student) => {
    setPrintStudentId(student.id);
    setPrintMode('student');
    setActiveSubTab('printReceipts');
  };

  const handleSaveNewStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.nis) return;

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const all = SchoolDataStore.getStudents();
      const targetClass = classes.find(c => c.id === formData.classId);

      const newId = `STD-${Date.now()}`;
      const newStudent: Student = {
        id: newId,
        nis: formData.nis,
        nisn: formData.nisn,
        name: formData.name,
        classId: formData.classId,
        className: targetClass ? targetClass.name : 'Kelas',
        gender: formData.gender,
        parentPhone: formData.parentPhone,
        balance: formData.initialBalance || 0,
        status: 'ACTIVE',
        createdAt: new Date().toISOString().replace('T', ' ').substring(0, 19)
      };

      all.unshift(newStudent);
      SchoolDataStore.saveStudents(all);

      if (formData.initialBalance > 0) {
        SchoolDataStore.recordDeposit(
          newId,
          formData.initialBalance,
          'Saldo Awal Pembukaan',
          'Setoran awal pendaftaran rekening tabungan siswa',
          currentUser.fullName
        );
      } else {
        SchoolDataStore.logAudit(currentUser.fullName, 'CREATE', 'STUDENT', newId, { name: newStudent.name });
        SchoolDataStore.recalculateClassBalances();
      }

      setShowAddModal(false);
      onRefresh();
    });
  };

  const handleSaveEditStudent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudent) return;

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const all = SchoolDataStore.getStudents();
      const idx = all.findIndex(s => s.id === selectedStudent.id);
      if (idx !== -1) {
        const targetClass = classes.find(c => c.id === formData.classId);
        all[idx] = {
          ...all[idx],
          nis: formData.nis,
          nisn: formData.nisn,
          name: formData.name,
          classId: formData.classId,
          className: targetClass ? targetClass.name : all[idx].className,
          gender: formData.gender,
          parentPhone: formData.parentPhone
        };
        SchoolDataStore.saveStudents(all);
        SchoolDataStore.logAudit(currentUser.fullName, 'UPDATE', 'STUDENT', selectedStudent.id, { name: formData.name });
        SchoolDataStore.recalculateClassBalances();
      }
      setShowEditModal(false);
      onRefresh();
    });
  };

  // --- CLASS MANAGEMENT HANDLERS ---
  const handleOpenAddClassModal = () => {
    setClassFormData({
      name: '',
      grade: 'X',
      homeroomTeacher: '',
      academicYear: '2026/2027',
      capacity: 36
    });
    setShowAddClassModal(true);
  };

  const handleOpenEditClassModal = (cls: ClassItem) => {
    setSelectedClassForEdit(cls);
    setClassFormData({
      name: cls.name,
      grade: cls.grade || 'X',
      homeroomTeacher: cls.homeroomTeacher || '',
      academicYear: cls.academicYear || '2026/2027',
      capacity: cls.capacity || 36
    });
    setShowEditClassModal(true);
  };

  const handleSaveNewClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!classFormData.name) return;

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const res = SchoolDataStore.createClass(classFormData, currentUser.fullName);
      if (res.success) {
        setClassNotice({
          type: 'success',
          message: `Kelas ${classFormData.name} (target/kuota: ${classFormData.capacity} siswa) berhasil disimpan!`
        });
        setShowAddClassModal(false);
        onRefresh();
      } else {
        setClassNotice({
          type: 'error',
          message: res.error || 'Gagal menambahkan kelas.'
        });
      }
    });
  };

  const handleSaveEditClass = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedClassForEdit || !classFormData.name) return;

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const res = SchoolDataStore.updateClass(selectedClassForEdit.id, classFormData, currentUser.fullName);
      if (res.success) {
        setClassNotice({
          type: 'success',
          message: `Data kelas ${classFormData.name} berhasil diperbarui!`
        });
        setShowEditClassModal(false);
        onRefresh();
      } else {
        setClassNotice({
          type: 'error',
          message: res.error || 'Gagal memperbarui kelas.'
        });
      }
    });
  };

  const handleDeleteClass = (cls: ClassItem) => {
    if (!window.confirm(`Hapus rombel ${cls.name}? Pastikan tidak ada siswa terdaftar di kelas ini.`)) return;

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const res = SchoolDataStore.deleteClass(cls.id, currentUser.fullName);
      if (res.success) {
        setClassNotice({
          type: 'success',
          message: `Kelas ${cls.name} berhasil dihapus.`
        });
        onRefresh();
      } else {
        setClassNotice({
          type: 'error',
          message: res.error || 'Gagal menghapus kelas.'
        });
      }
    });
  };

  // --- EXPORT FUNCTIONALITY ---
  const handleExportStudentsCSV = () => {
    const listToExport = exportClassFilter === 'ALL'
      ? students
      : students.filter(s => s.classId === exportClassFilter);

    if (listToExport.length === 0) {
      alert('Tidak ada data siswa untuk diekspor.');
      return;
    }

    const headers = ['ID', 'NIS', 'NISN', 'Nama Siswa', 'Kelas', 'Jenis Kelamin', 'No HP Ortu', 'Saldo Tabungan', 'Status', 'Tanggal Terdaftar'];
    const rows = listToExport.map(s => [
      `"${s.id}"`,
      `"${s.nis}"`,
      `"${s.nisn || ''}"`,
      `"${s.name}"`,
      `"${s.className || ''}"`,
      `"${s.gender}"`,
      `"${s.parentPhone || ''}"`,
      s.balance || 0,
      `"${s.status}"`,
      `"${s.createdAt || ''}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    const targetClassName = classes.find(c => c.id === exportClassFilter)?.name || 'Semua-Kelas';
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Data-Siswa-${targetClassName}-${new Date().toISOString().substring(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- IMPORT FUNCTIONALITY ---
  const handleDownloadTemplateCSV = () => {
    const templateContent = 'data:text/csv;charset=utf-8,\uFEFF' + [
      'nis,nisn,name,gender,parentPhone,initialBalance',
      '26101,0091234501,Aditya Pratama,L,081234567890,50000',
      '26102,0091234502,Bunga Cantika Putri,P,081298765432,30000',
      '26103,0091234503,Citra Kirana,P,085711223344,20000',
      '26104,0091234504,Danu Wijaya,L,081377889900,10000'
    ].join('\n');

    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(templateContent));
    link.setAttribute('download', 'template_import_siswa.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const parseCSVLines = (rawText: string) => {
    const lines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);
    if (lines.length === 0) {
      setParsedImportRows([]);
      return;
    }

    // Determine if first row is header
    const firstLineLower = lines[0].toLowerCase();
    const hasHeader = firstLineLower.includes('nis') || firstLineLower.includes('name') || firstLineLower.includes('nama');
    const dataLines = hasHeader ? lines.slice(1) : lines;

    const existingNisSet = new Set(students.map(s => s.nis.trim()));
    const batchNisSet = new Set<string>();

    const parsed = dataLines.map((line, idx) => {
      // Split by comma or semicolon
      const separator = line.includes(';') ? ';' : ',';
      const cols = line.split(separator).map(c => c.replace(/^["']|["']$/g, '').trim());

      const nis = cols[0] || '';
      const nisn = cols[1] || '';
      const name = cols[2] || '';
      const gender = (cols[3]?.toUpperCase().startsWith('P') ? 'P' : 'L') as 'L' | 'P';
      const parentPhone = cols[4] || '';
      const initialBalance = Number(cols[5]) || 0;

      let isValid = true;
      let error = '';

      if (!nis || !name) {
        isValid = false;
        error = 'NIS dan Nama wajib diisi';
      } else if (existingNisSet.has(nis)) {
        isValid = false;
        error = `NIS ${nis} sudah terdaftar di database`;
      } else if (batchNisSet.has(nis)) {
        isValid = false;
        error = `Duplikat NIS ${nis} dalam berkas import`;
      } else {
        batchNisSet.add(nis);
      }

      return {
        nis,
        nisn,
        name,
        gender,
        parentPhone,
        initialBalance,
        isValid,
        error
      };
    });

    setParsedImportRows(parsed);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = event => {
      const text = event.target?.result as string;
      setImportText(text);
      parseCSVLines(text);
    };
    reader.readAsText(file);
  };

  const handleProcessImport = () => {
    const validRows = parsedImportRows.filter(r => r.isValid);
    if (validRows.length === 0) {
      setImportNotification({
        type: 'error',
        message: 'Tidak ada baris data valid yang dapat diimpor.'
      });
      return;
    }

    import('../../lib/storage').then(({ SchoolDataStore }) => {
      const targetClass = classes.find(c => c.id === importClassId);
      const payload = validRows.map(r => ({
        nis: r.nis,
        nisn: r.nisn,
        name: r.name,
        classId: importClassId,
        className: targetClass ? targetClass.name : 'Kelas',
        gender: r.gender,
        parentPhone: r.parentPhone,
        initialBalance: r.initialBalance
      }));

      const res = SchoolDataStore.batchImportStudents(payload, currentUser.fullName);
      if (res.success) {
        setImportNotification({
          type: 'success',
          message: `Berhasil mengimpor ${res.importedCount} siswa baru ke kelas ${targetClass?.name || ''}!`
        });
        setImportText('');
        setParsedImportRows([]);
        if (fileInputRef.current) fileInputRef.current.value = '';
        onRefresh();
      } else {
        setImportNotification({
          type: 'error',
          message: 'Gagal mengimpor data siswa.'
        });
      }
    });
  };

  // --- PRINT PROOF OF DEPOSIT DATA PREPARATION ---
  // Student Specific
  const targetStudentForPrint = students.find(s => s.id === printStudentId) || students[0];
  const targetStudentDeposits = targetStudentForPrint
    ? transactions.filter(t => {
        const isDep = t.studentId === targetStudentForPrint.id && (t.type === 'SETORAN' || t.type === 'SETORAN_AWAL');
        if (!isDep) return false;
        if (printStartDate && t.timestamp.substring(0, 10) < printStartDate) return false;
        if (printEndDate && t.timestamp.substring(0, 10) > printEndDate) return false;
        return true;
      })
    : [];
  const totalStudentDepositSum = targetStudentDeposits.reduce((acc, t) => acc + t.amount, 0);

  // Class Specific
  const targetClassForPrint = classes.find(c => c.id === printClassId) || classes[0];
  const targetClassStudents = targetClassForPrint
    ? students.filter(s => s.classId === targetClassForPrint.id)
    : [];

  const classStudentDepositSummaries = targetClassStudents.map(student => {
    const studentDeps = transactions.filter(t => {
      const match = t.studentId === student.id && (t.type === 'SETORAN' || t.type === 'SETORAN_AWAL');
      if (!match) return false;
      if (printStartDate && t.timestamp.substring(0, 10) < printStartDate) return false;
      if (printEndDate && t.timestamp.substring(0, 10) > printEndDate) return false;
      return true;
    });

    const sumDeposits = studentDeps.reduce((sum, t) => sum + t.amount, 0);
    return {
      student,
      depositCount: studentDeps.length,
      totalDeposit: sumDeposits,
      currentBalance: student.balance
    };
  });

  const grandTotalClassDeposits = classStudentDepositSummaries.reduce((sum, item) => sum + item.totalDeposit, 0);
  const grandTotalClassBalance = classStudentDepositSummaries.reduce((sum, item) => sum + item.currentBalance, 0);

  // Print trigger
  const handlePrintDocument = () => {
    window.print();
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <span className="p-2 bg-emerald-100 text-emerald-700 rounded-xl">
              <Users className="w-5 h-5" />
            </span>
            Data Siswa & Layanan Pembukuan
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Manajemen direktori nasabah siswa, impor/ekspor data massal, dan cetak bukti setor per siswa maupun per kelas
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition"
          >
            <Plus className="w-4 h-4" />
            Tambah Siswa
          </button>
        </div>
      </div>

      {/* Sub Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveSubTab('list')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'list'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Direktori Siswa</span>
        </button>

        <button
          onClick={() => setActiveSubTab('classes')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'classes'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <GraduationCap className="w-4 h-4 text-emerald-300" />
          <span>Input Kelas & Kuota Siswa</span>
        </button>

        <button
          onClick={() => setActiveSubTab('exportImport')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'exportImport'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4 text-teal-300" />
          <span>Export & Import Data Siswa</span>
        </button>

        <button
          onClick={() => setActiveSubTab('printReceipts')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition ${
            activeSubTab === 'printReceipts'
              ? 'bg-emerald-600 text-white shadow-xs'
              : 'text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Printer className="w-4 h-4 text-amber-300" />
          <span>Cetak Bukti Setor (Siswa & Kelas)</span>
        </button>
      </div>

      {/* ============================================================== */}
      {/* TAB 1: DIREKTORI SISWA */}
      {/* ============================================================== */}
      {activeSubTab === 'list' && (
        <div className="space-y-4">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Cari siswa berdasarkan nama, NIS, atau NISN..."
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Class Filter */}
              <select
                value={selectedClassId}
                onChange={e => setSelectedClassId(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Kelas / Rombel</option>
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>

              {/* Status Filter */}
              <select
                value={selectedStatus}
                onChange={e => setSelectedStatus(e.target.value)}
                className="px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 text-xs bg-white text-slate-700 font-medium"
              >
                <option value="ALL">Semua Status</option>
                <option value="ACTIVE">Aktif</option>
                <option value="GRADUATED">Lulus</option>
                <option value="TRANSFERRED">Pindah</option>
              </select>

              {/* Filter summary badge */}
              <div className="px-3 py-2 bg-emerald-50 text-emerald-800 rounded-xl font-bold border border-emerald-100 whitespace-nowrap">
                Total: {filteredStudents.length} Siswa ({formatRupiah(totalFilteredBalance)})
              </div>
            </div>
          </div>

          {/* Students Table */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200 uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">NIS / NISN</th>
                    <th className="py-3 px-4">Nama Lengkap</th>
                    <th className="py-3 px-4">Kelas</th>
                    <th className="py-3 px-4">L/P</th>
                    <th className="py-3 px-4">No. HP Wali Murid</th>
                    <th className="py-3 px-4 text-right">Saldo Tabungan</th>
                    <th className="py-3 px-4 text-center">Status</th>
                    <th className="py-3 px-4 text-center">Aksi & Layanan</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredStudents.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        Tidak ada data siswa yang memenuhi kriteria pencarian.
                      </td>
                    </tr>
                  ) : (
                    filteredStudents.map(student => (
                      <tr key={student.id} className="hover:bg-slate-50/80 transition">
                        <td className="py-3 px-4 font-mono">
                          <span className="font-bold text-slate-900">{student.nis}</span>
                          <span className="block text-[10px] text-slate-400">{student.nisn || '-'}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-900 block">{student.name}</span>
                          <span className="text-[10px] text-slate-400">ID: {student.id}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-md bg-slate-100 font-semibold text-slate-700">
                            {student.className || 'Kelas'}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-semibold text-slate-600">
                          {student.gender === 'L' ? 'Laki-laki' : 'Perempuan'}
                        </td>
                        <td className="py-3 px-4 text-slate-600">
                          {student.parentPhone ? (
                            <span className="inline-flex items-center gap-1">
                              <Phone className="w-3 h-3 text-slate-400" />
                              {student.parentPhone}
                            </span>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className="font-extrabold text-emerald-600 text-sm">
                            {formatRupiah(student.balance)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            {student.status}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              onClick={() => handleOpenPassbook(student)}
                              className="p-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-700 transition"
                              title="Buka Buku Tabungan & Mutasi"
                            >
                              <BookOpen className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenPrintStudentDeposit(student)}
                              className="p-1.5 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-700 transition"
                              title="Cetak Bukti Rekap Setoran Siswa"
                            >
                              <Printer className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleOpenEditModal(student)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                              title="Ubah Profil Siswa"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB: INPUT KELAS & KUOTA SISWA */}
      {/* ============================================================== */}
      {activeSubTab === 'classes' && (
        <div className="space-y-6">
          {classNotice && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
                classNotice.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {classNotice.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{classNotice.message}</span>
              </div>
              <button
                onClick={() => setClassNotice(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Top Bar for Classes */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <GraduationCap className="w-5 h-5 text-emerald-600" />
                Daftar Rombongan Belajar & Kuota Jumlah Siswa
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Input rombel baru, atur wali kelas, tetapkan target kapasitas jumlah siswa, dan pantau saldo kelas
              </p>
            </div>

            <button
              onClick={handleOpenAddClassModal}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              Input Kelas Baru
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Kelas</span>
              <p className="text-2xl font-black text-slate-900 mt-1">{classes.length} Rombel</p>
              <span className="text-[11px] text-slate-500">Kelas terdaftar</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Siswa Terdaftar</span>
              <p className="text-2xl font-black text-emerald-700 mt-1">{students.length} Siswa</p>
              <span className="text-[11px] text-slate-500">Nasabah tabungan aktif</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Target Total Kuota</span>
              <p className="text-2xl font-black text-teal-700 mt-1">
                {classes.reduce((sum, c) => sum + (c.capacity || 36), 0)} Siswa
              </p>
              <span className="text-[11px] text-slate-500">Kapasitas seluruh rombel</span>
            </div>
            <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs">
              <span className="text-[11px] font-bold text-slate-400 uppercase">Total Tabungan Semua Kelas</span>
              <p className="text-2xl font-black text-emerald-600 mt-1">
                {formatRupiah(classes.reduce((sum, c) => sum + (c.totalBalance || 0), 0))}
              </p>
              <span className="text-[11px] text-slate-500">Akumulasi saldo kas</span>
            </div>
          </div>

          {/* Classes Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {classes.map(cls => {
              const cap = cls.capacity || 36;
              const count = cls.studentCount || 0;
              const percent = Math.min(100, Math.round((count / cap) * 100));
              const remainingQuota = Math.max(0, cap - count);

              return (
                <div
                  key={cls.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs hover:border-emerald-300 transition space-y-4"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-black text-lg text-slate-900">{cls.name}</h4>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Tingkat {cls.grade}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-1">
                        Wali Kelas: <span className="font-semibold text-slate-700">{cls.homeroomTeacher || '-'}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">Tahun Ajaran: {cls.academicYear}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-[11px] text-slate-400">Saldo Tabungan Kelas</span>
                      <p className="font-black text-emerald-700 text-base">{formatRupiah(cls.totalBalance || 0)}</p>
                    </div>
                  </div>

                  {/* Quota Progress */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-center">
                      <span className="text-slate-600 font-medium">Jumlah Siswa / Kuota Target:</span>
                      <span className="font-bold text-slate-900 font-mono">
                        {count} / {cap} Siswa ({percent}%)
                      </span>
                    </div>

                    <div className="w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          percent >= 100 ? 'bg-amber-500' : 'bg-emerald-600'
                        }`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>

                    <div className="flex justify-between text-[11px] text-slate-400 pt-0.5">
                      <span>{remainingQuota} kursi tersedia</span>
                      <span>Target: {cap} siswa/kelas</span>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setPrintClassId(cls.id);
                        setPrintMode('class');
                        setActiveSubTab('printReceipts');
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 hover:bg-teal-100 text-teal-800 text-xs font-semibold transition"
                      title="Cetak Bukti Setoran Kolektif Kelas"
                    >
                      <Printer className="w-3.5 h-3.5" />
                      <span>Cetak Rekap Setor</span>
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => handleOpenEditClassModal(cls)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                        <span>Ubah Kuota / Data</span>
                      </button>
                      <button
                        onClick={() => handleDeleteClass(cls)}
                        disabled={count > 0}
                        className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50 disabled:opacity-30 disabled:hover:bg-transparent transition"
                        title={count > 0 ? 'Tidak bisa dihapus karena masih ada siswa' : 'Hapus Kelas'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 2: EXPORT & IMPORT DATA SISWA */}
      {/* ============================================================== */}
      {activeSubTab === 'exportImport' && (
        <div className="space-y-6">
          {importNotification && (
            <div
              className={`p-4 rounded-2xl text-xs flex items-center justify-between border ${
                importNotification.type === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : 'bg-rose-50 border-rose-200 text-rose-800'
              }`}
            >
              <div className="flex items-center gap-2">
                {importNotification.type === 'success' ? (
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
                )}
                <span className="font-medium">{importNotification.message}</span>
              </div>
              <button
                onClick={() => setImportNotification(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* EXPORT CARD */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Download className="w-4 h-4 text-emerald-600" />
                    Ekspor Data Siswa ke CSV / Excel
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unduh data seluruh nasabah siswa atau filter per rombongan belajar
                  </p>
                </div>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Rombel / Kelas yang Diekspor</label>
                  <select
                    value={exportClassFilter}
                    onChange={e => setExportClassFilter(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="ALL">Semua Kelas ({students.length} Siswa)</option>
                    {classes.map(c => {
                      const count = students.filter(s => s.classId === c.id).length;
                      return (
                        <option key={c.id} value={c.id}>
                          {c.name} ({count} Siswa)
                        </option>
                      );
                    })}
                  </select>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 space-y-1.5">
                  <p className="font-bold text-slate-800">Kolom Data yang Disertakan:</p>
                  <p className="text-[11px] text-slate-500 leading-relaxed font-mono">
                    ID, NIS, NISN, Nama Siswa, Kelas, L/P, No HP Wali Murid, Saldo Tabungan, Status, Tanggal Registrasi
                  </p>
                </div>

                <button
                  onClick={handleExportStudentsCSV}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-xs transition"
                >
                  <Download className="w-4 h-4" />
                  Unduh Berkas Data Siswa (.CSV)
                </button>
              </div>
            </div>

            {/* IMPORT CARD */}
            <div className="bg-white rounded-2xl p-6 border border-slate-200 shadow-xs space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                <div>
                  <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
                    <Upload className="w-4 h-4 text-teal-600" />
                    Impor Data Siswa Massal
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Unggah file CSV atau salin-tempel baris data siswa
                  </p>
                </div>

                <button
                  type="button"
                  onClick={handleDownloadTemplateCSV}
                  className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
                  title="Unduh format file CSV standar"
                >
                  <FileText className="w-3.5 h-3.5 text-slate-500" />
                  Unduh Template CSV
                </button>
              </div>

              <div className="space-y-3 text-xs">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Kelas untuk Siswa yang Diimpor</label>
                  <select
                    value={importClassId}
                    onChange={e => setImportClassId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih File CSV (.csv)</label>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv,text/csv,text/plain"
                    onChange={handleFileUpload}
                    className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-teal-50 file:text-teal-700 hover:file:bg-teal-100"
                  />
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Atau Tempel Baris CSV / Teks di Sini</label>
                  <textarea
                    rows={3}
                    value={importText}
                    onChange={e => {
                      setImportText(e.target.value);
                      parseCSVLines(e.target.value);
                    }}
                    placeholder="nis,nisn,name,gender,parentPhone,initialBalance&#10;26101,0091234501,Aditya Pratama,L,081234567890,50000"
                    className="w-full p-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono text-xs"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* PARSED IMPORT PREVIEW TABLE */}
          {parsedImportRows.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">
                    Pratinjau Data Impor ({parsedImportRows.length} Baris Terdeteksi)
                  </h4>
                  <p className="text-xs text-slate-500">
                    {parsedImportRows.filter(r => r.isValid).length} baris siap diimpor, {parsedImportRows.filter(r => !r.isValid).length} baris bermasalah/duplikat
                  </p>
                </div>

                <button
                  onClick={handleProcessImport}
                  disabled={parsedImportRows.filter(r => r.isValid).length === 0}
                  className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs transition disabled:opacity-50"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Konfirmasi & Simpan {parsedImportRows.filter(r => r.isValid).length} Siswa
                </button>
              </div>

              <div className="overflow-x-auto border border-slate-200 rounded-xl max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3">NIS</th>
                      <th className="py-2.5 px-3">NISN</th>
                      <th className="py-2.5 px-3">Nama Lengkap</th>
                      <th className="py-2.5 px-3">L/P</th>
                      <th className="py-2.5 px-3">No HP Wali</th>
                      <th className="py-2.5 px-3 text-right">Setoran Awal</th>
                      <th className="py-2.5 px-3">Catatan / Validasi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {parsedImportRows.map((r, i) => (
                      <tr key={i} className={r.isValid ? 'hover:bg-slate-50' : 'bg-rose-50/50'}>
                        <td className="py-2 px-3">
                          {r.isValid ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                              Valid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-700 bg-rose-100 px-2 py-0.5 rounded-full">
                              Gagal
                            </span>
                          )}
                        </td>
                        <td className="py-2 px-3 font-mono font-bold">{r.nis || '-'}</td>
                        <td className="py-2 px-3 font-mono text-slate-500">{r.nisn || '-'}</td>
                        <td className="py-2 px-3 font-semibold text-slate-900">{r.name || '-'}</td>
                        <td className="py-2 px-3">{r.gender}</td>
                        <td className="py-2 px-3 text-slate-600">{r.parentPhone || '-'}</td>
                        <td className="py-2 px-3 text-right font-bold text-emerald-600">
                          {formatRupiah(r.initialBalance)}
                        </td>
                        <td className="py-2 px-3 text-[11px] text-rose-600 font-medium">{r.error || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* TAB 3: CETAK BUKTI SETOR (PER SISWA & PER KELAS) */}
      {/* ============================================================== */}
      {activeSubTab === 'printReceipts' && (
        <div className="space-y-6">
          {/* Controls Bar */}
          <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-xs space-y-4 print:hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                  <Printer className="w-4 h-4 text-emerald-600" />
                  Konfigurasi Dokumen Cetak Bukti Setoran
                </h3>
                <p className="text-xs text-slate-500">Pilih jenis cetak: individual per siswa atau kolektif rekap per rombel kelas</p>
              </div>

              {/* Mode switch */}
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
                <button
                  onClick={() => setPrintMode('student')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    printMode === 'student' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cetak Per Siswa
                </button>
                <button
                  onClick={() => setPrintMode('class')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                    printMode === 'class' ? 'bg-white text-emerald-800 shadow-xs' : 'text-slate-600'
                  }`}
                >
                  Cetak Kolektif Per Kelas
                </button>
              </div>
            </div>

            {/* Selectors depending on mode */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              {printMode === 'student' ? (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Siswa</label>
                  <select
                    value={printStudentId}
                    onChange={e => setPrintStudentId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {students.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.nis} - {s.className})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Pilih Rombel / Kelas</label>
                  <select
                    value={printClassId}
                    onChange={e => setPrintClassId(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.studentCount || 0} Siswa)
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block font-bold text-slate-700 mb-1">Dari Tanggal (Opsional)</label>
                <input
                  type="date"
                  value={printStartDate}
                  onChange={e => setPrintStartDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Sampai Tanggal (Opsional)</label>
                <input
                  type="date"
                  value={printEndDate}
                  onChange={e => setPrintEndDate(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div className="flex items-center justify-between pt-2 border-t border-slate-100">
              <span className="text-[11px] text-slate-500">
                Dokumen resmi telah diformat siap cetak pada ukuran kertas standar (A4).
              </span>

              <button
                onClick={handlePrintDocument}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md transition"
              >
                <Printer className="w-4 h-4" />
                {printMode === 'student' ? 'Cetak Bukti Setoran Siswa' : 'Cetak Rekap Setoran Kelas'}
              </button>
            </div>
          </div>

          {/* ========================================================= */}
          {/* PRINT DOCUMENT PREVIEW: PER SISWA */}
          {/* ========================================================= */}
          {printMode === 'student' && targetStudentForPrint && (
            <div id="printable-student-deposit" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
              {/* Formal School Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-900 relative">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-700 text-white font-black text-xl flex items-center justify-center shadow-xs">
                    ST
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase text-slate-900 tracking-wider">
                      {settings.schoolName}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                      UNIT PENGELOLA TABUNGAN & KAS SISWA
                    </p>
                    <p className="text-[11px] text-slate-500">{settings.address} • Telp: {settings.phone}</p>
                  </div>
                </div>
              </div>

              {/* Title Document */}
              <div className="text-center py-1">
                <span className="inline-block px-4 py-1 rounded-full bg-slate-100 font-bold text-slate-800 text-xs uppercase tracking-wider border border-slate-300">
                  SURAT BUKTI SETORAN TABUNGAN SISWA
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Periode: {printStartDate ? formatDateIndo(printStartDate, false) : 'Awal Pembukaan'} s/d {printEndDate ? formatDateIndo(printEndDate, false) : 'Saat Ini'}
                </p>
              </div>

              {/* Student Biodata Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Nama Lengkap Siswa:</span>
                  <span className="font-bold text-slate-900 text-sm">{targetStudentForPrint.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Nomor Induk Siswa (NIS):</span>
                  <span className="font-mono font-bold text-slate-900">{targetStudentForPrint.nis}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Rombel / Kelas:</span>
                  <span className="font-bold text-slate-800">{targetStudentForPrint.className}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Saldo Tabungan Saat Ini:</span>
                  <span className="font-extrabold text-emerald-700 text-sm">
                    {formatRupiah(targetStudentForPrint.balance)}
                  </span>
                </div>
              </div>

              {/* Deposit Entries Table */}
              <div>
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-600 mb-2">
                  Daftar Transaksi Setoran yang Diterima
                </h5>
                <div className="border border-slate-300 rounded-xl overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                        <th className="py-2.5 px-3">No.</th>
                        <th className="py-2.5 px-3">No. Bukti / Ref</th>
                        <th className="py-2.5 px-3">Tanggal & Jam</th>
                        <th className="py-2.5 px-3">Kategori Setoran</th>
                        <th className="py-2.5 px-3">Petugas Penerima</th>
                        <th className="py-2.5 px-3 text-right">Nominal Setoran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {targetStudentDeposits.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-6 text-center text-slate-400">
                            Belum ada riwayat transaksi setoran pada periode ini.
                          </td>
                        </tr>
                      ) : (
                        targetStudentDeposits.map((trx, idx) => (
                          <tr key={trx.id} className="hover:bg-slate-50">
                            <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                            <td className="py-2 px-3 font-mono font-semibold text-slate-800">{trx.referenceNo}</td>
                            <td className="py-2 px-3 text-slate-600">{formatDateIndo(trx.timestamp)}</td>
                            <td className="py-2 px-3 font-medium text-slate-700">{trx.category}</td>
                            <td className="py-2 px-3 text-slate-600">{trx.officerName}</td>
                            <td className="py-2 px-3 text-right font-bold text-emerald-700">
                              +{formatRupiah(trx.amount)}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-100 border-t-2 border-slate-400 font-black text-xs">
                        <td colSpan={5} className="py-2.5 px-3 text-right uppercase">
                          Total Setoran Masuk:
                        </td>
                        <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">
                          +{formatRupiah(totalStudentDepositSum)}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Signatures */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-500">Menyetujui / Siswa Penyetor,</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="font-bold underline text-slate-900">{targetStudentForPrint.name}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">NIS: {targetStudentForPrint.nis}</p>
                </div>
                <div>
                  <p className="text-slate-500">
                    {settings.address.split(',')[0] || 'Jakarta'}, {formatDateIndo(new Date(), false)}
                  </p>
                  <p className="text-slate-500">Bendahara Tabungan Siswa,</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="font-bold underline text-slate-900">{settings.treasurerName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">NIP: 19830219 200801 2 007</p>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* PRINT DOCUMENT PREVIEW: PER KELAS */}
          {/* ========================================================= */}
          {printMode === 'class' && targetClassForPrint && (
            <div id="printable-class-deposits" className="bg-white rounded-2xl border border-slate-200 shadow-sm p-8 space-y-6">
              {/* Formal School Letterhead */}
              <div className="text-center pb-4 border-b-2 border-slate-900 relative">
                <div className="flex items-center justify-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-teal-800 text-white font-black text-xl flex items-center justify-center shadow-xs">
                    ST
                  </div>
                  <div>
                    <h2 className="text-xl font-black uppercase text-slate-900 tracking-wider">
                      {settings.schoolName}
                    </h2>
                    <p className="text-xs text-slate-600 font-semibold uppercase tracking-widest">
                      REKAPITULASI BUKTI SETORAN KOLEKTIF ROMBEL / KELAS
                    </p>
                    <p className="text-[11px] text-slate-500">{settings.address} • Telp: {settings.phone}</p>
                  </div>
                </div>
              </div>

              {/* Class Info Box */}
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
                <div>
                  <span className="text-slate-500 block">Rombongan Belajar:</span>
                  <span className="font-bold text-slate-900 text-sm">{targetClassForPrint.name}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Wali Kelas:</span>
                  <span className="font-bold text-slate-800">{targetClassForPrint.homeroomTeacher}</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Jumlah Siswa:</span>
                  <span className="font-bold text-slate-800">{targetClassStudents.length} Siswa</span>
                </div>
                <div>
                  <span className="text-slate-500 block">Tahun Pelajaran:</span>
                  <span className="font-bold text-slate-800">{targetClassForPrint.academicYear}</span>
                </div>
              </div>

              {/* Table of Class Students */}
              <div className="border border-slate-300 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="bg-slate-100 text-slate-700 uppercase font-bold text-[10px] border-b border-slate-300">
                      <th className="py-2.5 px-3">No.</th>
                      <th className="py-2.5 px-3">NIS</th>
                      <th className="py-2.5 px-3">Nama Lengkap Siswa</th>
                      <th className="py-2.5 px-3 text-center">L/P</th>
                      <th className="py-2.5 px-3 text-center">Frekuensi Setor</th>
                      <th className="py-2.5 px-3 text-right">Total Setoran Periode Ini</th>
                      <th className="py-2.5 px-3 text-right">Saldo Tabungan Saat Ini</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200">
                    {classStudentDepositSummaries.length === 0 ? (
                      <tr>
                        <td colSpan={7} className="py-6 text-center text-slate-400">
                          Tidak ada siswa yang terdaftar di kelas ini.
                        </td>
                      </tr>
                    ) : (
                      classStudentDepositSummaries.map((item, idx) => (
                        <tr key={item.student.id} className="hover:bg-slate-50">
                          <td className="py-2 px-3 font-mono text-slate-500">{idx + 1}</td>
                          <td className="py-2 px-3 font-mono font-semibold text-slate-800">{item.student.nis}</td>
                          <td className="py-2 px-3 font-bold text-slate-900">{item.student.name}</td>
                          <td className="py-2 px-3 text-center">{item.student.gender}</td>
                          <td className="py-2 px-3 text-center font-mono">{item.depositCount}x</td>
                          <td className="py-2 px-3 text-right font-bold text-emerald-700">
                            +{formatRupiah(item.totalDeposit)}
                          </td>
                          <td className="py-2 px-3 text-right font-extrabold text-slate-900">
                            {formatRupiah(item.currentBalance)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-100 border-t-2 border-slate-400 font-black text-xs">
                      <td colSpan={5} className="py-2.5 px-3 text-right uppercase">
                        Grand Total Kelas {targetClassForPrint.name}:
                      </td>
                      <td className="py-2.5 px-3 text-right text-emerald-700 text-sm">
                        +{formatRupiah(grandTotalClassDeposits)}
                      </td>
                      <td className="py-2.5 px-3 text-right text-slate-900 text-sm">
                        {formatRupiah(grandTotalClassBalance)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Signatures for Class Sheet */}
              <div className="pt-6 grid grid-cols-2 gap-8 text-center text-xs">
                <div>
                  <p className="text-slate-500">Wali Kelas {targetClassForPrint.name},</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="font-bold underline text-slate-900">{targetClassForPrint.homeroomTeacher}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">NIP: 19800415 200604 1 008</p>
                </div>
                <div>
                  <p className="text-slate-500">
                    {settings.address.split(',')[0] || 'Jakarta'}, {formatDateIndo(new Date(), false)}
                  </p>
                  <p className="text-slate-500">Bendahara Tabungan Sekolah,</p>
                  <div className="h-16 flex items-end justify-center">
                    <span className="font-bold underline text-slate-900">{settings.treasurerName}</span>
                  </div>
                  <p className="text-[10px] text-slate-400">NIP: 19830219 200801 2 007</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Tambah Siswa Baru */}
      {/* ============================================================== */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-400" />
                Pendaftaran Nasabah Tabungan Siswa
              </h3>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS (Nomor Induk Siswa) *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={e => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN (Nasional)</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Nama sesuai akta lahir/ijazah"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rombel / Kelas *</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin *</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. WhatsApp / HP Orang Tua</label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  placeholder="081234567890"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="pt-2 border-t border-slate-100">
                <label className="block font-bold text-emerald-800 mb-1">Setoran Awal Tabungan (Rp)</label>
                <input
                  type="number"
                  min="0"
                  step="5000"
                  value={formData.initialBalance}
                  onChange={e => setFormData({ ...formData, initialBalance: Number(e.target.value) || 0 })}
                  className="w-full px-3 py-2 rounded-xl border border-emerald-300 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-bold text-emerald-700"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Opsional. Jika diisi, otomatis menerbitkan transaksi pembukaan rekening.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Siswa
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Edit Siswa */}
      {/* ============================================================== */}
      {showEditModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden border border-slate-200">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Ubah Profil Siswa: {selectedStudent.name}
              </h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditStudent} className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NIS *</label>
                  <input
                    type="text"
                    required
                    value={formData.nis}
                    onChange={e => setFormData({ ...formData, nis: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">NISN</label>
                  <input
                    type="text"
                    value={formData.nisn}
                    onChange={e => setFormData({ ...formData, nisn: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Lengkap Siswa *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={e => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Rombel / Kelas</label>
                  <select
                    value={formData.classId}
                    onChange={e => setFormData({ ...formData, classId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Jenis Kelamin</label>
                  <select
                    value={formData.gender}
                    onChange={e => setFormData({ ...formData, gender: e.target.value as 'L' | 'P' })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white"
                  >
                    <option value="L">Laki-laki (L)</option>
                    <option value="P">Perempuan (P)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">No. HP Orang Tua</label>
                <input
                  type="text"
                  value={formData.parentPhone}
                  onChange={e => setFormData({ ...formData, parentPhone: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================== */}
      {/* MODAL: Buku Tabungan Siswa (Digital Passbook & Card) */}
      {/* ============================================================== */}
      {showPassbookModal && selectedStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            {/* Modal Header */}
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-lg bg-emerald-500/20 text-emerald-400">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm">Buku Rekening Tabungan Siswa</h3>
                  <p className="text-xs text-slate-400">NIS: {selectedStudent.nis} • {selectedStudent.className}</p>
                </div>
              </div>
              <button
                onClick={() => setShowPassbookModal(false)}
                className="text-slate-400 hover:text-white p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Passbook Card Header */}
            <div className="p-6 bg-slate-50 border-b border-slate-200">
              <div className="bg-gradient-to-r from-emerald-800 to-teal-900 rounded-xl p-5 text-white shadow-md relative overflow-hidden">
                <div className="flex items-start justify-between">
                  <div>
                    <span className="text-[10px] uppercase font-bold tracking-widest text-emerald-200">
                      KARTU TABUNGAN RESMI
                    </span>
                    <h4 className="font-black text-xl mt-1 tracking-wide">{selectedStudent.name}</h4>
                    <p className="text-xs text-emerald-100/80 mt-0.5">
                      {settings.schoolName} • Rombel: {selectedStudent.className}
                    </p>
                  </div>
                  <div className="p-2 bg-white/10 rounded-lg backdrop-blur-xs">
                    <QrCode className="w-10 h-10 text-white" />
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-emerald-700/60 flex items-end justify-between">
                  <div>
                    <span className="text-[10px] uppercase text-emerald-300 font-semibold">Total Saldo Aktif</span>
                    <p className="text-2xl font-black text-white">{formatRupiah(selectedStudent.balance)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setShowPassbookModal(false);
                        onQuickDeposit(selectedStudent);
                      }}
                      className="px-3 py-1.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <ArrowDownLeft className="w-3.5 h-3.5" /> Setor
                    </button>
                    <button
                      onClick={() => {
                        setShowPassbookModal(false);
                        onQuickWithdrawal(selectedStudent);
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-lg text-xs flex items-center gap-1 shadow-xs transition"
                    >
                      <ArrowUpRight className="w-3.5 h-3.5" /> Tarik
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Mutation Passbook Table */}
            <div className="p-6">
              <div className="flex items-center justify-between mb-3">
                <h5 className="font-bold text-xs uppercase tracking-wider text-slate-500">
                  Histori Mutasi Buku Tabungan
                </h5>
                <button
                  onClick={() => {
                    setShowPassbookModal(false);
                    handleOpenPrintStudentDeposit(selectedStudent);
                  }}
                  className="flex items-center gap-1 text-xs text-emerald-700 hover:text-emerald-800 font-bold"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Lembar Rekap Setor
                </button>
              </div>

              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs text-slate-700">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider text-[10px] font-semibold sticky top-0 border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Tanggal</th>
                      <th className="py-2.5 px-3">No. Ref</th>
                      <th className="py-2.5 px-3">Keterangan</th>
                      <th className="py-2.5 px-3 text-right">Debit / Keluar</th>
                      <th className="py-2.5 px-3 text-right">Kredit / Masuk</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {transactions
                      .filter(t => t.studentId === selectedStudent.id)
                      .length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-6 text-center text-slate-400 text-xs">
                          Belum ada transaksi pada rekening siswa ini.
                        </td>
                      </tr>
                    ) : (
                      transactions
                        .filter(t => t.studentId === selectedStudent.id)
                        .map(t => {
                          const isDeposit = t.type !== 'PENARIKAN';
                          return (
                            <tr key={t.id} className="hover:bg-slate-50/70">
                              <td className="py-2 px-3 text-slate-500 font-mono text-[11px]">
                                {formatDateIndo(t.timestamp, false)}
                              </td>
                              <td className="py-2 px-3 font-mono text-[11px] text-slate-800">{t.referenceNo}</td>
                              <td className="py-2 px-3 text-slate-600">{t.category}</td>
                              <td className="py-2 px-3 text-right font-medium text-amber-600">
                                {!isDeposit ? `-${formatRupiah(t.amount)}` : '-'}
                              </td>
                              <td className="py-2 px-3 text-right font-bold text-emerald-600">
                                {isDeposit ? `+${formatRupiah(t.amount)}` : '-'}
                              </td>
                            </tr>
                          );
                        })
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="bg-slate-50 px-6 py-3 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="text-slate-500">Status: Aktif Menabung</span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 font-semibold hover:bg-slate-100 transition"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Kartu
                </button>
                <button
                  onClick={() => setShowPassbookModal(false)}
                  className="px-4 py-1.5 rounded-lg bg-slate-900 text-white font-semibold hover:bg-slate-800 transition"
                >
                  Tutup
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: Tambah Kelas Baru (Input Kelas & Kuota Siswa) */}
      {showAddClassModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-400" />
                Input Rombongan Belajar (Kelas) Baru
              </h3>
              <button onClick={() => setShowAddClassModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Rombel / Kelas *</label>
                <input
                  type="text"
                  required
                  value={classFormData.name}
                  onChange={e => setClassFormData({ ...classFormData, name: e.target.value })}
                  placeholder="Cth: X-RPL 1, VII-A, XII-MIPA 2"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat / Jenjang *</label>
                  <select
                    value={classFormData.grade}
                    onChange={e => setClassFormData({ ...classFormData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="VII">Kelas VII (SMP)</option>
                    <option value="VIII">Kelas VIII (SMP)</option>
                    <option value="IX">Kelas IX (SMP)</option>
                    <option value="X">Kelas X (SMA/SMK)</option>
                    <option value="XI">Kelas XI (SMA/SMK)</option>
                    <option value="XII">Kelas XII (SMA/SMK)</option>
                    <option value="Umum">Umum / Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Kuota Siswa *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={classFormData.capacity}
                    onChange={e => setClassFormData({ ...classFormData, capacity: Number(e.target.value) || 36 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  value={classFormData.homeroomTeacher}
                  onChange={e => setClassFormData({ ...classFormData, homeroomTeacher: e.target.value })}
                  placeholder="Cth: Bpk. Ahmad Fauzi, M.Pd"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={classFormData.academicYear}
                  onChange={e => setClassFormData({ ...classFormData, academicYear: e.target.value })}
                  placeholder="2026/2027"
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Kelas
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Ubah Kelas & Kuota Siswa */}
      {showEditClassModal && selectedClassForEdit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95">
            <div className="bg-slate-900 text-white px-6 py-4 flex items-center justify-between">
              <h3 className="font-bold text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-emerald-400" />
                Ubah Kelas & Kuota: {selectedClassForEdit.name}
              </h3>
              <button onClick={() => setShowEditClassModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveEditClass} className="p-6 space-y-4 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Rombel / Kelas *</label>
                <input
                  type="text"
                  required
                  value={classFormData.name}
                  onChange={e => setClassFormData({ ...classFormData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-semibold text-slate-900"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Tingkat / Jenjang *</label>
                  <select
                    value={classFormData.grade}
                    onChange={e => setClassFormData({ ...classFormData, grade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="VII">Kelas VII (SMP)</option>
                    <option value="VIII">Kelas VIII (SMP)</option>
                    <option value="IX">Kelas IX (SMP)</option>
                    <option value="X">Kelas X (SMA/SMK)</option>
                    <option value="XI">Kelas XI (SMA/SMK)</option>
                    <option value="XII">Kelas XII (SMA/SMK)</option>
                    <option value="Umum">Umum / Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-slate-700 mb-1">Target Kuota Siswa *</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    required
                    value={classFormData.capacity}
                    onChange={e => setClassFormData({ ...classFormData, capacity: Number(e.target.value) || 36 })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Wali Kelas</label>
                <input
                  type="text"
                  value={classFormData.homeroomTeacher}
                  onChange={e => setClassFormData({ ...classFormData, homeroomTeacher: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Tahun Pelajaran</label>
                <input
                  type="text"
                  value={classFormData.academicYear}
                  onChange={e => setClassFormData({ ...classFormData, academicYear: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditClassModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold shadow-xs"
                >
                  Simpan Perubahan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
