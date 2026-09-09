/**
 * Agregasi transaksi → data siap-chart untuk dashboard (PRD 3.4).
 * Semua fungsi murni (tanpa efek samping) supaya mudah diuji & dipakai di RSC.
 *
 * ponytail: tanpa test runner di proyek ini; logika ini display-only (bukan
 * jalur uang), jadi dijaga sederhana & bercabang minimum. Tambah Vitest bila
 * agregasi tumbuh rumit.
 */

export interface TxnLite {
  amount: number;
  transaction_date: string; // 'YYYY-MM-DD'
  categories: { name: string } | null;
}

/** Tanggal lokal 'YYYY-MM-DD' (hindari geser hari dari toISOString UTC). */
export function isoLocal(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

export interface MonthContext {
  monthStart: string;
  prevMonthStart: string;
  today: string;
  dayOfMonth: number;
}

export function monthContext(ref: Date = new Date()): MonthContext {
  const y = ref.getFullYear();
  const m = ref.getMonth();
  return {
    monthStart: isoLocal(new Date(y, m, 1)),
    prevMonthStart: isoLocal(new Date(y, m - 1, 1)),
    today: isoLocal(ref),
    dayOfMonth: ref.getDate(),
  };
}

export const sumAmount = (rows: TxnLite[]): number =>
  rows.reduce((s, r) => s + Number(r.amount), 0);

/** Persentase perubahan current vs previous; null jika previous nol/negatif. */
export function deltaPct(current: number, previous: number): number | null {
  if (previous <= 0) return null;
  return ((current - previous) / previous) * 100;
}

export interface CategorySlice {
  name: string;
  amount: number;
  isOther: boolean;
}

/**
 * Breakdown per kategori, diurutkan besar→kecil. Bila kategori melebihi
 * `maxSlices`, sisanya digabung ke satu irisan "Lainnya" (secondary encoding
 * wajib di chart: label langsung + legend + tabel).
 */
export function categoryBreakdown(rows: TxnLite[], maxSlices = 6): CategorySlice[] {
  const map = new Map<string, number>();
  for (const r of rows) {
    const name = r.categories?.name ?? 'Lainnya';
    map.set(name, (map.get(name) ?? 0) + Number(r.amount));
  }

  const sorted = [...map.entries()]
    .map(([name, amount]) => ({ name, amount }))
    .sort((a, b) => b.amount - a.amount);

  if (sorted.length <= maxSlices) {
    return sorted.map((s) => ({ ...s, isOther: s.name === 'Lainnya' }));
  }

  const head = sorted.slice(0, maxSlices - 1).map((s) => ({ ...s, isOther: false }));
  const tailSum = sorted.slice(maxSlices - 1).reduce((s, x) => s + x.amount, 0);

  const existingOther = head.find((s) => s.name === 'Lainnya');
  if (existingOther) {
    existingOther.amount += tailSum;
    existingOther.isOther = true;
    return head;
  }
  return [...head, { name: 'Lainnya', amount: tailSum, isOther: true }];
}

export interface DailyPoint {
  day: number;
  amount: number;
}

// --- Budget (PRD 3.5) ---------------------------------------------------------

export type BudgetTone = 'aman' | 'hati-hati' | 'lewat';

/** Warna progress: >100% merah, >=80% amber, sisanya kobalt (PRD: hijau/kuning/merah). */
export function budgetTone(pct: number): BudgetTone {
  if (pct > 100) return 'lewat';
  if (pct >= 80) return 'hati-hati';
  return 'aman';
}

export interface BudgetRow {
  id: string;
  category_id: string;
  amount_limit: number;
}

export interface BudgetProgress {
  id: string;
  categoryId: string;
  categoryName: string;
  limit: number;
  spent: number;
  remaining: number; // bisa negatif kalau lewat
  pct: number; // dibulatkan, bisa > 100
  tone: BudgetTone;
}

/**
 * Gabungkan limit anggaran dengan realisasi pengeluaran per kategori bulan ini.
 * Diurutkan dari yang paling mepet/lewat batas.
 */
export function budgetProgress(
  budgets: BudgetRow[],
  spentByCategory: Map<string, number>,
  categoryName: (id: string) => string
): BudgetProgress[] {
  return budgets
    .map((b) => {
      const limit = Number(b.amount_limit);
      const spent = spentByCategory.get(b.category_id) ?? 0;
      const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
      return {
        id: b.id,
        categoryId: b.category_id,
        categoryName: categoryName(b.category_id),
        limit,
        spent,
        remaining: limit - spent,
        pct,
        tone: budgetTone(pct),
      };
    })
    .sort((a, b) => b.pct - a.pct);
}

/** Total per hari, 1..`daysUpTo`, hari tanpa transaksi = 0. */
export function dailyTotals(
  rows: TxnLite[],
  monthStart: string,
  daysUpTo: number
): DailyPoint[] {
  const out: DailyPoint[] = Array.from({ length: daysUpTo }, (_, i) => ({
    day: i + 1,
    amount: 0,
  }));
  for (const r of rows) {
    if (r.transaction_date < monthStart) continue;
    const day = Number(r.transaction_date.slice(8, 10));
    if (day >= 1 && day <= daysUpTo) out[day - 1].amount += Number(r.amount);
  }
  return out;
}
