export function CastleMark({ size = 47 }: { size?: number }) {
  return <svg width={size} height={size} viewBox="0 0 52 52" fill="none" aria-hidden="true" className="castle-mark">
    <g stroke="currentColor" strokeWidth="1.55" strokeLinejoin="round" strokeLinecap="round">
      <path d="M3 39c4-1 5-8 9-10l5-2 3-6 8-1 4 3 8 1 3 6 5 4M4 43c6-2 8-8 11-10l7-3 4-5 6 2 6-1 6 7M9 45l7-6 7-3 7-5 6 2 6 5M20 44l5-4 7-4 5 3"/>
      <path d="M13 27V17h3v3h3v-3h3v7M22 21V10h3v3h3v-3h3v13M31 19l5 1v-4h3v3h3v6M24 9l3-3 3 3"/>
      <path d="M16 24v2m9-10v2m4 0v3m7 2v2M3 47h43" opacity=".8"/>
    </g>
  </svg>
}

export function CompassRose({ size = 43 }: { size?: number }) {
  return <svg width={size} height={size + 12} viewBox="0 0 50 62" fill="none" aria-hidden="true">
    <text x="25" y="9" textAnchor="middle" fill="#52604d" fontFamily="Georgia, serif" fontSize="12">N</text>
    <circle cx="25" cy="37" r="14.4" stroke="#737a65" strokeWidth=".7" opacity=".6"/>
    <circle cx="25" cy="37" r="11.5" stroke="#737a65" strokeWidth=".5" opacity=".4"/>
    <g stroke="#59614e" strokeWidth=".7" strokeLinejoin="round">
      <path d="m25 15 4.7 22-4.7 20-4.7-20z" fill="#f8f6e9"/>
      <path d="m4 37 21-4.2L46 37l-21 4.2z" fill="#f8f6e9"/>
      <path d="m25 15 4.7 22H25z" fill="#4b5c47"/><path d="m25 37-4.7 0L25 57z" fill="#4b5c47"/><path d="m4 37 21-4.2V37zM25 37h21l-21 4.2z" fill="#4b5c47"/>
    </g><circle cx="25" cy="37" r="2" fill="#edeede" stroke="#56614f" strokeWidth=".7"/>
  </svg>
}
