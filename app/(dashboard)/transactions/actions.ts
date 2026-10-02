'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/lib/supabase/server';
import { transactionSchema, categorySchema, receiptScanSchema } from '@/lib/validations';
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

const RECEIPT_MODEL = process.env.AI_GATEWAY_MODEL || 'google/gemini-2.5-flash';
const MAX_RECEIPT_BYTES = 2.5 * 1024 * 1024;

export type ReceiptScanResult =
  | { ok: true; amount: number; date: string | null; merchant: string | null; categoryId: string | null }
  | { ok: false; error: string };

/**
 * Baca foto struk lewat Vercel AI Gateway (model vision), balikin isian form.
 * Tidak menyimpan apa pun — foto langsung dibuang, user tetap review sebelum simpan.
 */
export async function scanReceipt(formData: FormData): Promise<ReceiptScanResult> {
  const { supabase, user } = await getSession();
  if (!user) return { ok: false, error: 'Sesi kamu habis, masuk lagi ya.' };

  const file = formData.get('receipt');
  if (!(file instanceof File) || !/^image\/(jpeg|png|webp)$/.test(file.type)) {
    return { ok: false, error: 'Kirim foto struk (JPG/PNG/WebP).' };
  }
  if (file.size > MAX_RECEIPT_BYTES) return { ok: false, error: 'Fotonya kegedean, coba lagi.' };

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return { ok: false, error: 'Fitur scan struk belum diaktifkan.' };

  const { data: categories, error: catError } = await supabase
    .from('categories')
    .select('id, name')
    .eq('user_id', user.id);
  if (catError) return { ok: false, error: 'Gagal memuat kategori, coba lagi.' };

  const names = (categories ?? []).map((c) => c.name);
  const prompt =
    'Ini gambar bukti pembayaran (kemungkinan Indonesia): struk belanja kertas, atau screenshot ' +
    'bukti transfer/pembayaran dari m-banking atau e-wallet. Balas HANYA JSON tanpa teks lain:\n' +
    '{"total": number|null, "date": "YYYY-MM-DD"|null, "merchant": string|null, "category": string|null}\n' +
    '- total: total akhir yang dibayar dalam rupiah, angka bulat tanpa pemisah & tanpa desimal ' +
    '("Rp 25.000" -> 25000, "IDR 10,000.00" -> 10000, "Rp25.000,00" -> 25000).\n' +
    '- date: tanggal transaksi (bulan bisa singkatan Indonesia: Jan, Feb, Mar, Apr, Mei, Jun, Jul, Agu/Agt, Sep, Okt, Nov, Des).\n' +
    '- merchant: nama toko, atau untuk transfer: nama produk/penerima (bukan nama bank pengirim), singkat.\n' +
    `- category: pilih tepat satu dari ${JSON.stringify(names)} yang paling cocok, atau null.\n` +
    'Kalau gambar bukan bukti pembayaran atau tidak terbaca, isi semua null.';

  const base64 = Buffer.from(await file.arrayBuffer()).toString('base64');

  let raw: unknown;
  try {
    const res = await fetch('https://ai-gateway.vercel.sh/v1/chat/completions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: RECEIPT_MODEL,
        max_tokens: 300,
        // Tanpa ini Gemini 2.5 menghabiskan jatah token buat "thinking" dan JSON-nya terpotong.
        reasoning_effort: 'none',
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: prompt },
              { type: 'image_url', image_url: { url: `data:${file.type};base64,${base64}` } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      // ponytail: status saja yang di-log, isi struk = data finansial
      const err = await res.json().catch(() => null);
      console.error('scanReceipt: gateway status', res.status, err?.error?.type ?? '');
      return { ok: false, error: 'Layanan scan lagi bermasalah, coba sebentar lagi.' };
    }
    const body = await res.json();
    const text: string = body?.choices?.[0]?.message?.content ?? '';
    raw = JSON.parse(text.match(/\{[\s\S]*\}/)?.[0] ?? 'null');
  } catch {
    return { ok: false, error: 'Struk gagal dibaca, coba foto ulang.' };
  }

  const parsed = receiptScanSchema.safeParse(raw);
  if (!parsed.success || parsed.data.total === null) {
    return { ok: false, error: 'Total di struk nggak kebaca. Foto lebih dekat & terang, ya.' };
  }

  const { total, date, merchant, category } = parsed.data;
  const today = isoLocal(new Date());
  const match = (categories ?? []).find((c) => c.name.toLowerCase() === category?.toLowerCase());

  return {
    ok: true,
    amount: Math.round(total),
    date: date && date <= today && !Number.isNaN(Date.parse(date)) ? date : null,
    merchant,
    categoryId: match?.id ?? null,
  };
}
