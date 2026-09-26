import { useEffect, useState } from 'react'
import { Terminal, RotateCcw } from 'lucide-react'
import type { Supplier } from '../lib/types'
import { findSupplierByKey, insertFixtureOffer, resetDemoState } from '../lib/presenterActions'
import type { FixtureKey } from '../lib/fixtures'

const BUTTONS: { key: FixtureKey; label: string }[] = [
  { key: 'A', label: 'Simulate Supplier A arrival (refuse)' },
  { key: 'C', label: 'Simulate Supplier C arrival & counter' },
  { key: 'D', label: 'Simulate Supplier D autonomous buy' },
  { key: 'B', label: 'Trigger decision card (Supplier B)' },
]

// Hidden fallback so the presenter can keep the demo moving if venue Wi-Fi
// stutters or a live agent stalls. Shift+D toggles visibility. Writes go to
// the same tables the real agents write to — see INTEGRATION_AND_REHEARSAL_PLAN.md.
export default function PresenterDrawer({
  demandId,
  suppliers,
  onReset,
}: {
  demandId: string | null
  suppliers: Supplier[]
  onReset: () => void
}) {
  const [open, setOpen] = useState(false)
  const [busyKey, setBusyKey] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (e.shiftKey && e.key.toLowerCase() === 'd') setOpen((o) => !o)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [])

  if (!open) return null

  async function fire(key: FixtureKey) {
    if (!demandId) {
      setError('No active demand — send a demand first.')
      return
    }
    const supplier = findSupplierByKey(suppliers, key)
    if (!supplier) {
      setError(`No supplier matching "${key}" found in the suppliers table.`)
      return
    }
    setBusyKey(key)
    setError(null)
    try {
      await insertFixtureOffer(demandId, supplier.id, key)
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Insert failed')
    } finally {
      setBusyKey(null)
    }
  }

  async function fireReset() {
    if (!demandId) return
    setBusyKey('reset')
    setError(null)
    try {
      await resetDemoState(demandId)
      onReset()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Reset failed')
    } finally {
      setBusyKey(null)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-80 rounded-xl border border-white/20 bg-black/95 p-4 shadow-2xl">
      <div className="mb-3 flex items-center gap-2 text-white/70">
        <Terminal size={16} />
        <p className="text-xs font-semibold uppercase tracking-widest">Presenter controls</p>
      </div>
      <div className="flex flex-col gap-2">
        {BUTTONS.map((b) => (
          <button
            key={b.key}
            className="rounded-lg bg-white/10 px-3 py-2 text-left text-sm text-white hover:bg-white/20 disabled:opacity-40"
            disabled={busyKey !== null}
            onClick={() => fire(b.key)}
          >
            {busyKey === b.key ? 'Working…' : b.label}
          </button>
        ))}
        <button
          className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-refuse/20 px-3 py-2 text-sm font-semibold text-refuse hover:bg-refuse/30 disabled:opacity-40"
          disabled={busyKey !== null}
          onClick={fireReset}
        >
          <RotateCcw size={14} />
          Reset demo state
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-refuse">{error}</p>}
      <p className="mt-2 text-xs text-white/30">Shift+D to hide</p>
    </div>
  )
}
