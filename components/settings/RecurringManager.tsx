'use client';

import { useState, useTransition } from 'react';
import { deleteRecurring, toggleRecurring } from '@/app/(dashboard)/settings/actions';
import { formatCurrency } from '@/lib/utils';
import { categoryColor } from '@/lib/category-colors';
import type { Interval } from '@/lib/recurring';
import { useToast } from '@/components/ui/Toast';

export interface RecurringItem {
  id: string;
  categoryName: string;
  description: string | null;
  amount: number;
  interval: Interval;
  dayOfMonth: number;
  active: boolean;
  nextRun: string;
}

function scheduleLabel(it: RecurringItem): string {
  if (it.interval === 'weekly') return 'tiap minggu';
  if (it.interval === 'yearly') return 'tiap tahun';
  return `tiap tanggal ${it.dayOfMonth}`;
}

function nextRunLabel(iso: string): string {
  return new Date(iso + 'T00:00:00').toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export default function RecurringManager({ items }: { items: RecurringItem[] }) {
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  function handleToggle(id: string, active: boolean) {
    startTransition(async () => {
      const res = await toggleRecurring(id, active);
      if (res.ok) push(active ? 'Berulang diaktifkan' : 'Berulang dijeda');
      else push(res.error, 'error');
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteRecurring(id);
      if (res.ok) push('Berulang dihapus');
      else push(res.error, 'error');
      setConfirmId(null);
    });
  }

  if (items.length === 0) {
    return (
      <div className="slat grain border-2 border-dashed border-line px-5 py-6 text-center text-ink-soft">
        <p className="text-sm">Belum ada transaksi berulang.</p>
      </div>
    );
  }

  return (
    <ul className="space-y-2">
      {items.map((it) => (
        <li key={it.id} className="slat grain px-4 py-3 text-ink">
          <div className="flex items-center gap-3">
            <span
              className="h-3.5 w-3.5 shrink-0 border border-black/20"
              style={{ backgroundColor: categoryColor(it.categoryName) }}
              aria-hidden
            />
            <div className="min-w-0 flex-1">
              <p className="stencil text-sm leading-tight text-ink">
                {it.categoryName}
                {!it.active && (
                  <span className="stencil ml-2 border border-line px-1.5 text-[0.625rem] tracking-wide text-ink-soft">
                    Dijeda
                  </span>
                )}
              </p>
              <p className="text-xs text-ink-soft">
                {it.description ? `${it.description} · ` : ''}
                {scheduleLabel(it)} · lanjut {nextRunLabel(it.nextRun)}
              </p>
            </div>
            <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
              {formatCurrency(it.amount)}
            </span>
          </div>

          <div className="mt-2 flex items-center justify-end gap-2.5 border-t border-dashed border-line pt-2">
            <button
              onClick={() => handleToggle(it.id, !it.active)}
              disabled={isPending}
              className="stencil text-xs tracking-wide text-board hover:text-board-deep disabled:opacity-60"
            >
              {it.active ? 'Jeda' : 'Aktifkan'}
            </button>
            {confirmId === it.id ? (
              <span className="flex items-center gap-1.5">
                <span className="stencil text-[0.625rem] tracking-wide text-ink-soft">Yakin?</span>
                <button
                  onClick={() => handleDelete(it.id)}
                  disabled={isPending}
                  className="stencil bg-signal px-2 py-1 text-xs tracking-wide text-chalk disabled:opacity-60"
                >
                  Hapus
                </button>
                <button
                  onClick={() => setConfirmId(null)}
                  className="stencil border border-line px-2 py-1 text-xs tracking-wide text-ink-soft"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmId(it.id)}
                className="stencil text-xs tracking-wide text-signal-deep"
              >
                Hapus
              </button>
            )}
          </div>
        </li>
      ))}
    </ul>
  );
}
