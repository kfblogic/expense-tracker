'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

interface DashboardHeaderProps {
  userEmail?: string | null;
}

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/transactions', label: 'Transactions' },
  { href: '/budgets', label: 'Budgets' },
  { href: '/settings', label: 'Settings' },
];

export default function DashboardHeader({ userEmail }: DashboardHeaderProps) {
  const router = useRouter();
  const pathname = usePathname();
  const supabase = createClient();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await supabase.auth.signOut();
      // Bersihkan cache PWA supaya halaman ber-data user ini tak kebaca
      // user lain di browser yang sama.
      if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map((k) => caches.delete(k)));
      }
      document.cookie = 'theme=; path=/; max-age=0';
      router.push('/login');
      router.refresh();
    } catch (err) {
      console.error('Gagal keluar:', err);
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="enamel sticky top-0 z-50 border-b-2 border-signal bg-board-deep text-chalk">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/dashboard" className="flex items-center gap-2.5">
            <span className="slat grid h-9 w-9 place-items-center text-ink stencil text-base">
              ET
            </span>
            <span className="stencil text-lg text-chalk">Expense Tracker</span>
          </Link>

          <nav className="hidden items-center gap-5 md:flex">
            {NAV_ITEMS.map((item) => {
              const active = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`stencil text-sm tracking-wide transition-colors ${
                    active
                      ? 'paint-underline text-chalk'
                      : 'text-chalk/60 hover:text-chalk'
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </div>

        <div className="flex items-center gap-3">
          {userEmail && (
            <span className="hidden max-w-[180px] truncate text-xs text-chalk/55 sm:inline">
              {userEmail}
            </span>
          )}
          <button
            onClick={handleLogout}
            disabled={isLoggingOut}
            className="stencil border border-chalk/40 px-3 py-1 text-xs tracking-wide text-chalk transition-colors hover:bg-chalk hover:text-board-deep disabled:opacity-60"
          >
            {isLoggingOut ? 'Keluar…' : 'Keluar'}
          </button>
        </div>
      </div>

      <div className="flex gap-4 overflow-x-auto border-t border-chalk/15 px-4 py-2 md:hidden">
        {NAV_ITEMS.map((item) => {
          const active = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`stencil whitespace-nowrap text-xs tracking-wide ${
                active ? 'paint-underline text-chalk' : 'text-chalk/60'
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
