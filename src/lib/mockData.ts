import { ClassItem, Student, Transaction, Withdrawal, AuditLog, SchoolSettings, User } from '../types';

export const INITIAL_USERS: User[] = [
  { id: 'USR-000', username: 'Bunga1983', fullName: 'Idjal Trisyanto Bunga, S.Pd', role: 'ADMIN', status: 'ACTIVE', password: '12345678' },
  { id: 'USR-001', username: 'admin', fullName: 'Administrator Sistem', role: 'ADMIN', status: 'ACTIVE', password: 'admin123' },
  { id: 'USR-002', username: 'bendahara', fullName: 'Ibu Hj. Rahmawati, S.Pd', role: 'BENDAHARA', status: 'ACTIVE', password: 'bendahara123' },
  { id: 'USR-003', username: 'walikelas', fullName: 'Bpk. Ahmad Fauzi, M.Pd', role: 'WALI_KELAS', status: 'ACTIVE', password: 'guru123' }
];

export const INITIAL_CLASSES: ClassItem[] = [
  { id: 'CLS-001', name: 'X-RPL 1', grade: 'X', homeroomTeacher: 'Bpk. Hendra Gunawan, S.Kom', academicYear: '2026/2027', capacity: 36, studentCount: 5, totalBalance: 1450000 },
  { id: 'CLS-002', name: 'X-RPL 2', grade: 'X', homeroomTeacher: 'Ibu Ratna Dewi, S.Pd', academicYear: '2026/2027', capacity: 36, studentCount: 4, totalBalance: 980000 },
  { id: 'CLS-003', name: 'XI-TKJ 1', grade: 'XI', homeroomTeacher: 'Bpk. Budi Santoso, M.T', academicYear: '2026/2027', capacity: 36, studentCount: 4, totalBalance: 1220000 },
  { id: 'CLS-004', name: 'XII-MM 1', grade: 'XII', homeroomTeacher: 'Ibu Siti Nurhaliza, S.Pd', academicYear: '2026/2027', capacity: 36, studentCount: 3, totalBalance: 750000 }
];

export const INITIAL_STUDENTS: Student[] = [
  {
    id: 'STD-1001',
    nis: '26001',
    nisn: '0089123451',
    name: 'Muhammad Farhan Pratama',
    classId: 'CLS-001',
    className: 'X-RPL 1',
    gender: 'L',
    parentPhone: '081234567890',
    balance: 450000,
    status: 'ACTIVE',
    createdAt: '2026-08-01 08:30:00'
  },
  {
    id: 'STD-1002',
    nis: '26002',
    nisn: '0089123452',
    name: 'Aisyah Putri Maharani',
    classId: 'CLS-001',
    className: 'X-RPL 1',
    gender: 'P',
    parentPhone: '081298765432',
    balance: 320000,
    status: 'ACTIVE',
    createdAt: '2026-08-01 08:35:00'
  },
  {
    id: 'STD-1003',
    nis: '26003',
    nisn: '0089123453',
    name: 'Rizky Ramadhan',
    classId: 'CLS-001',
    className: 'X-RPL 1',
    gender: 'L',
    parentPhone: '085712349988',
    balance: 280000,
    status: 'ACTIVE',
    createdAt: '2026-08-01 08:40:00'
  },
  {
    id: 'STD-1004',
    nis: '26004',
    nisn: '0089123454',
    name: 'Dewi Anjani',
    classId: 'CLS-001',
    className: 'X-RPL 1',
    gender: 'P',
    parentPhone: '081377889900',
    balance: 250000,
    status: 'ACTIVE',
    createdAt: '2026-08-02 09:00:00'
  },
  {
    id: 'STD-1005',
    nis: '26005',
    nisn: '0089123455',
    name: 'Dimas Bagus Saputra',
    classId: 'CLS-001',
    className: 'X-RPL 1',
    gender: 'L',
    parentPhone: '082165432190',
    balance: 150000,
    status: 'ACTIVE',
    createdAt: '2026-08-02 09:15:00'
  },
  {
    id: 'STD-1006',
    nis: '26006',
    nisn: '0089123456',
    name: 'Siti Zahra Aliyah',
    classId: 'CLS-002',
    className: 'X-RPL 2',
    gender: 'P',
    parentPhone: '089612340011',
    balance: 310000,
    status: 'ACTIVE',
    createdAt: '2026-08-03 08:10:00'
  },
  {
    id: 'STD-1007',
    nis: '26007',
    nisn: '0089123457',
    name: 'Bagus Tri Pamungkas',
    classId: 'CLS-002',
    className: 'X-RPL 2',
    gender: 'L',
    parentPhone: '087890123456',
    balance: 220000,
    status: 'ACTIVE',
    createdAt: '2026-08-03 08:20:00'
  },
  {
    id: 'STD-1008',
    nis: '26008',
    nisn: '0089123458',
    name: 'Nabila Syakieb Khairunisa',
    classId: 'CLS-002',
    className: 'X-RPL 2',
    gender: 'P',
    parentPhone: '081233445566',
    balance: 250000,
    status: 'ACTIVE',
    createdAt: '2026-08-04 10:00:00'
  },
  {
    id: 'STD-1009',
    nis: '26009',
    nisn: '0089123459',
    name: 'Raffi Aditya',
    classId: 'CLS-002',
    className: 'X-RPL 2',
    gender: 'L',
    parentPhone: '085299887766',
    balance: 200000,
    status: 'ACTIVE',
    createdAt: '2026-08-04 10:20:00'
  },
  {
    id: 'STD-1010',
    nis: '25010',
    nisn: '0078123460',
    name: 'Gilang Prasetyo',
    classId: 'CLS-003',
    className: 'XI-TKJ 1',
    gender: 'L',
    parentPhone: '081399001122',
    balance: 400000,
    status: 'ACTIVE',
    createdAt: '2025-08-01 08:00:00'
  },
  {
    id: 'STD-1011',
    nis: '25011',
    nisn: '0078123461',
    name: 'Clara Bella Safitri',
    classId: 'CLS-003',
    className: 'XI-TKJ 1',
    gender: 'P',
    parentPhone: '081288997700',
    balance: 350000,
    status: 'ACTIVE',
    createdAt: '2025-08-01 08:30:00'
  },
  {
    id: 'STD-1012',
    nis: '25012',
    nisn: '0078123462',
    name: 'Fandi Kurniawan',
    classId: 'CLS-003',
    className: 'XI-TKJ 1',
    gender: 'L',
    parentPhone: '082155443322',
    balance: 270000,
    status: 'ACTIVE',
    createdAt: '2025-08-02 09:00:00'
  },
  {
    id: 'STD-1013',
    nis: '25013',
    nisn: '0078123463',
    name: 'Putri Ayu Wandira',
    classId: 'CLS-003',
    className: 'XI-TKJ 1',
    gender: 'P',
    parentPhone: '087766554433',
    balance: 200000,
    status: 'ACTIVE',
    createdAt: '2025-08-02 09:30:00'
  },
  {
    id: 'STD-1014',
    nis: '24014',
    nisn: '0067123464',
    name: 'Aldi Taher Nugraha',
    classId: 'CLS-004',
    className: 'XII-MM 1',
    gender: 'L',
    parentPhone: '081900112233',
    balance: 300000,
    status: 'ACTIVE',
    createdAt: '2024-08-01 08:00:00'
  },
  {
    id: 'STD-1015',
    nis: '24015',
    nisn: '0067123465',
    name: 'Mega Utami',
    classId: 'CLS-004',
    className: 'XII-MM 1',
    gender: 'P',
    parentPhone: '085611223344',
    balance: 250000,
    status: 'ACTIVE',
    createdAt: '2024-08-01 08:30:00'
  },
  {
    id: 'STD-1016',
    nis: '24016',
    nisn: '0067123466',
    name: 'Rian Dwi Syahputra',
    classId: 'CLS-004',
    className: 'XII-MM 1',
    gender: 'L',
    parentPhone: '081244556677',
    balance: 200000,
    status: 'ACTIVE',
    createdAt: '2024-08-02 09:00:00'
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'TRX-101',
    referenceNo: 'TRX-20261027-1001',
    studentId: 'STD-1001',
    studentName: 'Muhammad Farhan Pratama',
    classId: 'CLS-001',
    type: 'SETORAN',
    amount: 50000,
    category: 'Tabungan Rutin Harian',
    notes: 'Uang saku disisihkan',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-27 08:15:00'
  },
  {
    id: 'TRX-102',
    referenceNo: 'TRX-20261027-1002',
    studentId: 'STD-1002',
    studentName: 'Aisyah Putri Maharani',
    classId: 'CLS-001',
    type: 'SETORAN',
    amount: 30000,
    category: 'Tabungan Rutin Harian',
    notes: 'Setoran hari Selasa',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-27 08:25:00'
  },
  {
    id: 'TRX-103',
    referenceNo: 'TRX-20261027-1003',
    studentId: 'STD-1006',
    studentName: 'Siti Zahra Aliyah',
    classId: 'CLS-002',
    type: 'SETORAN',
    amount: 50000,
    category: 'Tabungan Rutin Mingguan',
    notes: 'Setoran kas siswa',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-27 08:45:00'
  },
  {
    id: 'TRX-104',
    referenceNo: 'TRX-20261026-2001',
    studentId: 'STD-1010',
    studentName: 'Gilang Prasetyo',
    classId: 'CLS-003',
    type: 'SETORAN',
    amount: 100000,
    category: 'Tabungan Kurban / Khusus',
    notes: 'Tabungan rencana kurban',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-26 09:10:00'
  },
  {
    id: 'TRX-105',
    referenceNo: 'WDL-20261026-3001',
    studentId: 'STD-1003',
    studentName: 'Rizky Ramadhan',
    classId: 'CLS-001',
    type: 'PENARIKAN',
    amount: 50000,
    category: 'Pembelian Buku Pelajaran',
    notes: 'Disetujui wali kelas untuk beli modul praktikum',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-26 11:30:00'
  },
  {
    id: 'TRX-106',
    referenceNo: 'TRX-20261025-4001',
    studentId: 'STD-1014',
    studentName: 'Aldi Taher Nugraha',
    classId: 'CLS-004',
    type: 'SETORAN',
    amount: 50000,
    category: 'Tabungan Kelulusan',
    notes: 'Persiapan wisuda',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-25 10:15:00'
  }
];

export const INITIAL_WITHDRAWALS: Withdrawal[] = [
  {
    id: 'WDL-3001',
    referenceNo: 'WDL-20261026-3001',
    studentId: 'STD-1003',
    studentName: 'Rizky Ramadhan',
    classId: 'CLS-001',
    amount: 50000,
    reason: 'Pembelian Buku & Modul Praktikum Kejuruan',
    status: 'APPROVED',
    approvedBy: 'Ibu Hj. Rahmawati (Bendahara)',
    officerName: 'Ibu Rahma',
    timestamp: '2026-10-26 11:30:00'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'AUD-9001',
    timestamp: '2026-10-27 08:25:12',
    actor: 'bendahara',
    action: 'SETORAN',
    entity: 'TRANSACTION',
    entityId: 'TRX-20261027-1002',
    details: { student: 'Aisyah Putri Maharani', amount: 30000, newBalance: 320000 }
  },
  {
    id: 'AUD-9002',
    timestamp: '2026-10-27 08:15:05',
    actor: 'bendahara',
    action: 'SETORAN',
    entity: 'TRANSACTION',
    entityId: 'TRX-20261027-1001',
    details: { student: 'Muhammad Farhan Pratama', amount: 50000, newBalance: 450000 }
  },
  {
    id: 'AUD-9003',
    timestamp: '2026-10-26 11:30:00',
    actor: 'bendahara',
    action: 'PENARIKAN',
    entity: 'WITHDRAWAL',
    entityId: 'WDL-20261026-3001',
    details: { student: 'Rizky Ramadhan', amount: 50000, reason: 'Beli Modul' }
  },
  {
    id: 'AUD-9004',
    timestamp: '2026-10-25 08:00:00',
    actor: 'admin',
    action: 'SYSTEM_INIT',
    entity: 'DATABASE',
    entityId: 'ROOT',
    details: 'Database Google Sheets diinisialisasi dan disinkronkan'
  }
];

export const DEFAULT_SETTINGS: SchoolSettings = {
  schoolName: 'SMK BINA BANGSA NUSANTARA',
  schoolMotto: 'Membina Generasi Unggul, Cerdas Finansial & Berkarakter',
  address: 'Jl. Pendidikan Merdeka No. 45, Jakarta Selatan',
  phone: '(021) 7890-1234 / 0812-3456-7890',
  principalName: 'Dr. H. Sulaiman, M.Pd',
  treasurerName: 'Ibu Hj. Rahmawati, S.Pd',
  currencySymbol: 'Rp',
  minBalance: 10000,
  appsScriptUrl: '',
  syncMode: 'mock'
};
