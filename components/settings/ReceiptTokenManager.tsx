'use client';

import { useState, useTransition } from 'react';
import { createReceiptToken, revokeReceiptToken } from '@/app/(dashboard)/settings/actions';
import { useToast } from '@/components/ui/Toast';

export interface ReceiptTokenInfo {
  createdAt: string;
  lastUsedAt: string | null;
}

function dateLabel(iso: string): string {
  return new Date(iso).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function ReceiptTokenManager({ info }: { info: ReceiptTokenInfo | null }) {
  // Token mentah cuma ada di state ini, hilang begitu halaman ditutup.
  const [token, setToken] = useState<string | null>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  function handleCreate() {
    startTransition(async () => {
      const res = await createReceiptToken();
      if (res.ok) {
        setToken(res.token);
        push('Token dibuat — salin sekarang');
      } else push(res.error, 'error');
    });
  }

  function handleRevoke() {
    startTransition(async () => {
      const res = await revokeReceiptToken();
      if (res.ok) {
        setToken(null);
        push('Token dicabut');
      } else push(res.error, 'error');
      setConfirmRevoke(false);
    });
  }

  async function copy(text: string, label: string) {
    try {
      await navigator.clipboard.writeText(text);
      push(`${label} disalin`);
    } catch {
      push('Gagal menyalin, salin manual ya.', 'error');
    }
  }

  const endpoint = typeof window === 'undefined' ? '/api/receipts' : `${window.location.origin}/api/receipts`;

  return (
    <div className="slat grain px-5 py-5 text-ink">
      {info ? (
        <p className="text-sm">
          Token aktif · dibuat {dateLabel(info.createdAt)}
          {info.lastUsedAt ? ` · terakhir dipakai ${dateLabel(info.lastUsedAt)}` : ' · belum pernah dipakai'}
        </p>
      ) : (
        <p className="text-sm text-ink-soft">Belum ada token.</p>
      )}

      {token && (
        <div className="mt-3 space-y-2 border-2 border-dashed border-line p-3">
          <p className="text-xs text-ink-soft">
            Salin token ini sekarang — tidak akan ditampilkan lagi. Siapa pun yang memegangnya bisa
            mencatat transaksi atas nama kamu.
          </p>
          <div className="flex gap-2">
            <input
              readOnly
              value={token}
              onFocus={(e) => e.currentTarget.select()}
              className="min-w-0 flex-1 border border-line bg-transparent px-2 py-1.5 font-mono text-xs"
            />
            <button
              onClick={() => copy(token, 'Token')}
              className="stencil shrink-0 bg-board px-3 py-1.5 text-xs tracking-wide text-chalk"
            >
              Salin
            </button>
          </div>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2.5">
        <button
          onClick={handleCreate}
          disabled={isPending}
          className="stencil bg-board px-3 py-1.5 text-xs tracking-wide text-chalk disabled:opacity-60"
        >
          {info ? 'Buat ulang token' : 'Buat token'}
        </button>
        {info &&
          (confirmRevoke ? (
            <span className="flex items-center gap-1.5">
              <span className="stencil text-[0.625rem] tracking-wide text-ink-soft">Yakin?</span>
              <button
                onClick={handleRevoke}
                disabled={isPending}
                className="stencil bg-signal px-2 py-1 text-xs tracking-wide text-chalk disabled:opacity-60"
              >
                Cabut
              </button>
              <button
                onClick={() => setConfirmRevoke(false)}
                className="stencil border border-line px-2 py-1 text-xs tracking-wide text-ink-soft"
              >
                Batal
              </button>
            </span>
          ) : (
            <button
              onClick={() => setConfirmRevoke(true)}
              className="stencil text-xs tracking-wide text-signal-deep"
            >
              Cabut token
            </button>
          ))}
      </div>

      <details className="mt-4 text-xs text-ink-soft">
        <summary className="stencil cursor-pointer tracking-wide text-ink">Cara pasang di iPhone</summary>
        <ol className="mt-2 list-decimal space-y-1 pl-5">
          <li>Buka app Pintasan → + → beri nama &ldquo;Catat Struk&rdquo;.</li>
          <li>Info (ⓘ) → nyalakan &ldquo;Tampilkan di Lembar Bagikan&rdquo;, tipe input: Gambar.</li>
          <li>Tambah aksi &ldquo;Ubah Ukuran Gambar&rdquo; → lebar 1080.</li>
          <li>Tambah aksi &ldquo;Konversikan Gambar&rdquo; → JPEG.</li>
          <li>
            Tambah aksi &ldquo;Dapatkan Konten URL&rdquo;:
            <span className="mt-1 flex items-center gap-2">
              <code className="min-w-0 break-all font-mono" suppressHydrationWarning>
                {endpoint}
              </code>
              <button
                onClick={() => copy(endpoint, 'Alamat')}
                className="stencil shrink-0 text-board hover:text-board-deep"
              >
                Salin
              </button>
            </span>
            Metode POST · Header <code className="font-mono">Authorization</code> ={' '}
            <code className="font-mono">Bearer &lt;token&gt;</code> · Isi Permintaan: Formulir, field{' '}
            <code className="font-mono">receipt</code> (File) = gambar hasil konversi.
          </li>
          <li>Tambah aksi &ldquo;Tampilkan Pemberitahuan&rdquo; → isi: Konten URL.</li>
        </ol>
        <p className="mt-2">Selesai. Screenshot struk → Bagikan → Catat Struk.</p>
      </details>
    </div>
  );
}
