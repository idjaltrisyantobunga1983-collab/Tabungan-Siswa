/**
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
  if (!student) throw new Error('Siswa dengan ID ' + studentId + ' tidak ditemukan');
  return student;
}

function createStudent(data, actor) {
  if (!data.name || !data.nis) throw new Error('Nama dan NIS siswa wajib diisi');

  // Cek duplikasi NIS
  const existing = readSheetRows(SHEET_NAMES.STUDENTS);
  const isDuplicate = existing.some(s => String(s.nis).trim() === String(data.nis).trim());
  if (isDuplicate) throw new Error('NIS ' + data.nis + ' sudah terdaftar untuk siswa lain');

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

  // Jika ada setoran awal
  if (Number(data.initialBalance) > 0) {
    recordInitialDeposit(newStudent, Number(data.initialBalance), actor);
  }

  recordAuditLog(actor, 'CREATE', 'STUDENT', newStudent.id, { name: newStudent.name, nis: newStudent.nis });
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
    return { success: true, message: 'Data siswa berhasil diperbarui' };
  }
  throw new Error('Gagal memperbarui data siswa');
}

function batchImportStudents(studentsList, actor) {
  if (!Array.isArray(studentsList) || studentsList.length === 0) {
    throw new Error('Data import siswa kosong atau tidak valid');
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
      errors.push('Baris ' + rowNum + ': NIS ' + nis + ' sudah ada di sistem (duplikat)');
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
}
