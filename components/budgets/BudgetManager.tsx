'use client';

import { useMemo, useState, useTransition } from 'react';
import { deleteBudget, resetBudgets } from '@/app/(dashboard)/budgets/actions';
import { formatCurrency } from '@/lib/utils';
import { categoryColor } from '@/lib/category-colors';
import type { BudgetProgress, BudgetTone } from '@/lib/aggregate';
import { useToast } from '@/components/ui/Toast';
import BudgetForm, { type BudgetDraft, type CategoryOption } from './BudgetForm';

interface BudgetManagerProps {
  periodLabel: string;
  categories: CategoryOption[];
  budgets: BudgetDraft[];
  progress: BudgetProgress[];
}

type ModalState =
  | null
  | { mode: 'add'; categoryId?: string }
  | { mode: 'edit'; budget: BudgetDraft };

const TONE_COLOR: Record<BudgetTone, string> = {
  aman: 'var(--board)',
  'hati-hati': 'var(--budget-warn)',
  lewat: 'var(--signal)',
};

const TONE_LABEL: Record<BudgetTone, string> = {
  aman: 'Aman',
  'hati-hati': 'Hampir batas',
  lewat: 'Lewat batas',
};

export default function BudgetManager({ periodLabel, categories, budgets, progress }: BudgetManagerProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  const progressByCategory = useMemo(
    () => new Map(progress.map((p) => [p.categoryId, p])),
    [progress]
  );
  const budgetByCategory = useMemo(
    () => new Map(budgets.map((b) => [b.categoryId, b])),
    [budgets]
  );
  const budgetedIds = budgets.map((b) => b.categoryId);

  const alerts = progress.filter((p) => p.tone !== 'aman');

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteBudget(id);
      if (result.ok) push('Anggaran dihapus');
      else {
        setError(result.error);
        push(result.error, 'error');
      }
      setConfirmId(null);
    });
  }

  function handleReset() {
    setError(null);
    startTransition(async () => {
      const result = await resetBudgets();
      if (result.ok) push('Semua anggaran direset');
      else {
        setError(result.error);
        push(result.error, 'error');
      }
      setConfirmReset(false);
    });
  }

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h1 className="stencil paint-underline text-2xl text-chalk">Anggaran</h1>
          <p className="stencil mt-1 text-xs tracking-widest text-chalk/60">{periodLabel}</p>
        </div>
        <div className="hidden items-center gap-2 sm:flex">
          {budgets.length > 0 &&
            (confirmReset ? (
              <span className="flex items-center gap-1.5">
                <span className="stencil text-[0.625rem] tracking-wide text-chalk/70">Reset semua?</span>
                <button
                  onClick={handleReset}
                  disabled={isPending}
                  className="stencil bg-signal px-2 py-1.5 text-xs tracking-wide text-chalk disabled:opacity-60"
                >
                  Ya
                </button>
                <button
                  onClick={() => setConfirmReset(false)}
                  className="stencil border border-chalk/40 px-2 py-1.5 text-xs tracking-wide text-chalk/80"
                >
                  Batal
                </button>
              </span>
            ) : (
              <button
                onClick={() => setConfirmReset(true)}
                className="stencil border border-chalk/40 px-3 py-2 text-sm tracking-wide text-chalk/80 hover:bg-chalk hover:text-board-deep"
              >
                Reset
              </button>
            ))}
          <button
            onClick={() => setModal({ mode: 'add' })}
            disabled={budgetedIds.length >= categories.length}
            className="stencil border-2 border-board-deep bg-signal px-4 py-2 text-sm tracking-wide text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-60"
          >
            + Atur anggaran
          </button>
        </div>
      </div>

      {error && (
        <p className="slat mt-4 border-signal px-4 py-3 text-sm text-signal-deep">{error}</p>
      )}

      {alerts.length > 0 && (
        <div className="bolted grain mt-5 border-2 border-signal bg-board-deep px-5 py-4 text-chalk">
          <p className="stencil text-sm tracking-widest text-chalk">⚠ Perhatian anggaran</p>
          <ul className="mt-2 space-y-1 text-sm text-chalk/85">
            {alerts.map((a) => (
              <li key={a.id}>
                <span className="stencil">{a.categoryName}</span> —{' '}
                {a.tone === 'lewat'
                  ? `lewat batas ${a.pct}% (${formatCurrency(Math.abs(a.remaining))} di atas limit)`
                  : `sudah ${a.pct}% terpakai, sisa ${formatCurrency(a.remaining)}`}
              </li>
            ))}
          </ul>
        </div>
      )}

      <ul className="mt-5 space-y-2.5">
        {categories.map((c) => {
          const p = progressByCategory.get(c.id);
          const b = budgetByCategory.get(c.id);
          const color = categoryColor(c.name);

          return (
            <li key={c.id} className="slat grain px-4 py-3.5 text-ink">
              <div className="flex items-center gap-3">
                <span
                  className="h-3.5 w-3.5 shrink-0 border border-black/20"
                  style={{ backgroundColor: color }}
                  aria-hidden
                />
                <span className="stencil flex-1 text-sm text-ink">{c.name}</span>

                {p ? (
                  <span className="font-mono text-sm font-semibold tabular-nums text-ink">
                    {formatCurrency(p.spent)}{' '}
                    <span className="text-ink-soft">/ {formatCurrency(p.limit)}</span>
                  </span>
                ) : (
                  <span className="stencil text-xs tracking-wide text-ink-soft">Belum diatur</span>
                )}

                {b ? (
                  confirmId === b.id ? (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="stencil text-[0.625rem] tracking-wide text-ink-soft">Yakin?</span>
                      <button
                        onClick={() => handleDelete(b.id)}
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
                    <span className="flex shrink-0 items-center gap-2.5">
                      <button
                        onClick={() => setModal({ mode: 'edit', budget: b })}
                        className="stencil text-xs tracking-wide text-board hover:text-board-deep"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => setConfirmId(b.id)}
                        className="stencil text-xs tracking-wide text-signal-deep"
                      >
                        Hapus
                      </button>
                    </span>
                  )
                ) : (
                  <button
                    onClick={() => setModal({ mode: 'add', categoryId: c.id })}
                    className="stencil shrink-0 border border-line px-2.5 py-1 text-xs tracking-wide text-board hover:border-board"
                  >
                    Atur
                  </button>
                )}
              </div>

              {p && (
                <div className="mt-2.5">
                  <div
                    className="h-2.5 w-full overflow-hidden border border-black/15 bg-cream-deep"
                    role="progressbar"
                    aria-valuenow={p.pct}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-label={`${c.name}: ${p.pct}% dari anggaran`}
                  >
                    <div
                      className="h-full transition-[width]"
                      style={{
                        width: `${Math.min(p.pct, 100)}%`,
                        backgroundColor: TONE_COLOR[p.tone],
                      }}
                    />
                  </div>
                  <div className="mt-1 flex items-center justify-between text-xs">
                    <span
                      className="stencil tracking-wide"
                      style={{ color: TONE_COLOR[p.tone] }}
                    >
                      {p.pct}% · {TONE_LABEL[p.tone]}
                    </span>
                    <span className="text-ink-soft">
                      {p.remaining >= 0
                        ? `sisa ${formatCurrency(p.remaining)}`
                        : `lebih ${formatCurrency(Math.abs(p.remaining))}`}
                    </span>
                  </div>
                </div>
              )}
            </li>
          );
        })}
      </ul>

      {categories.length === 0 && (
        <p className="slat mt-4 px-4 py-3 text-sm text-ink-soft">
          Kategori belum kebentuk. Coba refresh halaman.
        </p>
      )}

      {budgets.length > 0 && (
        <button
          onClick={() => (confirmReset ? handleReset() : setConfirmReset(true))}
          disabled={isPending}
          className="stencil mt-5 w-full border border-chalk/40 px-3 py-2 text-xs tracking-wide text-chalk/80 disabled:opacity-60 sm:hidden"
        >
          {confirmReset ? 'Ketuk lagi buat reset semua anggaran' : 'Reset semua anggaran'}
        </button>
      )}

      <button
        onClick={() => setModal({ mode: 'add' })}
        disabled={budgetedIds.length >= categories.length}
        className="stencil fixed bottom-5 right-5 z-40 border-2 border-board-deep bg-signal px-5 py-3 text-base tracking-wide text-chalk shadow-[0_4px_0_0_rgb(0_0_0/0.3)] transition-transform active:translate-y-0.5 disabled:opacity-60 sm:hidden"
      >
        + Anggaran
      </button>

      {modal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-board-deep/70 p-4"
          onClick={() => setModal(null)}
        >
          <div
            className="settle slat grain w-full max-w-md border-2 border-line p-5 sm:p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="stencil flex items-center justify-between border-b-2 border-dashed border-line pb-2 text-ink">
              <span className="text-lg">
                {modal.mode === 'add' ? 'Atur Anggaran' : 'Ubah Anggaran'}
              </span>
              <span className="text-xs tracking-widest text-ink-soft">{periodLabel}</span>
            </div>
            <BudgetForm
              categories={categories}
              budgetedCategoryIds={budgetedIds}
              budget={modal.mode === 'edit' ? modal.budget : undefined}
              initialCategoryId={modal.mode === 'add' ? modal.categoryId : undefined}
              onDone={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
