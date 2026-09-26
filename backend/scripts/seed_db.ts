import { supabase } from '../src/config/supabase.js';

export const SHOP_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

export async function seedDatabase() {
  console.log('[Seed] Starting database seed via Supabase Client...');

  // 1. Shop
  const { error: shopErr } = await supabase.from('shops').upsert({
    id: SHOP_ID,
    name: 'Vintage Threads London',
    channel: 'Depop',
    currency: 'GBP',
  });
  if (shopErr) console.warn('[Seed] Shop upsert warning:', shopErr.message);

  // 2. Mandate
  const { error: mandateErr } = await supabase.from('mandates').upsert({
    shop_id: SHOP_ID,
    max_landed_price: 18.0,
    min_waist: 28,
    max_waist: 32,
    not_as_described_limit: 2,
    ask_conditions: ['grade_mismatch', 'price_over_cap'],
    rules_sentences: [
      'Landed price at or under £18 per piece.',
      'Waist sizes 28-32 only. Those sizes sell in this shop.',
      'Refuse a supplier whose recent orders were not as described twice.',
      'Ask the buyer when the photo grade disagrees with the claimed grade, or when the price breaks £18. Otherwise buy.',
    ],
  });
  if (mandateErr) console.warn('[Seed] Mandate upsert warning:', mandateErr.message);

  // 3. Suppliers
  const suppliers = [
    {
      id: '11111111-1111-1111-1111-111111111111',
      name: 'Supplier A (Cheap Wholesale)',
      not_as_described_count: 2,
      typical_ship_days: 28,
      is_live: false,
    },
    {
      id: '22222222-2222-2222-2222-222222222222',
      name: 'Supplier B (Premium Denim Lot)',
      not_as_described_count: 0,
      typical_ship_days: 5,
      is_live: false,
    },
    {
      id: '33333333-3333-3333-3333-333333333333',
      name: 'Supplier C (Bulk Garments Ltd)',
      not_as_described_count: 0,
      typical_ship_days: 7,
      is_live: false,
    },
    {
      id: '44444444-4444-4444-4444-444444444444',
      name: 'Supplier D (Euro Vintage Hub - Live)',
      not_as_described_count: 0,
      typical_ship_days: 5,
      is_live: true,
    },
  ];

  const { error: supErr } = await supabase.from('suppliers').upsert(suppliers);
  if (supErr) console.warn('[Seed] Suppliers upsert warning:', supErr.message);

  console.log('[Seed] Database seed completed!');
}

if (process.argv[1]?.endsWith('seed_db.ts') || process.argv[1]?.endsWith('seed_db.js')) {
  seedDatabase().catch((err) => {
    console.error('[Seed] Error during seeding:', err);
  });
}
