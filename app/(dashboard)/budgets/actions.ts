'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { budgetSchema } from '@/lib/validations';

type ActionResult = { ok: true } | { ok: false; error: string };

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

function revalidate() {
  revalidatePath('/budgets');
  revalidatePath('/dashboard');
}

/**
 * Set / ubah anggaran bulan berjalan untuk satu kategori.
 * Bulan & tahun diambil dari server (bukan input user) — anggaran selalu
 * dibuat untuk periode aktif. Upsert lewat unique key
 * (user_id, category_id, month, year) supaya set ulang = update.
 */
export async function saveBudget(
  _prev: ActionResult | null,
  formData: FormData
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const parsed = budgetSchema.safeParse({
    categoryId: formData.get('categoryId'),
    amountLimit: formData.get('amountLimit'),
  });

  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Ada yang salah di isian' };
  }

  const now = new Date();
  const month = now.getMonth() + 1;
  const year = now.getFullYear();

  const { error } = await supabase.from('budgets').upsert(
    {
      user_id: user.id,
      category_id: parsed.data.categoryId,
      month,
      year,
      amount_limit: parsed.data.amountLimit,
    },
    { onConflict: 'user_id,category_id,month,year' }
  );

  if (error) return { ok: false, error: 'Gagal nyimpen anggaran. Coba lagi.' };

  revalidate();
  return { ok: true };
}

export async function deleteBudget(id: string): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: 'Gagal hapus anggaran. Coba lagi.' };

  revalidate();
  return { ok: true };
}

/** Reset semua anggaran bulan berjalan (hapus seluruh baris budget periode ini). */
export async function resetBudgets(): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const now = new Date();
  const { error } = await supabase
    .from('budgets')
    .delete()
    .eq('user_id', user.id)
    .eq('month', now.getMonth() + 1)
    .eq('year', now.getFullYear());

  if (error) return { ok: false, error: 'Gagal reset anggaran. Coba lagi.' };

  revalidate();
  return { ok: true };
}
