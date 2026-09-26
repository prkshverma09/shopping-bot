import { supabase } from '../src/config/supabase.js';
import { createLiveSupplierDOffer } from '../src/suppliers/live_supplier.js';

export const SUPPLIER_A_ID = '11111111-1111-1111-1111-111111111111';
export const SUPPLIER_B_ID = '22222222-2222-2222-2222-222222222222';
export const SUPPLIER_C_ID = '33333333-3333-3333-3333-333333333333';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Simulates incoming supplier offers with timed delays.
 */
export async function simulateSupplierStream(demandId: string, delayMs: number = 2000) {
  console.log(`[Simulator] Starting supplier offer stream for Demand: ${demandId}...`);

  // 1. Supplier A: Cheapest, but slow & 2 not-as-described orders
  console.log(`[Simulator] Inserting Supplier A offer...`);
  await supabase.from('offers').insert({
    demand_id: demandId,
    supplier_id: SUPPLIER_A_ID,
    claimed_grade: 'A',
    unit_price: 12.0,
    shipping: 4.0,
    ship_days: 28,
    quantity: 20,
    photo_urls: [
      'https://images.unsplash.com/photo-1541099649105-f69ad21f3246?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'open',
  });
  await sleep(delayMs);

  // 2. Supplier C: Standard price, claimed Grade A, but photo has 3 damaged pairs
  console.log(`[Simulator] Inserting Supplier C offer (with photo flaws)...`);
  await supabase.from('offers').insert({
    demand_id: demandId,
    supplier_id: SUPPLIER_C_ID,
    claimed_grade: 'A',
    unit_price: 16.0,
    shipping: 2.0,
    ship_days: 7,
    quantity: 20,
    photo_urls: [
      'https://images.unsplash.com/photo-supplier_c-damaged-jeans',
    ],
    status: 'open',
  });
  await sleep(delayMs);

  // 3. Supplier D: Live response (Grade A, £17 landed, within cap)
  console.log(`[Simulator] Triggering Live Supplier D offer...`);
  await createLiveSupplierDOffer(demandId);
  await sleep(delayMs);

  // 4. Supplier B: Premium lot, £20 landed (£2 over cap) -> Triggers Decision Card
  console.log(`[Simulator] Inserting Supplier B offer (£20 landed - triggers Decision Card)...`);
  await supabase.from('offers').insert({
    demand_id: demandId,
    supplier_id: SUPPLIER_B_ID,
    claimed_grade: 'A',
    unit_price: 18.0,
    shipping: 2.0,
    ship_days: 5,
    quantity: 20,
    photo_urls: [
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=800&q=80',
    ],
    status: 'open',
  });

  console.log(`[Simulator] All 4 supplier offers submitted!`);
}

// CLI runner
if (process.argv[1]?.endsWith('simulate_suppliers.ts') || process.argv[1]?.endsWith('simulate_suppliers.js')) {
  (async () => {
    const { data: latestDemand } = await supabase
      .from('demands')
      .select('id')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (latestDemand) {
      await simulateSupplierStream(latestDemand.id, 1000);
    } else {
      console.log('[Simulator] No demand found. Create a demand first or run `npm run demo`.');
    }
  })();
}
