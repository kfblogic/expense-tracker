'use client';

import { useMemo, useState, useTransition } from 'react';
import { deleteTransaction } from '@/app/(dashboard)/transactions/actions';
import { formatCurrency } from '@/lib/utils';
import { categoryColor } from '@/lib/category-colors';
import { isoLocal } from '@/lib/aggregate';
import {
  filterTransactions,
  toCSV,
  EMPTY_FILTERS,
  hasActiveFilter,
  type TxnFilters,
} from '@/lib/transactions-filter';
import { useToast } from '@/components/ui/Toast';
import TransactionForm, { type CategoryOption, type TransactionDraft } from './TransactionForm';
import TransactionFilters from './TransactionFilters';

export interface TransactionRow extends TransactionDraft {
  categories: { name: string } | null;
}

interface TransactionManagerProps {
  categories: CategoryOption[];
  transactions: TransactionRow[];
}

type ModalState = null | { mode: 'add' } | { mode: 'edit'; txn: TransactionRow };

const TODAY = isoLocal(new Date());

const BOM = String.fromCharCode(0xfeff);

function downloadCSV(csv: string, filename: string) {
  // BOM supaya Excel baca UTF-8 (nama kategori/catatan bisa non-ASCII)
  const blob = new Blob([BOM + csv], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function dayLabel(iso: string): string {
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });
}

export default function TransactionManager({ categories, transactions }: TransactionManagerProps) {
  const [modal, setModal] = useState<ModalState>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [filters, setFilters] = useState<TxnFilters>(EMPTY_FILTERS);
  const { push } = useToast();

  const visible = useMemo(
    () => filterTransactions(transactions, filters),
    [transactions, filters]
  );
  const filterActive = hasActiveFilter(filters);
  const visibleTotal = useMemo(
    () => visible.reduce((s, t) => s + Number(t.amount), 0),
    [visible]
  );

  const groups = useMemo(() => {
    const map = new Map<string, TransactionRow[]>();
    for (const t of visible) {
      const arr = map.get(t.transaction_date) ?? [];
      arr.push(t);
      map.set(t.transaction_date, arr);
    }
    return [...map.entries()].sort((a, b) => (a[0] < b[0] ? 1 : -1));
  }, [visible]);

  const usedCategories = useMemo(() => {
    const names = new Set(visible.map((t) => t.categories?.name).filter(Boolean) as string[]);
    return [...names].sort((a, b) => a.localeCompare(b));
  }, [visible]);

  function handleExport() {
    downloadCSV(toCSV(visible), `transaksi-${TODAY}.csv`);
    push(`CSV terunduh · ${visible.length} baris`);
  }

  function handleDelete(id: string) {
    setError(null);
    startTransition(async () => {
      const result = await deleteTransaction(id);
      if (result.ok) push('Catatan dihapus');
      else {
        setError(result.error);
        push(result.error, 'error');
      }
      setConfirmId(null);
    });
  }

  return (
    <div className="mt-6">
      <div className="flex items-end justify-between gap-3">
        <h1 className="stencil paint-underline text-2xl text-chalk">Catatan</h1>
        <button
          onClick={() => setModal({ mode: 'add' })}
          disabled={categories.length === 0}
          className="stencil hidden border-2 border-board-deep bg-signal px-4 py-2 text-sm tracking-wide text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 disabled:opacity-60 sm:block"
        >
          + Catat
        </button>
      </div>

      {categories.length === 0 && (
        <p className="slat mt-4 px-4 py-3 text-sm text-signal-deep">
          Kategori belum kebentuk. Coba refresh halaman.
        </p>
      )}

      {error && (
        <p className="slat mt-4 border-signal px-4 py-3 text-sm text-signal-deep">{error}</p>
      )}

      {transactions.length > 0 && (
        <TransactionFilters
          categories={categories}
          value={filters}
          onChange={setFilters}
          onReset={() => setFilters(EMPTY_FILTERS)}
          onExport={handleExport}
          active={filterActive}
          resultCount={visible.length}
          resultTotal={visibleTotal}
        />
      )}

      {transactions.length === 0 ? (
        <div className="bolted grain mt-6 border-2 border-dashed border-line/60 bg-cream/10 px-6 py-14 text-center">
          <p className="stencil text-xl text-chalk">Masih kosong</p>
          <p className="mt-1 text-sm text-chalk/70">
            Tap <span className="text-chalk">&ldquo;+ Catat&rdquo;</span> buat mulai nyatat pengeluaran.
          </p>
        </div>
      ) : visible.length === 0 ? (
        <div className="bolted grain mt-6 border-2 border-dashed border-line/60 bg-cream/10 px-6 py-12 text-center">
          <p className="stencil text-lg text-chalk">Nggak ada yang cocok</p>
          <p className="mt-1 text-sm text-chalk/70">Coba longgarin filter atau kata pencarian.</p>
          <button
            onClick={() => setFilters(EMPTY_FILTERS)}
            className="stencil mt-3 border border-chalk/40 px-3 py-1.5 text-xs tracking-wide text-chalk hover:bg-chalk hover:text-board-deep"
          >
            Reset filter
          </button>
        </div>
      ) : (
        <ol className="mt-5 space-y-6">
          {groups.map(([date, rows]) => {
            const isToday = date === TODAY;
            const dayTotal = rows.reduce((s, r) => s + Number(r.amount), 0);
            return (
              <li key={date}>
                <div
                  className={`stencil flex items-baseline justify-between px-2 py-1 text-xs tracking-widest ${
                    isToday ? 'bg-signal text-chalk' : 'text-chalk/70'
                  }`}
                >
                  <span>{isToday ? 'HARI INI · ' : ''}{dayLabel(date)}</span>
                  <span className="font-mono tabular-nums">{formatCurrency(dayTotal)}</span>
                </div>

                <div className="mt-1 border-l-2 border-line/50 pl-3">
                  {rows.map((t) => (
                    <div
                      key={t.id}
                      className="slat grain mb-1.5 flex items-center gap-3 px-3 py-2.5 text-ink"
                    >
                      <span
                        className="h-3.5 w-3.5 shrink-0 border border-black/20"
                        style={{ backgroundColor: t.categories?.name ? categoryColor(t.categories.name) : 'transparent' }}
                        aria-hidden
                      />
                      <div className="min-w-0 flex-1">
                        <p className="stencil text-sm leading-tight text-ink">
                          {t.categories?.name ?? 'Tanpa kategori'}
                        </p>
                        {t.description && (
                          <p className="truncate text-xs text-ink-soft">{t.description}</p>
                        )}
                      </div>

                      <span className="shrink-0 font-mono text-sm font-semibold tabular-nums text-ink">
                        {formatCurrency(Number(t.amount))}
                      </span>

                      {confirmId === t.id ? (
                        <span className="flex shrink-0 items-center gap-1.5">
                          <span className="stencil text-[0.625rem] tracking-wide text-ink-soft">Yakin?</span>
                          <button
                            onClick={() => handleDelete(t.id)}
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
                            onClick={() => setModal({ mode: 'edit', txn: t })}
                            className="stencil text-xs tracking-wide text-board hover:text-board-deep"
                          >
                            Ubah
                          </button>
                          <button
                            onClick={() => setConfirmId(t.id)}
                            className="stencil text-xs tracking-wide text-signal-deep"
                          >
                            Hapus
                          </button>
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </li>
            );
          })}
        </ol>
      )}

      {usedCategories.length > 0 && (
        <div className="mt-8 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-chalk/15 pt-4">
          <span className="stencil text-xs tracking-widest text-chalk/60">Keterangan</span>
          {usedCategories.map((name) => (
            <span key={name} className="flex items-center gap-1.5 text-xs text-chalk/80">
              <span
                className="h-2.5 w-2.5 border border-black/20"
                style={{ backgroundColor: categoryColor(name) }}
                aria-hidden
              />
              {name}
            </span>
          ))}
        </div>
      )}

      {/* Aksi utama — zona jempol di mobile */}
      <button
        onClick={() => setModal({ mode: 'add' })}
        disabled={categories.length === 0}
        className="stencil fixed bottom-5 right-5 z-40 border-2 border-board-deep bg-signal px-5 py-3 text-base tracking-wide text-chalk shadow-[0_4px_0_0_rgb(0_0_0/0.3)] transition-transform active:translate-y-0.5 disabled:opacity-60 sm:hidden"
      >
        + Catat
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
              <span className="text-lg">{modal.mode === 'add' ? 'Catatan Baru' : 'Ubah Catatan'}</span>
              <span className="text-xs tracking-widest text-ink-soft">KWITANSI</span>
            </div>
            <TransactionForm
              categories={categories}
              transaction={modal.mode === 'edit' ? modal.txn : undefined}
              onDone={() => setModal(null)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
