'use client';

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';
import { formatCurrency } from '@/lib/utils';
import type { DailyPoint } from '@/lib/aggregate';
import ChartFrame from './ChartFrame';
import ChartTooltip from './ChartTooltip';

export default function DailyTrendChart({
  points,
  monthLabel,
}: {
  points: DailyPoint[];
  monthLabel: string;
}) {
  const hasData = points.some((p) => p.amount > 0);

  if (!hasData) {
    return (
      <ChartFrame title="Pengeluaran per hari">
        <p className="py-8 text-center text-sm text-ink-soft">Belum ada pengeluaran bulan ini.</p>
      </ChartFrame>
    );
  }

  const table = (
    <table className="w-full text-sm">
      <tbody className="divide-y divide-line/50">
        {points
          .filter((p) => p.amount > 0)
          .map((p) => (
            <tr key={p.day}>
              <td className="stencil py-1.5">Tanggal {p.day}</td>
              <td className="py-1.5 text-right font-mono tabular-nums">{formatCurrency(p.amount)}</td>
            </tr>
          ))}
      </tbody>
    </table>
  );

  return (
    <ChartFrame title="Pengeluaran per hari" table={table}>
      <div className="h-40 w-full">
        <ResponsiveContainer>
          <BarChart data={points} margin={{ top: 4, right: 4, bottom: 0, left: 0 }} barCategoryGap="14%">
            <CartesianGrid vertical={false} stroke="var(--line)" strokeDasharray="2 3" />
            <XAxis
              dataKey="day"
              tickLine={false}
              axisLine={{ stroke: 'var(--line)' }}
              tick={{ fontSize: 10, fill: 'var(--ink-soft)' }}
              interval={4}
            />
            <YAxis hide />
            <Tooltip cursor={{ fill: 'var(--line)', opacity: 0.35 }} content={<ChartTooltip dayPrefix />} />
            <Bar dataKey="amount" fill="var(--trend)" isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="stencil mt-1 text-[0.625rem] tracking-widest text-ink-soft">
        Sepanjang {monthLabel}
      </p>
    </ChartFrame>
  );
}
