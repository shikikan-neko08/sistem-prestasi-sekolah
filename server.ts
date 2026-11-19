import 'dotenv/config';
import express, { Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const PORT = Number(process.env.PORT || 3000);
const MODEL_NAME = 'gemini-4-hydrogen';

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY belum dikonfigurasi di environment server.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function handleGeminiError(res: Response, error: unknown): void {
  const message = error instanceof Error ? error.message : 'Terjadi kesalahan saat memanggil layanan AI.';
  console.error('Gemini API Error:', message);
  if (message.includes('API_KEY_INVALID') || message.includes('PERMISSION_DENIED') || message.includes('403')) {
    res.status(403).json({
      error: 'Akses Gemini API ditolak. Periksa pengaturan GEMINI_API_KEY di panel Secrets.',
    });
    return;
  }
  if (message.includes('RESOURCE_EXHAUSTED') || message.includes('429')) {
    res.status(429).json({
      error: 'Kuota Gemini API sementara tercapai. Silakan coba beberapa saat lagi.',
    });
    return;
  }
  if (message.includes('belum dikonfigurasi')) {
    res.status(500).json({ error: message });
    return;
  }
  res.status(500).json({
    error: `Gagal memproses permintaan AI: ${message}`,
  });
}

interface StudentPayload {
  nama: string;
  nis: string;
  jenjang: string;
  kelas: string;
}

interface AchievementSummaryItem {
  namaLomba: string;
  kategori: string;
  tingkat: string;
  peringkat: string;
  tanggal: string;
  tahunAjaran: string;
  penyelenggara: string;
  poin: number;
}

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true });
  });

  // 1. Buat narasi prestasi siswa (catatan rapor / surat rekomendasi)
  app.post('/api/ai/narasi', async (req: Request, res: Response) => {
    try {
      const { student, achievements, totalPoin } = req.body as {
        student?: StudentPayload;
        achievements?: AchievementSummaryItem[];
        totalPoin?: number;
      };

      if (!student || !student.nama) {
        res.status(400).json({ error: 'Data siswa tidak lengkap.' });
        return;
      }

      const list = Array.isArray(achievements) ? achievements : [];
      if (list.length === 0) {
        res.status(400).json({ error: 'Siswa belum memiliki prestasi berstatus Disetujui untuk dibuatkan narasi.' });
        return;
      }

      const ai = getGeminiClient();
      const daftarPrestasi = list
        .map(
          (a, idx) =>
            `${idx + 1}. ${a.peringkat} - ${a.namaLomba} (Kategori: ${a.kategori}, Tingkat: ${a.tingkat}, Tahun Ajaran: ${a.tahunAjaran}, Penyelenggara: ${a.penyelenggara}, Poin: ${a.poin})`
        )
        .join('\n');

      const prompt = `Buatkan 1 paragraf narasi prestasi resmi dalam Bahasa Indonesia yang ringkas, elegan, dan objektif (sekitar 85-130 kata) untuk keperluan catatan rapor atau surat rekomendasi Sekolah Nurul Insan.

Data Siswa:
- Nama: ${student.nama}
- NIS: ${student.nis}
- Jenjang/Kelas: ${student.jenjang} Kelas ${student.kelas}
- Total Poin Prestasi Terverifikasi: ${totalPoin ?? 0} poin

Daftar Prestasi Disetujui:
${daftarPrestasi}

Aturan Penulisan:
- Gunakan bahasa Indonesia baku dan formal khas institusi pendidikan Indonesia.
- Sebutkan capaian utama, bidang yang menonjol, serta sikap ketekunan/konsistensi tanpa melebih-lebihkan fakta di luar daftar.
- Jangan gunakan bullet point, judul, atau pembuka seperti "Berikut adalah narasi...". Langsung berikan paragraf narasi siap pakai.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah Wakil Kepala Sekolah Bidang Kesiswaan di Sekolah Nurul Insan (SD/SMP/SMA) yang menulis narasi resmi portofolio siswa secara ringkas, faktual, dan profesional dalam Bahasa Indonesia.',
        },
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        res.status(502).json({ error: 'Model AI mengembalikan respons kosong.' });
        return;
      }
      res.json({ text });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // 2. Saran pembinaan bakat siswa (3 saran singkat & realistis)
  app.post('/api/ai/pembinaan', async (req: Request, res: Response) => {
    try {
      const { student, achievements } = req.body as {
        student?: StudentPayload;
        achievements?: AchievementSummaryItem[];
      };

      if (!student || !student.nama) {
        res.status(400).json({ error: 'Data siswa tidak lengkap.' });
        return;
      }

      const list = Array.isArray(achievements) ? achievements : [];
      const daftarPrestasi =
        list.length > 0
          ? list
              .map(
                (a, idx) =>
                  `${idx + 1}. ${a.peringkat} ${a.namaLomba} (${a.kategori} · ${a.tingkat} · ${a.tanggal})`
              )
              .join('\n')
          : 'Belum ada prestasi disetujui; siswa baru memulai rekam jejak prestasi.';

      const ai = getGeminiClient();
      const prompt = `Analisis pola prestasi siswa berikut dan berikan tepat 3 saran pembinaan pengembangan bakat yang singkat, spesifik, dan realistis untuk dilaksanakan oleh guru pembina di sekolah SD/SMP/SMA Nurul Insan.

Data Siswa:
- Nama: ${student.nama}
- Jenjang/Kelas: ${student.jenjang} Kelas ${student.kelas}

Rekam Prestasi Terverifikasi:
${daftarPrestasi}

Aturan Penulisan:
- Tulis dalam Bahasa Indonesia yang jelas dan terstruktur bernomor 1, 2, 3.
- Setiap poin maksimal 2 kalimat: fokus pada langkah konkret (target kompetisi lanjutan, pendampingan/ekstrakurikuler, atau penguatan portofolio lintas bidang).
- Jangan gunakan kata pengantar atau penutup tambahan.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah koordinator pembina prestasi dan konselor bakat di Sekolah Nurul Insan. Berikan saran pembinaan praktis yang sesuai jenjang pendidikan siswa.',
        },
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        res.status(502).json({ error: 'Model AI mengembalikan respons kosong.' });
        return;
      }
      res.json({ text });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  // 3. Ringkasan capaian sekolah untuk laporan Kepala Sekolah
  app.post('/api/ai/ringkasan', async (req: Request, res: Response) => {
    try {
      const { tahunAjaran, stats } = req.body as {
        tahunAjaran?: string;
        stats?: {
          totalPrestasi: number;
          totalSiswaBerprestasi: number;
          totalPoin: number;
          perJenjang: Record<string, number>;
          perKategori: Record<string, number>;
          perTingkat: Record<string, number>;
          topStudents: Array<{ nama: string; kelas: string; jenjang: string; poin: number; jumlah: number }>;
          highlights: string[];
        };
      };

      if (!stats) {
        res.status(400).json({ error: 'Data statistik laporan tidak lengkap.' });
        return;
      }

      const ai = getGeminiClient();
      const prompt = `Susun ringkasan eksekutif capaian prestasi sekolah untuk laporan resmi Kepala Sekolah SD/SMP/SMA Nurul Insan.

Periode: Tahun Ajaran ${tahunAjaran || 'Semua Tahun'}
Statistik Terverifikasi:
- Total Prestasi Disetujui: ${stats.totalPrestasi} prestasi
- Jumlah Siswa Berprestasi: ${stats.totalSiswaBerprestasi} siswa
- Total Akumulasi Poin: ${stats.totalPoin} poin
- Sebaran Jenjang: ${JSON.stringify(stats.perJenjang)}
- Sebaran Kategori: ${JSON.stringify(stats.perKategori)}
- Sebaran Tingkat: ${JSON.stringify(stats.perTingkat)}
- Siswa Poin Tertinggi: ${stats.topStudents.map((s) => `${s.nama} (${s.jenjang} ${s.kelas}, ${s.poin} poin, ${s.jumlah} prestasi)`).join('; ')}
- Sorotan Lomba Unggulan: ${stats.highlights.join('; ')}

Aturan Penulisan:
- Tulis dalam 2 sampai 3 paragraf Bahasa Indonesia baku, formal, dan strategis (total 160-240 kata).
- Paragraf 1: Gambaran umum capaian dan sebaran jenjang/tingkat.
- Paragraf 2: Kekuatan kategori dominan serta apresiasi kontribusi siswa unggulan.
- Paragraf 3: Evaluasi singkat dan fokus penguatan pembinaan untuk periode berikutnya.
- Langsung tulis isi ringkasan tanpa judul tambahan atau format markdown berlebihan.`;

      const response = await ai.models.generateContent({
        model: MODEL_NAME,
        contents: prompt,
        config: {
          systemInstruction:
            'Anda adalah tim penyusun laporan tahunan akademik Sekolah Nurul Insan untuk Kepala Sekolah dan Yayasan.',
        },
      });

      const text = (response.text ?? '').trim();
      if (!text) {
        res.status(502).json({ error: 'Model AI mengembalikan respons kosong.' });
        return;
      }
      res.json({ text });
    } catch (error) {
      handleGeminiError(res, error);
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sistem Prestasi Siswa Nurul Insan berjalan di port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Gagal menjalankan server:', err);
  process.exit(1);
});
