/**
 * Reports.gs - Rekapitulasi Laporan Keuangan Tabungan Siswa
 * SI-TABUNGAN
 */

function getDashboardSummary() {
  const students = readSheetRows(SHEET_NAMES.STUDENTS);
  const transactions = readSheetRows(SHEET_NAMES.TRANSACTIONS);
  const withdrawals = readSheetRows(SHEET_NAMES.WITHDRAWALS);
  const classes = readSheetRows(SHEET_NAMES.CLASSES);

  // Total saldo terkumpul
  const totalBalance = students.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
  const activeStudentsCount = students.filter(s => (s.status || 'ACTIVE') === 'ACTIVE').length;

  // Total setoran akumulatif
  const totalDeposits = transactions
    .filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Total penarikan akumulatif
  const totalWithdrawals = withdrawals
    .reduce((sum, w) => sum + (Number(w.amount) || 0), 0);

  // Transaksi hari ini
  const todayStr = Utilities.formatDate(new Date(), "Asia/Jakarta", "yyyy-MM-dd");
  const todayTransactions = transactions.filter(t => String(t.timestamp).startsWith(todayStr));
  const todayDeposits = todayTransactions
    .filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
  const todayWithdrawals = todayTransactions
    .filter(t => t.type === 'PENARIKAN')
    .reduce((sum, t) => sum + (Number(t.amount) || 0), 0);

  // Transaksi 7 hari terakhir untuk grafik tren
  const recentDays = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateFormatted = Utilities.formatDate(d, "Asia/Jakarta", "yyyy-MM-dd");
    const label = Utilities.formatDate(d, "Asia/Jakarta", "dd MMM");

    const dayTrx = transactions.filter(t => String(t.timestamp).startsWith(dateFormatted));
    const dayDeposit = dayTrx.filter(t => t.type === 'SETORAN' || t.type === 'SETORAN_AWAL').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
    const dayWithdrawal = dayTrx.filter(t => t.type === 'PENARIKAN').reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

    recentDays.push({
      date: dateFormatted,
      label: label,
      deposits: dayDeposit,
      withdrawals: dayWithdrawal
    });
  }

  // Top kelas dengan tabungan terbanyak
  const classBreakdown = classes.map(c => {
    const classStudents = students.filter(s => String(s.classId) === String(c.id));
    const balance = classStudents.reduce((sum, s) => sum + (Number(s.balance) || 0), 0);
    return {
      className: c.name,
      studentCount: classStudents.length,
      balance: balance
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
    chartData: recentDays,
    classBreakdown: classBreakdown
  };
}

function getStudentMutationReport(studentId, startDate, endDate) {
  const student = getStudentById(studentId);
  const transactions = getTransactionsList({ studentId, startDate, endDate });

  return {
    student: student,
    transactions: transactions,
    period: {
      startDate: startDate || 'Awal',
      endDate: endDate || 'Saat ini'
    }
  };
}
