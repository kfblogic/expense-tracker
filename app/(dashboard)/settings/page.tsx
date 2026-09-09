import { createClient } from '@/lib/supabase/server';
import ThemeToggle from '@/components/ui/ThemeToggle';
import RecurringManager, { type RecurringItem } from '@/components/settings/RecurringManager';
import CategoryManager, { type CategoryRow } from '@/components/settings/CategoryManager';
import type { Interval } from '@/lib/recurring';
import type { ThemePref } from './actions';

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const theme = (user?.user_metadata?.theme as ThemePref | undefined) ?? 'system';

  const [recRes, catRes] = await Promise.all([
    supabase
      .from('recurring_transactions')
      .select('id, amount, description, interval, day_of_month, active, next_run, categories(name)')
      .eq('user_id', user!.id)
      .order('created_at', { ascending: false }),
    supabase
      .from('categories')
      .select('id, name, is_default, color')
      .eq('user_id', user!.id)
      .order('is_default', { ascending: false })
      .order('name', { ascending: true }),
  ]);

  const items: RecurringItem[] = (recRes.data ?? []).map((r) => {
    const cat = r.categories as unknown as { name: string } | { name: string }[] | null;
    const raw = r.interval as string;
    return {
      id: r.id as string,
      categoryName: (Array.isArray(cat) ? cat[0]?.name : cat?.name) ?? 'Tanpa kategori',
      description: (r.description as string | null) ?? null,
      amount: Number(r.amount),
      interval: (raw === 'weekly' || raw === 'yearly' ? raw : 'monthly') as Interval,
      dayOfMonth: r.day_of_month as number,
      active: r.active as boolean,
      nextRun: r.next_run as string,
    };
  });

  const categories: CategoryRow[] = (catRes.data ?? []).map((c) => ({
    id: c.id as string,
    name: c.name as string,
    isDefault: c.is_default as boolean,
    color: (c.color as string | null) ?? null,
  }));

  return (
    <div className="mt-6 space-y-8">
      <h1 className="stencil paint-underline text-2xl text-chalk">Setelan</h1>

      <section className="slat grain px-5 py-5 text-ink">
        <h2 className="stencil text-sm tracking-widest text-ink">Tema</h2>
        <p className="mt-1 text-xs text-ink-soft">
          Preferensi ikut akun kamu — kebawa ke perangkat lain, bukan cuma browser ini.
        </p>
        <div className="mt-3">
          <ThemeToggle current={theme} />
        </div>
      </section>

      <section>
        <h2 className="stencil text-sm tracking-widest text-chalk">Kategori</h2>
        <p className="mt-1 text-xs text-chalk/60">
          Tambah, ganti nama, atau hapus kategori kustom. Kategori bawaan dikunci.
        </p>
        <div className="mt-3">
          <CategoryManager categories={categories} />
        </div>
      </section>

      <section>
        <h2 className="stencil text-sm tracking-widest text-chalk">Transaksi berulang</h2>
        <p className="mt-1 text-xs text-chalk/60">
          Dibuat lewat centang &ldquo;Transaksi berulang&rdquo; saat nyatat. Dibukukan otomatis
          tiap periode pas kamu buka aplikasi.
        </p>
        <div className="mt-3">
          <RecurringManager items={items} />
        </div>
      </section>
    </div>
  );
}
