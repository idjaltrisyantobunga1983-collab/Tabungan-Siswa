/**
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
    return { success: false, message: 'Akun Anda telah dinonaktifkan. Hubungi Administrator.' };
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
    exp: new Date().getTime() + (24 * 60 * 60 * 1000) // 24 jam
  };
  return Utilities.base64Encode(JSON.stringify(payload));
}

function verifySessionToken(token) {
  if (!token) return null;
  try {
    const jsonStr = Utilities.newBlob(Utilities.base64Decode(token)).getDataAsString();
    const payload = JSON.parse(jsonStr);
    if (payload.exp < new Date().getTime()) {
      return null;
    }
    return payload;
  } catch (e) {
    return null;
  }
}
