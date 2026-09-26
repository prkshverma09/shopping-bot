import { Check, X, Clock3, HelpCircle } from 'lucide-react'
import type { OfferWithContext } from '../lib/types'
import MarkedPhoto from './MarkedPhoto'

const STATUS_STYLE: Record<string, { label: string; classes: string; icon: JSX.Element }> = {
  buy: { label: 'Bought autonomously', classes: 'bg-buy text-white', icon: <Check size={16} /> },
  refuse: { label: 'Refused', classes: 'bg-refuse text-white', icon: <X size={16} /> },
  counter: { label: 'Countering…', classes: 'bg-counter text-white', icon: <Clock3 size={16} /> },
  ask: { label: 'Action required', classes: 'bg-ask text-white', icon: <HelpCircle size={16} /> },
}

export default function OfferCard({ ctx }: { ctx: OfferWithContext }) {
  const { offer, supplier, latestAction, order } = ctx
  const landed = offer.unit_price + offer.shipping
  const statusKey = order?.status === 'placed' && latestAction?.action === 'ask'
    ? 'buy'
    : latestAction?.action ?? 'open'
  const status = STATUS_STYLE[statusKey]
  const showDissent = offer.seen_grade && offer.seen_grade !== offer.claimed_grade

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div>
          <p className="text-lg font-semibold text-white">{supplier?.name ?? 'Supplier'}</p>
          <p className="text-sm text-white/50">
            {supplier?.not_as_described_count ?? 0} not-as-described order
            {supplier?.not_as_described_count === 1 ? '' : 's'} · {offer.ship_days}d ship
          </p>
        </div>
        {status && (
          <span
            className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold ${status.classes}`}
          >
            {status.icon}
            {status.label}
          </span>
        )}
      </div>

      <div className="mb-3 flex flex-wrap items-baseline gap-4">
        <p className="text-2xl font-bold text-white">
          £{offer.unit_price.toFixed(2)}
          <span className="text-base font-normal text-white/50">
            /pc + £{offer.shipping.toFixed(2)} ship = £{landed.toFixed(2)} landed
          </span>
        </p>
        <span className="rounded bg-white/10 px-2 py-0.5 text-sm font-medium text-white/80">
          Claimed: Grade {offer.claimed_grade}
        </span>
        {offer.seen_grade && (
          <span
            className={`rounded px-2 py-0.5 text-sm font-medium ${
              showDissent ? 'bg-refuse/20 text-refuse' : 'bg-buy/20 text-buy'
            }`}
          >
            Seen: Grade {offer.seen_grade}
          </span>
        )}
      </div>

      {showDissent && offer.damage_markers && offer.photo_urls[0] && (
        <div className="mb-3">
          <MarkedPhoto photoUrl={offer.photo_urls[0]} markers={offer.damage_markers} />
          <p className="mt-2 text-sm text-white/70">
            Claimed: Grade {offer.claimed_grade}. Seen: Grade {offer.seen_grade} ({offer.seen_grade_reason})
          </p>
        </div>
      )}

      {latestAction && (
        <p className="border-t border-white/10 pt-3 text-sm text-white/70">
          <span className="font-medium text-white/90">{latestAction.rule_cited}.</span>{' '}
          {latestAction.note}
        </p>
      )}
    </div>
  )
}
