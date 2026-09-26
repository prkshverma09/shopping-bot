import { supabase } from '../config/supabase.js';

export const SUPPLIER_D_ID = '44444444-4444-4444-4444-444444444444';

/**
 * Generates an offer from Live Supplier D (Euro Vintage Hub).
 */
export async function createLiveSupplierDOffer(demandId: string) {
  console.log(`[Supplier D (Live)] Generating offer for demand ${demandId}...`);

  const { data, error } = await supabase
    .from('offers')
    .insert({
      demand_id: demandId,
      supplier_id: SUPPLIER_D_ID,
      claimed_grade: 'A',
      unit_price: 15.0,
      shipping: 2.0,
      ship_days: 5,
      quantity: 20,
      photo_urls: [
        'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=800&q=80',
      ],
      status: 'open',
    })
    .select()
    .single();

  if (error) {
    console.error('[Supplier D] Failed to create live offer:', error);
    throw error;
  }

  console.log(`[Supplier D (Live)] Live offer submitted! ID: ${data.id} (£15/pc + £2 ship)`);
  return data;
}
