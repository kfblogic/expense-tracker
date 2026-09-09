import type { Metadata, Viewport } from 'next';
import { cookies } from 'next/headers';
import { Barlow_Condensed, Anton, Geist_Mono } from 'next/font/google';
import ServiceWorkerRegister from '@/components/ui/ServiceWorkerRegister';
import './globals.css';

// Suara "cat papan" — kondensat tebal untuk judul & label
const barlow = Barlow_Condensed({
  variable: '--font-papan',
  weight: ['400', '500', '600', '700'],
  subsets: ['latin'],
});

// Numeral monumental — satu berat, dicat tangan
const anton = Anton({
  variable: '--font-numeral',
  weight: '400',
  subsets: ['latin'],
});

// Angka tabular di daftar — seperti mesin hitung / struk
const geistMono = Geist_Mono({
  variable: '--font-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Expense Tracker — Papan Pengeluaran Bulanan',
  description: 'Catat pengeluaran harian pribadi secepat menulis di papan warung.',
  manifest: '/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'Expense Tracker', statusBarStyle: 'default' },
};

export const viewport: Viewport = {
  themeColor: '#124b60',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Preferensi tema: cookie 'theme' disetel dari /settings (sumber utama =
  // user_metadata, ikut akun). Dibaca di sini — tanpa network — supaya atribut
  // ter-render di server dan tak ada flash tema saat load.
  const pref = (await cookies()).get('theme')?.value;
  const themeAttr = pref === 'light' || pref === 'dark' ? pref : undefined;

  return (
    <html
      lang="id"
      data-theme={themeAttr}
      suppressHydrationWarning
      className={`${barlow.variable} ${anton.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <div
          hidden
          dangerouslySetInnerHTML={{
            __html: `<!--
DIRECTION CONTRACT — seed e7572b75 (impeccable new-work, mode operate)
THESIS: Personal expense log built as a warung enamel price-board — hand-painted numerals,
  chalk tally, bolted cream slats. Refuses the white-card SaaS dashboard and its dark-neon twin.
OWN-WORLD: Enamel cobalt fields (page ground, header, nav, total banner) over warm warung-cream
  writing slats; signal-red hand-painted accents and alerts; chalk-white numerals; Barlow
  Condensed + Anton as the painted voice, Geist Mono for tabular figures; bolt-head corners,
  worn-paint underline, tally strokes; light ground, read in daylight.
STORY: user sees this month's spend as a monumental painted figure, scans the ruled slat list
  with today's band lit, taps a fat cobalt "+ CATAT", fills a kwitansi-style slip in seconds.
FIRST VIEWPORT: bolted cobalt banner top; huge Anton cream total + red underline + count caption;
  below, cream slat rows on a left date-spine; "+ CATAT" fixed bottom-right (mobile) / top-right (desktop).
FORM: warung enamel price-board, candidate 6 of the grounded list; seed key e7572b75.
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the
  verdict, DESIGN.md, and every shipping raster carrying its provenance.
-->`,
          }}
        />
        {children}
        <ServiceWorkerRegister />
      </body>
    </html>
  );
}
