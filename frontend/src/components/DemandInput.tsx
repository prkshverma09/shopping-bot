import { useState } from 'react'
import { Send } from 'lucide-react'

export const SCRIPT_PROMPT =
  "I need about 40 Grade A Levi's 501s, waist 28-32, under £18 landed, the kind that sells in my shop. Budget £600. Only ping me if the grade looks wrong or the price breaks the cap."

// Lightweight client-side extraction so the demand row can be inserted
// immediately on click. The buyer bot's own create_demand tool remains the
// source of truth for real parsing; this only unblocks the UI for the demo.
export function parseDemand(raw: string, mandateDefaults: {
  max_landed_price: number
  min_waist: number
  max_waist: number
}) {
  const quantity = Number(raw.match(/(\d+)\s*(?:grade|levi|pcs|pairs|piece)/i)?.[1] ?? 40)
  const grade = raw.match(/grade\s*([a-c])/i)?.[1]?.toUpperCase() ?? 'A'
  const sizeMatch = raw.match(/(\d{2})\s*-\s*(\d{2})/)
  const sizes = sizeMatch ? `${sizeMatch[1]}-${sizeMatch[2]}` : `${mandateDefaults.min_waist}-${mandateDefaults.max_waist}`
  const maxUnitPrice = Number(
    raw.match(/under\s*£?\s*(\d+)/i)?.[1] ??
      raw.match(/£\s*(\d+)\s*landed/i)?.[1] ??
      mandateDefaults.max_landed_price
  )
  const budget = Number(raw.match(/budget\s*£?\s*(\d+)/i)?.[1] ?? maxUnitPrice * quantity)
  const category = raw.match(/levi'?s?\s*501/i) ? "Levi's 501" : 'Vintage denim'

  return { quantity, category, grade: `Grade ${grade}`, sizes, max_unit_price: maxUnitPrice, budget }
}

export default function DemandInput({
  disabled,
  onSubmit,
}: {
  disabled: boolean
  onSubmit: (raw: string) => void
}) {
  const [value, setValue] = useState(SCRIPT_PROMPT)

  return (
    <div className="border-b border-white/10 bg-ink px-6 py-4">
      <div className="mx-auto flex max-w-6xl gap-3">
        <textarea
          className="flex-1 resize-none rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-base text-white placeholder-white/30 focus:border-white/30 focus:outline-none"
          rows={2}
          value={value}
          disabled={disabled}
          onChange={(e) => setValue(e.target.value)}
        />
        <button
          className="flex items-center gap-2 self-start rounded-lg bg-white px-5 py-3 font-semibold text-ink transition disabled:cursor-not-allowed disabled:opacity-40"
          disabled={disabled || !value.trim()}
          onClick={() => onSubmit(value.trim())}
        >
          <Send size={18} />
          Send Demand
        </button>
      </div>
    </div>
  )
}
