import { formatCurrency } from '@/lib/utils';
import Tally from './Tally';

interface PapanBannerProps {
  label: string;
  periodLabel: string;
  amount: number;
  count?: number;
  /** Selisih vs periode lalu dalam persen; positif = naik (boros). */
  deltaPct?: number | null;
}

export default function PapanBanner({
  label,
  periodLabel,
  amount,
  count,
  deltaPct,
}: PapanBannerProps) {
  const rupiah = formatCurrency(amount);
  const showTally = typeof count === 'number' && count >= 3 && count <= 40;

  return (
    <section className="enamel bolted grain relative overflow-hidden border border-board-deep bg-board px-5 py-6 text-chalk sm:px-8 sm:py-8">
      <div className="flex items-baseline justify-between gap-3">
        <span className="stencil text-sm text-chalk/75 sm:text-base">{label}</span>
        <span className="stencil text-sm text-chalk/60">{periodLabel}</span>
      </div>

      <p className="painted-numeral paint-underline mt-2 inline-block text-[clamp(2rem,8.5vw,4rem)] leading-none text-chalk">
        {rupiah}
      </p>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
        {typeof count === 'number' && (
          <span className="flex items-center gap-2 text-chalk/80">
            {showTally ? (
              <Tally count={count} className="text-chalk/80" />
            ) : null}
            <span className="stencil text-xs tracking-widest">
              {count} catatan
            </span>
          </span>
        )}

        {typeof deltaPct === 'number' && Number.isFinite(deltaPct) && (
          <span
            className={`stencil inline-flex items-center gap-1 px-2 py-0.5 text-xs tracking-wide ${
              deltaPct > 0
                ? 'bg-signal text-chalk'
                : 'bg-chalk text-board-deep'
            }`}
          >
            {deltaPct > 0 ? '▲' : '▼'} {Math.abs(deltaPct).toFixed(0)}% vs bulan lalu
          </span>
        )}
      </div>
    </section>
  );
}
