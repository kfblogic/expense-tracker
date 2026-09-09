import { createClient } from '@/lib/supabase/server';
import { ensureDefaultCategories } from '@/app/(dashboard)/transactions/actions';
import { monthContext, budgetProgress, type BudgetRow } from '@/lib/aggregate';
import BudgetManager from '@/components/budgets/BudgetManager';

export default async function BudgetsPage() {
  await ensureDefaultCategories();

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();
  const { monthStart } = monthContext(now);

  const [categoriesRes, budgetsRes, txnsRes] = await Promise.all([
    supabase.from('categories').select('id, name').eq('user_id', user!.id).order('name', { ascending: true }),
    supabase
      .from('budgets')
      .select('id, category_id, amount_limit')
      .eq('user_id', user!.id)
      .eq('month', month)
      .eq('year', year),
    supabase.from('transactions').select('category_id, amount').gte('transaction_date', monthStart),
  ]);

  const categories = categoriesRes.data ?? [];
  const budgets = (budgetsRes.data ?? []) as BudgetRow[];
  const txns = txnsRes.data ?? [];

  const nameById = new Map(categories.map((c) => [c.id, c.name]));

  const spentByCategory = new Map<string, number>();
  for (const t of txns) {
    spentByCategory.set(t.category_id, (spentByCategory.get(t.category_id) ?? 0) + Number(t.amount));
  }

  const progress = budgetProgress(budgets, spentByCategory, (id) => nameById.get(id) ?? 'Tanpa kategori');

  const periodLabel = now.toLocaleDateString('id-ID', { month: 'long', year: 'numeric' });

  return (
    <BudgetManager
      periodLabel={periodLabel}
      categories={categories}
      budgets={budgets.map((b) => ({
        id: b.id,
        categoryId: b.category_id,
        amountLimit: Number(b.amount_limit),
      }))}
      progress={progress}
    />
  );
}
