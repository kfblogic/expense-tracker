'use client';

import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { categoryColor, OTHER_COLOR } from '@/lib/category-colors';
import { formatCurrency } from '@/lib/utils';
import type { CategorySlice } from '@/lib/aggregate';
import ChartFrame from './ChartFrame';
import ChartTooltip from './ChartTooltip';

const sliceColor = (s: CategorySlice) => (s.isOther ? OTHER_COLOR : categoryColor(s.name));

export default function CategoryDonut({
  slices,
  total,
}: {
  slices: CategorySlice[];
  total: number;
}) {
  if (total <= 0 || slices.length === 0) {
    return (
      <ChartFrame title="Pengeluaran per kategori">
        <p className="py-8 text-center text-sm text-ink-soft">Belum ada pengeluaran bulan ini.</p>
      </ChartFrame>
    );
  }

  const pct = (a: number) => Math.round((a / total) * 100);

  const table = (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-line/50">
        {slices.map((s) => (
          <tr key={s.name}>
            <td className="py-1.5">
              <span
                className="mr-2 inline-block h-2.5 w-2.5 border border-black/20 align-middle"
                style={{ background: sliceColor(s) }}
              />
              <span className="stencil align-middle">{s.name}</span>
            </td>
            <td className="py-1.5 text-right font-mono tabular-nums">{formatCurrency(s.amount)}</td>
            <td className="py-1.5 pl-3 text-right font-mono tabular-nums text-ink-soft">
              {pct(s.amount)}%
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );

  return (
    <ChartFrame title="Pengeluaran per kategori" table={table}>
      <div className="flex flex-col items-center gap-4 sm:flex-row">
        <div className="relative h-40 w-40 shrink-0">
          <ResponsiveContainer>
            <PieChart>
              <Pie
                data={slices}
                dataKey="amount"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius="62%"
                outerRadius="100%"
                paddingAngle={2}
                stroke="var(--cream)"
                strokeWidth={2}
                isAnimationActive={false}
              >
                {slices.map((s) => (
                  <Cell key={s.name} fill={sliceColor(s)} />
                ))}
              </Pie>
              <Tooltip content={<ChartTooltip />} />
            </PieChart>
          </ResponsiveContainer>
          <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
            <span className="stencil text-[0.625rem] tracking-widest text-ink-soft">Total</span>
            <span className="painted-numeral text-base text-ink [text-shadow:none]">
              {formatCurrency(total)}
            </span>
          </div>
        </div>

        <ul className="w-full flex-1 space-y-1.5">
          {slices.map((s) => (
            <li key={s.name} className="flex items-center gap-2 text-xs">
              <span
                className="h-2.5 w-2.5 shrink-0 border border-black/20"
                style={{ background: sliceColor(s) }}
                aria-hidden
              />
              <span className="stencil flex-1 truncate text-ink">{s.name}</span>
              <span className="font-mono tabular-nums text-ink-soft">{pct(s.amount)}%</span>
              <span className="font-mono tabular-nums text-ink">{formatCurrency(s.amount)}</span>
            </li>
          ))}
        </ul>
      </div>
    </ChartFrame>
  );
}
