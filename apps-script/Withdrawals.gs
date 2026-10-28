/**
 * Withdrawals.gs - Penarikan Saldo Tabungan Siswa
 * SI-TABUNGAN
 */

const MINIMUM_REMAINING_BALANCE = 10000; // Saldo mengendap minimum Rp 10.000

function recordWithdrawal(data, actor) {
  const studentId = data.studentId;
  const amount = Number(data.amount);

  if (!studentId) throw new Error('ID Siswa wajib disertakan');
  if (isNaN(amount) || amount <= 0) throw new Error('Nominal penarikan harus lebih dari Rp 0');

  const students = readSheetRows(SHEET_NAMES.STUDENTS);
  const student = students.find(s => String(s.id) === String(studentId));
  if (!student) throw new Error('Siswa tidak ditemukan');

  const currentBalance = Number(student.balance) || 0;

  // Validasi saldo mencukupi
  if (currentBalance < amount) {
    throw new Error('Saldo tabungan siswa tidak mencukupi. Saldo saat ini: Rp ' + currentBalance.toLocaleString('id-ID'));
  }

  // Validasi saldo minimum mengendap (bisa di-bypass jika penarikan penutupan rekening)
  const isClosing = data.isClosingAccount === true || data.reason === 'Penutupan Tabungan / Lulus';
  if (!isClosing && (currentBalance - amount < MINIMUM_REMAINING_BALANCE)) {
    throw new Error('Sisa saldo setelah penarikan minimal Rp ' + MINIMUM_REMAINING_BALANCE.toLocaleString('id-ID') + '. Maksimal penarikan: Rp ' + (currentBalance - MINIMUM_REMAINING_BALANCE).toLocaleString('id-ID'));
  }

  const newBalance = currentBalance - amount;

  // Generate Reference No: WDL-YYYYMMDD-XXXX
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

  // Simpan record penarikan
  appendSheetRow(SHEET_NAMES.WITHDRAWALS, withdrawal);

  // Catat juga ke jurnal transaksi umum sebagai debit/keluar
  const trxEntry = {
    id: generateId('TRX'),
    referenceNo: refNo,
    studentId: student.id,
    studentName: student.name,
    classId: student.classId,
    type: 'PENARIKAN',
    amount: amount,
    category: data.reason || 'Penarikan Tabungan',
    notes: 'Penarikan disetujui oleh: ' + (actor || 'Bendahara'),
    officerName: actor || 'Petugas',
    timestamp: withdrawal.timestamp
  };
  appendSheetRow(SHEET_NAMES.TRANSACTIONS, trxEntry);

  // Update saldo siswa
  updateSheetRowById(SHEET_NAMES.STUDENTS, student.id, { balance: newBalance });

  // Catat audit log
  recordAuditLog(actor, 'PENARIKAN', 'WITHDRAWAL', refNo, {
    studentId: student.id,
    studentName: student.name,
    amount: amount,
    previousBalance: currentBalance,
    newBalance: newBalance,
    reason: data.reason
  });

  return {
    success: true,
    withdrawal: withdrawal,
    previousBalance: currentBalance,
    newBalance: newBalance
  };
}

function getWithdrawalsList(filters) {
  let list = readSheetRows(SHEET_NAMES.WITHDRAWALS);

  if (filters) {
    if (filters.studentId) {
      list = list.filter(w => String(w.studentId) === String(filters.studentId));
    }
    if (filters.classId && filters.classId !== 'ALL') {
      list = list.filter(w => String(w.classId) === String(filters.classId));
    }
    if (filters.startDate) {
      list = list.filter(w => new Date(w.timestamp) >= new Date(filters.startDate));
    }
    if (filters.endDate) {
      const end = new Date(filters.endDate);
      end.setHours(23, 59, 59, 999);
      list = list.filter(w => new Date(w.timestamp) <= end);
    }
  }

  list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  return list;
}
