import { receiptScanSchema } from '@/lib/validations';
import { isoLocal } from '@/lib/aggregate';

const RECEIPT_MODEL = process.env.AI_GATEWAY_MODEL || 'google/gemini-2.5-flash';
export const MAX_RECEIPT_BYTES = 2.5 * 1024 * 1024;

export type ReceiptScanResult =
  | { ok: true; amount: number; date: string | null; merchant: string | null; categoryId: string | null }
  | { ok: false; error: string };

/** Tebak tipe gambar dari magic bytes — iOS Shortcuts kadang kirim tanpa MIME yang benar. */
function sniffImageType(bytes: Uint8Array): string | null {
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  const head = String.fromCharCode(...bytes.slice(0, 12));
  if (head.startsWith('RIFF') && head.endsWith('WEBP')) return 'image/webp';
  return null;
}

/**
 * Baca foto struk lewat Vercel AI Gateway (model vision), balikin isian form.
 * Tidak menyimpan apa pun — foto langsung dibuang.
 */
export async function readReceipt(
  file: unknown,
  categories: { id: string; name: string }[]
): Promise<ReceiptScanResult> {
  if (!(file instanceof File)) return { ok: false, error: 'Kirim foto struk (JPG/PNG/WebP).' };
  if (file.size > MAX_RECEIPT_BYTES) return { ok: false, error: 'Fotonya kegedean, coba lagi.' };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = sniffImageType(bytes);
  if (!mime) return { ok: false, error: 'Kirim foto struk (JPG/PNG/WebP).' };

  const token = process.env.AI_GATEWAY_API_KEY || process.env.VERCEL_OIDC_TOKEN;
  if (!token) return { ok: false, error: 'Fitur scan struk belum diaktifkan.' };

  const names = categories.map((c) => c.name);
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

  const base64 = Buffer.from(bytes).toString('base64');

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
              { type: 'image_url', image_url: { url: `data:${mime};base64,${base64}` } },
            ],
          },
        ],
      }),
      signal: AbortSignal.timeout(30_000),
    });
    if (!res.ok) {
      // ponytail: status saja yang di-log, isi struk = data finansial
      const err = await res.json().catch(() => null);
      console.error('readReceipt: gateway status', res.status, err?.error?.type ?? '');
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
  const match = categories.find((c) => c.name.toLowerCase() === category?.toLowerCase());

  return {
    ok: true,
    amount: Math.round(total),
    date: date && date <= today && !Number.isNaN(Date.parse(date)) ? date : null,
    merchant,
    categoryId: match?.id ?? null,
  };
}
