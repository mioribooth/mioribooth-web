// Menulis ke album acara (kirim sesi / ganti nama) hanya boleh dari aplikasi booth.
// Set BOOTH_API_KEY di Vercel (Environment Variables), lalu isi key yang sama di
// pengaturan aplikasi WPF. Kalau BOOTH_API_KEY belum diset, pengecekan dilewati.
export function isBoothAuthorized(request: Request): boolean {
  const expected = process.env.BOOTH_API_KEY;

  if (!expected) return true;

  return request.headers.get("x-booth-key") === expected;
}
