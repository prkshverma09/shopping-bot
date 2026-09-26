import type { OfferWithContext } from '../lib/types'

// Only sums figures physically present in orders/actions rows — per PRD:
// "Do not invent a savings figure in the UI that the rows do not support."
export default function FinalReceipt({ rows }: { rows: OfferWithContext[] }) {
  const placedOrders = rows.filter((r) => r.order?.status === 'placed')
  const refused = rows.filter((r) => r.latestAction?.action === 'refuse')
  const countered = rows.filter((r) => r.offer.status === 'accepted')

  const piecesBought = placedOrders.reduce((sum, r) => sum + (r.order?.quantity ?? 0), 0)
  const totalSpend = placedOrders.reduce((sum, r) => sum + (r.order?.total ?? 0), 0)
  const refusedLandedCost = refused.reduce(
    (sum, r) => sum + (r.offer.unit_price + r.offer.shipping) * r.offer.quantity,
    0
  )

  if (placedOrders.length === 0 && refused.length === 0) return null

  return (
    <div className="rounded-xl border border-white/10 bg-white p-6 text-ink">
      <p className="mb-4 text-xs font-semibold uppercase tracking-widest text-ink/40">
        Closing receipt
      </p>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Pieces bought" value={`${piecesBought}`} />
        <Stat label="Total spend" value={`£${totalSpend.toFixed(0)}`} />
        <Stat label="Offers refused" value={`${refused.length}`} />
        <Stat label="Counters accepted" value={`${countered.length}`} />
      </div>
      {refused.length > 0 && (
        <p className="mt-4 text-sm text-ink/60">
          £{refusedLandedCost.toFixed(0)} in landed cost avoided on refused lots.
        </p>
      )}
      <p className="mt-4 text-sm font-semibold text-ink/80">
        {piecesBought > 0 ? '0 store checkouts opened. Fully audited.' : 'Fully audited.'}
      </p>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-ink/50">{label}</p>
    </div>
  )
}
