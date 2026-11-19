# Spesifikasi Keamanan Firestore — Sistem Prestasi Siswa Nurul Insan

## 1. Data Invariants
1. **Master Gate & Zero-Trust**: Tidak ada akses baca/tulis tanpa autentikasi Firebase (`request.auth != null`) dan email terverifikasi (`request.auth.token.email_verified == true`) untuk seluruh operasi tulis.
2. **RBAC Berbasis Database**: Peran pengguna (`admin`, `guru`, `siswa`, `kepala_sekolah`) disimpan di `/users/{uid}`, bukan dari custom claim klien. Email admin bawaan (`ardaffa2000@gmail.com` terverifikasi) memiliki akses penuh sejak awal.
3. **Isolasi Data Siswa**: Pengguna dengan peran `siswa` hanya boleh membaca dokumen siswa miliknya (`ownerUid == request.auth.uid`) dan hanya boleh membaca/mengajukan prestasi miliknya (`studentOwnerUid == request.auth.uid` dengan status awal wajib `'Menunggu'`).
4. **Anti-Delete Prestasi Disetujui**: Prestasi berstatus `'Disetujui'` tidak dapat dihapus (`allow delete: if false;`), hanya dapat diubah menjadi `'Dibatalkan'` oleh `admin` atau `guru` dengan wajib menyertakan `alasanPembatalan` tidak kosong.
5. **Audit Trail Permanen**: Setiap penciptaan log di `/audit_logs/{logId}` wajib mencantumkan `actorUid == request.auth.uid` dan tidak dapat diubah atau dihapus (`update: false`, `delete: false`).
6. **Validasi Ketat & Temporal Integrity**: Semua `createdAt`/`updatedAt` wajib menggunakan `request.time`, semua string dibatasi panjang maksimal, dan tidak ada field bayangan (`keys().hasOnly(...)`).

## 2. The "Dirty Dozen" Attack Payloads (Wajib Ditolak PERMISSION_DENIED)
1. **Privilege Escalation (Self-Assign Admin)**: User biasa mencoba `setDoc('/users/uid2', { role: 'admin', ... })` -> DITOLAK.
2. **Role Tampering on Update**: User siswa mencoba `updateDoc('/users/uid2', { role: 'guru' })` -> DITOLAK.
3. **Unverified Email Write**: Token dengan `email_verified: false` mencoba menulis prestasi -> DITOLAK.
4. **Siswa Approving Own Achievement**: Siswa mencoba membuat prestasi dengan `status: 'Disetujui'` -> DITOLAK.
5. **Siswa Modifying Status**: Siswa mencoba update status prestasi dari `'Menunggu'` ke `'Disetujui'` -> DITOLAK.
6. **Siswa Reading Other Student PII**: Siswa A mencoba `get` `/students/student_B` milik Siswa B -> DITOLAK.
7. **Siswa Querying All Achievements**: Siswa mencoba `list` `/achievements` tanpa filter `studentOwnerUid == request.auth.uid` -> DITOLAK.
8. **Kepala Sekolah Mutating Data**: Kepala Sekolah mencoba membuat/mengubah/menghapus siswa atau prestasi -> DITOLAK.
9. **Deleting Approved Achievement**: Admin atau Guru mencoba `deleteDoc('/achievements/ach_1')` -> DITOLAK.
10. **Cancelling Without Reason**: Guru mencoba ubah status `'Disetujui'` -> `'Dibatalkan'` dengan `alasanPembatalan: ''` -> DITOLAK.
11. **Shadow Field Injection**: Payload prestasi menyertakan field ilegal `{ extraAdminFlag: true }` -> DITOLAK.
12. **Audit Log Tampering / Spoofing**: User mencoba `update`/`delete` `/audit_logs/log_1` atau menulis `actorUid` milik orang lain -> DITOLAK.
