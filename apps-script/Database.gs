/**
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

/**
 * Mendapatkan Spreadsheet aktif atau berdasarkan ID properti
 */
function getSpreadsheet() {
  const customId = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (customId) {
    return SpreadsheetApp.openById(customId);
  }
  return SpreadsheetApp.getActiveSpreadsheet();
}

/**
 * Inisialisasi awal seluruh tabel sheet & header kolom otomatis
 */
function setupDatabase() {
  const ss = getSpreadsheet();

  const schemas = {
    [SHEET_NAMES.USERS]: ['id', 'username', 'passwordHash', 'fullName', 'role', 'status', 'createdAt'],
    [SHEET_NAMES.CLASSES]: ['id', 'name', 'grade', 'homeroomTeacher', 'academicYear', 'capacity', 'createdAt'],
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
    // Set headers if empty
    if (sheet.getLastRow() === 0) {
      const headers = schemas[name];
      sheet.appendRow(headers);
      sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#0f766e').setFontColor('#ffffff');
      sheet.setFrozenRows(1);
    }
  });

  // Seed default admin jika USERS kosong
  seedDefaultUsers(ss);

  return { success: true, message: 'Database initialized successfully with all required schemas.' };
}

/**
 * Helper untuk membaca seluruh baris sheet sebagai array object
 */
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
    // Abaikan baris kosong
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

/**
 * Helper untuk append row object sesuai headers
 */
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

/**
 * Helper untuk update row berdasarkan ID di kolom pertama 'id'
 */
function updateSheetRowById(sheetName, id, updateObj) {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(sheetName);
  if (!sheet) throw new Error('Sheet ' + sheetName + ' tidak ditemukan');

  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return false;

  const headers = data[0].map(h => String(h).trim());
  const idColIndex = headers.indexOf('id');
  if (idColIndex === -1) throw new Error('Kolom id tidak ditemukan pada sheet ' + sheetName);

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

/**
 * Generate unique ID
 */
function generateId(prefix) {
  const dateStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyMMddHHmmss");
  const random = Math.floor(1000 + Math.random() * 9000);
  return (prefix || 'ID') + '-' + dateStr + '-' + random;
}
