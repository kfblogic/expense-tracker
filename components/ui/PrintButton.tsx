'use client';

export default function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="stencil border-2 border-board-deep bg-board px-4 py-2 text-sm tracking-wide text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5"
    >
      Simpan PDF
    </button>
  );
}
