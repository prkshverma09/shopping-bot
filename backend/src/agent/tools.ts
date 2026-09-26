import { supabase } from '../config/supabase.js';
import { inspectPhotos, DamageMarker } from '../vision/inspect_photos.js';

export interface ParsedDemand {
  quantity: number;
  category: string;
  grade: string;
  sizes: string;
  max_unit_price: number;
  budget: number;
}

/**
 * Tool 1: create_demand
 * Parses raw text message and stores new demand in Supabase.
 */
export async function createDemand(rawMessage: string, shopId?: string) {
  const defaultShopId = shopId || 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

  let parsed: ParsedDemand = {
    quantity: 40,
    category: "Levi's 501",
    grade: 'Grade A',
    sizes: '28-32',
    max_unit_price: 18.0,
    budget: 600.0,
  };

  const apiKey = process.env.OPENAI_API_KEY || process.env.XAI_API_KEY;
  if (apiKey && apiKey !== 'your-openai-api-key') {
    try {
      const { default: OpenAI } = await import('openai');
      const openai = new OpenAI({
        apiKey,
        baseURL: process.env.OPENAI_BASE_URL || (process.env.OPENAI_API_KEY ? 'https://api.openai.com/v1' : 'https://api.x.ai/v1'),
      });
      console.log('[OpenAI] Extracting demand parameters via real LLM call...');
      const completion = await openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You extract vintage clothing wholesale buying demand parameters from a user prompt into strict JSON.
Fields:
- quantity (integer)
- category (string)
- grade (string, e.g. "Grade A")
- sizes (string, e.g. "28-32")
- max_unit_price (float)
- budget (float)`
          },
          { role: 'user', content: rawMessage }
        ],
        response_format: { type: 'json_object' }
      });
      const llmParsed = JSON.parse(completion.choices[0]?.message?.content || '{}');
      parsed = {
        quantity: Number(llmParsed.quantity) || parsed.quantity,
        category: llmParsed.category || parsed.category,
        grade: llmParsed.grade || parsed.grade,
        sizes: llmParsed.sizes || parsed.sizes,
        max_unit_price: Number(llmParsed.max_unit_price) || parsed.max_unit_price,
        budget: Number(llmParsed.budget) || parsed.budget,
      };
      console.log('[OpenAI] Successfully parsed demand parameters:', parsed);
    } catch (err) {
      console.warn('[OpenAI] LLM demand extraction fallback:', err);
    }
  }

  const { data, error } = await supabase
    .from('demands')
    .insert({
      shop_id: defaultShopId,
      raw_message: rawMessage,
      quantity: parsed.quantity,
      category: parsed.category,
      grade: parsed.grade,
      sizes: parsed.sizes,
      max_unit_price: parsed.max_unit_price,
      budget: parsed.budget,
      status: 'processing',
    })
    .select()
    .single();

  if (error) {
    console.error('[Tool: createDemand] Error:', error);
    throw error;
  }

  console.log(`[Tool: createDemand] Created demand ID: ${data.id}`);
  return data;
}

/**
 * Tool 2: list_offers
 * Lists offers for a given demand with supplier information joined.
 */
export async function listOffers(demandId: string) {
  const { data, error } = await supabase
    .from('offers')
    .select(`
      *,
      suppliers:supplier_id (
        id,
        name,
        not_as_described_count,
        typical_ship_days,
        is_live
      )
    `)
    .eq('demand_id', demandId)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[Tool: listOffers] Error:', error);
    throw error;
  }

  return data || [];
}

/**
 * Tool 3: record_grade
 * Records inspected grade and defect markers on an offer.
 */
export async function recordGrade(
  offerId: string,
  seenGrade: string,
  reason: string,
  damageMarkers: DamageMarker[] = []
) {
  const { data, error } = await supabase
    .from('offers')
    .update({
      seen_grade: seenGrade,
      seen_grade_reason: reason,
      damage_markers: damageMarkers,
    })
    .eq('id', offerId)
    .select()
    .single();

  if (error) {
    console.error('[Tool: recordGrade] Error:', error);
    throw error;
  }

  console.log(`[Tool: recordGrade] Updated Offer ${offerId} with Seen Grade: ${seenGrade}`);
  return data;
}

/**
 * Tool 4: send_counteroffer
 * Sends a price or condition counteroffer to a supplier.
 */
export async function sendCounteroffer(
  offerId: string,
  newUnitPrice: number,
  ruleCited: string,
  note: string
) {
  // Update offer status
  const { error: offerError } = await supabase
    .from('offers')
    .update({
      unit_price: newUnitPrice,
      status: 'countered',
    })
    .eq('id', offerId);

  if (offerError) throw offerError;

  // Record action in Trust Ledger
  const { data, error: actionError } = await supabase
    .from('actions')
    .insert({
      offer_id: offerId,
      action: 'counter',
      rule_cited: ruleCited,
      note: note,
    })
    .select()
    .single();

  if (actionError) throw actionError;

  console.log(`[Tool: sendCounteroffer] Counteroffer sent for Offer ${offerId} at £${newUnitPrice}`);
  return data;
}

/**
 * Tool 5: decide
 * Records an evaluation decision ('buy', 'counter', 'refuse', 'ask') into actions table.
 */
export async function decide(
  offerId: string,
  action: 'buy' | 'counter' | 'refuse' | 'ask',
  ruleCited: string,
  note: string
) {
  // Map action to offer status
  let offerStatus = 'open';
  if (action === 'refuse') offerStatus = 'refused';
  else if (action === 'ask') offerStatus = 'asked';
  else if (action === 'buy') offerStatus = 'accepted';
  else if (action === 'counter') offerStatus = 'countered';

  const { error: offerError } = await supabase
    .from('offers')
    .update({ status: offerStatus })
    .eq('id', offerId);

  if (offerError) throw offerError;

  const { data, error } = await supabase
    .from('actions')
    .insert({
      offer_id: offerId,
      action: action,
      rule_cited: ruleCited,
      note: note,
    })
    .select()
    .single();

  if (error) {
    console.error('[Tool: decide] Error:', error);
    throw error;
  }

  console.log(`[Tool: decide] Recorded decision: [${action.toUpperCase()}] for Offer ${offerId} -> "${note}"`);
  return data;
}

/**
 * Tool 6: place_order
 * Executes purchase by creating an order record.
 */
export async function placeOrder(offerId: string) {
  // Fetch offer details
  const { data: offer, error: fetchError } = await supabase
    .from('offers')
    .select('*')
    .eq('id', offerId)
    .single();

  if (fetchError || !offer) throw fetchError || new Error('Offer not found');

  const quantity = offer.quantity;
  const unitPrice = Number(offer.unit_price);
  const shipping = Number(offer.shipping);
  const total = Number((quantity * unitPrice + shipping).toFixed(2));

  const { data, error } = await supabase
    .from('orders')
    .insert({
      offer_id: offerId,
      quantity: quantity,
      unit_price: unitPrice,
      shipping: shipping,
      total: total,
      status: 'placed',
    })
    .select()
    .single();

  if (error) {
    console.error('[Tool: placeOrder] Error:', error);
    throw error;
  }

  // Update offer to accepted
  await supabase.from('offers').update({ status: 'accepted' }).eq('id', offerId);

  console.log(`[Tool: placeOrder] Order successfully placed! Total: £${total} (Qty: ${quantity} pcs)`);
  return data;
}
