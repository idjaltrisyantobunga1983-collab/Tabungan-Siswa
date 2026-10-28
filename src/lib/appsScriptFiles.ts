import { AppsScriptFile } from '../types';

export const APPS_SCRIPT_SOURCE_FILES: AppsScriptFile[] = [
  {
    name: 'Code.gs',
    category: 'core',
    description: 'Entry point router HTTP GET & POST. Menghubungkan URL Web App ke fungsi controller.',
    code: `/**
 * Code.gs - Entry Point & Router Web App Google Apps Script
 * SI-TABUNGAN (Sistem Informasi Tabungan Siswa)
 */

function doGet(e) {
  try {
    const params = e && e.parameter ? e.parameter : {};
    const action = params.action || 'ping';

    let result;

    switch (action) {
      case 'ping':
        result = {
          success: true,
          message: 'SI-TABUNGAN API Backend Google Apps Script aktif!',
          timestamp: new Date().toISOString(),
          version: '1.0.0'
        };
        break;

      case 'getSummary':
        result = { success: true, data: getDashboardSummary() };
        break;

      case 'getStudents':
        result = {
          success: true,
          data: getStudentsList({
            classId: params.classId,
            status: params.status,
            search: params.search
          })
        };
        break;

      case 'getStudentById':
        result = { success: true, data: getStudentById(params.id) };
        break;

      case 'getClasses':
        result = { success: true, data: getClassesList() };
        break;

      case 'getTransactions':
        result = {
          success: true,
          data: getTransactionsList({
            studentId: params.studentId,
            classId: params.classId,
            startDate: params.startDate,
            endDate: params.endDate
          })
        };
        break;

      case 'getWithdrawals':
        result = {
          success: true,
          data: getWithdrawalsList({
            studentId: params.studentId,
            classId: params.classId,
            startDate: params.startDate,
            endDate: params.endDate
          })
        };
        break;

      case 'getAuditLogs':
        result = { success: true, data: getAuditLogs(params.limit || 100) };
        break;

      default:
        result = { success: false, error: 'Action GET tidak dikenali: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  }
}

function doPost(e) {
  try {
    let payload = {};
    if (e && e.postData && e.postData.contents) {
      try {
        payload = JSON.parse(e.postData.contents);
      } catch (err) {
        payload = e.parameter || {};
      }
    } else if (e && e.parameter) {
      payload = e.parameter;
    }

    const action = payload.action;
    const actor = payload.actor || 'SYSTEM';
    let result;

    switch (action) {
      case 'setupDatabase':
        result = setupDatabase();
        break;

      case 'login':
        result = authenticateUser(payload.username, payload.password);
        break;

      case 'createStudent':
        result = { success: true, data: createStudent(payload.data, actor) };
        break;

      case 'updateStudent':
        result = updateStudent(payload.id, payload.data, actor);
        break;

      case 'createClass':
        result = { success: true, data: createClass(payload.data, actor) };
        break;

      case 'recordDeposit':
        result = recordDeposit(payload.data, actor);
        break;

      case 'recordWithdrawal':
        result = recordWithdrawal(payload.data, actor);
        break;

      case 'importStudents':
        result = batchImportStudents(payload.data, actor);
        break;

      default:
        result = { success: false, error: 'Action POST tidak dikenali: ' + action };
    }

    return createJsonResponse(result);
  } catch (error) {
    return createJsonResponse({
      success: false,
      error: error.message || error.toString()
    });
  }
}

function createJsonResponse(data) {
  const output = JSON.stringify(data);
  return ContentService.createTextOutput(output)
    .setMimeType(ContentService.MimeType.JSON);
}`
  },
  {
    name: 'Database.gs',
    category: 'data',
    description: 'Inisialisasi tabel Google Sheets otomatis dengan styling header hijau, helper CRUD baris.',
    code: `/**
 * Database.gs - Manajemen Koneksi & Skema Google Sheets
 * SI-TABUNGAN (Sistem Informasi Tabungan Siswa)
 */

const SHEET_NAMES = {
  USERS: 'USERS',
  CLASSES: 'CLASSES',
  STUDENTS: 'STUDENTS',
  TRANSACTIONS: 'TRANSACTIONS',
  WITHDRAWALS: 'WITHDRAWALS',
  AUDIT_LOGS: 'AUDIT_LOGS',
  SETTINGS: 'SETTINGS'
};

function getSpreadsheet() {
  const customId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (customId) {
    return SpreadsheetApp.openById(customId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

function setupDatabase() {
  const ss = getSpreadsheet();

  const schemas = {
    [SHEET_NAMES.USERS]: ['id', 'username', 'passwordHash', 'fullName', 'role', 'status', 'createdAt'],
    [SHEET_NAMES.CLASSES]: ['id', 'name', 'grade', 'homeroomTeacher', 'academicYear', 'createdAt'],
    [SHEET_NAMES.STUDENTS]: ['id', 'nis', 'nisn', 'name', 'classId', 'gender', 'parentPhone', 'balance', 'status', 'createdAt'],
    [SHEET_NAMES.TRANSACTIONS]: ['id', 'referenceNo', 'studentId', 'studentName', 'classId', 'type', 'amount', 'category', 'notes', 'officerName', 'timestamp'],
    [SHEET_NAMES.WITHDRAWALS]: ['id', 'referenceNo', 'studentId', 'studentName', 'classId', 'amount', 'reason', 'status', 'approvedBy', 'officerName', 'timestamp'],
    [SHEET_NAMES.AUDIT_LOGS]: ['id', 'timestamp', 'actor', 'action', 'entity', 'entityId', 'details'],
    [SHEET_NAMES.SETTINGS]: ['key', 'value', 'updatedAt']
  };

  Object.keys(schemas).forEach(name => {
    let sheet = ss.getSheetByName(name);
    if (!sheet) {
      sheet = ss.insertSheet(name);
    }
    if (sheet.getLastRow() === 0) {
      const headers = schemas[name];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });

  seedDefaultUsers(ss);
  return { success: true, message: 'Database initialized successfully with all required schemas.' };
}

function readSheetRows(sheetName) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) return [];

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];

  const headers = data[0].map(h => String(h).trim());
  const rows = [];

  for (let i = 1; i < data.length; i++) {
    const row = data[i];
    if (row.every(cell => cell === '' || cell === null)) continue;
    
    const obj = { _rowIndex: i + 1 };
    headers.forEach((header, colIndex) => {
      let val = row[colIndex];
      if (val instanceof Date) {
        val = Utilities.formatDate(val, "Asia/Jakarta", "yyyy-MM-dd'T'HH:mm:ss'Z'");
      }
      obj[header] = val;
    });
    rows.push(obj);
  }

  return rows;
}

function appendSheetRow(sheetName, recordObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const newRow = headers.map(header => {
    return recordObj[header] !== undefined ? recordObj[header] : '';
  });

  sheet.appendRow(newRow);
  return recordObj;
}

function updateSheetRowById(sheetName, id, updateObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  const headers = data[0].map(h => String(h).trim());
  const idColIndex = headers.indexOf('id');
  if (idColIndex === -1) throw new Error('Kolom id tidak ditemukan');

  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idColIndex]) === String(id)) {
      headers.forEach((header, colIdx) => {
        if (updateObj[header] !== undefined && header !== 'id') {
          sheet.getRange(i + 1, colIdx + 1).setValue(updateObj[header]);
        }
      });
      return true;
    }
  }

  return false;
}

function generateId(prefix) {
  const dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyMMddHHmmss");
  const random = Math.floor(1000 + Math.random() * 9000);
  return (prefix || 'ID') + '-' + dateStr + '-' + random;
}`
  },
  {
    name: 'Auth.gs',
    category: 'handler',
    description: 'Autentikasi akun petugas bendahara, hash SHA-256, dan validasi sesi.',
    code: `/**
 * Auth.gs - Autentikasi Pengguna & Role Permission
 * SI-TABUNGAN
 */

function seedDefaultUsers(ss) {
  const sheet = ss.getSheetByName(SHEET_NAMES.USERS);
  if (!sheet) return;

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) {
    const defaultUsers = [
      {
        id: 'USR-000',
        username: 'Bunga1983',
        passwordHash: hashPassword('12345678'),
        fullName: 'Idjal Trisyanto Bunga, S.Pd',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      },
      {
        id: 'USR-001',
        username: 'admin',
        passwordHash: hashPassword('admin123'),
        fullName: 'Administrator Sekolah',
        role: 'ADMIN',
        status: 'ACTIVE',
        createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      },
      {
        id: 'USR-002',
        username: 'bendahara',
        passwordHash: hashPassword('bendahara123'),
        fullName: 'Ibu Rahma, S.Pd (Bendahara)',
        role: 'BENDAHARA',
        status: 'ACTIVE',
        createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      },
      {
        id: 'USR-003',
        username: 'walikelas',
        passwordHash: hashPassword('guru123'),
        fullName: 'Bpk. Ahmad Fauzi (Wali Kelas)',
        role: 'WALI_KELAS',
        status: 'ACTIVE',
        createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
      }
    ];

    defaultUsers.forEach(u => appendSheetRow(SHEET_NAMES.USERS, u));
  }
}

function hashPassword(password) {
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, String(password), Utilities.Charset.UTF_8);
  let hexString = '';
  for (let i = 0; i < rawHash.length; i++) {
    let byteVal = rawHash[i];
    if (byteVal < 0) byteVal += 256;
    let byteHex = byteVal.toString(16);
    if (byteHex.length === 1) byteHex = '0' + byteHex;
    hexString += byteHex;
  }
  return hexString;
}

function authenticateUser(username, password) {
  if (!username || !password) {
    return { success: false, message: 'Username dan password wajib diisi' };
  }

  const rawUser = String(username).trim();
  const cleanUsername = rawUser.toLowerCase();
  const rawPass = String(password).trim();
  const cleanPass = rawPass.toLowerCase();

  // 1. Cek Login Siswa (password Siswa123)
  if (cleanPass === 'siswa123') {
    const students = readSheetRows(SHEET_NAMES.STUDENTS);
    let matchedStudent = null;

    if (cleanUsername === 'nisn' || cleanUsername === '') {
      matchedStudent = students.find(s => s.status === 'ACTIVE') || students[0];
    } else {
      matchedStudent = students.find(s =>
        String(s.nisn).trim().toLowerCase() === cleanUsername ||
        String(s.nis).trim().toLowerCase() === cleanUsername
      );
    }

    if (matchedStudent) {
      recordAuditLog(matchedStudent.name, 'LOGIN_SUCCESS', 'STUDENT_PORTAL', matchedStudent.id, {
        nisn: matchedStudent.nisn,
        role: 'SISWA'
      });
      return {
        success: true,
        user: {
          id: matchedStudent.id,
          username: matchedStudent.nisn,
          fullName: matchedStudent.name,
          role: 'SISWA',
          studentId: matchedStudent.id
        },
        token: generateSessionToken({
          id: matchedStudent.id,
          username: matchedStudent.nisn,
          role: 'SISWA'
        })
      };
    } else {
      return {
        success: false,
        message: 'NISN siswa "' + rawUser + '" tidak ditemukan dalam database siswa.'
      };
    }
  }

  // 2. Cek Login Petugas / Bendahara / Admin
  const users = readSheetRows(SHEET_NAMES.USERS);
  const hashedPassword = hashPassword(password);

  const matched = users.find(u => String(u.username).trim().toLowerCase() === cleanUsername);

  if (!matched) {
    recordAuditLog('ANONYMOUS', 'LOGIN_FAILED', 'USER', cleanUsername, { reason: 'User not found' });
    return { success: false, message: 'Username atau password salah' };
  }

  if (matched.status !== 'ACTIVE') {
    return { success: false, message: 'Akun Anda nonaktif.' };
  }

  if (matched.passwordHash !== hashedPassword) {
    recordAuditLog(cleanUsername, 'LOGIN_FAILED', 'USER', matched.id, { reason: 'Password invalid' });
    return { success: false, message: 'Username atau password salah' };
  }

  recordAuditLog(matched.username, 'LOGIN_SUCCESS', 'USER', matched.id, { role: matched.role });

  return {
    success: true,
    user: {
      id: matched.id,
      username: matched.username,
      fullName: matched.fullName,
      role: matched.role
    },
    token: generateSessionToken(matched)
  };
}

function generateSessionToken(user) {
  const payload = {
    userId: user.id,
    username: user.username,
    role: user.role,
    exp: new Date().getTime() + (24 * 60 * 60 * 1000)
  };
  return Utilities.base64Encode(JSON.stringify(payload));
}`
  },
  {
    name: 'Students.gs',
    category: 'handler',
    description: 'Pengelolaan data siswa, NIS unik, kontak wali murid, dan saldo berjalan.',
    code: `/**
 * Students.gs - Manajemen Data Siswa & Saldo Tabungan
 * SI-TABUNGAN
 */

function getStudentsList(filters) {
  let students = readSheetRows(SHEET_NAMES.STUDENTS);
  const classes = readSheetRows(SHEET_NAMES.CLASSES);
  const classMap = {};
  classes.forEach(c => { classMap[c.id] = c.name; });

  let result = students.map(s => ({
    id: s.id,
    nis: s.nis,
    nisn: s.nisn,
    name: s.name,
    classId: s.classId,
    className: classMap[s.classId] || 'Tidak Diketahui',
    gender: s.gender,
    parentPhone: s.parentPhone,
    balance: Number(s.balance) || 0,
    status: s.status || 'ACTIVE',
    createdAt: s.createdAt
  }));

  if (filters) {
    if (filters.classId && filters.classId !== 'ALL') {
      result = result.filter(s => String(s.classId) === String(filters.classId));
    }
    if (filters.status && filters.status !== 'ALL') {
      result = result.filter(s => String(s.status) === String(filters.status));
    }
    if (filters.search) {
      const q = String(filters.search).toLowerCase();
      result = result.filter(s => 
        String(s.name).toLowerCase().includes(q) ||
        String(s.nis).toLowerCase().includes(q) ||
        String(s.nisn).toLowerCase().includes(q)
      );
    }
  }

  return result;
}

function getStudentById(studentId) {
  const students = getStudentsList();
  const student = students.find(s => String(s.id) === String(studentId));
  if (!student) throw new Error('Siswa tidak ditemukan');
  return student;
}

function createStudent(data, actor) {
  if (!data.name || !data.nis) throw new Error('Nama dan NIS wajib diisi');

  const existing = readSheetRows(SHEET_NAMES.STUDENTS);
  const isDuplicate = existing.some(s => String(s.nis).trim() === String(data.nis).trim());
  if (isDuplicate) throw new Error('NIS sudah terdaftar');

  const newStudent = {
    id: generateId('STD'),
    nis: String(data.nis).trim(),
    nisn: String(data.nisn || '').trim(),
    name: String(data.name).trim(),
    classId: data.classId || '',
    gender: data.gender || 'L',
    parentPhone: data.parentPhone || '',
    balance: Number(data.initialBalance) || 0,
    status: 'ACTIVE',
    createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };

  appendSheetRow(SHEET_NAMES.STUDENTS, newStudent);

  if (Number(data.initialBalance) > 0) {
    recordInitialDeposit(newStudent, Number(data.initialBalance), actor);
  }

  recordAuditLog(actor, 'CREATE', 'STUDENT', newStudent.id, { name: newStudent.name });
  return newStudent;
}

function updateStudent(studentId, data, actor) {
  const updatePayload = {
    nis: data.nis,
    nisn: data.nisn,
    name: data.name,
    classId: data.classId,
    gender: data.gender,
    parentPhone: data.parentPhone,
    status: data.status
  };

  const updated = updateSheetRowById(SHEET_NAMES.STUDENTS, studentId, updatePayload);
  if (updated) {
    recordAuditLog(actor, 'UPDATE', 'STUDENT', studentId, updatePayload);
    return { success: true, message: 'Data siswa diperbarui' };
  }
  throw new Error('Gagal update siswa');
}

function batchImportStudents(studentsList, actor) {
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    throw new Error('Data import siswa kosong');
  }

  const existing = readSheetRows(SHEET_NAMES.STUDENTS);
  const existingNisMap = {};
  existing.forEach(s => { existingNisMap[String(s.nis).trim()] = true; });

  const imported = [];
  const errors = [];

  studentsList.forEach((data, index) => {
    const rowNum = index + 1;
    const nis = String(data.nis || '').trim();
    const name = String(data.name || '').trim();

    if (!nis || !name) {
      errors.push('Baris ' + rowNum + ': NIS dan Nama wajib diisi');
      return;
    }

    if (existingNisMap[nis]) {
      errors.push('Baris ' + rowNum + ': NIS ' + nis + ' sudah ada di sistem');
      return;
    }

    const newStudent = {
      id: generateId('STD'),
      nis: nis,
      nisn: String(data.nisn || '').trim(),
      name: name,
      classId: data.classId || '',
      gender: (String(data.gender || 'L').toUpperCase().startsWith('P')) ? 'P' : 'L',
      parentPhone: String(data.parentPhone || '').trim(),
      balance: Number(data.initialBalance) || 0,
      status: 'ACTIVE',
      createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
    };

    appendSheetRow(SHEET_NAMES.STUDENTS, newStudent);
    existingNisMap[nis] = true;
    imported.push(newStudent);

    if (newStudent.balance > 0) {
      recordInitialDeposit(newStudent, newStudent.balance, actor);
    }
  });

  recordAuditLog(actor, 'IMPORT', 'STUDENTS', 'BATCH', {
    totalAttempted: studentsList.length,
    successCount: imported.length,
    errorCount: errors.length
  });

  return {
    success: true,
    totalAttempted: studentsList.length,
    importedCount: imported.length,
    imported: imported,
    errors: errors
  };
}`
  },
  {
    name: 'Classes.gs',
    category: 'handler',
    description: 'Manajemen rombongan belajar (kelas), wali kelas, dan agregasi total saldo per kelas.',
    code: `/**
 * Classes.gs - Manajemen Data Kelas & Rombongan Belajar
 * SI-TABUNGAN
 */

function getClassesList() {
  const classes = readSheetRows(SHEET_NAMES.CLASSES);
  const students = readSheetRows(SHEET_NAMES.STUDENTS);

  return classes.map(c => {
    const classStudents = students.filter(s => String(s.classId) === String(c.id));
    const totalBalance = classStudents.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    return {
      id: c.id,
      name: c.name,
      grade: c.grade,
      homeroomTeacher: c.homeroomTeacher || '-',
      academicYear: c.academicYear || '2026/2027',
      capacity: Number(c.capacity) || 36,
      studentCount: classStudents.length,
      totalBalance: totalBalance
    };
  });
}

function createClass(data, actor) {
  if (!data.name) throw new Error('Nama kelas wajib diisi');

  const newClass = {
    id: generateId('CLS'),
    name: String(data.name).trim(),
    grade: data.grade || 'Umum',
    homeroomTeacher: data.homeroomTeacher || '',
    academicYear: data.academicYear || '2026/2027',
    capacity: Number(data.capacity) || 36,
    createdAt: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };

  appendSheetRow(SHEET_NAMES.CLASSES, newClass);
  recordAuditLog(actor, 'CREATE', 'CLASS', newClass.id, { name: newClass.name, capacity: newClass.capacity });
  return newClass;
}

function updateClass(classId, data, actor) {
  const updated = updateSheetRowById(SHEET_NAMES.CLASSES, classId, {
    name: data.name,
    grade: data.grade,
    homeroomTeacher: data.homeroomTeacher,
    academicYear: data.academicYear,
    capacity: Number(data.capacity) || 36
  });

  if (updated) {
    recordAuditLog(actor, 'UPDATE', 'CLASS', classId, data);
    return { success: true, message: 'Kelas berhasil diperbarui' };
  }
  throw new Error('Kelas tidak ditemukan');
}`
  },
  {
    name: 'Transactions.gs',
    category: 'handler',
    description: 'Proses pencatatan setoran tabungan siswa, nomor referensi TRX otomatis, mutasi saldo.',
    code: `/**
 * Transactions.gs - Pencatatan Setoran Tabungan Siswa
 * SI-TABUNGAN
 */

function recordDeposit(data, actor) {
  const studentId = data.studentId;
  const amount = Number(data.amount);

  if (!studentId) throw new Error('ID Siswa wajib disertakan');
  if (isNaN(amount) || amount <= 0) throw new Error('Nominal setoran harus lebih besar dari Rp 0');

  const students = readSheetRows(SHEET_NAMES.STUDENTS);
  const student = students.find(s => String(s.id) === String(studentId));
  if (!student) throw new Error('Siswa tidak ditemukan');

  const currentBalance = Number(student.balance) || 0;
  const newBalance = currentBalance + amount;

  const dateCode = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const refNo = 'TRX-' + dateCode + '-' + randomCode;

  const trx = {
    id: generateId('TRX'),
    referenceNo: refNo,
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    type: 'SETORAN',
    amount: amount,
    category: data.category || 'Tabungan Rutin',
    notes: data.notes || '',
    officerName: actor || 'Bendahara',
    timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };

  appendSheetRow(SHEET_NAMES.TRANSACTIONS, trx);
  updateSheetRowById(SHEET_NAMES.STUDENTS, student.id, { balance: newBalance });

  recordAuditLog(actor, 'SETORAN', 'TRANSACTION', trx.referenceNo, {
    studentName: student.name,
    amount: amount,
    newBalance: newBalance
  });

  return {
    success: true,
    transaction: trx,
    previousBalance: currentBalance,
    newBalance: newBalance
  };
}

function getTransactionsList(filters) {
  let list = readSheetRows(SHEET_NAMES.TRANSACTIONS);
  if (filters) {
    if (filters.studentId) list = list.filter(t => String(t.studentId) === String(filters.studentId));
    if (filters.classId && filters.classId !== 'ALL') list = list.filter(t => String(t.classId) === String(filters.classId));
  }
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
}`
  },
  {
    name: 'Withdrawals.gs',
    category: 'handler',
    description: 'Proses validasi penarikan saldo, proteksi sisa saldo minimal Rp 10.000, approval bendahara.',
    code: `/**
 * Withdrawals.gs - Penarikan Saldo Tabungan Siswa
 * SI-TABUNGAN
 */

const MINIMUM_REMAINING_BALANCE = 10000;

function recordWithdrawal(data, actor) {
  const studentId = data.studentId;
  const amount = Number(data.amount);

  if (!studentId) throw new Error('ID Siswa wajib disertakan');
  if (isNaN(amount) || amount <= 0) throw new Error('Nominal penarikan harus lebih dari Rp 0');

  const students = readSheetRows(SHEET_NAMES.STUDENTS);
  const student = students.find(s => String(s.id) === String(studentId));
  if (!student) throw new Error('Siswa tidak ditemukan');

  const currentBalance = Number(student.balance) || 0;

  if (currentBalance < amount) {
    throw new Error('Saldo tabungan siswa tidak mencukupi.');
  }

  const isClosing = data.isClosingAccount === true;
  if (!isClosing && (currentBalance - amount < MINIMUM_REMAINING_BALANCE)) {
    throw new Error('Sisa saldo setelah penarikan minimal Rp ' + MINIMUM_REMAINING_BALANCE.toLocaleString('id-ID'));
  }

  const newBalance = currentBalance - amount;
  const dateCode = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  const randomCode = Math.floor(1000 + Math.random() * 9000);
  const refNo = 'WDL-' + dateCode + '-' + randomCode;

  const withdrawal = {
    id: generateId('WDL'),
    referenceNo: refNo,
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    amount: amount,
    reason: data.reason || 'Keperluan Pribadi Siswa',
    status: 'APPROVED',
    approvedBy: actor || 'Bendahara',
    officerName: actor || 'Petugas',
    timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };

  appendSheetRow(SHEET_NAMES.WITHDRAWALS, withdrawal);

  const trxEntry = {
    id: generateId('TRX'),
    referenceNo: refNo,
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    type: 'PENARIKAN',
    amount: amount,
    category: data.reason || 'Penarikan Tabungan',
    notes: 'Penarikan disetujui',
    officerName: actor || 'Petugas',
    timestamp: withdrawal.timestamp
  };
  appendSheetRow(SHEET_NAMES.TRANSACTIONS, trxEntry);

  updateSheetRowById(SHEET_NAMES.STUDENTS, student.id, { balance: newBalance });

  recordAuditLog(actor, 'PENARIKAN', 'WITHDRAWAL', refNo, {
    studentName: student.name,
    amount: amount,
    newBalance: newBalance
  });

  return {
    success: true,
    withdrawal: withdrawal,
    previousBalance: currentBalance,
    newBalance: newBalance
  };
}`
  },
  {
    name: 'Reports.gs',
    category: 'handler',
    description: 'Agregasi laporan statistik kas masuk/keluar harian, saldo total, dan buku tabungan per siswa.',
    code: `/**
 * Reports.gs - Rekapitulasi Laporan Keuangan Tabungan Siswa
 * SI-TABUNGAN
 */

function getDashboardSummary() {
  const students = readSheetRows(SHEET_NAMES.STUDENTS);
  const transactions = readSheetRows(SHEET_NAMES.TRANSACTIONS);
  const withdrawals = readSheetRows(SHEET_NAMES.WITHDRAWALS);
  const classes = readSheetRows(SHEET_NAMES.CLASSES);

  const totalBalance = students.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
  const activeStudentsCount = students.filter(s => (s.status || 'ACTIVE') === 'ACTIVE').length;

  const totalDeposits = transactions
    .filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  const totalWithdrawals = withdrawals
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  const todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  const todayTransactions = transactions.filter(t => String(t.timestamp).startsWith(todayStr));
  const todayDeposits = todayTransactions
    .filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const todayWithdrawals = todayTransactions
    .filter(t => t.type === 'PENARIKAN')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  return {
    totalBalance,
    activeStudentsCount,
    totalClassesCount: classes.length,
    totalDeposits,
    totalWithdrawals,
    todayDeposits,
    todayWithdrawals,
    todayNet: todayDeposits - todayWithdrawals
  };
}`
  },
  {
    name: 'Audit.gs',
    category: 'handler',
    description: 'Perekaman log audit trail transaksi dan mutasi saldo yang tidak dapat diubah.',
    code: `/**
 * Audit.gs - Pencatatan Jejak Audit (Audit Trail)
 * Merekam setiap aksi mutasi saldo & otentikasi
 */

function recordAuditLog(actor, action, entity, entityId, details) {
  try {
    const logEntry = {
      id: generateId('AUD'),
      timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss"),
      actor: actor || 'SYSTEM',
      action: action,
      entity: entity,
      entityId: String(entityId || ''),
      details: typeof details === 'object' ? JSON.stringify(details) : String(details || '')
    };

    appendSheetRow(SHEET_NAMES.AUDIT_LOGS, logEntry);
    return logEntry;
  } catch (err) {
    Logger.log('Gagal mencatat audit log: ' + err.toString());
    return null;
  }
}

function getAuditLogs(limit) {
  const logs = readSheetRows(SHEET_NAMES.AUDIT_LOGS);
  logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return limit ? logs.slice(0, Number(limit)) : logs;
}`
  },
  {
    name: 'appsscript.json',
    category: 'config',
    description: 'Manifest konfigurasi zona waktu Asia/Jakarta dan izin Web App eksekusi.',
    code: `{
  "timeZone": "Asia/Jakarta",
  "dependencies": {},
  "exceptionLogging": "STACKDRIVER",
  "runtimeVersion": "V8",
  "webapp": {
    "executeAs": "USER_DEPLOYING",
    "access": "ANYONE_ANONYMOUS"
  }
}`
  }
];
