// ID acara wedding: huruf kecil, angka, dan tanda minus (3-64 karakter).
// Dipakai di route session, API acara, dan halaman album supaya aturannya sama.
export function normalizeEventId(value: unknown): string {
  const id = String(value ?? "").trim().toLowerCase();
  return /^[a-z0-9][a-z0-9-]{2,63}$/.test(id) ? id : "";
}
