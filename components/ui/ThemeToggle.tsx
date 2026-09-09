'use client';

import { useState, useTransition } from 'react';
import { updateTheme, type ThemePref } from '@/app/(dashboard)/settings/actions';
import { useToast } from '@/components/ui/Toast';

const OPTIONS: { value: ThemePref; label: string }[] = [
  { value: 'system', label: 'Ikut sistem' },
  { value: 'light', label: 'Terang' },
  { value: 'dark', label: 'Gelap' },
];

function applyTheme(pref: ThemePref) {
  const el = document.documentElement;
  if (pref === 'system') el.removeAttribute('data-theme');
  else el.setAttribute('data-theme', pref);
}

export default function ThemeToggle({ current }: { current: ThemePref }) {
  const [pref, setPref] = useState<ThemePref>(current);
  const [isPending, startTransition] = useTransition();
  const { push } = useToast();

  function choose(next: ThemePref) {
    if (next === pref) return;
    setPref(next);
    applyTheme(next); // umpan balik instan, nggak nunggu server

    startTransition(async () => {
      const res = await updateTheme(next);
      if (res.ok) {
        push('Tema disimpan');
      } else {
        push(res.error, 'error');
        setPref(current);
        applyTheme(current);
      }
    });
  }

  return (
    <div className="inline-flex border-2 border-line" role="group" aria-label="Tema">
      {OPTIONS.map((o) => (
        <button
          key={o.value}
          type="button"
          onClick={() => choose(o.value)}
          disabled={isPending}
          aria-pressed={pref === o.value}
          className={`stencil px-3 py-2 text-xs tracking-wide transition-colors disabled:opacity-70 ${
            pref === o.value
              ? 'bg-signal text-chalk'
              : 'bg-cream text-ink-soft hover:bg-cream-deep'
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
