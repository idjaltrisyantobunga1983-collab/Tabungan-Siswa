# Backend Google Apps Script & Google Sheets - SI-TABUNGAN

Panduan instalasi dan deployment backend Google Apps Script untuk Sistem Informasi Tabungan Siswa (SI-TABUNGAN).

---

## 📁 Struktur Berkas `apps-script/`

- **`appsscript.json`**: Manifest konfigurasi proyek Apps Script (Zona waktu `Asia/Jakarta`, otorisasi Web App).
- **`Code.gs`**: Router utama request HTTP (`doGet` & `doPost`), format respon JSON, handling error.
- **`Database.gs`**: Inisialisasi sheet otomatis (`USERS`, `CLASSES`, `STUDENTS`, `TRANSACTIONS`, `WITHDRAWALS`, `AUDIT_LOGS`, `SETTINGS`) dan query CRUD helper.
- **`Auth.gs`**: Login akun petugas (Admin, Bendahara, Wali Kelas), hash password SHA-256, session token.
- **`Students.gs`**: CRUD data siswa (NIS, NISN, Nama, Kelas, Jenis Kelamin, No. HP Ortu, Saldo Tabungan).
- **`Classes.gs`**: Data rombel/kelas (Nama Kelas, Tingkat, Wali Kelas, Tahun Ajaran, Agregasi Saldo).
- **`Transactions.gs`**: Pencatatan setoran tabungan (Setoran Rutin, Setoran Awal), penomoran bukti otomatis (`TRX-YYYYMMDD-XXXX`), mutasi saldo.
- **`Withdrawals.gs`**: Validasi penarikan saldo, batas minimum saldo mengendap (Rp 10.000), approval petugas, debit jurnal transaksi.
- **`Reports.gs`**: Rekapitulasi keuangan harian & bulanan, statistik saldo per kelas, buku mutasi tabungan siswa.
- **`Audit.gs`**: Pencatatan jejak audit (Audit Trail) otomatis setiap mutasi untuk akuntabilitas bendahara.

---

## 🚀 Langkah-Langkah Deployment ke Google Sheets

### 1. Buat Spreadsheet Baru
1. Buka [Google Sheets](https://sheets.new).
2. Beri nama spreadsheet, contoh: `SI-TABUNGAN - Database Keuangan Siswa`.

### 2. Buka Apps Script Editor
1. Di menu Google Sheets, klik **Ekstensi** > **Apps Script**.
2. Beri nama proyek: `SI-TABUNGAN Backend`.

### 3. Salin Kode Berkas `.gs`
Buat berkas skrip baru di editor Apps Script sesuai nama berkas di folder ini dan salin isinya:
- `Code.gs`
- `Auth.gs`
- `Students.gs`
- `Classes.gs`
- `Transactions.gs`
- `Withdrawals.gs`
- `Reports.gs`
- `Audit.gs`
- `Database.gs`
- (Opsional) Buka **Project Settings** (ikon roda gigi) > centang *"Show "appsscript.json" manifest file in editor"*, lalu sesuaikan isi `appsscript.json`.

### 4. Inisialisasi Database Pertama Kali
1. Di editor Apps Script, pilih fungsi `setupDatabase` pada dropdown fungsi di atas toolbar.
2. Klik tombol **Jalankan (Run)**.
3. Google akan meminta izin akses ("Authorization Required") -> Klik **Review Permissions** -> Pilih akun Google -> Klik **Advanced** -> Klik **Go to SI-TABUNGAN (unsafe)** -> Klik **Allow**.
4. Spreadsheet Anda akan otomatis terbuat 7 sheet dengan header yang rapi dan akun default!

### 5. Akun Pengguna Bawaan (Default Login)
| Peran | Username | Password |
|---|---|---|
| Administrator Utama | `Bunga1983` | `12345678` |
| Administrator Sistem | `admin` | `admin123` |
| Bendahara Sekolah | `bendahara` | `bendahara123` |
| Wali Kelas | `walikelas` | `guru123` |

### 6. Deploy sebagai Web App
1. Klik tombol biru **Deploy** (Terapkan) di kanan atas > **Penerapan Baru (New Deployment)**.
2. Klik ikon gerigi (Select type) > pilih **Aplikasi Web (Web app)**.
3. Konfigurasi:
   - **Deskripsi**: `SI-TABUNGAN Production v1.0`
   - **Jalankan sebagai (Execute as)**: `Saya (User deploying)`
   - **Siapa yang memiliki akses (Who has access)**: `Siapa saja (Anyone)`
4. Klik **Terapkan (Deploy)**.
5. Salin **URL Aplikasi Web (Web App URL)** yang berformat:
   `https://script.google.com/macros/s/AKfycbx.../exec`

### 7. Hubungkan dengan Frontend React
Buka aplikasi web ini, masuk ke tab **Pengaturan / Integrasi Apps Script**, lalu tempelkan URL Web App tersebut dan klik **Uji Koneksi & Simpan**.
Aplikasi akan langsung tersinkronisasi dua arah dengan Google Sheets Anda!
