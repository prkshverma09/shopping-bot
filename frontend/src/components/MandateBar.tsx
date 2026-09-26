import type { Mandate } from '../lib/types'

const DEFAULT_SENTENCES = [
  'Landed price at or under £18 per piece.',
  'Waist sizes 28-32 only. Those sizes sell in this shop.',
  'Refuse a supplier whose recent orders were not as described twice.',
  'Ask the buyer when the photo grade disagrees with the claimed grade, or when the price breaks £18. Otherwise buy.',
]

export default function MandateBar({ mandate }: { mandate: Mandate | null }) {
  const sentences = mandate?.rules_sentences?.length ? mandate.rules_sentences : DEFAULT_SENTENCES

  return (
    <div className="border-b border-white/10 bg-ink px-6 py-4">
      <div className="mx-auto max-w-6xl">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-white/40">
          Standing mandate
        </p>
        <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          {sentences.map((sentence, i) => (
            <li
              key={i}
              className="rounded-lg bg-white/5 px-3 py-2 text-sm leading-snug text-white/90"
            >
              {sentence}
            </li>
          ))}
        </ol>
      </div>
    </div>
  )
}
