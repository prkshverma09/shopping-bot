import { useEffect, useMemo, useRef, useState } from 'react'
import { supabase } from './lib/supabase'
import type { Action, Demand, Mandate, Offer, OfferWithContext, Order, Supplier } from './lib/types'
import MandateBar from './components/MandateBar'
import DemandInput, { parseDemand } from './components/DemandInput'
import OfferCard from './components/OfferCard'
import DecisionCard from './components/DecisionCard'
import TrustLedger from './components/TrustLedger'
import FinalReceipt from './components/FinalReceipt'
import PresenterDrawer from './components/PresenterDrawer'
import { approveOffer, declineOffer } from './lib/presenterActions'

export default function App() {
  const [mandate, setMandate] = useState<Mandate | null>(null)
  const [suppliers, setSuppliers] = useState<Supplier[]>([])
  const [demand, setDemand] = useState<Demand | null>(null)
  const [offers, setOffers] = useState<Offer[]>([])
  const [actions, setActions] = useState<Action[]>([])
  const [orders, setOrders] = useState<Order[]>([])
  const [decisionBusy, setDecisionBusy] = useState(false)

  const offerIdsRef = useRef<Set<string>>(new Set())
  useEffect(() => {
    offerIdsRef.current = new Set(offers.map((o) => o.id))
  }, [offers])

  // Initial load: mandate + suppliers are static for the demo.
  useEffect(() => {
    supabase
      .from('mandates')
      .select('*')
      .limit(1)
      .maybeSingle()
      .then(({ data }) => setMandate(data as Mandate | null))

    supabase
      .from('suppliers')
      .select('*')
      .then(({ data }) => setSuppliers((data as Supplier[]) ?? []))
  }, [])

  // Realtime subscriptions, scoped once a demand exists.
  useEffect(() => {
    if (!demand) return

    const channel = supabase
      .channel(`demand-${demand.id}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'offers', filter: `demand_id=eq.${demand.id}` },
        (payload) => setOffers((prev) => [...prev, payload.new as Offer])
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'offers', filter: `demand_id=eq.${demand.id}` },
        (payload) =>
          setOffers((prev) => prev.map((o) => (o.id === payload.new.id ? (payload.new as Offer) : o)))
      )
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'actions' }, (payload) => {
        const row = payload.new as Action
        if (offerIdsRef.current.has(row.offer_id)) setActions((prev) => [...prev, row])
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
        const row = payload.new as Order
        if (offerIdsRef.current.has(row.offer_id)) setOrders((prev) => [...prev, row])
      })
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders' }, (payload) => {
        const row = payload.new as Order
        if (offerIdsRef.current.has(row.offer_id))
          setOrders((prev) => prev.map((o) => (o.id === row.id ? row : o)))
      })
      .subscribe()

    // Initial fetch
    const refreshData = () => {
      supabase
        .from('offers')
        .select('*')
        .eq('demand_id', demand.id)
        .then(({ data: fetchedOffers }) => {
          if (fetchedOffers && fetchedOffers.length > 0) {
            setOffers(fetchedOffers as Offer[])
            const ids = (fetchedOffers as Offer[]).map((o) => o.id)
            supabase
              .from('actions')
              .select('*')
              .in('offer_id', ids)
              .then(({ data: fetchedActions }) => {
                if (fetchedActions) setActions(fetchedActions as Action[])
              })
            supabase
              .from('orders')
              .select('*')
              .in('offer_id', ids)
              .then(({ data: fetchedOrders }) => {
                if (fetchedOrders) setOrders(fetchedOrders as Order[])
              })
          }
        })
    }

    refreshData()
    // Poll every 1s for immediate responsiveness
    const pollInterval = setInterval(refreshData, 1000)

    return () => {
      clearInterval(pollInterval)
      supabase.removeChannel(channel)
    }
  }, [demand?.id])

  const rows: OfferWithContext[] = useMemo(() => {
    return offers
      .map((offer) => {
        const supplier = suppliers.find((s) => s.id === offer.supplier_id)
        const offerActions = actions
          .filter((a) => a.offer_id === offer.id)
          .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        const order = orders.find((o) => o.offer_id === offer.id)
        return { offer, supplier, latestAction: offerActions[0], order }
      })
      .sort((a, b) => new Date(a.offer.created_at).getTime() - new Date(b.offer.created_at).getTime())
  }, [offers, suppliers, actions, orders])

  const activeAsk = rows.find(
    (r) => r.latestAction?.action === 'ask' && r.offer.status === 'asked' && !r.order
  )

  async function handleSubmitDemand(raw: string) {
    const defaults = {
      max_landed_price: mandate?.max_landed_price ?? 18,
      min_waist: mandate?.min_waist ?? 28,
      max_waist: mandate?.max_waist ?? 32,
    }
    const parsed = parseDemand(raw, defaults)
    const defaultShopId = mandate?.shop_id || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11'
    const { data, error } = await supabase
      .from('demands')
      .insert({
        shop_id: defaultShopId,
        raw_message: raw,
        ...parsed,
        status: 'open',
      })
      .select()
      .single()

    if (error) {
      // eslint-disable-next-line no-console
      console.error(error)
      return
    }
    setDemand(data as Demand)
  }

  async function handleApprove() {
    if (!activeAsk) return
    setDecisionBusy(true)
    try {
      await approveOffer(activeAsk.offer)
    } finally {
      setDecisionBusy(false)
    }
  }

  async function handleDecline() {
    if (!activeAsk) return
    setDecisionBusy(true)
    try {
      await declineOffer(activeAsk.offer)
    } finally {
      setDecisionBusy(false)
    }
  }

  function handleReset() {
    setDemand(null)
    setOffers([])
    setActions([])
    setOrders([])
  }

  return (
    <div className="min-h-screen bg-ink pb-16">
      <MandateBar mandate={mandate} />
      <DemandInput disabled={!!demand} onSubmit={handleSubmitDemand} />

      <div className="mx-auto max-w-6xl space-y-6 px-6 py-8">
        {rows.length > 0 && (
          <div className="grid gap-4 md:grid-cols-2">
            {rows.map((ctx) => (
              <OfferCard key={ctx.offer.id} ctx={ctx} />
            ))}
          </div>
        )}
        <TrustLedger rows={rows} />
        <FinalReceipt rows={rows} />
      </div>

      {activeAsk && (
        <DecisionCard
          offer={activeAsk.offer}
          supplier={activeAsk.supplier}
          mandate={mandate}
          busy={decisionBusy}
          onApprove={handleApprove}
          onDecline={handleDecline}
        />
      )}

      <PresenterDrawer demandId={demand?.id ?? null} suppliers={suppliers} onReset={handleReset} />
    </div>
  )
}
