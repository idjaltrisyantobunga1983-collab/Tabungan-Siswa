/**
 * Classes.gs - Manajemen Data Kelas & Rombongan Belajar
 * SI-TABUNGAN
 */

function getClassesList() {
  const classes = readSheetRows(SHEET_NAMES.CLASSES);
  const students = readSheetRows(SHEET_NAMES.STUDENTS);

  // Hitung jumlah siswa dan akumulasi saldo tabungan per kelas
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
}
