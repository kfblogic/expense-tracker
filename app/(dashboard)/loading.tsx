export default function Loading() {
  return (
    <div className="mt-6 animate-pulse space-y-5" aria-busy="true" aria-label="Memuat">
      <div className="bolted h-40 border border-board-deep bg-board/60" />
      <div className="grid grid-cols-2 gap-3">
        <div className="slat h-24 bg-cream/40" />
        <div className="slat h-24 bg-cream/40" />
      </div>
      <div className="space-y-2">
        <div className="slat h-12 bg-cream/40" />
        <div className="slat h-12 bg-cream/40" />
        <div className="slat h-12 bg-cream/40" />
      </div>
    </div>
  );
}
