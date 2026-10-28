/**
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

  // Generate Reference No: TRX-YYYYMMDD-XXXX
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

  // Simpan transaksi
  appendSheetRow(SHEET_NAMES.TRANSACTIONS, trx);

  // Update saldo siswa
  updateSheetRowById(SHEET_NAMES.STUDENTS, student.id, { balance: newBalance });

  // Catat audit
  recordAuditLog(actor, 'SETORAN', 'TRANSACTION', trx.referenceNo, {
    studentId: student.id,
    studentName: student.name,
    amount: amount,
    previousBalance: currentBalance,
    newBalance: newBalance
  });

  return {
    success: true,
    transaction: trx,
    previousBalance: currentBalance,
    newBalance: newBalance
  };
}

function recordInitialDeposit(student, amount, actor) {
  const dateCode = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyyMMdd");
  const trx = {
    id: generateId('TRX'),
    referenceNo: 'INIT-' + dateCode + '-' + Math.floor(1000 + Math.random() * 9000),
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    type: 'SETORAN_AWAL',
    amount: amount,
    category: 'Saldo Awal Pembukaan',
    notes: 'Setoran awal saat pendaftaran siswa baru',
    officerName: actor || 'Admin',
    timestamp: Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd HH:mm:ss")
  };
  appendSheetRow(SHEET_NAMES.TRANSACTIONS, trx);
}

function getTransactionsList(filters) {
  let list = readSheetRows(SHEET_NAMES.TRANSACTIONS);

  if (filters) {
    if (filters.studentId) {
      list = list.filter(t => String(t.studentId) === String(filters.studentId));
    }
    if (filters.classId && filters.classId !== 'ALL') {
      list = list.filter(t => String(t.classId) === String(filters.classId));
    }
    if (filters.startDate) {
      list = list.filter(t => new Date(t.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(t => new Date(t.timestamp) <= end);
    }
  }

  // Sort descending by timestamp
  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
}
