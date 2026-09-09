import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  monthContext,
  sumAmount,
  deltaPct,
  categoryBreakdown,
  budgetProgress,
  type TxnLite,
  type BudgetRow,
} from '@/lib/aggregate';
import PrintButton from '@/components/ui/PrintButton';

interface Row {
  amount: number;
  transaction_date: string;
  description: string | null;
  category_id: string;
  categories: { name: string } | null;
}

export default async function RingkasanPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const ctx = monthContext(now);

  const [txnRes, budgetRes, catRes] = await Promise.all([
    supabase
      .from('transactions')
      .select('amount, transaction_date, description, category_id, categories(name)')
      .gte('transaction_date', ctx.prevMonthStart)
      .order('transaction_date', { ascending: true }),
    supabase
      .from('budgets')
      .select('id, category_id, amount_limit')
      .eq('user_id', user!.id)
      .eq('month', now.getMonth() + 1)
      .eq('year', now.getFullYear()),
    supabase.from('categories').select('id, name').eq('user_id', user!.id),
  ]);

  const rows = (txnRes.data ?? []) as unknown as Row[];
  const monthRows = rows.filter((r) => r.transaction_date >= ctx.monthStart);
  const prevRows = rows.filter(
    (r) => r.transaction_date >= ctx.prevMonthStart && r.transaction_date < ctx.monthStart
  );

  const monthTotal = sumAmount(monthRows as unknown as TxnLite[]);
  const prevTotal = sumAmount(prevRows as unknown as TxnLite[]);
  const delta = deltaPct(monthTotal, prevTotal);

  const slices = categoryBreakdown(monthRows as unknown as TxnLite[], 99);

  const nameById = new Map((catRes.data ?? []).map((c) => [c.id, c.name]));
  const spent = new Map<string, number>();
  for (const r of monthRows) {
    spent.set(r.category_id, (spent.get(r.category_id) ?? 0) + Number(r.amount));
  }
  const budgets = budgetProgress(
    (budgetRes.data ?? []) as BudgetRow[],
    spent,
    (id) => nameById.get(id) ?? 'Tanpa kategori'
  );

  const periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });
  const generated = now.toLocaleString('id-ID', { dateStyle: 'long', timeStyle: 'short' });

  const th = 'stencil border-b-2 border-line px-2 py-1.5 text-left text-xs tracking-widest text-ink-soft';
  const td = 'border-b border-line/60 px-2 py-1.5 text-sm text-ink';
  const tdNum = td + ' text-right font-mono tabular-nums';

  return (
    <div className="mt-6 space-y-6 text-ink">
      <div className="no-print flex items-center justify-between gap-3">
        <Link href="/dashboard" className="stencil text-sm tracking-wide text-chalk/70 hover:text-chalk">
          ← Dashboard
        </Link>
        <PrintButton />
      </div>

      <header className="slat grain px-5 py-5">
        <h1 className="stencil paint-underline text-2xl text-ink">Ringkasan Bulanan</h1>
        <p className="mt-2 stencil text-sm tracking-widest text-ink-soft">{periodLabel}</p>
        <p className="mt-1 text-xs text-ink-soft">Dicetak {generated}</p>
      </header>

      <section className="slat grain px-5 py-4">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span className="stencil text-sm tracking-widest text-ink-soft">Total pengeluaran</span>
          <span className="painted-numeral text-3xl text-ink [text-shadow:none]">
            {formatCurrency(monthTotal)}
          </span>
        </div>
        <p className="mt-2 text-sm text-ink-soft">
          {monthRows.length} transaksi ·{' '}
          {delta === null
            ? 'belum ada pembanding bulan lalu'
            : `${delta > 0 ? 'naik' : 'turun'} ${Math.abs(delta).toFixed(0)}% vs bulan lalu (${formatCurrency(prevTotal)})`}
        </p>
      </section>

      <section>
        <h2 className="stencil text-sm tracking-widest text-ink">Per kategori</h2>
        <table className="mt-2 w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Kategori</th>
              <th className={th + ' text-right'}>Jumlah</th>
              <th className={th + ' text-right'}>Porsi</th>
            </tr>
          </thead>
          <tbody>
            {slices.map((s) => (
              <tr key={s.name}>
                <td className={td}>{s.name}</td>
                <td className={tdNum}>{formatCurrency(s.amount)}</td>
                <td className={tdNum}>
                  {monthTotal > 0 ? Math.round((s.amount / monthTotal) * 100) : 0}%
                </td>
              </tr>
            ))}
            {slices.length === 0 && (
              <tr>
                <td className={td} colSpan={3}>
                  Belum ada transaksi bulan ini.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </section>

      {budgets.length > 0 && (
        <section>
          <h2 className="stencil text-sm tracking-widest text-ink">Status anggaran</h2>
          <table className="mt-2 w-full border-collapse">
            <thead>
              <tr>
                <th className={th}>Kategori</th>
                <th className={th + ' text-right'}>Terpakai</th>
                <th className={th + ' text-right'}>Batas</th>
                <th className={th + ' text-right'}>%</th>
              </tr>
            </thead>
            <tbody>
              {budgets.map((b) => (
                <tr key={b.id}>
                  <td className={td}>{b.categoryName}</td>
                  <td className={tdNum}>{formatCurrency(b.spent)}</td>
                  <td className={tdNum}>{formatCurrency(b.limit)}</td>
                  <td className={tdNum}>
                    {b.pct}%{b.tone === 'lewat' ? ' ⚠' : ''}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      <section>
        <h2 className="stencil text-sm tracking-widest text-ink">Semua transaksi bulan ini</h2>
        <table className="mt-2 w-full border-collapse">
          <thead>
            <tr>
              <th className={th}>Tanggal</th>
              <th className={th}>Kategori</th>
              <th className={th}>Catatan</th>
              <th className={th + ' text-right'}>Jumlah</th>
            </tr>
          </thead>
          <tbody>
            {monthRows.map((r, i) => (
              <tr key={i}>
                <td className={td}>{formatDate(r.transaction_date)}</td>
                <td className={td}>{r.categories?.name ?? '—'}</td>
                <td className={td}>{r.description ?? ''}</td>
                <td className={tdNum}>{formatCurrency(Number(r.amount))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
