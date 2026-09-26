import type { DamageMarker } from '../lib/types'

// Markers are authored against a 400x300 reference frame (see CONTRACT.md
// example payload). We convert to percentages so the overlay stays aligned
// at any render size.
const REF_W = 400
const REF_H = 300

export default function MarkedPhoto({
  photoUrl,
  markers,
}: {
  photoUrl: string
  markers: DamageMarker[]
}) {
  return (
    <div className="relative w-full overflow-hidden rounded-lg border border-white/10 bg-black min-h-[200px]">
      <img
        src={photoUrl}
        alt="Bundle inspection"
        className="block w-full h-56 object-cover"
        onError={(e) => {
          // Fallback to high quality demo denim photo if external URL fails
          ;(e.target as HTMLImageElement).src =
            'https://images.unsplash.com/photo-1604176354204-9268737828e4?auto=format&fit=crop&w=800&q=80'
        }}
      />
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox={`0 0 ${REF_W} ${REF_H}`}
        preserveAspectRatio="none"
      >
        {markers.map((m, i) => (
          <g key={i}>
            <circle
              cx={m.x}
              cy={m.y}
              r={m.radius}
              fill="rgba(220,38,38,0.15)"
              stroke="#dc2626"
              strokeWidth={3}
            />
          </g>
        ))}
      </svg>
      <div className="absolute bottom-2 left-2 flex flex-wrap gap-1">
        {markers.map((m, i) => (
          <span
            key={i}
            className="rounded bg-refuse/90 px-2 py-0.5 text-xs font-medium text-white"
          >
            {m.label}
          </span>
        ))}
      </div>
    </div>
  )
}
