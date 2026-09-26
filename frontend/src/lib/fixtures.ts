// Demo-safe fallback data for the Presenter Drawer.
// These numbers match CONTRACT.md's "4 Demo Scenarios" table exactly, so the
// closing receipt always adds up on stage even if the backend agents stall.
// The Presenter Drawer inserts these rows directly — same tables, same shapes
// the real agents write to. This is a fail-safe, not a shortcut around the
// contract.

import type { DamageMarker } from './types'

export const SUPPLIER_NAMES = {
  A: 'Cheapest Wholesaler',
  B: 'Premium Denim Lot',
  C: 'Standard Vintage Co.',
  D: 'Euro Vintage Hub',
} as const

export type FixtureKey = keyof typeof SUPPLIER_NAMES

export const CLEAN_BUNDLE_PHOTO =
  'https://images.unsplash.com/photo-1602293589930-45821b8b7f75?w=800&q=80'
export const DAMAGED_BUNDLE_PHOTO =
  'https://images.unsplash.com/photo-1604176354204-9268737828e4?w=800&q=80'

export const SUPPLIER_C_MARKERS: DamageMarker[] = [
  { x: 120, y: 85, radius: 24, label: 'Frayed hem' },
  { x: 240, y: 140, radius: 20, label: 'Tear near pocket' },
  { x: 310, y: 195, radius: 22, label: 'Frayed cuff' },
]

export const FIXTURE_OFFERS: Record<
  FixtureKey,
  {
    claimed_grade: string
    seen_grade: string | null
    seen_grade_reason: string | null
    damage_markers: DamageMarker[] | null
    unit_price: number
    shipping: number
    ship_days: number
    quantity: number
    photo_urls: string[]
    action: 'refuse' | 'counter' | 'buy' | 'ask'
    rule_cited: string
    note: string
    counter_price?: number
  }
> = {
  A: {
    claimed_grade: 'A',
    seen_grade: null,
    seen_grade_reason: null,
    damage_markers: null,
    unit_price: 12,
    shipping: 4,
    ship_days: 28,
    quantity: 20,
    photo_urls: [CLEAN_BUNDLE_PHOTO],
    action: 'refuse',
    rule_cited: 'Refuse supplier with 2 not-as-described orders',
    note: 'Refused. Two not-as-described orders; 28-day ship window.',
  },
  C: {
    claimed_grade: 'A',
    seen_grade: 'B',
    seen_grade_reason: '3 frayed hems detected on front row jeans',
    damage_markers: SUPPLIER_C_MARKERS,
    unit_price: 16,
    shipping: 2,
    ship_days: 7,
    quantity: 20,
    photo_urls: [DAMAGED_BUNDLE_PHOTO],
    action: 'counter',
    rule_cited: 'Claimed grade disagrees with seen grade',
    note: 'Countered at £14/pc after downgrading to Grade B. Accepted.',
    counter_price: 14,
  },
  D: {
    claimed_grade: 'A',
    seen_grade: 'A',
    seen_grade_reason: 'Clean bundle, no visible defects, matches claimed grade',
    damage_markers: null,
    unit_price: 15,
    shipping: 2,
    ship_days: 5,
    quantity: 20,
    photo_urls: [CLEAN_BUNDLE_PHOTO],
    action: 'buy',
    rule_cited: 'All mandate rules satisfied (£17 landed, Grade A, size 28-32)',
    note: 'Bought autonomously. £17 landed, every rule passed.',
  },
  B: {
    claimed_grade: 'A',
    seen_grade: 'A',
    seen_grade_reason: 'Clean bundle, matches claimed grade',
    damage_markers: null,
    unit_price: 18,
    shipping: 2,
    ship_days: 5,
    quantity: 20,
    photo_urls: [CLEAN_BUNDLE_PHOTO],
    action: 'ask',
    rule_cited: 'Landed price £20 breaks the £18 cap by £2',
    note: 'Asked buyer. £2 over cap, otherwise a clean lot.',
  },
}
