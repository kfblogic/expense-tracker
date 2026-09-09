'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';

/**
 * Bar loading tipis di atas layar + kunci klik tautan selama pindah halaman.
 * Antisipasi spam-klik menu header saat internet lambat.
 *
 * App Router belum punya event "route change start": start dideteksi dari klik
 * <a> internal (simpan path tujuan), selesai turunan dari `pathname` yang
 * menyusul path tujuan — jadi tak perlu setState di effect untuk mematikannya.
 */
export default function TopProgress() {
  const pathname = usePathname();
  const [target, setTarget] = useState<string | null>(null);

  const loading = target !== null && target !== pathname;

  // Efek DOM saja (bukan setState): kelas di <html> untuk cursor + kunci klik.
  useEffect(() => {
    const root = document.documentElement;
    if (!loading) {
      root.classList.remove('is-navigating');
      return;
    }
    root.classList.add('is-navigating');
    // Jaring pengaman: navigasi macet (jaringan mati) → lepas setelah 12 dtk.
    const t = setTimeout(() => setTarget(null), 12000);
    return () => {
      root.classList.remove('is-navigating');
      clearTimeout(t);
    };
  }, [loading]);

  // Deteksi mulai navigasi dari klik tautan internal.
  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) {
        return;
      }
      const anchor = (e.target as HTMLElement | null)?.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href || anchor.target === '_blank' || anchor.hasAttribute('download')) return;
      try {
        const url = new URL(anchor.href);
        if (url.origin !== location.origin) return;
        if (url.pathname === location.pathname) return;
        setTarget(url.pathname);
      } catch {
        /* href tak valid — abaikan */
      }
    }
    document.addEventListener('click', onClick, true);
    return () => document.removeEventListener('click', onClick, true);
  }, []);

  if (!loading) return null;

  return (
    <div className="fixed inset-x-0 top-0 z-[80] h-[3px] overflow-hidden bg-signal/25" aria-hidden>
      <div className="nav-bar h-full w-1/3 bg-signal" />
    </div>
  );
}
