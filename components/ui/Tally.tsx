/**
 * Guratan tally (卌) untuk jumlah kecil — motif kapur di papan warung.
 * n > 40 dijatuhkan ke angka biasa oleh pemanggil.
 */
export default function Tally({
  count,
  className = '',
}: {
  count: number;
  className?: string;
}) {
  const groups = Math.floor(count / 5);
  const rest = count % 5;
  const unitW = 26;
  const gap = 10;
  const width = groups * (unitW + gap) + (rest > 0 ? unitW + gap : 0);

  return (
    <svg
      viewBox={`0 0 ${Math.max(width, unitW)} 24`}
      width={Math.max(width, unitW)}
      height={20}
      className={className}
      role="img"
      aria-label={`${count} catatan`}
    >
      {Array.from({ length: groups }).map((_, g) => (
        <g key={g} transform={`translate(${g * (unitW + gap)}, 0)`} stroke="currentColor" strokeWidth={3} strokeLinecap="round">
          <line x1={3} y1={3} x2={3} y2={21} />
          <line x1={9} y1={3} x2={9} y2={21} />
          <line x1={15} y1={3} x2={15} y2={21} />
          <line x1={21} y1={3} x2={21} y2={21} />
          <line x1={-1} y1={20} x2={25} y2={4} />
        </g>
      ))}
      {rest > 0 && (
        <g transform={`translate(${groups * (unitW + gap)}, 0)`} stroke="currentColor" strokeWidth={3} strokeLinecap="round">
          {Array.from({ length: rest }).map((_, i) => (
            <line key={i} x1={3 + i * 6} y1={3} x2={3 + i * 6} y2={21} />
          ))}
        </g>
      )}
    </svg>
  );
}
