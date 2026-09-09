import { createClient } from '@/lib/supabase/server';
import { ensureDefaultCategories, ensureRecurringPosted } from './actions';
import { monthContext } from '@/lib/aggregate';
import PapanBanner from '@/components/ui/PapanBanner';
import TransactionManager, { type TransactionRow } from '@/components/transactions/TransactionManager';

export default async function TransactionsPage() {
  await ensureDefaultCategories();
  await ensureRecurringPosted();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [categoriesRes, transactionsRes] = await Promise.all([
    supabase
      .from('categories')
      .select('id, name')
      .eq('user_id', user!.id)
      .order('name', { ascending: true }),
    supabase
      .from('transactions')
      .select('id, amount, description, transaction_date, category_id, categories(name)')
      .order('transaction_date', { ascending: false })
      .order('created_at', { ascending: false }),
  ]);

  const categories = categoriesRes.data ?? [];
  const transactions = (transactionsRes.data ?? []) as unknown as TransactionRow[];

  const now = new Date();
  const { monthStart } = monthContext(now);
  const monthRows = transactions.filter((t) => t.transaction_date >= monthStart);
  const monthTotal = monthRows.reduce((s, t) => s + Number(t.amount), 0);
  const periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <>
      <PapanBanner
        label="Pengeluaran"
        periodLabel={periodLabel}
        amount={monthTotal}
        count={monthRows.length}
      />
      <TransactionManager categories={categories} transactions={transactions} />
    </>
  );
}
