# Expense Tracker

Aplikasi web untuk mencatat & memantau pengeluaran bulanan pribadi. Dibangun
dengan tampilan "papan warung" — angka besar dicat tangan, baris krem, aksen
merah sinyal.

## Fitur

- **Autentikasi** email + password (Supabase Auth), route dashboard terproteksi
- **Catatan transaksi** — tambah / ubah / hapus, dikelompokkan per tanggal
- **Kategori** — 7 bawaan + kategori kustom, warna bisa diatur sendiri
- **Dashboard** — total bulan berjalan, donut per kategori, grafik harian,
  perbandingan vs bulan lalu (Recharts)
- **Anggaran** per kategori — progress bar (aman / hampir batas / lewat),
  peringatan >80% dan >100%, reset semua
- **Filter & pencarian** transaksi (kategori, rentang tanggal, cari catatan)
  secara real-time
- **Export** — CSV sesuai filter aktif, ringkasan bulanan ke PDF (via print)
- **Transaksi berulang** — mingguan / bulanan / tahunan, dibukukan otomatis
- **Dark mode** tersimpan per akun (kebawa lintas perangkat)
- **PWA** — installable, cache app shell untuk akses offline dasar

## Tech Stack

| Layer | Teknologi |
|---|---|
| Framework | Next.js 16 (App Router) + TypeScript |
| Styling | Tailwind CSS v4 |
| Database & Auth | Supabase (PostgreSQL, Row Level Security) |
| Chart | Recharts |
| Validasi | Zod (sisi server) |
| Hosting | Vercel |

## Menjalankan secara lokal

```bash
npm install
cp .env.example .env.local   # lalu isi kredensial Supabase
npm run dev
```

Buka http://localhost:3000

### Environment variables

| Variabel | Keterangan |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | URL project Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Anon/publishable key Supabase |

### Database

Skema ada di `supabase/migrations/`. Terapkan lewat Supabase CLI atau SQL editor.
Tabel: `categories`, `transactions`, `budgets`, `recurring_transactions` —
semuanya dengan RLS aktif (`auth.uid() = user_id`).

## Deploy

1. Import repo ini di [Vercel](https://vercel.com/new)
2. Set kedua environment variable di atas
3. Di Supabase → Authentication → URL Configuration, tambahkan domain Vercel
   ke **Site URL** dan **Redirect URLs**

## Struktur

```
app/
  (auth)/          login, register
  (dashboard)/     dashboard, transactions, budgets, settings, ringkasan
  manifest.ts      PWA manifest
components/
  ui/ transactions/ budgets/ charts/ settings/
lib/
  supabase/        client & server helper
  aggregate.ts     agregasi dashboard
  recurring.ts     jadwal transaksi berulang
  validations.ts   skema Zod
proxy.ts           middleware auth (Next.js 16)
public/sw.js       service worker
```

## Lisensi

Proyek pribadi.
