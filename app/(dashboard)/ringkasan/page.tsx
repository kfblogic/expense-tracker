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

  const th =
    'stencil border-b-2 border-ink/25 px-2 py-2 text-left text-[0.6875rem] tracking-widest text-ink';
  const td = 'border-b border-line px-2 py-2 text-sm text-ink';
  const tdNum = td + ' text-right font-mono tabular-nums';

  const deltaText =
    delta === null
      ? 'belum ada pembanding bulan lalu'
      : `${delta > 0 ? 'naik' : 'turun'} ${Math.abs(delta).toFixed(0)}% vs bulan lalu (${formatCurrency(prevTotal)})`;

  return (
    <div className="mt-6 space-y-5">
      <div className="no-print flex items-center justify-between gap-3">
        <Link href="/dashboard" className="stencil text-sm tracking-wide text-chalk/70 hover:text-chalk">
          ← Dashboard
        </Link>
        <PrintButton />
      </div>

      {/* Lembar dokumen — satu panel krem, konsisten light/dark & cetak */}
      <article className="slat grain space-y-7 px-6 py-7 text-ink sm:px-9 sm:py-9">
        <header className="border-b-2 border-dashed border-line pb-4">
          <h1 className="stencil paint-underline text-2xl text-ink">Ringkasan Bulanan</h1>
          <p className="stencil mt-2 text-sm tracking-widest text-ink-soft">{periodLabel}</p>
          <p className="mt-1 text-xs text-ink-soft">Dicetak {generated}</p>
        </header>

        <div className="flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
          <div>
            <span className="stencil text-sm tracking-widest text-ink-soft">Total pengeluaran</span>
            <p className="mt-1 text-sm text-ink-soft">{monthRows.length} transaksi · {deltaText}</p>
          </div>
          <span className="painted-numeral text-4xl text-ink [text-shadow:none]">
            {formatCurrency(monthTotal)}
          </span>
        </div>

        <section>
          <h2 className="stencil mb-2 text-sm tracking-widest text-ink">Per kategori</h2>
          <table className="w-full border-collapse">
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
            <h2 className="stencil mb-2 text-sm tracking-widest text-ink">Status anggaran</h2>
            <table className="w-full border-collapse">
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
          <h2 className="stencil mb-2 text-sm tracking-widest text-ink">Semua transaksi bulan ini</h2>
          <table className="w-full border-collapse">
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
                  <td className={td + ' text-ink-soft'}>{r.description ?? ''}</td>
                  <td className={tdNum}>{formatCurrency(Number(r.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </article>
    </div>
  );
}
