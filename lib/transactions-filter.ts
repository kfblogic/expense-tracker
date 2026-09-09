/**
 * Filter + export transaksi (PRD 3.6 & 3.7). Fungsi murni, dipakai client-side
 * supaya pencarian real-time tanpa round-trip server (data transaksi bulan
 * berjalan + riwayat sudah ada di memori halaman).
 *
 * ponytail: tanpa test runner di proyek ini; logika ini display/export (bukan
 * jalur uang tulis). Dijaga sederhana & bercabang minimum. Tambah Vitest bila
 * filter tumbuh rumit (mis. multi-kategori, operator teks).
 */

export interface FilterableTxn {
  amount: number;
  description: string | null;
  transaction_date: string; // 'YYYY-MM-DD'
  category_id: string;
  categories: { name: string } | null;
}

export interface TxnFilters {
  categoryId: string; // '' = semua kategori
  from: string; // '' = tak dibatasi
  to: string; // '' = tak dibatasi
  query: string; // cari di catatan
}

export const EMPTY_FILTERS: TxnFilters = { categoryId: '', from: '', to: '', query: '' };

export function hasActiveFilter(f: TxnFilters): boolean {
  return Boolean(f.categoryId || f.from || f.to || f.query.trim());
}

export function filterTransactions<T extends FilterableTxn>(rows: T[], f: TxnFilters): T[] {
  const q = f.query.trim().toLowerCase();
  return rows.filter((r) => {
    if (f.categoryId && r.category_id !== f.categoryId) return false;
    if (f.from && r.transaction_date < f.from) return false;
    if (f.to && r.transaction_date > f.to) return false;
    if (q && !(r.description ?? '').toLowerCase().includes(q)) return false;
    return true;
  });
}

const CSV_HEADER = ['Tanggal', 'Kategori', 'Jumlah', 'Catatan'];

/** Bungkus sel yang mengandung pemisah/kutip/baris-baru sesuai RFC 4180. */
function csvCell(v: string | number): string {
  const s = String(v);
  return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export function toCSV(rows: FilterableTxn[]): string {
  const lines = [CSV_HEADER.join(',')];
  for (const r of rows) {
    lines.push(
      [
        r.transaction_date,
        r.categories?.name ?? '',
        Math.round(Number(r.amount)),
        r.description ?? '',
      ]
        .map(csvCell)
        .join(',')
    );
  }
  return lines.join('\r\n');
}
