'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveBudget } from '@/app/(dashboard)/budgets/actions';
import { categoryColor } from '@/lib/category-colors';
import { useToast } from '@/components/ui/Toast';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface BudgetDraft {
  id: string;
  categoryId: string;
  amountLimit: number;
}

interface BudgetFormProps {
  categories: CategoryOption[];
  /** Kategori yang sudah punya anggaran bulan ini — disembunyikan saat menambah baru. */
  budgetedCategoryIds: string[];
  budget?: BudgetDraft;
  /** Pra-pilih kategori ini saat menambah (dari tombol "Atur" per baris). */
  initialCategoryId?: string;
  onDone: () => void;
}

const fieldLabel = 'stencil block text-xs tracking-widest text-ink-soft';

export default function BudgetForm({
  categories,
  budgetedCategoryIds,
  budget,
  initialCategoryId,
  onDone,
}: BudgetFormProps) {
  const [state, formAction, pending] = useActionState(saveBudget, null);
  const { push } = useToast();

  const isEdit = Boolean(budget);
  const selectable = isEdit
    ? categories.filter((c) => c.id === budget!.categoryId)
    : categories.filter((c) => !budgetedCategoryIds.includes(c.id));

  const [categoryId, setCategoryId] = useState<string>(
    budget?.categoryId ??
      (initialCategoryId && selectable.some((c) => c.id === initialCategoryId)
        ? initialCategoryId
        : selectable[0]?.id ?? '')
  );
  const [amount, setAmount] = useState<string>(budget ? String(Math.round(budget.amountLimit)) : '');
  const displayAmount = amount ? new Intl.NumberFormat('id-ID').format(Number(amount)) : '';

  useEffect(() => {
    if (state?.ok) {
      push(isEdit ? 'Anggaran diperbarui' : 'Anggaran diatur');
      onDone();
    }
  }, [state, onDone, push, isEdit]);

  return (
    <form action={formAction} className="mt-4 space-y-4">
      <input type="hidden" name="categoryId" value={categoryId} />
      <input type="hidden" name="amountLimit" value={amount} />

      <div>
        <span className={fieldLabel}>Kategori</span>
        <div className="mt-2 flex flex-wrap gap-1.5">
          {selectable.map((c) => {
            const selected = c.id === categoryId;
            const color = categoryColor(c.name);
            return (
              <button
                key={c.id}
                type="button"
                disabled={isEdit}
                onClick={() => setCategoryId(c.id)}
                className={`stencil inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs tracking-wide transition-colors ${
                  selected ? 'border-ink text-chalk' : 'border-line bg-cream text-ink-soft hover:border-ink-soft'
                } disabled:opacity-100`}
                style={selected ? { backgroundColor: color } : undefined}
              >
                <span className="h-2 w-2 border border-black/20" style={{ backgroundColor: color }} aria-hidden />
                {c.name}
              </button>
            );
          })}
        </div>
        {selectable.length === 0 && (
          <p className="mt-1 text-xs text-ink-soft">Semua kategori sudah punya anggaran bulan ini.</p>
        )}
      </div>

      <div>
        <span className={fieldLabel}>Batas per bulan</span>
        <div className="mt-1 flex items-stretch border border-line bg-cream-deep focus-within:border-signal">
          <span className="stencil grid place-items-center border-r border-line bg-cream px-3 text-sm text-ink-soft">
            Rp
          </span>
          <input
            type="text"
            inputMode="numeric"
            autoComplete="off"
            required
            value={displayAmount}
            onChange={(e) => setAmount(e.target.value.replace(/\D/g, ''))}
            placeholder="1.500.000"
            className="painted-numeral w-full bg-transparent px-3 py-2 text-2xl text-ink outline-none [text-shadow:none]"
          />
        </div>
      </div>

      {state && !state.ok && (
        <p className="border border-signal bg-signal/10 px-3 py-2 text-sm text-signal-deep">{state.error}</p>
      )}

      <div className="flex gap-2 border-t-2 border-dashed border-line pt-3">
        <button
          type="submit"
          disabled={pending || !categoryId || amount.length === 0}
          className="stencil flex-1 border-2 border-signal-deep bg-signal px-4 py-2.5 text-sm tracking-widest text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : isEdit ? 'Simpan' : 'Atur'}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="stencil border border-line px-4 py-2.5 text-sm tracking-wide text-ink-soft hover:bg-cream-deep"
        >
          Batal
        </button>
      </div>
    </form>
  );
}
