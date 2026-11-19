export async function compressImageFileToDataUrl(
  file: File,
  maxDimension = 900,
  quality = 0.72
): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Berkas yang dipilih harus berupa gambar (JPG, PNG, WebP).');
  }

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Gagal membaca berkas gambar.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Gambar tidak valid atau rusak.'));
      img.onload = () => {
        let { width, height } = img;
        if (width > maxDimension || height > maxDimension) {
          if (width >= height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Browser tidak mendukung pemrosesan kanvas gambar.'));
          return;
        }
        ctx.fillStyle = '#FFFFFF';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', quality);
        if (dataUrl.length > 400000) {
          const fallback = canvas.toDataURL('image/jpeg', 0.5);
          if (fallback.length > 420000) {
            reject(new Error('Ukuran gambar terlalu besar setelah dikompresi. Gunakan gambar di bawah 5 MB.'));
            return;
          }
          resolve(fallback);
          return;
        }
        resolve(dataUrl);
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}
