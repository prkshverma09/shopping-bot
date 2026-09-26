import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import type { OfferWithContext } from '../lib/types'

const ACTION_LABEL: Record<string, string> = {
  buy: 'Bought',
  refuse: 'Refused',
  counter: 'Countered',
  ask: 'Asked',
}

export default function TrustLedger({ rows }: { rows: OfferWithContext[] }) {
  const [openId, setOpenId] = useState<string | null>(null)

  const ordered = rows
    .filter((r) => r.latestAction)
    .sort(
      (a, b) =>
        new Date(a.latestAction!.created_at).getTime() -
        new Date(b.latestAction!.created_at).getTime()
    )

  if (ordered.length === 0) return null

  return (
    <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
      <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-white/40">
        Trust ledger
      </p>
      <ol className="space-y-2">
        {ordered.map(({ offer, supplier, latestAction }) => {
          const isOpen = openId === offer.id
          return (
            <li key={offer.id} className="rounded-lg bg-white/5">
              <button
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-left"
                onClick={() => setOpenId(isOpen ? null : offer.id)}
              >
                <span className="text-sm text-white/90">
                  <span className="font-semibold">
                    {ACTION_LABEL[latestAction!.action]} {supplier?.name ?? 'Supplier'}
                  </span>
                  : {latestAction!.note}
                </span>
                {isOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
              </button>
              {isOpen && (
                <div className="border-t border-white/10 px-4 py-3 text-sm text-white/60">
                  <p>
                    <span className="text-white/40">Rule cited:</span> {latestAction!.rule_cited}
                  </p>
                  <p>
                    <span className="text-white/40">Landed:</span> £
                    {(offer.unit_price + offer.shipping).toFixed(2)} ×{offer.quantity}pc
                  </p>
                  {offer.seen_grade_reason && (
                    <p>
                      <span className="text-white/40">Photo dissent:</span> {offer.seen_grade_reason}
                    </p>
                  )}
                </div>
              )}
            </li>
          )
        })}
      </ol>
    </div>
  )
}
