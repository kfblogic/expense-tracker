import Link from 'next/link';

export const metadata = { title: 'Offline — Expense Tracker' };

export default function OfflinePage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-ground px-4 py-12">
      <div className="bolted grain slat w-full max-w-sm border-2 border-line px-6 py-8 text-center text-ink">
        <p className="stencil text-xl text-ink">Lagi offline</p>
        <p className="mt-2 text-sm text-ink-soft">
          Halaman ini belum tersimpan buat dibuka tanpa internet. Sambungin dulu, terus coba lagi.
        </p>
        <Link
          href="/dashboard"
          className="stencil mt-5 inline-block border-2 border-board-deep bg-board px-4 py-2 text-sm tracking-wide text-chalk"
        >
          Coba ke Dashboard
        </Link>
      </div>
    </main>
  );
}
