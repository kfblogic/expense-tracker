import Link from 'next/link';
import { monthKey } from '@/lib/aggregate';

interface MonthNavProps {
  refDate: Date;
  basePath: string;
}

/** Pindah bulan lewat `?bulan=YYYY-MM`; bulan berjalan = URL polos, tak bisa maju ke masa depan. */
export default function MonthNav({ refDate, basePath }: MonthNavProps) {
  const current = monthKey(new Date());
  const isCurrent = monthKey(refDate) === current;
  const prev = new Date(refDate.getFullYear(), refDate.getMonth() - 1, 1);
  const next = new Date(refDate.getFullYear(), refDate.getMonth() + 1, 1);
  const href = (d: Date) => (monthKey(d) === current ? basePath : `${basePath}?bulan=${monthKey(d)}`);
  const label = (d: Date) => d.toLocaleDateString('id-ID', { month: 'short', year: 'numeric' });

  const btn =
    'stencil border border-line bg-cream px-3 py-1.5 text-xs tracking-wide text-ink hover:bg-cream-deep';

  return (
    <nav aria-label="Pilih bulan" className="no-print flex items-center justify-between gap-2">
      <Link href={href(prev)} className={btn}>
        ‹ {label(prev)}
      </Link>
      {isCurrent ? (
        <span className="stencil text-xs tracking-widest text-chalk/70">Bulan ini</span>
      ) : (
        <Link href={basePath} className="stencil text-xs tracking-wide text-chalk/70 hover:text-chalk">
          Ke bulan ini
        </Link>
      )}
      {isCurrent ? (
        <span className={btn + ' invisible'} aria-hidden>
          {label(next)} ›
        </span>
      ) : (
        <Link href={href(next)} className={btn}>
          {label(next)} ›
        </Link>
      )}
    </nav>
  );
}
