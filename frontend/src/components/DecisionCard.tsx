import { Check, X } from 'lucide-react'
import type { Mandate, Offer, Supplier } from '../lib/types'

export default function DecisionCard({
  offer,
  supplier,
  mandate,
  onApprove,
  onDecline,
  busy,
}: {
  offer: Offer
  supplier: Supplier | undefined
  mandate: Mandate | null
  onApprove: () => void
  onDecline: () => void
  busy: boolean
}) {
  const landed = offer.unit_price + offer.shipping
  const cap = mandate?.max_landed_price ?? 18
  const over = landed - cap
  const total = landed * offer.quantity

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-6">
      <div className="w-full max-w-2xl rounded-2xl border border-white/10 bg-ink p-8 shadow-2xl">
        <p className="mb-1 text-sm font-semibold uppercase tracking-widest text-ask">
          Decision required
        </p>
        <h2 className="mb-6 text-display text-white">
          Price exceeds mandate cap by £{over.toFixed(2)}
        </h2>

        <dl className="mb-8 grid grid-cols-2 gap-4 text-lg">
          <Row label="Landed price" value={`£${landed.toFixed(2)}`} sub={`Cap: £${cap.toFixed(2)}`} />
          <Row label="Grade" value={`${offer.seen_grade ?? offer.claimed_grade} confirmed`} />
          <Row label="Quantity" value={`${offer.quantity} pcs`} />
          <Row label="Total" value={`£${total.toFixed(2)}`} />
        </dl>

        <p className="mb-6 text-sm text-white/50">
          Supplier: {supplier?.name ?? 'Supplier'} · Ship window: {offer.ship_days} days
        </p>

        <div className="flex gap-4">
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-buy py-5 text-xl font-bold text-white transition disabled:opacity-50"
            disabled={busy}
            onClick={onApprove}
          >
            <Check size={24} /> Approve &amp; Buy
          </button>
          <button
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-refuse py-5 text-xl font-bold text-white transition disabled:opacity-50"
            disabled={busy}
            onClick={onDecline}
          >
            <X size={24} /> Decline &amp; Refuse
          </button>
        </div>
      </div>
    </div>
  )
}

function Row({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="rounded-lg bg-white/5 px-4 py-3">
      <dt className="text-xs uppercase tracking-wide text-white/40">{label}</dt>
      <dd className="text-2xl font-bold text-white">{value}</dd>
      {sub && <p className="text-xs text-white/40">{sub}</p>}
    </div>
  )
}
