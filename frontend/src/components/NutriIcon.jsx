/**
 * NutriTrack brand icon — a 270° progress ring (gap at bottom) with a
 * bold fork centred inside. The ring mirrors the macro ring in the dashboard
 * and the fork anchors it as a food/performance mark.
 *
 * Usage:
 *   <NutriIcon size={32} className="shadow-sm" />
 *   <NutriIcon size={56} className="shadow-lg shadow-indigo-200" />
 */
export default function NutriIcon({ size = 32, className = "" }) {
  const r = 10;
  const circ = 2 * Math.PI * r;   // 62.83
  const arc  = circ * 0.75;        // 270° visible → 47.12
  const gap  = circ - arc;         // 90°  gap     → 15.71

  return (
    <div
      className={`bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center flex-shrink-0 ${className}`}
      style={{ width: size, height: size, borderRadius: Math.round(size * 0.28) }}
    >
      <svg
        width={Math.round(size * 0.75)}
        height={Math.round(size * 0.75)}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* ── Ring track (full circle, faint) ── */}
        <circle
          cx="16" cy="16" r={r}
          stroke="white" strokeWidth="2" strokeOpacity="0.22"
        />

        {/* ── Ring arc — 270°, gap centred at 6 o'clock ──
             rotate(135) shifts the default 3-o'clock start to 7:30,
             so the 270° arc runs 7:30 → 9 → 12 → 3 → 4:30,
             leaving a 90° gap centred at 6 o'clock (bottom). */}
        <circle
          cx="16" cy="16" r={r}
          stroke="white" strokeWidth="2.5" strokeLinecap="round"
          strokeDasharray={`${arc.toFixed(2)} ${gap.toFixed(2)}`}
          transform="rotate(135 16 16)"
        />

        {/* ── Fork ── */}
        {/* Three tines */}
        <path d="M13 9.5v5"   stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M16 9.5v5"   stroke="white" strokeWidth="2" strokeLinecap="round" />
        <path d="M19 9.5v5"   stroke="white" strokeWidth="2" strokeLinecap="round" />
        {/* Bridge connecting the tines */}
        <path
          d="M13 14.5 C13 16.5 19 16.5 19 14.5"
          stroke="white" strokeWidth="2" fill="none" strokeLinecap="round"
        />
        {/* Handle */}
        <path d="M16 16.5v6.5" stroke="white" strokeWidth="2" strokeLinecap="round" />
      </svg>
    </div>
  );
}
