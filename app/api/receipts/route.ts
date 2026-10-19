import { createClient } from '@supabase/supabase-js';
import { readReceipt } from '@/lib/receipt';
import { isoLocal } from '@/lib/aggregate';
import { formatCurrency } from '@/lib/utils';

/**
 * Kirim struk dari luar browser (iOS Shortcuts / share sheet).
 *   POST multipart/form-data, field `receipt` = gambar
 *   Header: Authorization: Bearer <token dari halaman Setelan>
 * Balasan teks polos supaya Shortcut bisa langsung tampilkan sebagai notifikasi.
 *
 * Tanpa sesi cookie: akses lewat RPC SECURITY DEFINER yang memvalidasi token.
 * Transaksi langsung tersimpan; koreksi lewat halaman Transaksi kalau meleset.
 */
function reply(message: string, status: number) {
  return new Response(message, { status, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

export async function POST(request: Request) {
  const token = request.headers.get('authorization')?.match(/^Bearer\s+([A-Za-z0-9_-]{43})$/)?.[1];
  if (!token) return reply('Token tidak valid. Buat token di halaman Setelan.', 401);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!supabaseUrl || !supabaseAnonKey) return reply('Server belum dikonfigurasi.', 500);

  const supabase = createClient(supabaseUrl, supabaseAnonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { data: categories, error: catError } = await supabase.rpc('receipt_token_categories', {
    p_token: token,
  });
  if (catError) return reply('Gagal memuat data, coba lagi.', 500);
  // ponytail: user tanpa kategori sama sekali juga kena 401 — kategori bawaan selalu di-seed.
  if (!categories || categories.length === 0) {
    return reply('Token tidak valid atau sudah dicabut.', 401);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return reply('Kirim gambar struk sebagai form (field "receipt").', 400);
  }

  const cats = categories as { id: string; name: string }[];
  const scan = await readReceipt(form.get('receipt'), cats);
  if (!scan.ok) return reply(scan.error, 422);

  const { data: id, error } = await supabase.rpc('receipt_token_add_transaction', {
    p_token: token,
    p_amount: scan.amount,
    p_date: scan.date ?? isoLocal(new Date()),
    p_category_id: scan.categoryId,
    p_description: scan.merchant ?? 'Struk',
  });
  if (error) return reply('Gagal menyimpan transaksi, coba lagi.', 500);
  if (!id) return reply('Token tidak valid atau sudah dicabut.', 401);

  const category = cats.find((c) => c.id === scan.categoryId)?.name ?? 'Lainnya';
  return reply(
    `Tercatat ${formatCurrency(scan.amount)}${scan.merchant ? ` · ${scan.merchant}` : ''} (${category})`,
    201
  );
}
