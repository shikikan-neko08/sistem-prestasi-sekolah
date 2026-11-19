import React, { useEffect, useMemo, useState } from 'react';
import {
  getRedirectResult,
  onAuthStateChanged,
  signInWithPopup,
  signInWithRedirect,
  signOut,
  User,
} from 'firebase/auth';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from 'firebase/firestore';
import {
  Award,
  BarChart3,
  FileText,
  GraduationCap,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  Trophy,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { AchievementsView } from './components/AchievementsView';
import { AchievementFormModal } from './components/AchievementFormModal';
import { DashboardView } from './components/DashboardView';
import { ErrorBoundary } from './components/ErrorBoundary';
import { LeaderboardView } from './components/LeaderboardView';
import { LoginScreen } from './components/LoginScreen';
import { ReportsView } from './components/ReportsView';
import { SettingsView } from './components/SettingsView';
import { StudentFormModal } from './components/StudentFormModal';
import { StudentProfileView } from './components/StudentProfileView';
import { StudentsView } from './components/StudentsView';
import { VerifyAchievementModal } from './components/VerifyAchievementModal';
import {
  BOOTSTRAPPED_ADMIN_EMAIL,
  calculatePoints,
  DEFAULT_POINT_MATRIX,
  DEFAULT_TAHUN_AJARAN,
  ROLE_LABELS,
  SCHOOL_ASSETS,
  SCHOOL_NAME,
} from './lib/constants';
import { auth, db, googleProvider, handleFirestoreError, OperationType } from './lib/firebase';
import { seedInitialDataIfEmpty, writeSeedDataset } from './lib/seedData';
import {
  Achievement,
  ActivePage,
  AuditLog,
  Jenjang,
  JenisKelamin,
  KategoriPrestasi,
  PeringkatPrestasi,
  PointMatrix,
  PointSettings,
  SchoolReport,
  StatusAktif,
  Student,
  TingkatPrestasi,
  UserProfile,
  UserRole,
} from './types';

function MainApp() {
  const [authReady, setAuthReady] = useState(false);
  const [firebaseUser, setFirebaseUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [popupBlocked, setPopupBlocked] = useState(false);

  // Admin role preview mode (UI-only preview for admin testing all 4 roles cleanly)
  const [previewRole, setPreviewRole] = useState<UserRole | null>(null);
  const [previewStudentId, setPreviewStudentId] = useState<string>('stu-10');

  // Firestore synced state
  const [students, setStudents] = useState<Student[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [pointSettings, setPointSettings] = useState<PointSettings | null>(null);
  const [schoolReports, setSchoolReports] = useState<SchoolReport[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [allUsers, setAllUsers] = useState<UserProfile[]>([]);
  const [dataLoading, setDataLoading] = useState(true);

  // Navigation & modals
  const [activePage, setActivePage] = useState<ActivePage>('dashboard');
  const [achievementStatusFilter, setAchievementStatusFilter] = useState<string>('Semua');
  const [selectedStudentId, setSelectedStudentId] = useState<string | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const [studentModalOpen, setStudentModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);

  const [achievementModalOpen, setAchievementModalOpen] = useState(false);
  const [achievementModalStudent, setAchievementModalStudent] = useState<Student | null>(null);
  const [editingAchievement, setEditingAchievement] = useState<Achievement | null>(null);

  const [inspectingAchievementId, setInspectingAchievementId] = useState<string | null>(null);

  // 1. Auth & User Profile Bootstrap
  useEffect(() => {
    getRedirectResult(auth).catch((err) => {
      const msg = err instanceof Error ? err.message : 'Gagal menyelesaikan login pengalihan.';
      setAuthError(msg);
    });

    const unsub = onAuthStateChanged(auth, async (user) => {
      setFirebaseUser(user);
      setAuthError(null);
      setPopupBlocked(false);
      if (!user) {
        setUserProfile(null);
        setAuthReady(true);
        setDataLoading(false);
        return;
      }

      try {
        const userRef = doc(db, 'users', user.uid);
        const snap = await getDoc(userRef);
        const isBootAdmin =
          user.email?.toLowerCase() === BOOTSTRAPPED_ADMIN_EMAIL.toLowerCase();

        if (!snap.exists()) {
          const initialRole: UserRole = isBootAdmin ? 'admin' : 'siswa';
          const newProfile = {
            uid: user.uid,
            email: user.email || '',
            nama: user.displayName || user.email?.split('@')[0] || 'Pengguna Nurul Insan',
            role: initialRole,
            studentId: '',
            jenjangBinaan: initialRole === 'admin' ? 'Semua' : '',
            statusAktif: 'aktif',
            createdAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          };
          await setDoc(userRef, newProfile);
          setUserProfile({
            id: user.uid,
            ...newProfile,
          } as UserProfile);

          if (isBootAdmin) {
            await seedInitialDataIfEmpty({
              uid: user.uid,
              nama: newProfile.nama,
              role: 'admin',
            });
          }
        } else {
          const data = snap.data() as Omit<UserProfile, 'id'>;
          const profile: UserProfile = {
            id: snap.id,
            ...data,
            role: isBootAdmin ? 'admin' : data.role,
          };
          setUserProfile(profile);

          if (profile.role === 'admin') {
            await seedInitialDataIfEmpty({
              uid: user.uid,
              nama: profile.nama,
              role: 'admin',
            });
          }
        }
      } catch (err) {
        setAuthError(
          err instanceof Error ? err.message : 'Gagal memuat profil pengguna.'
        );
      } finally {
        setAuthReady(true);
      }
    });

    return () => unsub();
  }, []);

  const actualRole: UserRole = userProfile?.role ?? 'siswa';
  const effectiveRole: UserRole =
    actualRole === 'admin' && previewRole ? previewRole : actualRole;

  // Keep activePage valid when effective role changes
  useEffect(() => {
    if (effectiveRole === 'siswa') {
      if (activePage !== 'my-portfolio' && activePage !== 'achievements') {
        setActivePage('my-portfolio');
      }
    } else if (effectiveRole === 'kepala_sekolah') {
      if (
        activePage !== 'dashboard' &&
        activePage !== 'leaderboard' &&
        activePage !== 'reports' &&
        activePage !== 'students'
      ) {
        setActivePage('dashboard');
      }
    } else if (effectiveRole === 'guru') {
      if (activePage === 'settings' || activePage === 'my-portfolio') {
        setActivePage('dashboard');
      }
    } else if (effectiveRole === 'admin') {
      if (activePage === 'my-portfolio') {
        setActivePage('dashboard');
      }
    }
  }, [effectiveRole, activePage]);

  // 2. Real-time Firestore Subscriptions
  useEffect(() => {
    if (!authReady || !firebaseUser || !userProfile) return;

    setDataLoading(true);
    const unsubs: Array<() => void> = [];

    // Point Settings (readable by all signed-in users)
    unsubs.push(
      onSnapshot(
        doc(db, 'settings', 'points_matrix'),
        (snap) => {
          if (snap.exists()) {
            setPointSettings({
              id: snap.id,
              ...(snap.data() as Omit<PointSettings, 'id'>),
            });
          }
        },
        (err) => handleFirestoreError(err, OperationType.GET, 'settings/points_matrix')
      )
    );

    const isStaff =
      actualRole === 'admin' ||
      actualRole === 'guru' ||
      actualRole === 'kepala_sekolah';

    if (isStaff) {
      unsubs.push(
        onSnapshot(
          collection(db, 'students'),
          (snap) => {
            setStudents(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Student, 'id'>),
              }))
            );
            setDataLoading(false);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'students')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'achievements'),
          (snap) => {
            setAchievements(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Achievement, 'id'>),
              }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'achievements')
        )
      );

      unsubs.push(
        onSnapshot(
          collection(db, 'school_reports'),
          (snap) => {
            setSchoolReports(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<SchoolReport, 'id'>),
              }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'school_reports')
        )
      );

      unsubs.push(
        onSnapshot(
          query(collection(db, 'audit_logs'), orderBy('createdAt', 'desc')),
          (snap) => {
            setAuditLogs(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<AuditLog, 'id'>),
              }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'audit_logs')
        )
      );

      if (actualRole === 'admin') {
        unsubs.push(
          onSnapshot(
            collection(db, 'users'),
            (snap) => {
              setAllUsers(
                snap.docs.map((d) => ({
                  id: d.id,
                  ...(d.data() as Omit<UserProfile, 'id'>),
                }))
              );
            },
            (err) => handleFirestoreError(err, OperationType.LIST, 'users')
          )
        );
      }
    } else {
      // Strictly scoped queries for Siswa role (only own student & own achievements)
      unsubs.push(
        onSnapshot(
          query(collection(db, 'students'), where('ownerUid', '==', firebaseUser.uid)),
          (snap) => {
            setStudents(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Student, 'id'>),
              }))
            );
            setDataLoading(false);
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'students')
        )
      );

      unsubs.push(
        onSnapshot(
          query(
            collection(db, 'achievements'),
            where('studentOwnerUid', '==', firebaseUser.uid)
          ),
          (snap) => {
            setAchievements(
              snap.docs.map((d) => ({
                id: d.id,
                ...(d.data() as Omit<Achievement, 'id'>),
              }))
            );
          },
          (err) => handleFirestoreError(err, OperationType.LIST, 'achievements')
        )
      );
    }

    return () => {
      unsubs.forEach((u) => u());
    };
  }, [authReady, firebaseUser, userProfile, actualRole]);

  const activeMatrix: PointMatrix = pointSettings?.matrix ?? DEFAULT_POINT_MATRIX;
  const activeTahunAjaran = pointSettings?.tahunAjaranAktif ?? DEFAULT_TAHUN_AJARAN;

  // Compute ranks map
  const studentRankMap = useMemo(() => {
    const totals = new Map<string, number>();
    for (const a of achievements) {
      if (a.status !== 'Disetujui') continue;
      totals.set(a.studentId, (totals.get(a.studentId) || 0) + (a.poin || 0));
    }
    const sorted = Array.from(totals.entries()).sort((a, b) => b[1] - a[1]);
    const rankMap = new Map<string, number>();
    sorted.forEach(([stuId], idx) => rankMap.set(stuId, idx + 1));
    return rankMap;
  }, [achievements]);

  const myStudent: Student | null = useMemo(() => {
    if (effectiveRole !== 'siswa') return null;
    if (actualRole === 'admin' && previewRole === 'siswa') {
      return students.find((s) => s.id === previewStudentId) || students[0] || null;
    }
    if (userProfile?.studentId) {
      return students.find((s) => s.id === userProfile.studentId) || students[0] || null;
    }
    return students[0] || null;
  }, [effectiveRole, actualRole, previewRole, previewStudentId, students, userProfile]);

  const scopedAchievements = useMemo(() => {
    if (effectiveRole === 'siswa') {
      if (!myStudent) return [];
      return achievements.filter((a) => a.studentId === myStudent.id);
    }
    return achievements;
  }, [effectiveRole, myStudent, achievements]);

  const selectedStudent = useMemo(
    () => students.find((s) => s.id === selectedStudentId) || null,
    [students, selectedStudentId]
  );

  const inspectingAchievement = useMemo(
    () => achievements.find((a) => a.id === inspectingAchievementId) || null,
    [achievements, inspectingAchievementId]
  );

  // Auth Actions
  const handleGoogleLogin = async () => {
    setAuthError(null);
    setPopupBlocked(false);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      const code = (err as { code?: string })?.code ?? '';
      const message = err instanceof Error ? err.message : '';
      if (code === 'auth/popup-blocked' || message.includes('auth/popup-blocked')) {
        setPopupBlocked(true);
        setAuthError(
          'Jendela pop-up login Google diblokir oleh browser atau pembatasan iframe. Izinkan pop-up di bilah alamat browser atau buka portal di tab baru.'
        );
      } else if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        setAuthError('Proses masuk dibatalkan sebelum selesai. Silakan klik kembali untuk masuk.');
      } else {
        setAuthError(
          message || 'Gagal masuk dengan Google. Pastikan pop-up browser diizinkan.'
        );
      }
    }
  };

  const handleGoogleRedirectLogin = async () => {
    setAuthError(null);
    setPopupBlocked(false);
    try {
      await signInWithRedirect(auth, googleProvider);
    } catch (err) {
      setAuthError(
        err instanceof Error ? err.message : 'Gagal mengalihkan halaman ke login Google.'
      );
    }
  };

  const handleLogout = async () => {
    setPreviewRole(null);
    setSelectedStudentId(null);
    await signOut(auth);
  };

  // Audit helper
  const writeAuditLog = async (params: {
    targetType: AuditLog['targetType'];
    targetId: string;
    targetTitle: string;
    action: string;
    reason?: string;
    details?: string;
  }) => {
    if (!firebaseUser || !userProfile) return;
    try {
      await addDoc(collection(db, 'audit_logs'), {
        targetType: params.targetType,
        targetId: params.targetId,
        targetTitle: params.targetTitle.slice(0, 200),
        action: params.action,
        actorUid: firebaseUser.uid,
        actorName: userProfile.nama,
        actorRole: actualRole,
        reason: (params.reason || '').slice(0, 500),
        details: (params.details || '').slice(0, 1000),
        createdAt: serverTimestamp(),
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'audit_logs');
    }
  };

  // Student CRUD
  const handleSaveStudent = async (data: {
    nis: string;
    nama: string;
    jenjang: Jenjang;
    kelas: string;
    jenisKelamin: JenisKelamin;
    statusAktif: StatusAktif;
    fotoUrl: string;
  }) => {
    if (!firebaseUser) return;
    if (editingStudent) {
      const ref = doc(db, 'students', editingStudent.id);
      try {
        await updateDoc(ref, {
          ...data,
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog({
          targetType: 'student',
          targetId: editingStudent.id,
          targetTitle: `${data.nama} (${data.jenjang} ${data.kelas})`,
          action: 'UBAH_DATA_SISWA',
          details: 'Pembaruan profil siswa.',
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `students/${editingStudent.id}`);
      }
    } else {
      try {
        const ref = await addDoc(collection(db, 'students'), {
          ...data,
          ownerUid: '',
          pembinaUid: firebaseUser.uid,
          aiNarasi: '',
          aiPembinaan: '',
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
        });
        await writeAuditLog({
          targetType: 'student',
          targetId: ref.id,
          targetTitle: `${data.nama} (${data.jenjang} ${data.kelas})`,
          action: 'TAMBAH_SISWA',
          details: `NIS ${data.nis} ditambahkan ke sistem.`,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'students');
      }
    }
  };

  // Achievement Create / Edit
  const handleSaveAchievement = async (payload: {
    student: Student;
    namaLomba: string;
    kategori: KategoriPrestasi;
    tingkat: TingkatPrestasi;
    peringkat: PeringkatPrestasi;
    tanggal: string;
    tahunAjaran: string;
    penyelenggara: string;
    buktiUrl: string;
    buktiNama: string;
    deskripsi: string;
    autoApprove: boolean;
  }) => {
    if (!firebaseUser || !userProfile) return;
    const poin = calculatePoints(activeMatrix, payload.tingkat, payload.peringkat);

    if (editingAchievement) {
      const ref = doc(db, 'achievements', editingAchievement.id);
      const nextStatus =
        effectiveRole === 'siswa'
          ? 'Menunggu'
          : payload.autoApprove
          ? 'Disetujui'
          : 'Menunggu';

      const updateFields: Record<string, unknown> = {
        namaLomba: payload.namaLomba,
        kategori: payload.kategori,
        tingkat: payload.tingkat,
        peringkat: payload.peringkat,
        tanggal: payload.tanggal,
        tahunAjaran: payload.tahunAjaran,
        penyelenggara: payload.penyelenggara,
        buktiUrl: payload.buktiUrl,
        buktiNama: payload.buktiNama,
        deskripsi: payload.deskripsi,
        status: nextStatus,
        poin,
        updatedAt: serverTimestamp(),
      };
      if (effectiveRole !== 'siswa') {
        updateFields.alasanPenolakan = '';
        if (nextStatus === 'Disetujui') {
          updateFields.verifiedByUid = firebaseUser.uid;
          updateFields.verifiedByName = userProfile.nama;
        }
      }

      try {
        await updateDoc(ref, updateFields);
        await writeAuditLog({
          targetType: 'achievement',
          targetId: editingAchievement.id,
          targetTitle: `${payload.namaLomba} — ${payload.student.nama}`,
          action: 'PERBAIKI_PRESTASI',
          details: `Data prestasi diperbarui dengan status ${nextStatus}.`,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `achievements/${editingAchievement.id}`);
      }
    } else {
      const status = payload.autoApprove ? 'Disetujui' : 'Menunggu';
      const newDoc: Record<string, unknown> = {
        studentId: payload.student.id,
        studentNama: payload.student.nama,
        studentKelas: payload.student.kelas,
        studentJenjang: payload.student.jenjang,
        studentOwnerUid: payload.student.ownerUid || '',
        namaLomba: payload.namaLomba,
        kategori: payload.kategori,
        tingkat: payload.tingkat,
        peringkat: payload.peringkat,
        tanggal: payload.tanggal,
        tahunAjaran: payload.tahunAjaran,
        penyelenggara: payload.penyelenggara,
        buktiUrl: payload.buktiUrl,
        buktiNama: payload.buktiNama,
        deskripsi: payload.deskripsi,
        status,
        poin,
        submittedByUid: firebaseUser.uid,
        submittedByName: userProfile.nama,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };
      if (status === 'Disetujui') {
        newDoc.verifiedByUid = firebaseUser.uid;
        newDoc.verifiedByName = userProfile.nama;
      }

      try {
        const ref = await addDoc(collection(db, 'achievements'), newDoc);
        await writeAuditLog({
          targetType: 'achievement',
          targetId: ref.id,
          targetTitle: `${payload.namaLomba} — ${payload.student.nama}`,
          action: status === 'Disetujui' ? 'CATAT_DAN_SETUJUI' : 'AJUKAN_PRESTASI',
          details: `${payload.peringkat} tingkat ${payload.tingkat} (${poin} poin).`,
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, 'achievements');
      }
    }
  };

  // Verification / Rejection / Cancellation
  const handleApproveAchievement = async (a: Achievement) => {
    if (!firebaseUser || !userProfile) return;
    const poin = calculatePoints(activeMatrix, a.tingkat, a.peringkat);
    try {
      await updateDoc(doc(db, 'achievements', a.id), {
        status: 'Disetujui',
        poin,
        alasanPenolakan: '',
        verifiedByUid: firebaseUser.uid,
        verifiedByName: userProfile.nama,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        targetType: 'achievement',
        targetId: a.id,
        targetTitle: `${a.namaLomba} — ${a.studentNama}`,
        action: 'SETUJUI_PRESTASI',
        details: `Prestasi disetujui dengan nilai ${poin} poin.`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `achievements/${a.id}`);
    }
  };

  const handleRejectAchievement = async (a: Achievement, reason: string) => {
    if (!firebaseUser || !userProfile) return;
    try {
      await updateDoc(doc(db, 'achievements', a.id), {
        status: 'Ditolak',
        alasanPenolakan: reason,
        verifiedByUid: firebaseUser.uid,
        verifiedByName: userProfile.nama,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        targetType: 'achievement',
        targetId: a.id,
        targetTitle: `${a.namaLomba} — ${a.studentNama}`,
        action: 'TOLAK_PRESTASI',
        reason,
        details: 'Pengajuan prestasi ditolak oleh pemeriksa.',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `achievements/${a.id}`);
    }
  };

  const handleCancelApprovedAchievement = async (a: Achievement, reason: string) => {
    if (!firebaseUser || !userProfile) return;
    try {
      await updateDoc(doc(db, 'achievements', a.id), {
        status: 'Dibatalkan',
        alasanPembatalan: reason,
        verifiedByUid: firebaseUser.uid,
        verifiedByName: userProfile.nama,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        targetType: 'achievement',
        targetId: a.id,
        targetTitle: `${a.namaLomba} — ${a.studentNama}`,
        action: 'BATALKAN_PRESTASI',
        reason,
        details: 'Prestasi yang disetujui dibatalkan tanpa menghapus arsip.',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `achievements/${a.id}`);
    }
  };

  // Save AI outputs
  const handleSaveStudentAi = async (
    studentId: string,
    fields: { aiNarasi?: string; aiPembinaan?: string }
  ) => {
    const stu = students.find((s) => s.id === studentId);
    try {
      await updateDoc(doc(db, 'students', studentId), {
        ...fields,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        targetType: 'student',
        targetId: studentId,
        targetTitle: stu ? stu.nama : studentId,
        action: 'SIMPAN_NARASI_PEMBINAAN',
        details: 'Narasi rapor / saran pembinaan disimpan ke portofolio siswa.',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `students/${studentId}`);
    }
  };

  const handleSaveSchoolSummary = async (tahunAjaran: string, ringkasanAi: string) => {
    if (!firebaseUser || !userProfile) return;
    const reportId = `ta_${tahunAjaran.replace('/', '_')}`;
    try {
      await setDoc(doc(db, 'school_reports', reportId), {
        tahunAjaran,
        ringkasanAi,
        updatedByUid: firebaseUser.uid,
        updatedByName: userProfile.nama,
        updatedAt: serverTimestamp(),
      });
      await writeAuditLog({
        targetType: 'report',
        targetId: reportId,
        targetTitle: `Ringkasan Sekolah TA ${tahunAjaran}`,
        action: 'SIMPAN_RINGKASAN_SEKOLAH',
        details: 'Ringkasan capaian sekolah disimpan untuk laporan Kepala Sekolah.',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `school_reports/${reportId}`);
    }
  };

  // Settings & Point Matrix Recalculation
  const handleSavePointMatrix = async (
    matrix: PointMatrix,
    tahunAjaranAktifValue: string
  ) => {
    if (!firebaseUser || !userProfile) return;
    try {
      const batch = writeBatch(db);
      batch.set(doc(db, 'settings', 'points_matrix'), {
        matrix,
        tahunAjaranAktif: tahunAjaranAktifValue,
        updatedByUid: firebaseUser.uid,
        updatedByName: userProfile.nama,
        updatedAt: serverTimestamp(),
      });

      // Recalculate points across existing achievements consistently
      for (const a of achievements) {
        const recalculated = calculatePoints(matrix, a.tingkat, a.peringkat);
        if (recalculated !== a.poin) {
          batch.update(doc(db, 'achievements', a.id), {
            poin: recalculated,
            updatedAt: serverTimestamp(),
          });
        }
      }

      await batch.commit();
      await writeAuditLog({
        targetType: 'settings',
        targetId: 'points_matrix',
        targetTitle: `Pengaturan Matriks Poin & TA ${tahunAjaranAktifValue}`,
        action: 'UBAH_MATRIKS_POIN',
        details: 'Bobot poin tingkat/peringkat diperbarui dan dihitung ulang.',
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'settings/points_matrix');
    }
  };

  const handleUpdateUserRole = async (
    userId: string,
    updates: { role: UserRole; studentId: string; statusAktif: 'aktif' | 'nonaktif' }
  ) => {
    const targetUser = allUsers.find((u) => u.id === userId);
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, 'users', userId), {
        role: updates.role,
        studentId: updates.role === 'siswa' ? updates.studentId : '',
        statusAktif: updates.statusAktif,
        updatedAt: serverTimestamp(),
      });

      // Sync student ownerUid and achievement studentOwnerUid if linked
      if (updates.role === 'siswa' && updates.studentId) {
        batch.update(doc(db, 'students', updates.studentId), {
          ownerUid: userId,
          updatedAt: serverTimestamp(),
        });
        for (const a of achievements) {
          if (a.studentId === updates.studentId) {
            batch.update(doc(db, 'achievements', a.id), {
              studentOwnerUid: userId,
              updatedAt: serverTimestamp(),
            });
          }
        }
      }

      await batch.commit();
      await writeAuditLog({
        targetType: 'user',
        targetId: userId,
        targetTitle: targetUser ? targetUser.nama : userId,
        action: 'UBAH_PERAN_PENGGUNA',
        details: `Peran diatur menjadi ${ROLE_LABELS[updates.role]} (${updates.statusAktif}).`,
      });
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${userId}`);
    }
  };

  const handleReseedSampleData = async () => {
    if (!firebaseUser || !userProfile) return;
    await writeSeedDataset({
      uid: firebaseUser.uid,
      nama: userProfile.nama,
      role: actualRole,
    });
  };

  if (!authReady) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="text-center space-y-3">
          <div className="w-10 h-10 border-4 border-blue-700 border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-sm font-medium text-slate-600">
            Menyiapkan Sistem Prestasi Siswa Nurul Insan...
          </p>
        </div>
      </div>
    );
  }

  if (!firebaseUser || !userProfile) {
    return (
      <LoginScreen
        onLoginGoogle={handleGoogleLogin}
        onLoginRedirect={handleGoogleRedirectLogin}
        popupBlocked={popupBlocked}
        errorMessage={authError}
      />
    );
  }

  if (userProfile.statusAktif === 'nonaktif') {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
        <div className="max-w-md w-full bg-white border border-slate-200 rounded-xl p-8 text-center space-y-4">
          <h1 className="font-display text-xl font-bold text-slate-900">
            Akun Dinonaktifkan
          </h1>
          <p className="text-sm text-slate-600">
            Akun Anda saat ini berstatus nonaktif. Silakan hubungi Admin Sekolah Nurul Insan untuk aktivasi kembali.
          </p>
          <button
            type="button"
            onClick={handleLogout}
            className="px-4 py-2 rounded-lg bg-slate-900 text-white text-xs font-semibold cursor-pointer"
          >
            Keluar
          </button>
        </div>
      </div>
    );
  }

  const navItems: Array<{ id: ActivePage; label: string; icon: React.ReactNode }> =
    effectiveRole === 'siswa'
      ? [
          {
            id: 'my-portfolio',
            label: 'Portofolio Saya',
            icon: <GraduationCap className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'achievements',
            label: 'Pengajuan Prestasi',
            icon: <Award className="w-4 h-4 shrink-0" />,
          },
        ]
      : effectiveRole === 'kepala_sekolah'
      ? [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'students',
            label: 'Profil Siswa',
            icon: <Users className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'leaderboard',
            label: 'Peringkat',
            icon: <Trophy className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'reports',
            label: 'Laporan',
            icon: <FileText className="w-4 h-4 shrink-0" />,
          },
        ]
      : effectiveRole === 'guru'
      ? [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'students',
            label: 'Data Siswa',
            icon: <Users className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'achievements',
            label: 'Prestasi & Verifikasi',
            icon: <Award className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'leaderboard',
            label: 'Peringkat',
            icon: <Trophy className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'reports',
            label: 'Laporan',
            icon: <BarChart3 className="w-4 h-4 shrink-0" />,
          },
        ]
      : [
          {
            id: 'dashboard',
            label: 'Dashboard',
            icon: <LayoutDashboard className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'students',
            label: 'Data Siswa',
            icon: <Users className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'achievements',
            label: 'Prestasi & Verifikasi',
            icon: <Award className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'leaderboard',
            label: 'Peringkat',
            icon: <Trophy className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'reports',
            label: 'Laporan',
            icon: <FileText className="w-4 h-4 shrink-0" />,
          },
          {
            id: 'settings',
            label: 'Pengaturan',
            icon: <Settings className="w-4 h-4 shrink-0" />,
          },
        ];

  const handleNavigate = (page: ActivePage) => {
    setSelectedStudentId(null);
    setActivePage(page);
    setMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:w-64 lg:flex-col lg:fixed lg:inset-y-0 bg-white border-r border-slate-200 no-print">
        <div className="px-5 py-4 border-b border-slate-200 flex items-center gap-3">
          <img
            src={SCHOOL_ASSETS.EMBLEM}
            alt="Logo Sekolah Nurul Insan"
            referrerPolicy="no-referrer"
            className="w-9 h-9 rounded-lg object-cover border border-slate-200 bg-white shrink-0"
          />
          <div className="min-w-0">
            <p className="font-display text-sm font-bold text-slate-900 truncate">
              {SCHOOL_NAME}
            </p>
            <p className="text-[11px] text-emerald-700 font-medium truncate">
              Sistem Prestasi Siswa
            </p>
          </div>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = activePage === item.id && !selectedStudentId;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => handleNavigate(item.id)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors cursor-pointer whitespace-nowrap ${
                  isActive
                    ? 'bg-blue-50 text-blue-800 font-semibold'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {item.icon}
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        {/* Admin Role Preview Switcher */}
        {actualRole === 'admin' && (
          <div className="px-4 py-3 border-t border-slate-200 bg-slate-50/70 space-y-2">
            <div className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-600">
              <UserCheck className="w-3.5 h-3.5 text-blue-700" />
              <span>Pratinjau Peran (Admin)</span>
            </div>
            <select
              value={previewRole || 'admin'}
              onChange={(e) => {
                const val = e.target.value as UserRole;
                setPreviewRole(val === 'admin' ? null : val);
                setSelectedStudentId(null);
              }}
              aria-label="Pilih pratinjau peran"
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs font-medium text-slate-800"
            >
              <option value="admin">Admin Sekolah</option>
              <option value="guru">Guru / Pembina</option>
              <option value="siswa">Siswa</option>
              <option value="kepala_sekolah">Kepala Sekolah</option>
            </select>
            {previewRole === 'siswa' && students.length > 0 && (
              <select
                value={previewStudentId}
                onChange={(e) => setPreviewStudentId(e.target.value)}
                aria-label="Pilih siswa pratinjau"
                className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-slate-700"
              >
                {students.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nama} ({s.kelas})
                  </option>
                ))}
              </select>
            )}
          </div>
        )}

        <div className="px-4 py-3.5 border-t border-slate-200 flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-slate-900 truncate">
              {userProfile.nama}
            </p>
            <p className="text-[11px] text-slate-500 truncate">
              {ROLE_LABELS[effectiveRole]}
            </p>
          </div>
          <button
            type="button"
            onClick={handleLogout}
            title="Keluar"
            className="p-2 rounded-lg text-slate-500 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
            aria-label="Keluar dari akun"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      {/* Mobile Slide-Over Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex no-print">
          <div
            className="fixed inset-0 bg-slate-900/50"
            onClick={() => setMobileMenuOpen(false)}
          />
          <div className="relative w-72 max-w-[85vw] bg-white h-full flex flex-col border-r border-slate-200 z-10">
            <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <img
                  src={SCHOOL_ASSETS.EMBLEM}
                  alt="Logo Sekolah Nurul Insan"
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-lg object-cover border border-slate-200"
                />
                <span className="font-display text-sm font-bold text-slate-900">
                  {SCHOOL_NAME}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-2 rounded-lg text-slate-500 hover:bg-slate-100"
                aria-label="Tutup menu"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
              {navItems.map((item) => {
                const isActive = activePage === item.id && !selectedStudentId;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleNavigate(item.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium ${
                      isActive
                        ? 'bg-blue-50 text-blue-800 font-semibold'
                        : 'text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            {actualRole === 'admin' && (
              <div className="px-4 py-3 border-t border-slate-200 bg-slate-50 space-y-2">
                <p className="text-[11px] font-semibold text-slate-600">
                  Pratinjau Peran (Admin)
                </p>
                <select
                  value={previewRole || 'admin'}
                  onChange={(e) => {
                    const val = e.target.value as UserRole;
                    setPreviewRole(val === 'admin' ? null : val);
                    setSelectedStudentId(null);
                  }}
                  className="w-full px-2.5 py-1.5 rounded-lg border border-slate-300 bg-white text-xs"
                >
                  <option value="admin">Admin Sekolah</option>
                  <option value="guru">Guru / Pembina</option>
                  <option value="siswa">Siswa</option>
                  <option value="kepala_sekolah">Kepala Sekolah</option>
                </select>
              </div>
            )}

            <div className="px-4 py-3.5 border-t border-slate-200 flex items-center justify-between">
              <div className="min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate">
                  {userProfile.nama}
                </p>
                <p className="text-[11px] text-slate-500">
                  {ROLE_LABELS[effectiveRole]}
                </p>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 text-xs font-semibold text-red-600"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-64 flex flex-col min-w-0">
        {/* Top Bar Contract */}
        <header className="bg-white border-b border-slate-200 px-4 sm:px-8 py-3.5 sticky top-0 z-30 no-print">
          <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-slate-700 hover:bg-slate-100 cursor-pointer"
                aria-label="Buka menu navigasi"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="flex items-center gap-2 text-xs sm:text-sm text-slate-500 truncate">
                <span className="font-semibold text-slate-900 whitespace-nowrap">
                  Sistem Prestasi Siswa
                </span>
                <span aria-hidden="true">/</span>
                <span className="truncate">
                  {selectedStudent
                    ? `Portofolio · ${selectedStudent.nama}`
                    : navItems.find((n) => n.id === activePage)?.label ?? 'Beranda'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4 shrink-0">
              <span className="hidden sm:inline text-xs text-slate-500 whitespace-nowrap">
                TA <span className="font-mono font-semibold text-slate-700">{activeTahunAjaran}</span>
                <span className="mx-2 text-slate-300" aria-hidden="true">·</span>
                <span className="font-semibold text-emerald-700">
                  {ROLE_LABELS[effectiveRole]}
                </span>
              </span>
              {previewRole && (
                <button
                  type="button"
                  onClick={() => setPreviewRole(null)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-800 text-xs font-semibold hover:bg-blue-100 cursor-pointer whitespace-nowrap"
                >
                  Kembali ke Admin
                </button>
              )}
            </div>
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-8 py-6 sm:py-8">
          {dataLoading ? (
            <div className="space-y-4">
              <div className="h-8 w-64 bg-slate-200 rounded animate-pulse" />
              <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-28 bg-white border border-slate-200 rounded-xl" />
                ))}
              </div>
              <div className="h-72 bg-white border border-slate-200 rounded-xl" />
            </div>
          ) : selectedStudent ? (
            <StudentProfileView
              student={selectedStudent}
              achievements={achievements}
              rank={studentRankMap.get(selectedStudent.id) ?? null}
              role={effectiveRole}
              auditLogs={auditLogs}
              onBack={() => setSelectedStudentId(null)}
              onEditStudent={(stu) => {
                setEditingStudent(stu);
                setStudentModalOpen(true);
              }}
              onAddAchievement={(stu) => {
                setEditingAchievement(null);
                setAchievementModalStudent(stu);
                setAchievementModalOpen(true);
              }}
              onInspectAchievement={(ach) => setInspectingAchievementId(ach.id)}
              onSaveAiFields={handleSaveStudentAi}
            />
          ) : effectiveRole === 'siswa' && activePage === 'my-portfolio' ? (
            myStudent ? (
              <StudentProfileView
                student={myStudent}
                achievements={scopedAchievements}
                rank={studentRankMap.get(myStudent.id) ?? null}
                role="siswa"
                auditLogs={[]}
                onAddAchievement={(stu) => {
                  setEditingAchievement(null);
                  setAchievementModalStudent(stu);
                  setAchievementModalOpen(true);
                }}
                onInspectAchievement={(ach) => setInspectingAchievementId(ach.id)}
              />
            ) : (
              <div className="bg-white border border-slate-200 rounded-xl p-8 max-w-xl mx-auto text-center space-y-3">
                <h1 className="font-display text-xl font-bold text-slate-900">
                  Akun Siswa Belum Tertaut dengan NIS
                </h1>
                <p className="text-sm text-slate-600 leading-relaxed">
                  Akun Anda ({userProfile.email}) terdaftar dengan peran <strong>Siswa</strong>, namun belum ditautkan ke data induk siswa oleh Admin Sekolah Nurul Insan. Silakan hubungi wali kelas atau Admin untuk menautkan NIS Anda.
                </p>
              </div>
            )
          ) : activePage === 'dashboard' ? (
            <DashboardView
              students={students}
              achievements={achievements}
              role={effectiveRole}
              tahunAjaranAktif={activeTahunAjaran}
              onNavigateToAchievements={(initialStatus) => {
                setAchievementStatusFilter(initialStatus || 'Semua');
                setActivePage('achievements');
              }}
              onOpenAddAchievement={() => {
                setEditingAchievement(null);
                setAchievementModalStudent(null);
                setAchievementModalOpen(true);
              }}
              onInspectAchievement={(ach) => setInspectingAchievementId(ach.id)}
            />
          ) : activePage === 'students' ? (
            <StudentsView
              students={students}
              achievements={achievements}
              role={effectiveRole}
              onSelectStudent={(stu) => setSelectedStudentId(stu.id)}
              onAddStudent={() => {
                setEditingStudent(null);
                setStudentModalOpen(true);
              }}
            />
          ) : activePage === 'achievements' ? (
            <AchievementsView
              achievements={scopedAchievements}
              role={effectiveRole}
              initialStatusFilter={achievementStatusFilter}
              onAddAchievement={() => {
                setEditingAchievement(null);
                setAchievementModalStudent(effectiveRole === 'siswa' ? myStudent : null);
                setAchievementModalOpen(true);
              }}
              onInspectAchievement={(ach) => setInspectingAchievementId(ach.id)}
            />
          ) : activePage === 'leaderboard' ? (
            <LeaderboardView
              students={students}
              achievements={achievements}
              onSelectStudent={(stu) => setSelectedStudentId(stu.id)}
            />
          ) : activePage === 'reports' ? (
            <ReportsView
              achievements={achievements}
              schoolReports={schoolReports}
              tahunAjaranAktif={activeTahunAjaran}
              role={effectiveRole}
              onSaveSchoolSummary={handleSaveSchoolSummary}
            />
          ) : activePage === 'settings' && effectiveRole === 'admin' ? (
            <SettingsView
              matrix={activeMatrix}
              tahunAjaranAktif={activeTahunAjaran}
              users={allUsers}
              students={students}
              auditLogs={auditLogs}
              onSavePointMatrix={handleSavePointMatrix}
              onUpdateUserRole={handleUpdateUserRole}
              onReseedSampleData={handleReseedSampleData}
            />
          ) : null}
        </main>
      </div>

      {/* Modals */}
      {studentModalOpen && (
        <StudentFormModal
          student={editingStudent}
          onClose={() => {
            setStudentModalOpen(false);
            setEditingStudent(null);
          }}
          onSave={handleSaveStudent}
        />
      )}

      {achievementModalOpen && (
        <AchievementFormModal
          students={students}
          matrix={activeMatrix}
          role={effectiveRole}
          lockedStudent={achievementModalStudent}
          editingAchievement={editingAchievement}
          onClose={() => {
            setAchievementModalOpen(false);
            setAchievementModalStudent(null);
            setEditingAchievement(null);
          }}
          onSave={handleSaveAchievement}
        />
      )}

      {inspectingAchievement && (
        <VerifyAchievementModal
          achievement={inspectingAchievement}
          role={effectiveRole}
          auditLogs={auditLogs}
          onClose={() => setInspectingAchievementId(null)}
          onApprove={handleApproveAchievement}
          onReject={handleRejectAchievement}
          onCancelApproved={handleCancelApprovedAchievement}
          onEditRequested={(ach) => {
            setEditingAchievement(ach);
            setAchievementModalStudent(
              students.find((s) => s.id === ach.studentId) || null
            );
            setAchievementModalOpen(true);
          }}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <MainApp />
    </ErrorBoundary>
  );
}
