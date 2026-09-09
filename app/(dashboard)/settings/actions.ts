'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { createClient } from '@/lib/supabase/server';
import { categorySchema } from '@/lib/validations';

type ActionResult = { ok: true } | { ok: false; error: string };

const THEMES = ['system', 'light', 'dark'] as const;
export type ThemePref = (typeof THEMES)[number];

async function getSession() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  return { supabase, user };
}

/** Simpan preferensi tema di user_metadata — ikut akun, lintas perangkat. */
export async function updateTheme(theme: string): Promise<ActionResult> {
  if (!THEMES.includes(theme as ThemePref)) {
    return { ok: false, error: 'Pilihan tema tidak dikenal.' };
  }
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const { error } = await supabase.auth.updateUser({ data: { theme } });
  if (error) return { ok: false, error: 'Gagal simpan tema. Coba lagi.' };

  // Cermin di cookie supaya root layout bisa render atribut tema tanpa network.
  const store = await cookies();
  store.set('theme', theme, {
    maxAge: 60 * 60 * 24 * 365,
    sameSite: 'lax',
    path: '/',
  });

  revalidatePath('/', 'layout');
  return { ok: true };
}

export async function toggleRecurring(id: string, active: boolean): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const { error } = await supabase
    .from('recurring_transactions')
    .update({ active })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: 'Gagal ubah status. Coba lagi.' };

  revalidatePath('/settings');
  return { ok: true };
}

export async function deleteRecurring(id: string): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const { error } = await supabase
    .from('recurring_transactions')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: 'Gagal hapus. Coba lagi.' };

  revalidatePath('/settings');
  return { ok: true };
}

// --- Kelola kategori ---------------------------------------------------------

function revalidateCategoryConsumers() {
  revalidatePath('/settings');
  revalidatePath('/transactions');
  revalidatePath('/dashboard');
  revalidatePath('/budgets');
}

export async function addCategory(
  name: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama kategorinya nggak valid' };
  }

  const { error } = await supabase
    .from('categories')
    .insert({ user_id: user.id, name: parsed.data.name, is_default: false });

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Kategori itu udah ada.' };
    return { ok: false, error: 'Gagal nambah kategori. Coba lagi.' };
  }

  revalidateCategoryConsumers();
  return { ok: true };
}

export async function renameCategory(id: string, name: string): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const parsed = categorySchema.safeParse({ name });
  if (!parsed.success) {
    return { ok: false, error: parsed.error.issues[0]?.message ?? 'Nama kategorinya nggak valid' };
  }

  // Hanya kategori kustom milik user (bawaan dikunci lewat filter is_default).
  const { error } = await supabase
    .from('categories')
    .update({ name: parsed.data.name })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_default', false);

  if (error) {
    if (error.code === '23505') return { ok: false, error: 'Nama itu udah dipakai.' };
    return { ok: false, error: 'Gagal ganti nama. Coba lagi.' };
  }

  revalidateCategoryConsumers();
  return { ok: true };
}

const HEX = /^#[0-9a-fA-F]{6}$/;

/** Set warna kategori (hex #RRGGBB) atau null untuk balik ke palet bawaan. */
export async function setCategoryColor(
  id: string,
  color: string | null
): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  if (color !== null && !HEX.test(color)) {
    return { ok: false, error: 'Kode warnanya nggak valid.' };
  }

  const { error } = await supabase
    .from('categories')
    .update({ color })
    .eq('id', id)
    .eq('user_id', user.id);

  if (error) return { ok: false, error: 'Gagal simpan warna. Coba lagi.' };

  revalidateCategoryConsumers();
  return { ok: true };
}

export async function deleteCategoryById(id: string): Promise<ActionResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const { error } = await supabase
    .from('categories')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('is_default', false);

  if (error) {
    // FK transactions.category_id ON DELETE RESTRICT
    if (error.code === '23503') {
      return { ok: false, error: 'Masih dipakai di transaksi. Pindahkan transaksinya dulu.' };
    }
    return { ok: false, error: 'Gagal hapus kategori. Coba lagi.' };
  }

  revalidateCategoryConsumers();
  return { ok: true };
}
