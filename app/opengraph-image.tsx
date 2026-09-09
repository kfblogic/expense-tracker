import { ImageResponse } from 'next/og';

export const alt = 'Expense Tracker — Papan Pengeluaran Bulanan';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

// Kartu pratinjau tautan (WhatsApp, Twitter, dll). Tema "papan warung":
// enamel kobalt, slat krem, garis merah sinyal. Tanpa dependency tambahan —
// next/og bawaan Next.js.
export default function OGImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          padding: '90px',
          background: '#124b60',
          backgroundImage:
            'linear-gradient(180deg, rgba(255,255,255,0.08) 0%, rgba(0,0,0,0.10) 100%)',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '28px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '96px',
              height: '96px',
              background: '#f4ead6',
              color: '#211c17',
              fontSize: '44px',
              fontWeight: 800,
              letterSpacing: '2px',
              border: '4px solid #0e4557',
            }}
          >
            ET
          </div>
          <div
            style={{
              color: '#f7f4ec',
              fontSize: '30px',
              fontWeight: 700,
              letterSpacing: '6px',
              textTransform: 'uppercase',
            }}
          >
            Expense Tracker
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            marginTop: '48px',
            color: '#f7f4ec',
            fontSize: '92px',
            fontWeight: 800,
            lineHeight: 1.08,
            letterSpacing: '-1px',
          }}
        >
          <div style={{ display: 'flex' }}>Catat pengeluaran</div>
          <div style={{ display: 'flex' }}>harian pribadi</div>
        </div>

        <div style={{ marginTop: '28px', width: '360px', height: '12px', background: '#c8312a' }} />

        <div
          style={{
            marginTop: '40px',
            color: 'rgba(247,244,236,0.75)',
            fontSize: '32px',
            fontWeight: 500,
          }}
        >
          Anggaran per kategori · grafik · ekspor · secepat nulis di papan warung
        </div>
      </div>
    ),
    { ...size }
  );
}
