'use client';

import { formatCurrency } from '@/lib/utils';
import type { CategoryOption } from './TransactionForm';
import type { TxnFilters } from '@/lib/transactions-filter';

interface TransactionFiltersProps {
  categories: CategoryOption[];
  value: TxnFilters;
  onChange: (next: TxnFilters) => void;
  onReset: () => void;
  onExport: () => void;
  active: boolean;
  resultCount: number;
  resultTotal: number;
}

const fieldBox =
  'mt-1 block w-full border border-line bg-cream-deep px-3 py-2 text-sm text-ink outline-none focus:border-signal';

export default function TransactionFilters({
  categories,
  value,
  onChange,
  onReset,
  onExport,
  active,
  resultCount,
  resultTotal,
}: TransactionFiltersProps) {
  const set = (patch: Partial<TxnFilters>) => onChange({ ...value, ...patch });

  return (
    <div className="slat grain mt-5 space-y-3 px-4 py-4 text-ink">
      <label className="block">
        <span className="stencil block text-[0.625rem] tracking-widest text-ink-soft">Cari catatan</span>
        <input
          type="search"
          inputMode="search"
          value={value.query}
          onChange={(e) => set({ query: e.target.value })}
          placeholder="mis. kopi, bensin, tim…"
          className={fieldBox + ' bg-cream'}
        />
      </label>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <label className="block">
          <span className="stencil block text-[0.625rem] tracking-widest text-ink-soft">Kategori</span>
          <select
            value={value.categoryId}
            onChange={(e) => set({ categoryId: e.target.value })}
            className={fieldBox + ' bg-cream'}
          >
            <option value="">Semua kategori</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="stencil block text-[0.625rem] tracking-widest text-ink-soft">Dari tanggal</span>
          <input
            type="date"
            value={value.from}
            max={value.to || undefined}
            onChange={(e) => set({ from: e.target.value })}
            className={fieldBox + ' bg-cream'}
          />
        </label>

        <label className="block">
          <span className="stencil block text-[0.625rem] tracking-widest text-ink-soft">Sampai tanggal</span>
          <input
            type="date"
            value={value.to}
            min={value.from || undefined}
            onChange={(e) => set({ to: e.target.value })}
            className={fieldBox + ' bg-cream'}
          />
        </label>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 border-t border-dashed border-line pt-3">
        <span className="text-xs text-ink-soft">
          <span className="stencil text-ink">{resultCount}</span> transaksi
          {' · '}
          <span className="font-mono tabular-nums text-ink">{formatCurrency(resultTotal)}</span>
        </span>

        <div className="flex items-center gap-2">
          {active && (
            <button
              type="button"
              onClick={onReset}
              className="stencil border border-line px-3 py-1.5 text-xs tracking-wide text-ink-soft hover:bg-cream-deep"
            >
              Reset
            </button>
          )}
          <button
            type="button"
            onClick={onExport}
            disabled={resultCount === 0}
            className="stencil border-2 border-board-deep bg-board px-3 py-1.5 text-xs tracking-wide text-chalk shadow-[0_2px_0_0_rgb(0_0_0/0.25)] disabled:opacity-50"
          >
            Export CSV
          </button>
        </div>
      </div>
    </div>
  );
}
