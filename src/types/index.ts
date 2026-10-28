export type UserRole = 'ADMIN' | 'BENDAHARA' | 'WALI_KELAS' | 'SISWA';

export interface User {
  id: string;
  username: string;
  fullName: string;
  role: UserRole;
  status?: string;
  password?: string;
  studentId?: string;
  studentData?: Student;
}

export interface ClassItem {
  id: string;
  name: string;
  grade: string;
  homeroomTeacher: string;
  academicYear: string;
  capacity?: number;
  studentCount?: number;
  totalBalance?: number;
}

export interface Student {
  id: string;
  nis: string;
  nisn: string;
  name: string;
  classId: string;
  className?: string;
  gender: 'L' | 'P';
  parentPhone: string;
  balance: number;
  status: 'ACTIVE' | 'GRADUATED' | 'TRANSFERRED' | 'INACTIVE';
  createdAt?: string;
}

export type TransactionType = 'SETORAN' | 'SETORAN_AWAL' | 'PENARIKAN';

export interface Transaction {
  id: string;
  referenceNo: string;
  studentId: string;
  studentName: string;
  classId: string;
  type: TransactionType;
  amount: number;
  category: string;
  notes?: string;
  officerName: string;
  timestamp: string;
}

export interface Withdrawal {
  id: string;
  referenceNo: string;
  studentId: string;
  studentName: string;
  classId: string;
  amount: number;
  reason: string;
  status: 'APPROVED' | 'PENDING' | 'REJECTED';
  approvedBy: string;
  officerName: string;
  timestamp: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  entity: string;
  entityId: string;
  details: string | Record<string, unknown>;
}

export interface ChartDayItem {
  date: string;
  label: string;
  deposits: number;
  withdrawals: number;
}

export interface ClassBreakdownItem {
  className: string;
  studentCount: number;
  balance: number;
}

export interface DashboardSummary {
  totalBalance: number;
  activeStudentsCount: number;
  totalClassesCount: number;
  totalDeposits: number;
  totalWithdrawals: number;
  todayDeposits: number;
  todayWithdrawals: number;
  todayNet: number;
  chartData: ChartDayItem[];
  classBreakdown: ClassBreakdownItem[];
}

export interface SchoolSettings {
  schoolName: string;
  schoolMotto: string;
  address: string;
  phone: string;
  principalName: string;
  treasurerName: string;
  currencySymbol: string;
  minBalance: number;
  appsScriptUrl: string;
  syncMode: 'mock' | 'live';
}

export interface AppsScriptFile {
  name: string;
  description: string;
  category: 'core' | 'handler' | 'data' | 'config';
  code: string;
}
