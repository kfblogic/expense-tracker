'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { transactionSchema, categorySchema } from '@/lib/validations';
import { isoLocal } from '@/lib/aggregate';
import { advance, dueOccurrences, type Interval } from '@/lib/recurring';

type ActionResult = { ok: true } | { ok: false; error: string };

const DEFAULT_CATEGORIES = [
  'Makan',
  'Transport',
  'Hiburan',
  'Tagihan',
  'Belanja',
  'Kesehatan',
  'Lainnya',
];

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidate() {
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
}

/**
 * Jaring pengaman: kalau trigger auto-seed di Supabase belum sempat jalan
 * (atau user dibuat sebelum migration), pastikan 7 kategori bawaan tersedia.
 */
export async function ensureDefaultCategories(): Promise<void> {
  const { supabase, user } = await getSession();
  if (!user) return;

  const { count, error } = await supabase
    .from('categories')
    .select('id', { count: 'exact', head: true })
    .eq('user_id', user.id);

  if (error || (count ?? 0) > 0) return;

  await supabase.from('categories').insert(
    DEFAULT_CATEGORIES.map((name) => ({
      user_id: user.id,
      name,
      is_default: true,
    }))
  );
}

/**
 * Simpan transaksi: insert kalau tidak ada `id`, update kalau ada.
 * Semua operasi lewat Supabase server client sehingga RLS (user_id = auth.uid())
 * otomatis berlaku.
 */
export async function saveTransaction(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const id = (formData.get('id') as string | null) || null;

  const parsed = transactionSchema.safeParse({
    amount: formData.get('amount'),
    categoryId: formData.get('categoryId'),
    transactionDate: formData.get('transactionDate'),
    description: (formData.get('description') as string)?.trim() || undefined,
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ada yang salah di isian' };
  }

  const payload = {
    category_id: parsed.data.categoryId,
    amount: parsed.data.amount,
    description: parsed.data.description ?? null,
    transaction_date: parsed.data.transactionDate,
  };

  if (id) {
    const { error } = await supabase
      .from('transactions')
      .update(payload)
      .eq('id', id)
      .eq('user_id', user.id);
    if (error) return { ok: false, error: 'Gagal nyimpen perubahan. Coba lagi.' };
  } else {
    const { error } = await supabase
      .from('transactions')
      .insert({ ...payload, user_id: user.id });
    if (error) return { ok: false, error: 'Gagal nyimpen. Coba lagi.' };

    // Transaksi berulang: bikin template. Occurrence pertama = transaksi
    // yang barusan; occurrence berikutnya dibukukan lewat ensureRecurringPosted.
    if (formData.get('repeat') === 'on') {
      const raw = String(formData.get('repeatInterval') ?? 'monthly');
      const interval: Interval =
        raw === 'weekly' || raw === 'yearly' ? raw : 'monthly';
      const day = Math.min(Number(parsed.data.transactionDate.slice(8, 10)) || 1, 28);
      await supabase.from('recurring_transactions').insert({
        user_id: user.id,
        category_id: parsed.data.categoryId,
        amount: parsed.data.amount,
        description: parsed.data.description ?? null,
        interval,
        day_of_month: day,
        next_run: advance(parsed.data.transactionDate, interval, day),
      });
      revalidatePath('/settings');
    }
  }

  revalidate();
  return { ok: true };
}

/**
 * Catch-up transaksi berulang: bukukan tiap occurrence yang jatuh tempo lalu
 * majukan next_run. Dipanggil saat halaman transaksi/dashboard dibuka.
 *
 * ponytail: tanpa lock — dua load bersamaan (mis. prefetch) bisa dobel-posting.
 * Batas diterima untuk app pribadi; kalau jadi masalah, bungkus dengan
 * pg advisory lock per user atau pindah ke satu cron job.
 *
 * Tanpa revalidatePath: dipanggil saat render RSC (revalidate saat render
 * dilarang Next), dan halaman pemanggil query datanya sendiri setelah ini.
 */
export async function ensureRecurringPosted(): Promise<void> {
  const { supabase, user } = await getSession();
  if (!user) return;

  const today = isoLocal(new Date());
  const { data: rules } = await supabase
    .from('recurring_transactions')
    .select('id, category_id, amount, description, interval, day_of_month, next_run')
    .eq('user_id', user.id)
    .eq('active', true)
    .lte('next_run', today);

  if (!rules || rules.length === 0) return;

  for (const rule of rules) {
    const interval: Interval =
      rule.interval === 'weekly' || rule.interval === 'yearly' ? rule.interval : 'monthly';
    const { dates, nextRun } = dueOccurrences(
      rule.next_run,
      today,
      interval,
      rule.day_of_month
    );
    if (dates.length === 0) continue;

    const { error } = await supabase.from('transactions').insert(
      dates.map((d) => ({
        user_id: user.id,
        category_id: rule.category_id,
        amount: rule.amount,
        description: rule.description,
        transaction_date: d,
      }))
    );
    if (error) continue; // jangan majukan next_run kalau insert gagal

    await supabase
      .from('recurring_transactions')
      .update({ next_run: nextRun })
      .eq('id', rule.id)
      .eq('user_id', user.id);
  }
}

export async function deleteTransaction(id: string): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const { error } = await supabase
    .from('transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: 'Gagal hapus. Coba lagi.' };

  revalidate();
  return { ok: true };
}

export async function createCategory(
  name: string
): Promise<{ ok: true; id: string; name: string } | { ok: false; error: string }> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama kategorinya nggak valid' };
  }

  const { data, error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name: parsed.data.name, is_default: false })
    .select('id, name')
    .single();

  if (error) {
    if (error.code === '23505') {
      return { ok: false, error: 'Kategori itu udah ada.' };
    }
    return { ok: false, error: 'Gagal nambah kategori. Coba lagi.' };
  }

  revalidate();
  return { ok: true, id: data.id, name: data.name };
}
