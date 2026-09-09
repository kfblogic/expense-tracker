'use client';

import { useState, useTransition } from 'react';
import {
  addCategory,
  renameCategory,
  deleteCategoryById,
  setCategoryColor,
} from '@/app/(dashboard)/settings/actions';
import { categoryHexFallback } from '@/lib/category-colors';
import { useToast } from '@/components/ui/Toast';

export interface CategoryRow {
  id: string;
  name: string;
  isDefault: boolean;
  color: string | null;
}

export default function CategoryManager({ categories }: { categories: CategoryRow[] }) {
  const [newName, setNewName] = useState('');
  const [editId, setEditId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [confirmId, setConfirmId] = useState<string | null>(null);
  // warna sementara di UI sebelum commit (biar swatch langsung berubah)
  const [draftColor, setDraftColor] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  function swatch(c: CategoryRow): string {
    return draftColor[c.id] ?? c.color ?? categoryHexFallback(c.name);
  }

  function commitColor(id: string, color: string | null) {
    startTransition(async () => {
      const res = await setCategoryColor(id, color);
      if (res.ok) push(color ? 'Warna disimpan' : 'Warna direset');
      else push(res.error, 'error');
    });
  }

  function handleAdd() {
    const name = newName.trim();
    if (!name) return;
    startTransition(async () => {
      const res = await addCategory(name);
      if (res.ok) {
        push('Kategori ditambah');
        setNewName('');
      } else push(res.error, 'error');
    });
  }

  function handleRename() {
    if (!editId) return;
    startTransition(async () => {
      const res = await renameCategory(editId, editName.trim());
      if (res.ok) {
        push('Nama kategori diganti');
        setEditId(null);
      } else push(res.error, 'error');
    });
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      const res = await deleteCategoryById(id);
      if (res.ok) push('Kategori dihapus');
      else push(res.error, 'error');
      setConfirmId(null);
    });
  }

  return (
    <div className="space-y-3">
      <div className="slat grain flex gap-2 px-3 py-3">
        <input
          type="text"
          value={newName}
          maxLength={50}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
          placeholder="Nama kategori baru"
          className="min-w-0 flex-1 border border-line bg-cream-deep px-3 py-2 text-sm text-ink outline-none focus:border-signal"
        />
        <button
          onClick={handleAdd}
          disabled={isPending || newName.trim().length === 0}
          className="stencil shrink-0 border-2 border-board-deep bg-board px-3 text-xs tracking-wide text-chalk disabled:opacity-60"
        >
          Tambah
        </button>
      </div>

      <ul className="space-y-1.5">
        {categories.map((c) => (
          <li key={c.id} className="slat grain flex items-center gap-3 px-3 py-2.5 text-ink">
            <input
              type="color"
              value={swatch(c)}
              title="Warna kategori"
              onChange={(e) => setDraftColor((d) => ({ ...d, [c.id]: e.target.value }))}
              onBlur={(e) => {
                if (e.target.value !== (c.color ?? categoryHexFallback(c.name))) {
                  commitColor(c.id, e.target.value);
                }
              }}
              className="h-6 w-8 shrink-0 cursor-pointer border border-black/20 bg-transparent p-0"
            />

            {editId === c.id ? (
              <>
                <input
                  type="text"
                  value={editName}
                  maxLength={50}
                  autoFocus
                  onChange={(e) => setEditName(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                  className="min-w-0 flex-1 border border-line bg-cream-deep px-2 py-1 text-sm text-ink outline-none focus:border-signal"
                />
                <button
                  onClick={handleRename}
                  disabled={isPending}
                  className="stencil shrink-0 bg-board px-2 py-1 text-xs tracking-wide text-chalk disabled:opacity-60"
                >
                  Simpan
                </button>
                <button
                  onClick={() => setEditId(null)}
                  className="stencil shrink-0 border border-line px-2 py-1 text-xs tracking-wide text-ink-soft"
                >
                  Batal
                </button>
              </>
            ) : (
              <>
                <span className="flex-1 truncate">
                  <span className="stencil text-sm text-ink">{c.name}</span>
                  {c.isDefault && (
                    <span className="stencil ml-2 border border-line px-1.5 text-[0.5rem] tracking-wide text-ink-soft">
                      Bawaan
                    </span>
                  )}
                </span>

                {c.color && (
                  <button
                    onClick={() => {
                      setDraftColor((d) => {
                        const n = { ...d };
                        delete n[c.id];
                        return n;
                      });
                      commitColor(c.id, null);
                    }}
                    title="Balik ke warna bawaan"
                    className="stencil shrink-0 text-xs tracking-wide text-ink-soft hover:text-ink"
                  >
                    ↺
                  </button>
                )}

                {!c.isDefault &&
                  (confirmId === c.id ? (
                    <span className="flex shrink-0 items-center gap-1.5">
                      <span className="stencil text-[0.625rem] tracking-wide text-ink-soft">Yakin?</span>
                      <button
                        onClick={() => handleDelete(c.id)}
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
                        onClick={() => {
                          setEditId(c.id);
                          setEditName(c.name);
                        }}
                        className="stencil text-xs tracking-wide text-board hover:text-board-deep"
                      >
                        Ubah
                      </button>
                      <button
                        onClick={() => setConfirmId(c.id)}
                        className="stencil text-xs tracking-wide text-signal-deep"
                      >
                        Hapus
                      </button>
                    </span>
                  ))}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
