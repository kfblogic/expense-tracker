'use client';

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react';

type Tone = 'ok' | 'error';
interface ToastItem {
  id: number;
  msg: string;
  tone: Tone;
}

const ToastCtx = createContext<{ push: (msg: string, tone?: Tone) => void } | null>(null);

export function useToast() {
  const ctx = useContext(ToastCtx);
  if (!ctx) throw new Error('useToast harus dipakai di dalam <ToastProvider>');
  return ctx;
}

let seq = 0;

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const push = useCallback((msg: string, tone: Tone = 'ok') => {
    const id = ++seq;
    setToasts((prev) => [...prev, { id, msg, tone }]);
    setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), 3200);
  }, []);

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 bottom-4 z-[60] flex flex-col items-center gap-2 px-4">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={`settle stencil pointer-events-auto max-w-sm border-2 px-4 py-2.5 text-sm tracking-wide text-chalk shadow-[0_3px_0_0_rgb(0_0_0/0.3)] ${
              t.tone === 'error' ? 'border-signal-deep bg-signal' : 'border-board-deep bg-board'
            }`}
          >
            {t.msg}
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
