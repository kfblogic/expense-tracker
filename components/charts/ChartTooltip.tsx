import { formatCurrency } from '@/lib/utils';

interface TooltipLike {
  active?: boolean;
  label?: string | number;
  payload?: { name?: string; value?: number | string }[];
  dayPrefix?: boolean;
}

export default function ChartTooltip({ active, label, payload, dayPrefix }: TooltipLike) {
  if (!active || !payload || payload.length === 0) return null;
  const point = payload[0];
  const heading =
    point.name ?? (label != null ? (dayPrefix ? `Tanggal ${label}` : String(label)) : '');

  return (
    <div className="slat px-2.5 py-1.5 text-xs">
      {heading && <p className="stencil text-ink">{heading}</p>}
      <p className="font-mono tabular-nums text-ink">{formatCurrency(Number(point.value))}</p>
    </div>
  );
}
