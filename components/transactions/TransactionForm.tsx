'use client';

import { useActionState, useEffect, useState } from 'react';
import { saveTransaction, createCategory } from '@/app/(dashboard)/transactions/actions';
import { categoryColor } from '@/lib/category-colors';
import { isoLocal } from '@/lib/aggregate';
import { useToast } from '@/components/ui/Toast';

export interface CategoryOption {
  id: string;
  name: string;
}

export interface TransactionDraft {
  id: string;
  amount: number;
  description: string | null;
  transaction_date: string;
  category_id: string;
}

interface TransactionFormProps {
  categories: CategoryOption[];
  transaction?: TransactionDraft;
  onDone: () => void;
}

const fieldLabel = 'stencil block text-xs tracking-widest text-ink-soft';
const fieldBox =
  'mt-1 block w-full border border-line bg-cream-deep px-3 py-2 text-sm text-ink outline-none focus:border-signal';

export default function TransactionForm({ categories: initialCategories, transaction, onDone }: TransactionFormProps) {
  const [state, formAction, pending] = useActionState(saveTransaction, null);
  const { push } = useToast();

  const [amount, setAmount] = useState<string>(transaction ? String(Math.round(transaction.amount)) : '');
  const displayAmount = amount ? new Intl.NumberFormat('id-ID').format(Number(amount)) : '';

  const [categories, setCategories] = useState<CategoryOption[]>(initialCategories);
  const [categoryId, setCategoryId] = useState<string>(
    transaction?.category_id ?? initialCategories[0]?.id ?? ''
  );

  const [repeat, setRepeat] = useState(false);
  const [showNewCategory, setShowNewCategory] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [categoryError, setCategoryError] = useState<string | null>(null);
  const [addingCategory, setAddingCategory] = useState(false);

  const today = isoLocal(new Date());

  useEffect(() => {
    if (state?.ok) {
      push(transaction ? 'Catatan diperbarui' : 'Catatan tersimpan');
      onDone();
    }
  }, [state, onDone, push, transaction]);

  async function handleAddCategory() {
    setCategoryError(null);
    setAddingCategory(true);
    const result = await createCategory(newCategory);
    setAddingCategory(false);
    if (!result.ok) {
      setCategoryError(result.error);
      return;
    }
    setCategories((prev) =>
      [...prev, { id: result.id, name: result.name }].sort((a, b) => a.name.localeCompare(b.name))
    );
    setCategoryId(result.id);
    setNewCategory('');
    setShowNewCategory(false);
  }

  return (
    <form action={formAction} className="mt-4 space-y-4">
      {transaction && <input type="hidden" name="id" value={transaction.id} />}
      <input type="hidden" name="categoryId" value={categoryId} />
      {/* Nilai yang disubmit = digit mentah; input terlihat cuma buat tampilan berformat. */}
      <input type="hidden" name="amount" value={amount} />

      <div>
        <span className={fieldLabel}>Jumlah</span>
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
            placeholder="25.000"
            className="painted-numeral w-full bg-transparent px-3 py-2 text-2xl text-ink outline-none [text-shadow:none]"
          />
        </div>
      </div>

      <div>
        <div className="flex items-center justify-between">
          <span className={fieldLabel}>Kategori</span>
          <button
            type="button"
            onClick={() => setShowNewCategory((v) => !v)}
            className="stencil text-xs tracking-wide text-board hover:text-board-deep"
          >
            {showNewCategory ? 'Batal' : '+ Kategori'}
          </button>
        </div>

        <div className="mt-2 flex flex-wrap gap-1.5">
          {categories.map((c) => {
            const selected = c.id === categoryId;
            const color = categoryColor(c.name);
            return (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                className={`stencil inline-flex items-center gap-1.5 border px-2.5 py-1 text-xs tracking-wide transition-colors ${
                  selected ? 'border-ink text-chalk' : 'border-line bg-cream text-ink-soft hover:border-ink-soft'
                }`}
                style={selected ? { backgroundColor: color } : undefined}
              >
                <span className="h-2 w-2 border border-black/20" style={{ backgroundColor: color }} aria-hidden />
                {c.name}
              </button>
            );
          })}
        </div>

        {showNewCategory && (
          <div className="mt-2 flex gap-2">
            <input
              type="text"
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              placeholder="Nama kategori"
              maxLength={50}
              className={fieldBox + ' mt-0'}
            />
            <button
              type="button"
              onClick={handleAddCategory}
              disabled={addingCategory || newCategory.trim().length === 0}
              className="stencil shrink-0 border-2 border-board-deep bg-board px-3 text-xs tracking-wide text-chalk disabled:opacity-60"
            >
              {addingCategory ? '…' : 'Tambah'}
            </button>
          </div>
        )}
        {categoryError && <p className="mt-1 text-xs text-signal-deep">{categoryError}</p>}
      </div>

      <div className="flex gap-3">
        <label className="flex-1">
          <span className={fieldLabel}>Tanggal</span>
          <input
            type="date"
            name="transactionDate"
            required
            max={today}
            defaultValue={transaction?.transaction_date ?? today}
            className={fieldBox}
          />
        </label>
      </div>

      <label className="block">
        <span className={fieldLabel}>Catatan <span className="text-ink-soft/60">(kalau perlu)</span></span>
        <textarea
          name="description"
          rows={2}
          maxLength={500}
          defaultValue={transaction?.description ?? ''}
          placeholder="mis. makan siang sama tim"
          className={fieldBox}
        />
      </label>

      {!transaction && (
        <div className="border border-dashed border-line bg-cream px-3 py-2.5">
          <label className="flex cursor-pointer items-start gap-2.5">
            <input
              type="checkbox"
              name="repeat"
              checked={repeat}
              onChange={(e) => setRepeat(e.target.checked)}
              className="mt-0.5 h-4 w-4 shrink-0 accent-signal"
            />
            <span className="text-xs text-ink-soft">
              <span className="stencil text-ink">Transaksi berulang</span> — dibukukan
              otomatis tiap periode (mis. tagihan). Kelola di Setelan.
            </span>
          </label>
          {repeat && (
            <div className="mt-2 flex items-center gap-2 pl-6">
              <span className={fieldLabel + ' mt-0'}>Tiap</span>
              <select
                name="repeatInterval"
                defaultValue="monthly"
                className="border border-line bg-cream-deep px-2 py-1 text-sm text-ink outline-none focus:border-signal"
              >
                <option value="weekly">Minggu</option>
                <option value="monthly">Bulan</option>
                <option value="yearly">Tahun</option>
              </select>
            </div>
          )}
        </div>
      )}

      {state && !state.ok && (
        <p className="border border-signal bg-signal/10 px-3 py-2 text-sm text-signal-deep">{state.error}</p>
      )}

      <div className="flex gap-2 border-t-2 border-dashed border-line pt-3">
        <button
          type="submit"
          disabled={pending || categories.length === 0}
          className="stencil flex-1 border-2 border-signal-deep bg-signal px-4 py-2.5 text-sm tracking-widest text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.25)] transition-transform hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {pending ? 'Menyimpan…' : transaction ? 'Simpan' : 'Catat'}
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
