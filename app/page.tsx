import Link from 'next/link';

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ground px-4 py-12">
      <main className="w-full max-w-lg">
        <div className="bolted enamel grain border-2 border-board-deep bg-board px-7 py-10 text-chalk sm:px-10 sm:py-12">
          <span className="stencil text-xs tracking-[0.3em] text-chalk/70">Catatan pengeluaran</span>
          <h1 className="painted-numeral mt-2 text-5xl text-chalk sm:text-6xl">
            Expense
            <br />
            Tracker
          </h1>
          <p className="paint-underline mt-4 inline-block text-base text-chalk/85">
            Catat pengeluaran harian secepat nulis di papan warung.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="stencil border-2 border-board-deep bg-signal px-6 py-2.5 text-sm tracking-widest text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.3)] transition-transform hover:-translate-y-0.5"
            >
              Masuk
            </Link>
            <Link
              href="/register"
              className="stencil border-2 border-chalk/40 px-6 py-2.5 text-sm tracking-widest text-chalk transition-colors hover:bg-chalk hover:text-board-deep"
            >
              Daftar
            </Link>
          </div>
        </div>

        <p className="stencil mt-5 px-1 text-xs tracking-wide text-chalk/50">
          Buat dipake sendiri · Rupiah · Fase 0–3 (lihat PROGRESS.md)
        </p>
      </main>
    </div>
  );
}
