import {
  Student,
  ClassItem,
  Transaction,
  Withdrawal,
  AuditLog,
  SchoolSettings,
  User,
  DashboardSummary
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_CLASSES,
  INITIAL_TRANSACTIONS,
  INITIAL_WITHDRAWALS,
  INITIAL_AUDIT_LOGS,
  DEFAULT_SETTINGS,
  INITIAL_USERS
} from './mockData';
import { generateReceiptNumber } from './formatters';

const STORAGE_KEYS = {
  STUDENTS: 'sitabungan_students_v1',
  CLASSES: 'sitabungan_classes_v1',
  TRANSACTIONS: 'sitabungan_transactions_v1',
  WITHDRAWALS: 'sitabungan_withdrawals_v1',
  AUDIT_LOGS: 'sitabungan_audit_logs_v1',
  SETTINGS: 'sitabungan_settings_v1',
  CURRENT_USER: 'sitabungan_current_user_v1'
};

export class SchoolDataStore {
  static getStudents(): Student[] {
    const raw = localStorage.getItem(STORAGE_KEYS.STUDENTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
      return INITIAL_STUDENTS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_STUDENTS;
    }
  }

  static saveStudents(students: Student[]) {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(students));
  }

  static batchImportStudents(
    incomingStudents: Array<{
      nis: string;
      nisn?: string;
      name: string;
      classId?: string;
      className?: string;
      gender?: 'L' | 'P';
      parentPhone?: string;
      initialBalance?: number;
    }>,
    actor: string
  ): { success: boolean; importedCount: number; errors: string[]; imported: Student[] } {
    const existing = this.getStudents();
    const classes = this.getClasses();
    const classMap: Record<string, string> = {};
    classes.forEach(c => { classMap[c.id] = c.name; });

    const existingNis = new Set(existing.map(s => s.nis.trim()));
    const imported: Student[] = [];
    const errors: string[] = [];
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 19);

    incomingStudents.forEach((item, idx) => {
      const lineNum = idx + 1;
      const cleanNis = String(item.nis || '').trim();
      const cleanName = String(item.name || '').trim();

      if (!cleanNis || !cleanName) {
        errors.push(`Baris ${lineNum}: NIS dan Nama siswa wajib diisi`);
        return;
      }

      if (existingNis.has(cleanNis)) {
        errors.push(`Baris ${lineNum}: NIS ${cleanNis} sudah terdaftar (duplikat)`);
        return;
      }

      const assignedClassId = item.classId || classes[0]?.id || 'CLS-001';
      const assignedClassName = item.className || classMap[assignedClassId] || 'Kelas';
      const initialBal = Number(item.initialBalance) || 0;

      const newStudent: Student = {
        id: `STD-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`,
        nis: cleanNis,
        nisn: String(item.nisn || '').trim(),
        name: cleanName,
        classId: assignedClassId,
        className: assignedClassName,
        gender: (String(item.gender || 'L').toUpperCase().startsWith('P')) ? 'P' : 'L',
        parentPhone: String(item.parentPhone || '').trim(),
        balance: initialBal,
        status: 'ACTIVE',
        createdAt: nowStr
      };

      existing.unshift(newStudent);
      existingNis.add(cleanNis);
      imported.push(newStudent);

      if (initialBal > 0) {
        // Record deposit transaction
        this.recordDeposit(
          newStudent.id,
          initialBal,
          'Saldo Awal Pembukaan',
          'Setoran awal import data siswa baru',
          actor || 'Petugas'
        );
      }
    });

    this.saveStudents(existing);
    this.recalculateClassBalances();

    this.logAudit(actor || 'Petugas', 'IMPORT_STUDENTS', 'STUDENT', 'BATCH', {
      totalAttempted: incomingStudents.length,
      successCount: imported.length,
      errorsCount: errors.length
    });

    return {
      success: true,
      importedCount: imported.length,
      errors,
      imported
    };
  }

  static getClasses(): ClassItem[] {
    const raw = localStorage.getItem(STORAGE_KEYS.CLASSES);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
      return INITIAL_CLASSES;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_CLASSES;
    }
  }

  static saveClasses(classes: ClassItem[]) {
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
  }

  static getTransactions(): Transaction[] {
    const raw = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
      return INITIAL_TRANSACTIONS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_TRANSACTIONS;
    }
  }

  static saveTransactions(transactions: Transaction[]) {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }

  static getWithdrawals(): Withdrawal[] {
    const raw = localStorage.getItem(STORAGE_KEYS.WITHDRAWALS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
      return INITIAL_WITHDRAWALS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_WITHDRAWALS;
    }
  }

  static saveWithdrawals(withdrawals: Withdrawal[]) {
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(withdrawals));
  }

  static getAuditLogs(): AuditLog[] {
    const raw = localStorage.getItem(STORAGE_KEYS.AUDIT_LOGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
      return INITIAL_AUDIT_LOGS;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return INITIAL_AUDIT_LOGS;
    }
  }

  static logAudit(actor: string, action: string, entity: string, entityId: string, details: Record<string, unknown> | string) {
    const logs = this.getAuditLogs();
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp,
      actor: actor || 'Sistem',
      action,
      entity,
      entityId,
      details
    };

    logs.unshift(newLog);
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs.slice(0, 200)));
    return newLog;
  }

  static getSettings(): SchoolSettings {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
      return DEFAULT_SETTINGS;
    }
    try {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    } catch {
      return DEFAULT_SETTINGS;
    }
  }

  static saveSettings(settings: SchoolSettings) {
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
  }

  static getUsers(): User[] {
    return INITIAL_USERS;
  }

  static getCurrentUser(): User | null {
    const raw = localStorage.getItem(STORAGE_KEYS.CURRENT_USER);
    if (!raw) {
      return null;
    }
    try {
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  static setCurrentUser(user: User | null) {
    if (user) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));
    } else {
      localStorage.removeItem(STORAGE_KEYS.CURRENT_USER);
    }
  }

  static authenticate(username: string, password: string): { success: boolean; user?: User; message?: string } {
    const rawUser = (username || '').trim();
    const cleanUser = rawUser.toLowerCase();
    const cleanPass = (password || '').trim();

    // 1. Cek apakah ini Login Siswa (password Siswa123 atau user berformat NISN / 'nisn')
    const isStudentPass = cleanPass.toLowerCase() === 'siswa123';
    const isStudentUser = cleanUser === 'nisn' || /^\d{8,12}$/.test(cleanUser);

    if (isStudentPass || isStudentUser) {
      if (!isStudentPass) {
        return {
          success: false,
          message: 'Password akun siswa salah. Gunakan kata sandi default: "Siswa123".'
        };
      }

      const students = this.getStudents();
      let matchedStudent = null;

      if (cleanUser === 'nisn' || cleanUser === '') {
        // Jika user mengetikkan "NISN" secara harfiah, ambil siswa aktif pertama (Ahmad Fauzi)
        matchedStudent = students.find(s => s.status === 'ACTIVE') || students[0];
      } else {
        matchedStudent = students.find(
          s =>
            s.nisn.toLowerCase() === cleanUser ||
            s.nis.toLowerCase() === cleanUser ||
            s.name.toLowerCase() === cleanUser
        );
      }

      if (!matchedStudent) {
        this.logAudit('ANONIM', 'LOGIN_FAILED', 'STUDENT_PORTAL', rawUser, 'NISN tidak terdaftar');
        return {
          success: false,
          message: `Data siswa dengan NISN "${rawUser}" tidak ditemukan. Pastikan NISN sudah terdaftar.`
        };
      }

      const studentUser: User = {
        id: `USR-STU-${matchedStudent.id}`,
        username: matchedStudent.nisn,
        fullName: matchedStudent.name,
        role: 'SISWA',
        status: matchedStudent.status,
        studentId: matchedStudent.id,
        studentData: matchedStudent
      };

      this.setCurrentUser(studentUser);
      this.logAudit(
        matchedStudent.name,
        'LOGIN_SUCCESS',
        'STUDENT_PORTAL',
        matchedStudent.id,
        `Siswa login mandiri dengan NISN: ${matchedStudent.nisn} (${matchedStudent.name})`
      );

      return { success: true, user: studentUser };
    }

    // 2. Cek Login Petugas / Bendahara / Admin
    const users = this.getUsers();
    const matched = users.find(u => u.username.toLowerCase() === cleanUser);

    if (!matched) {
      this.logAudit('ANONIM', 'LOGIN_FAILED', 'USER', cleanUser, 'Username tidak ditemukan');
      return {
        success: false,
        message: 'Username petugas tidak ditemukan. Untuk siswa, gunakan NISN dan password "Siswa123".'
      };
    }

    if (matched.password !== cleanPass) {
      this.logAudit(matched.username, 'LOGIN_FAILED', 'USER', matched.id, 'Password salah');
      return { success: false, message: 'Password salah. Periksa kembali password Anda.' };
    }

    this.setCurrentUser(matched);
    this.logAudit(matched.username, 'LOGIN_SUCCESS', 'USER', matched.id, `Login berhasil sebagai ${matched.role}`);

    return { success: true, user: matched };
  }

  static logout() {
    const current = this.getCurrentUser();
    if (current) {
      this.logAudit(current.username, 'LOGOUT', 'USER', current.id, 'Petugas keluar dari sistem');
    }
    this.setCurrentUser(null);
  }

  static recordDeposit(
    studentId: string,
    amount: number,
    category: string,
    notes: string,
    officerName: string
  ): { success: boolean; transaction?: Transaction; student?: Student; error?: string } {
    if (amount <= 0) return { success: false, error: 'Nominal setoran harus lebih besar dari Rp 0' };

    const students = this.getStudents();
    const studentIdx = students.findIndex(s => s.id === studentId);
    if (studentIdx === -1) return { success: false, error: 'Siswa tidak ditemukan' };

    const targetStudent = students[studentIdx];
    const prevBalance = targetStudent.balance || 0;
    const newBalance = prevBalance + amount;

    targetStudent.balance = newBalance;
    students[studentIdx] = targetStudent;
    this.saveStudents(students);

    // Save transaction
    const refNo = generateReceiptNumber('TRX');
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const trx: Transaction = {
      id: `TRX-${Date.now()}`,
      referenceNo: refNo,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      classId: targetStudent.classId,
      type: 'SETORAN',
      amount,
      category: category || 'Tabungan Rutin',
      notes,
      officerName: officerName || 'Bendahara',
      timestamp
    };

    const transactions = this.getTransactions();
    transactions.unshift(trx);
    this.saveTransactions(transactions);

    // Update class aggregated balance
    this.recalculateClassBalances();

    // Audit log
    this.logAudit(officerName, 'SETORAN', 'TRANSACTION', refNo, {
      studentName: targetStudent.name,
      amount,
      prevBalance,
      newBalance
    });

    return { success: true, transaction: trx, student: targetStudent };
  }

  static recordWithdrawal(
    studentId: string,
    amount: number,
    reason: string,
    officerName: string
  ): { success: boolean; withdrawal?: Withdrawal; transaction?: Transaction; student?: Student; error?: string } {
    if (amount <= 0) return { success: false, error: 'Nominal penarikan harus lebih dari Rp 0' };

    const settings = this.getSettings();
    const students = this.getStudents();
    const studentIdx = students.findIndex(s => s.id === studentId);
    if (studentIdx === -1) return { success: false, error: 'Siswa tidak ditemukan' };

    const targetStudent = students[studentIdx];
    const prevBalance = targetStudent.balance || 0;

    if (prevBalance < amount) {
      return { success: false, error: `Saldo tidak mencukupi. Saldo saat ini: Rp ${prevBalance.toLocaleString('id-ID')}` };
    }

    if (prevBalance - amount < settings.minBalance) {
      return {
        success: false,
        error: `Saldo mengendap minimal Rp ${settings.minBalance.toLocaleString('id-ID')}. Maksimal penarikan: Rp ${(prevBalance - settings.minBalance).toLocaleString('id-ID')}`
      };
    }

    const newBalance = prevBalance - amount;
    targetStudent.balance = newBalance;
    students[studentIdx] = targetStudent;
    this.saveStudents(students);

    const refNo = generateReceiptNumber('WDL');
    const now = new Date();
    const timestamp = now.toISOString().replace('T', ' ').substring(0, 19);

    const wdl: Withdrawal = {
      id: `WDL-${Date.now()}`,
      referenceNo: refNo,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      classId: targetStudent.classId,
      amount,
      reason: reason || 'Keperluan Pribadi Siswa',
      status: 'APPROVED',
      approvedBy: officerName || 'Bendahara',
      officerName: officerName || 'Petugas',
      timestamp
    };

    const withdrawals = this.getWithdrawals();
    withdrawals.unshift(wdl);
    this.saveWithdrawals(withdrawals);

    // Record corresponding debit transaction
    const trx: Transaction = {
      id: `TRX-${Date.now()}`,
      referenceNo: refNo,
      studentId: targetStudent.id,
      studentName: targetStudent.name,
      classId: targetStudent.classId,
      type: 'PENARIKAN',
      amount,
      category: reason || 'Penarikan Tabungan',
      notes: `Penarikan disetujui petugas: ${officerName}`,
      officerName: officerName || 'Petugas',
      timestamp
    };

    const transactions = this.getTransactions();
    transactions.unshift(trx);
    this.saveTransactions(transactions);

    this.recalculateClassBalances();

    this.logAudit(officerName, 'PENARIKAN', 'WITHDRAWAL', refNo, {
      studentName: targetStudent.name,
      amount,
      prevBalance,
      newBalance,
      reason
    });

    return { success: true, withdrawal: wdl, transaction: trx, student: targetStudent };
  }

  static recalculateClassBalances() {
    const classes = this.getClasses();
    const students = this.getStudents();

    const updated = classes.map(c => {
      const classStudents = students.filter(s => s.classId === c.id);
      const totalBalance = classStudents.reduce((acc, s) => acc + (s.balance || 0), 0);
      return {
        ...c,
        studentCount: classStudents.length,
        totalBalance
      };
    });

    this.saveClasses(updated);
  }

  static createClass(
    data: { name: string; grade: string; homeroomTeacher: string; academicYear: string; capacity?: number },
    actor: string
  ): { success: boolean; newClass?: ClassItem; error?: string } {
    if (!data.name) return { success: false, error: 'Nama kelas wajib diisi' };
    const classes = this.getClasses();
    const isDup = classes.some(c => c.name.toLowerCase() === data.name.trim().toLowerCase());
    if (isDup) return { success: false, error: `Kelas ${data.name} sudah ada` };

    const newClass: ClassItem = {
      id: `CLS-${Date.now()}`,
      name: data.name.trim(),
      grade: data.grade || 'Umum',
      homeroomTeacher: data.homeroomTeacher || '-',
      academicYear: data.academicYear || '2026/2027',
      capacity: Number(data.capacity) || 36,
      studentCount: 0,
      totalBalance: 0
    };

    classes.push(newClass);
    this.saveClasses(classes);
    this.logAudit(actor, 'CREATE', 'CLASS', newClass.id, { name: newClass.name, capacity: newClass.capacity });
    return { success: true, newClass };
  }

  static updateClass(
    id: string,
    data: { name: string; grade: string; homeroomTeacher: string; academicYear: string; capacity?: number },
    actor: string
  ): { success: boolean; error?: string } {
    const classes = this.getClasses();
    const idx = classes.findIndex(c => c.id === id);
    if (idx === -1) return { success: false, error: 'Kelas tidak ditemukan' };

    classes[idx] = {
      ...classes[idx],
      name: data.name.trim(),
      grade: data.grade,
      homeroomTeacher: data.homeroomTeacher,
      academicYear: data.academicYear,
      capacity: Number(data.capacity) || classes[idx].capacity || 36
    };

    this.saveClasses(classes);
    this.recalculateClassBalances();
    this.logAudit(actor, 'UPDATE', 'CLASS', id, data);
    return { success: true };
  }

  static deleteClass(id: string, actor: string): { success: boolean; error?: string } {
    const students = this.getStudents();
    const hasStudents = students.some(s => s.classId === id);
    if (hasStudents) {
      return { success: false, error: 'Tidak dapat menghapus kelas yang masih memiliki siswa terdaftar.' };
    }

    let classes = this.getClasses();
    const target = classes.find(c => c.id === id);
    classes = classes.filter(c => c.id !== id);
    this.saveClasses(classes);
    this.logAudit(actor, 'DELETE', 'CLASS', id, { name: target?.name });
    return { success: true };
  }

  static getSummary(): DashboardSummary {
    const students = this.getStudents();
    const classes = this.getClasses();
    const transactions = this.getTransactions();
    const withdrawals = this.getWithdrawals();

    const totalBalance = students.reduce((acc, s) => acc + (s.balance || 0), 0);
    const activeStudentsCount = students.filter(s => s.status === 'ACTIVE').length;

    const totalDeposits = transactions
      .filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalWithdrawals = withdrawals.reduce((acc, w) => acc + w.amount, 0);

    const todayStr = new Date().toISOString().substring(0, 10);
    const todayTransactions = transactions.filter(t => t.timestamp.startsWith(todayStr));

    const todayDeposits = todayTransactions
      .filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL')
      .reduce((acc, t) => acc + t.amount, 0);

    const todayWithdrawals = todayTransactions
      .filter(t => t.type === 'PENARIKAN')
      .reduce((acc, t) => acc + t.amount, 0);

    // Chart last 7 days
    const chartData = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dStr = d.toISOString().substring(0, 10);
      const dayName = d.toLocaleDateString('id-ID', { weekday: 'short', day: 'numeric' });

      const dayTrx = transactions.filter(t => t.timestamp.startsWith(dStr));
      const dep = dayTrx.filter(t => t.type !== 'PENARIKAN').reduce((acc, t) => acc + t.amount, 0);
      const wdl = dayTrx.filter(t => t.type === 'PENARIKAN').reduce((acc, t) => acc + t.amount, 0);

      chartData.push({
        date: dStr,
        label: dayName,
        deposits: dep,
        withdrawals: wdl
      });
    }

    const classBreakdown = classes.map(c => {
      const cStudents = students.filter(s => s.classId === c.id);
      const b = cStudents.reduce((acc, s) => acc + (s.balance || 0), 0);
      return {
        className: c.name,
        studentCount: cStudents.length,
        balance: b
      };
    }).sort((a, b) => b.balance - a.balance);

    return {
      totalBalance,
      activeStudentsCount,
      totalClassesCount: classes.length,
      totalDeposits,
      totalWithdrawals,
      todayDeposits,
      todayWithdrawals,
      todayNet: todayDeposits - todayWithdrawals,
      chartData,
      classBreakdown
    };
  }

  static resetDatabase() {
    localStorage.setItem(STORAGE_KEYS.STUDENTS, JSON.stringify(INITIAL_STUDENTS));
    localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(INITIAL_CLASSES));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(INITIAL_TRANSACTIONS));
    localStorage.setItem(STORAGE_KEYS.WITHDRAWALS, JSON.stringify(INITIAL_WITHDRAWALS));
    localStorage.setItem(STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(INITIAL_AUDIT_LOGS));
    localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(DEFAULT_SETTINGS));
  }
}
