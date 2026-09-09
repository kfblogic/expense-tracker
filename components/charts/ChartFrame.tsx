'use client';

import { useState, type ReactNode } from 'react';

interface ChartFrameProps {
  title: string;
  /** Tampilan tabel setara chart — kanal aksesibilitas (dataviz). */
  table?: ReactNode;
  children: ReactNode;
}

export default function ChartFrame({ title, table, children }: ChartFrameProps) {
  const [showTable, setShowTable] = useState(false);

  return (
    <div className="slat grain px-4 py-4 text-ink">
      <div className="flex items-center justify-between">
        <h2 className="stencil text-sm tracking-widest text-ink">{title}</h2>
        {table && (
          <button
            onClick={() => setShowTable((v) => !v)}
            className="stencil text-xs tracking-wide text-board hover:text-board-deep"
          >
            {showTable ? 'Grafik' : 'Tabel'}
          </button>
        )}
      </div>
      <div className="mt-3">{showTable && table ? table : children}</div>
    </div>
  );
}
