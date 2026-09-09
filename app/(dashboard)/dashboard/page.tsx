import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { ensureRecurringPosted } from '@/app/(dashboard)/transactions/actions';
import { formatCurrency } from '@/lib/utils';
import {
  monthContext,
  sumAmount,
  deltaPct,
  categoryBreakdown,
  dailyTotals,
  type TxnLite,
} from '@/lib/aggregate';
import PapanBanner from '@/components/ui/PapanBanner';
import CategoryDonut from '@/components/charts/CategoryDonut';
import DailyTrendChart from '@/components/charts/DailyTrendChart';

export default async function DashboardPage() {
  await ensureRecurringPosted();

  const supabase = await createClient();
  const { data } = await supabase
    .from('transactions')
    .select('amount, transaction_date, categories(name)')
    .order('transaction_date', { ascending: false });

  const txns = (data ?? []) as unknown as TxnLite[];
  const ctx = monthContext();

  const monthRows = txns.filter((t) => t.transaction_date >= ctx.monthStart);
  const prevRows = txns.filter(
    (t) => t.transaction_date >= ctx.prevMonthStart && t.transaction_date < ctx.monthStart
  );

  const monthTotal = sumAmount(monthRows);
  const prevTotal = sumAmount(prevRows);
  const delta = deltaPct(monthTotal, prevTotal);

  const slices = categoryBreakdown(monthRows, 6);
  const daily = dailyTotals(monthRows, ctx.monthStart, ctx.dayOfMonth);
  const perDay = ctx.dayOfMonth > 0 ? monthTotal / ctx.dayOfMonth : 0;

  const now = new Date();
  const periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const monthLabel = now.toLocaleDateString('id-ID', { month: 'long' });

  return (
    <div className="space-y-5">
      <PapanBanner
        label="Pengeluaran"
        periodLabel={periodLabel}
        amount={monthTotal}
        count={monthRows.length}
        deltaPct={delta}
      />

      <div className="grid grid-cols-2 gap-3">
        <Link
          href="/transactions"
          className="slat grain block px-4 py-4 text-ink transition-transform hover:-translate-y-0.5"
        >
          <span className="stencil text-xs tracking-widest text-ink-soft">Jumlah catatan</span>
          <p className="painted-numeral mt-1 text-3xl text-ink [text-shadow:none]">
            {monthRows.length}
          </p>
          <span className="stencil text-xs tracking-wide text-board">Lihat semua →</span>
        </Link>

        <div className="slat grain px-4 py-4 text-ink">
          <span className="stencil text-xs tracking-widest text-ink-soft">Rata-rata / hari</span>
          <p className="mt-1 font-mono text-xl font-semibold tabular-nums text-ink">
            {formatCurrency(Math.round(perDay))}
          </p>
          <span className="stencil text-xs tracking-wide text-ink-soft">
            baru hari ke-{ctx.dayOfMonth}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <CategoryDonut slices={slices} total={monthTotal} />
        <DailyTrendChart points={daily} monthLabel={monthLabel} />
      </div>

      <div className="bolted grain flex items-center justify-between border border-board-deep bg-board px-5 py-4 text-chalk">
        <p className="stencil text-sm tracking-wide">Belum nyatet hari ini?</p>
        <Link
          href="/transactions"
          className="stencil border-2 border-board-deep bg-signal px-4 py-2 text-sm tracking-wide text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)]"
        >
          + Catat
        </Link>
      </div>

      <Link
        href="/ringkasan"
        className="slat grain block px-4 py-3 text-center text-ink transition-transform hover:-translate-y-0.5"
      >
        <span className="stencil text-sm tracking-wide text-board">Cetak ringkasan bulanan (PDF) →</span>
      </Link>
    </div>
  );
}
