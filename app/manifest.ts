import type { MetadataRoute } from 'next';

// PWA dasar: cukup untuk prompt "Add to Home Screen" / install desktop.
// ponytail: tanpa service worker (butuh dependency spt Serwist) — offline-mode
// belum ada; tambah kalau memang perlu jalan tanpa jaringan.
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Expense Tracker — Papan Pengeluaran',
    short_name: 'Expense Tracker',
    description: 'Catat pengeluaran harian pribadi secepat menulis di papan warung.',
    start_url: '/dashboard',
    display: 'standalone',
    background_color: '#124b60',
    theme_color: '#124b60',
    lang: 'id',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
