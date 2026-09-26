// Mirrors CONTRACT.md exactly. Do not add fields the backend doesn't write.

export type Mandate = {
  id: string
  shop_id: string
  max_landed_price: number
  min_waist: number
  max_waist: number
  not_as_described_limit: number
  ask_conditions: string[]
  rules_sentences: string[]
  created_at: string
}

export type Demand = {
  id: string
  shop_id: string
  raw_message: string
  quantity: number
  category: string
  grade: string
  sizes: string
  max_unit_price: number
  budget: number
  status: 'open' | 'processing' | 'completed'
  created_at: string
}

export type Supplier = {
  id: string
  name: string
  not_as_described_count: number
  typical_ship_days: number
  is_live: boolean
  created_at: string
}

export type DamageMarker = {
  x: number
  y: number
  radius: number
  label: string
}

export type OfferStatus = 'open' | 'countered' | 'accepted' | 'refused' | 'asked'

export type Offer = {
  id: string
  demand_id: string
  supplier_id: string
  claimed_grade: string
  seen_grade: string | null
  seen_grade_reason: string | null
  damage_markers: DamageMarker[] | null
  unit_price: number
  shipping: number
  ship_days: number
  quantity: number
  photo_urls: string[]
  status: OfferStatus
  created_at: string
}

export type ActionType = 'buy' | 'counter' | 'refuse' | 'ask'

export type Action = {
  id: string
  offer_id: string
  action: ActionType
  rule_cited: string
  note: string
  created_at: string
}

export type OrderStatus = 'placed' | 'declined'

export type Order = {
  id: string
  offer_id: string
  quantity: number
  unit_price: number
  shipping: number
  total: number
  status: OrderStatus
  shopify_draft_id: string | null
  created_at: string
}

// Frontend-only join shape: one offer plus everything it takes to render a card.
export type OfferWithContext = {
  offer: Offer
  supplier: Supplier | undefined
  latestAction: Action | undefined
  order: Order | undefined
}
