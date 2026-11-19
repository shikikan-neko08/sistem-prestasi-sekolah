import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Achievement, Student } from '../types';
import { formatTanggalID } from './constants';

function escapeCsvCell(value: string | number): string {
  const str = String(value ?? '');
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export function exportAchievementsToExcelCSV(
  achievements: Achievement[],
  filename = 'laporan-prestasi-nurul-insan.csv'
): void {
  const headers = [
    'No',
    'Nama Siswa',
    'Jenjang',
    'Kelas',
    'Nama Lomba / Kegiatan',
    'Kategori',
    'Tingkat',
    'Peringkat',
    'Tanggal',
    'Tahun Ajaran',
    'Penyelenggara',
    'Status',
    'Poin',
  ];

  const rows = achievements.map((a, index) => [
    index + 1,
    a.studentNama,
    a.studentJenjang,
    a.studentKelas,
    a.namaLomba,
    a.kategori,
    a.tingkat,
    a.peringkat,
    a.tanggal,
    a.tahunAjaran,
    a.penyelenggara,
    a.status,
    a.status === 'Disetujui' ? a.poin : 0,
  ]);

  const csvContent =
    '\uFEFF' +
    [headers, ...rows]
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\r\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export function downloadStudentPortfolioPDF(params: {
  student: Student;
  achievements: Achievement[];
  totalPoin: number;
  rank: number | null;
  narasiAi?: string;
  pembinaanAi?: string;
}): void {
  const { student, achievements, totalPoin, rank, narasiAi, pembinaanAi } = params;
  const approved = achievements.filter((a) => a.status === 'Disetujui');

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header Sekolah Nurul Insan
  doc.setFillColor(29, 78, 216); // Blue-700
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(5, 150, 105); // Emerald-600 strip
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(15);
  doc.text('PORTOFOLIO PRESTASI SISWA', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text('Sekolah Nurul Insan (SD · SMP · SMA) · Sistem Prestasi Siswa', 14, 19);
  doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, pageWidth - 14, 19, {
    align: 'right',
  });

  // Identitas Siswa
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.text(student.nama, 14, 40);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`NIS: ${student.nis}   |   Jenjang & Kelas: ${student.jenjang} - ${student.kelas}   |   Jenis Kelamin: ${student.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}`, 14, 46);

  // Kotak Ringkasan Metrik
  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 51, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${totalPoin} Poin`, 22, 60);
  doc.text(`${approved.length} Prestasi`, 75, 60);
  doc.text(rank ? `#${rank} Sekolah` : '-', 135, 60);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Poin Terverifikasi', 22, 64.5);
  doc.text('Prestasi Disetujui', 75, 64.5);
  doc.text('Peringkat Umum', 135, 64.5);

  let currentY = 75;

  if (narasiAi && narasiAi.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(29, 78, 216);
    doc.text('Narasi Prestasi (Rekomendasi / Catatan Rapor)', 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9.5);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(narasiAi.trim(), pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.5 + 6;
  }

  // Tabel Prestasi
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(15, 23, 42);
  doc.text('Daftar Prestasi Terverifikasi', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Nama Lomba / Kegiatan', 'Kategori', 'Tingkat', 'Peringkat', 'Tanggal', 'Poin']],
    body:
      approved.length > 0
        ? approved.map((a, idx) => [
            idx + 1,
            `${a.namaLomba}\n(${a.penyelenggara})`,
            a.kategori,
            a.tingkat,
            a.peringkat,
            formatTanggalID(a.tanggal),
            String(a.poin),
          ])
        : [['-', 'Belum ada prestasi berstatus Disetujui', '-', '-', '-', '-', '0']],
    styles: { fontSize: 8.5, cellPadding: 2.5, textColor: [30, 41, 59] },
    headStyles: { fillColor: [29, 78, 216], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 9, halign: 'center' },
      6: { cellWidth: 14, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  const finalY = (doc as unknown as { lastAutoTable?: { finalY: number } }).lastAutoTable?.finalY ?? currentY + 30;
  let afterTableY = finalY + 8;

  if (pembinaanAi && pembinaanAi.trim()) {
    if (afterTableY > 245) {
      doc.addPage();
      afterTableY = 20;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.setTextColor(5, 150, 105);
    doc.text('Rekomendasi Pembinaan Bakat', 14, afterTableY);
    afterTableY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const pembinaanLines = doc.splitTextToSize(pembinaanAi.trim(), pageWidth - 28);
    doc.text(pembinaanLines, 14, afterTableY);
    afterTableY += pembinaanLines.length * 4.2 + 8;
  }

  if (afterTableY > 260) {
    doc.addPage();
    afterTableY = 25;
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(71, 85, 105);
  doc.text('Mengetahui,', pageWidth - 65, afterTableY + 4);
  doc.text('Wakil Kepala Sekolah Bidang Kesiswaan', pageWidth - 65, afterTableY + 9);
  doc.text('Sekolah Nurul Insan', pageWidth - 65, afterTableY + 26);

  const safeName = student.nama.toLowerCase().replace(/[^a-z0-9]+/g, '-');
  doc.save(`portofolio-prestasi-${safeName}.pdf`);
}

export function downloadSchoolReportPDF(params: {
  tahunAjaran: string;
  filterLabel: string;
  totalPrestasi: number;
  totalSiswa: number;
  totalPoin: number;
  achievements: Achievement[];
  ringkasanAi?: string;
}): void {
  const { tahunAjaran, filterLabel, totalPrestasi, totalSiswa, totalPoin, achievements, ringkasanAi } = params;
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(29, 78, 216);
  doc.rect(0, 0, pageWidth, 28, 'F');
  doc.setFillColor(5, 150, 105);
  doc.rect(0, 28, pageWidth, 2, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('LAPORAN REKAPITULASI PRESTASI SISWA', 14, 12);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.text(`Sekolah Nurul Insan (SD · SMP · SMA) · Tahun Ajaran ${tahunAjaran}`, 14, 19);
  doc.text(filterLabel, pageWidth - 14, 19, { align: 'right' });

  doc.setDrawColor(226, 232, 240);
  doc.setFillColor(248, 250, 252);
  doc.roundedRect(14, 36, pageWidth - 28, 16, 2, 2, 'FD');

  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text(`${totalPrestasi} Prestasi`, 22, 45);
  doc.text(`${totalSiswa} Siswa`, 80, 45);
  doc.text(`${totalPoin} Poin`, 135, 45);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 116, 139);
  doc.text('Total Prestasi Disetujui', 22, 49.5);
  doc.text('Siswa Berprestasi', 80, 49.5);
  doc.text('Akumulasi Poin Sekolah', 135, 49.5);

  let currentY = 60;

  if (ringkasanAi && ringkasanAi.trim()) {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10.5);
    doc.setTextColor(29, 78, 216);
    doc.text('Ringkasan Capaian Sekolah (Laporan Kepala Sekolah)', 14, currentY);
    currentY += 5;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(30, 41, 59);
    const lines = doc.splitTextToSize(ringkasanAi.trim(), pageWidth - 28);
    doc.text(lines, 14, currentY);
    currentY += lines.length * 4.3 + 6;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10.5);
  doc.setTextColor(15, 23, 42);
  doc.text('Rincian Prestasi Terverifikasi', 14, currentY);

  autoTable(doc, {
    startY: currentY + 3,
    head: [['No', 'Siswa', 'Kelas', 'Nama Lomba', 'Kategori', 'Tingkat', 'Peringkat', 'Poin']],
    body:
      achievements.length > 0
        ? achievements.map((a, idx) => [
            idx + 1,
            a.studentNama,
            `${a.studentJenjang} ${a.studentKelas}`,
            a.namaLomba,
            a.kategori,
            a.tingkat,
            a.peringkat,
            String(a.poin),
          ])
        : [['-', 'Tidak ada data prestasi sesuai filter', '-', '-', '-', '-', '-', '0']],
    styles: { fontSize: 8, cellPadding: 2.2, textColor: [30, 41, 59] },
    headStyles: { fillColor: [5, 150, 105], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    columnStyles: {
      0: { cellWidth: 8, halign: 'center' },
      7: { cellWidth: 12, halign: 'right', fontStyle: 'bold' },
    },
    margin: { left: 14, right: 14 },
  });

  doc.save(`laporan-prestasi-nurul-insan-${tahunAjaran.replace('/', '-')}.pdf`);
}
