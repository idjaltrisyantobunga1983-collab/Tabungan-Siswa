# SI-TABUNGAN - Sistem Informasi Tabungan Siswa

Aplikasi manajemen keuangan & buku tabungan siswa sekolah terintegrasi dengan Google Sheets menggunakan Google Apps Script Web App API serta antarmuka modern React 19 + Tailwind CSS.

## 🗂️ Struktur Proyek

```text
├── apps-script/                 # Backend Google Apps Script (Serverless di Google Sheets)
│   ├── appsscript.json          # Manifest Apps Script (Timezone & Scope)
│   ├── Code.gs                  # HTTP router (doGet & doPost) & CORS handling
│   ├── Auth.gs                  # Manajemen user & otentikasi SHA-256
│   ├── Students.gs              # CRUD siswa, mutasi saldo, filter kelas
│   ├── Classes.gs               # Master data kelas & rekapitulasi rombel
│   ├── Transactions.gs          # Jurnal setoran tabungan & nomor bukti TRX
│   ├── Withdrawals.gs           # Validasi penarikan & saldo minimum mengendap
│   ├── Reports.gs               # Rekap statistik keuangan & buku tabungan
│   ├── Audit.gs                 # Audit trail pencatatan aktivitas pengguna
│   ├── Database.gs              # Migrasi & inisialisasi sheet otomatis
│   └── README.md                # Panduan deployment Google Apps Script
│
├── public/                      # Static assets & icons
│
├── src/                         # Frontend React + TypeScript
│   ├── app/                     # Navigasi & layout container
│   ├── components/              # Komponen UI modular
│   │   ├── Dashboard/           # Kartu statistik ringkasan, grafik mutasi
│   │   ├── Students/            # Tabel siswa, tambah/edit, detail buku tabungan
│   │   ├── Transactions/        # Form setoran cepat, kwitansi cetak, riwayat
│   │   ├── Withdrawals/         # Form penarikan, validasi saldo, persetujuan
│   │   ├── Reports/             # Rekap kas masuk/keluar, filter periode, export
│   │   ├── Audit/               # Log aktivitas sistem & jejak mutasi
│   │   ├── AppsScriptStudio/    # Code viewer, panduan setup, uji endpoint live
│   │   └── Settings/            # Konfigurasi URL Apps Script, profil sekolah
│   ├── lib/                     # Utilitas, mock database, Apps Script client
│   ├── types/                   # Type definition TypeScript
│   ├── App.tsx                  # Root component
│   └── main.tsx                 # Application entry point
│
├── .env.example                 # Contoh environment variables
├── metadata.json                # Metadata AI Studio
├── package.json                 # Node dependencies
└── tsconfig.json                # TypeScript configuration
```

## ✨ Fitur Utama

1. **Dashboard Eksekutif**:
   - Total saldo tabungan seluruh siswa saat ini.
   - Total setoran & penarikan kumulatif serta hari ini.
   - Grafik tren kas 7 hari terakhir.
   - Distribusi saldo berdasarkan kelas / rombel.

2. **Manajemen Siswa & Buku Tabungan**:
   - Master data siswa lengkap (NIS, NISN, Nama, Kelas, Jenis Kelamin, Kontak Orang Tua).
   - Buku Tabungan Digital per siswa (riwayat mutasi kredit/debit lengkap).
   - Cetak Kartu Tabungan Siswa dengan QR Code.

3. **Transaksi Setoran (Deposit)**:
   - Pencarian siswa cepat by NIS atau Nama.
   - Nominal cepat (Quick Amount: Rp 5.000, 10.000, 20.000, 50.000, 100.000).
   - Cetak struk/kwitansi bukti setoran instan (Thermal Receipt & A4).

4. **Penarikan Tabungan (Withdrawal)**:
   - Validasi saldo mencukupi secara real-time.
   - Proteksi saldo mengendap minimum (Rp 10.000).
   - Catatan alasan penarikan & persetujuan bendahara.

5. **Laporan Keuangan & Mutasi Kas**:
   - Filter tanggal fleksibel (Hari ini, Minggu ini, Bulan ini, Custom).
   - Export laporan ke format CSV / Excel.
   - Cetak Rekapitulasi Kas Tabungan lengkap dengan tanda tangan Kepala Sekolah & Bendahara.

6. **Audit Trail**:
   - Setiap setoran, penarikan, dan pembaruan data tercatat secara permanen dengan stempel waktu dan identitas operator.

7. **Apps Script Studio & Live Backend**:
   - Dilengkapi viewer kode sumber seluruh berkas `apps-script/*.gs`.
   - Tombol salin kode 1-klik untuk setiap modul.
   - Pengujian koneksi langsung ke Google Apps Script Web App URL.
   - Mode offline/mock cerdas saat belum menghubungkan Web App URL, sehingga seluruh fitur langsung dapat diuji coba tanpa hambatan.

---

## 🚀 Memulai (Local Development)

```bash
# Menjalankan development server
npm run dev
```

Dev server akan berjalan di port `3000`.
Buka browser di `http://localhost:3000`.
