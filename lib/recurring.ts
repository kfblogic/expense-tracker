/**
 * Jadwal transaksi berulang (PRD 3.8). Strategi "catch-up": saat halaman
 * transaksi/dashboard dibuka, tiap rule yang jatuh tempo (next_run <= hari ini)
 * dibukukan jadi transaksi nyata lalu next_run dimajukan. Idempoten selama
 * next_run maju. Tanpa cron — cukup untuk pemakaian pribadi.
 *
 * ponytail: interval mingguan/bulanan/tahunan. Mingguan = +7 hari dari next_run
 * (anchor ikut hari transaksi pertama, tanpa picker hari). day_of_month dikunci
 * 1..28 dan hanya relevan untuk 'monthly'.
 */

export type Interval = 'weekly' | 'monthly' | 'yearly';

export const INTERVAL_LABEL: Record<Interval, string> = {
  weekly: 'Mingguan',
  monthly: 'Bulanan',
  yearly: 'Tahunan',
};

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

/** Maju `n` hari dari 'YYYY-MM-DD' (UTC, hindari geser DST). */
export function addDays(iso: string, n: number): string {
  const d = new Date(iso + 'T00:00:00Z');
  d.setUTCDate(d.getUTCDate() + n);
  return `${d.getUTCFullYear()}-${pad(d.getUTCMonth() + 1)}-${pad(d.getUTCDate())}`;
}

/** Maju satu bulan dari 'YYYY-MM-DD', tanggal dikunci ke `day` (1..28). */
export function addMonth(iso: string, day: number): string {
  const [y, m] = iso.split('-').map(Number);
  const nextM = m === 12 ? 1 : m + 1;
  const nextY = m === 12 ? y + 1 : y;
  return `${nextY}-${pad(nextM)}-${pad(day)}`;
}

/** Occurrence berikutnya menurut interval. */
export function advance(iso: string, interval: Interval, day: number): string {
  if (interval === 'weekly') return addDays(iso, 7);
  if (interval === 'yearly') {
    const [y, m, d] = iso.split('-').map(Number);
    return `${y + 1}-${pad(m)}-${pad(d)}`;
  }
  return addMonth(iso, day);
}

/**
 * Occurrence dari `nextRun` (inklusif) sampai `today` (inklusif), plus nilai
 * `nextRun` baru sesudahnya. `cap` = jaring pengaman jumlah iterasi (sisanya
 * dibukukan saat kunjungan berikutnya).
 */
export function dueOccurrences(
  nextRun: string,
  today: string,
  interval: Interval,
  day: number,
  cap = 120
): { dates: string[]; nextRun: string } {
  const dates: string[] = [];
  let cursor = nextRun;
  while (cursor <= today && dates.length < cap) {
    dates.push(cursor);
    cursor = advance(cursor, interval, day);
  }
  return { dates, nextRun: cursor };
}
