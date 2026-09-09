/**
 * Palet kategoris "cat" — divalidasi dengan skill dataviz (CVD adjacent, mode
 * light & dark). Warnanya hidup sebagai CSS var di `globals.css` (`--cat-*`)
 * supaya light/dark bertukar di satu tempat, dan dipakai baik untuk kotak-cat
 * kategori maupun seri chart. Lihat DESIGN.md — The Chart-Only Color Rule.
 *
 * Warna kustom per kategori (kolom `categories.color`) di-inject sebagai
 * `--catc-<key>` di `:root` oleh dashboard layout; `categoryColor()` memakainya
 * sebagai override dengan fallback ke palet slug.
 */

const SLUGS = ['makan', 'transport', 'hiburan', 'tagihan', 'belanja', 'kesehatan'] as const;

const DEFAULT_SLUG: Record<string, string> = {
  Makan: 'makan',
  Transport: 'transport',
  Hiburan: 'hiburan',
  Tagihan: 'tagihan',
  Belanja: 'belanja',
  Kesehatan: 'kesehatan',
  Lainnya: 'lainnya',
};

/** Nilai hex light-mode dari `--cat-*` di globals.css — cermin, untuk default
 *  `<input type="color">`. Kalau globals.css berubah, samakan di sini. */
export const SLUG_HEX: Record<string, string> = {
  makan: '#eb6834',
  transport: '#1baf7a',
  hiburan: '#eda100',
  tagihan: '#e87ba4',
  belanja: '#008300',
  kesehatan: '#4a3aa7',
  lainnya: '#7a6f5d',
};

/** Slug kategori: bawaan punya slug tetap, kustom di-hash deterministik. */
export function categorySlug(name: string): string {
  const fixed = DEFAULT_SLUG[name];
  if (fixed) return fixed;

  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return SLUGS[Math.abs(hash) % SLUGS.length];
}

/** Kunci CSS-var stabil per nama kategori (untuk override warna kustom). */
export function categoryVarKey(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = (hash * 31 + name.charCodeAt(i)) | 0;
  }
  return 'c' + Math.abs(hash).toString(36);
}

/** CSS-var warna cat untuk sebuah kategori: override kustom → palet slug. */
export function categoryColor(name: string): string {
  return `var(--catc-${categoryVarKey(name)}, var(--cat-${categorySlug(name)}))`;
}

/** Hex konkret untuk default `<input type="color">` (tak bisa terima `var()`). */
export function categoryHexFallback(name: string): string {
  return SLUG_HEX[categorySlug(name)] ?? SLUG_HEX.lainnya;
}

/** Warna netral untuk kelompok "Lainnya" di chart (gabungan sisa kategori). */
export const OTHER_COLOR = 'var(--cat-lainnya)';
