import { supabase } from './supabase'
import { FIXTURE_OFFERS, FixtureKey } from './fixtures'
import type { Offer, Supplier } from './types'

// Matches suppliers seeded per HACKER_2_PLAN.md's naming convention
// ("Supplier A", "Supplier B", "Supplier C", "Live Supplier D" / is_live=true).
// Falls back gracefully if the backend seeded slightly different names.
export function findSupplierByKey(suppliers: Supplier[], key: FixtureKey): Supplier | undefined {
  if (key === 'D') {
    return suppliers.find((s) => s.is_live) ?? suppliers.find((s) => /\bD\b/i.test(s.name))
  }
  return suppliers.find((s) => new RegExp(`\\b${key}\\b`, 'i').test(s.name))
}

export async function insertFixtureOffer(demandId: string, supplierId: string, key: FixtureKey) {
  const fx = FIXTURE_OFFERS[key]
  const status = fx.action === 'refuse' ? 'refused' : fx.action === 'ask' ? 'asked' : 'accepted'

  const { data: offer, error: offerErr } = await supabase
    .from('offers')
    .insert({
      demand_id: demandId,
      supplier_id: supplierId,
      claimed_grade: fx.claimed_grade,
      seen_grade: fx.seen_grade,
      seen_grade_reason: fx.seen_grade_reason,
      damage_markers: fx.damage_markers,
      unit_price: fx.counter_price ?? fx.unit_price,
      shipping: fx.shipping,
      ship_days: fx.ship_days,
      quantity: fx.quantity,
      photo_urls: fx.photo_urls,
      status,
    })
    .select()
    .single()

  if (offerErr || !offer) throw offerErr

  const { error: actionErr } = await supabase.from('actions').insert({
    offer_id: offer.id,
    action: fx.action,
    rule_cited: fx.rule_cited,
    note: fx.note,
  })
  if (actionErr) throw actionErr

  if (fx.action === 'buy') {
    const unitPrice = fx.unit_price
    const total = (unitPrice + fx.shipping) * fx.quantity
    const { error: orderErr } = await supabase.from('orders').insert({
      offer_id: offer.id,
      quantity: fx.quantity,
      unit_price: unitPrice,
      shipping: fx.shipping,
      total,
      status: 'placed',
    })
    if (orderErr) throw orderErr
  }

  return offer
}

// Fires when the buyer taps a Decision Card. Same tables the buyer bot's own
// `place_order` tool writes to — the UI is not making a purchasing decision,
// it is recording the one the buyer just made.
export async function approveOffer(offer: Offer) {
  const total = (offer.unit_price + offer.shipping) * offer.quantity
  const { data: orderData, error: orderErr } = await supabase.from('orders').insert({
    offer_id: offer.id,
    quantity: offer.quantity,
    unit_price: offer.unit_price,
    shipping: offer.shipping,
    total,
    status: 'placed',
  }).select().single()
  if (orderErr) throw orderErr

  const { error: offerErr } = await supabase
    .from('offers')
    .update({ status: 'accepted' })
    .eq('id', offer.id)
  if (offerErr) throw offerErr

  // Auto-intake items for retail listing in Supabase
  try {
    const unitPrice = offer.unit_price
    const shipping = offer.shipping
    const quantity = offer.quantity
    const costBasis = Number((unitPrice + shipping / quantity).toFixed(2))
    const listPrice = Math.round(costBasis / (1 - 0.55))
    const floorPrice = Number((costBasis / (1 - 0.30)).toFixed(2))

    const demoSizes = ['W29 L30', 'W30 L32', 'W31 L32', 'W32 L32']
    const itemsToInsert = demoSizes.map((size) => ({
      order_id: (orderData as any)?.id,
      title: `Vintage Levi's 501 Straight Leg Denim - ${size}`,
      category: "Levi's 501",
      size,
      grade: offer.seen_grade || offer.claimed_grade || 'A',
      flaws: ['Subtle vintage wash wear', 'Original chainstitched hems intact'],
      cost_basis: costBasis,
      list_price: listPrice,
      floor_price: floorPrice,
      current_price: listPrice,
      photo_urls: offer.photo_urls,
      status: 'listed',
      days_on_shelf: 0,
    }))

    await supabase.from('items').insert(itemsToInsert)
  } catch (err) {
    // Non-blocking fallback
  }
}

export async function declineOffer(offer: Offer) {
  const total = (offer.unit_price + offer.shipping) * offer.quantity
  const { error: orderErr } = await supabase.from('orders').insert({
    offer_id: offer.id,
    quantity: offer.quantity,
    unit_price: offer.unit_price,
    shipping: offer.shipping,
    total,
    status: 'declined',
  })
  if (orderErr) throw orderErr

  const { error: offerErr } = await supabase
    .from('offers')
    .update({ status: 'refused' })
    .eq('id', offer.id)
  if (offerErr) throw offerErr
}

export async function resetDemoState(demandId: string) {
  const { data: offers } = await supabase.from('offers').select('id').eq('demand_id', demandId)
  const offerIds = (offers ?? []).map((o) => o.id)

  if (offerIds.length > 0) {
    await supabase.from('orders').delete().in('offer_id', offerIds)
    await supabase.from('actions').delete().in('offer_id', offerIds)
    await supabase.from('offers').delete().in('id', offerIds)
  }
  await supabase.from('demands').delete().eq('id', demandId)
}
