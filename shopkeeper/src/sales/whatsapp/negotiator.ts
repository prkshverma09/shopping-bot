import { supabase } from '../../db/supabase.js';
import { Item, RetailNegotiation, NegotiationOutcome } from '../../types.js';

export interface NegotiationResult {
  outcome: NegotiationOutcome;
  responseMessage: string;
  agreedPrice?: number;
  counterPrice?: number;
  reason: string;
}

/**
 * Floor-Guarded Negotiation Engine:
 * Implements strict concession policy:
 * - NEVER sell below item.floor_price.
 * - If offer >= current_price -> Accept immediately.
 * - If offer >= floor_price -> If close to list (within 10%), accept. Else counter at halfway between offer and list.
 * - If offer < floor_price -> Counter strictly at floor_price or refuse if insulting (< 50% of floor).
 */
export async function negotiatePrice(
  item: Item,
  offeredPrice: number,
  buyerChannel: 'whatsapp' | 'agent_storefront' | 'web_chat' = 'whatsapp',
  buyerIdentifier: string = 'customer-whatsapp'
): Promise<NegotiationResult> {
  const floor = Number(item.floor_price);
  const list = Number(item.current_price);
  const offer = Number(offeredPrice);

  let outcome: NegotiationOutcome = 'inquiry';
  let responseMessage = '';
  let agreedPrice: number | undefined;
  let counterPrice: number | undefined;
  let reason = '';

  if (offer >= list) {
    outcome = 'accepted';
    agreedPrice = list;
    reason = 'Offer meets or exceeds current listing price.';
    responseMessage = `Deal! I'll take £${list}. Here's the secure checkout link to claim it before someone else grabs it.`;
  } else if (offer >= floor) {
    const discountPercent = ((list - offer) / list) * 100;
    if (discountPercent <= 12) {
      // Small discount, close deal immediately
      outcome = 'accepted';
      agreedPrice = offer;
      reason = `Offer £${offer} is within 12% concession threshold and above floor £${floor}.`;
      responseMessage = `You've got a deal at £${offer}. Setting it aside for you now!`;
    } else {
      // Counter halfway
      const midPoint = Math.round((offer + list) / 2);
      counterPrice = Math.max(midPoint, Math.ceil(floor));
      outcome = 'countered';
      reason = `Offer £${offer} is above floor £${floor}; countering at concession midpoint £${counterPrice}.`;
      responseMessage = `I can't quite do £${offer} on this pair since it's Grade ${item.grade}, but I can meet you in the middle at £${counterPrice}. Does that work?`;
    }
  } else {
    // Below floor
    if (offer < floor * 0.7) {
      outcome = 'rejected';
      reason = `Offer £${offer} is well below floor £${floor}.`;
      responseMessage = `Sorry, £${offer} is too low for authenticated Grade ${item.grade} denim. Lowest I can let this go for is £${Math.ceil(floor)}.`;
    } else {
      outcome = 'countered';
      counterPrice = Math.ceil(floor);
      reason = `Offer £${offer} is below floor £${floor}; countering at absolute floor.`;
      responseMessage = `That's below our cost margin, but the best bottom price I can offer today is £${counterPrice}.`;
    }
  }

  // Record negotiation event in Supabase
  try {
    await supabase.from('retail_negotiations').insert({
      item_id: item.id.startsWith('mock') ? null : item.id,
      channel: buyerChannel,
      buyer_identifier: buyerIdentifier,
      buyer_message: `Offer: £${offer}`,
      offer_amount: offer,
      counter_amount: counterPrice,
      outcome: outcome,
      reasoning: reason,
    });
  } catch (err) {
    // Non-blocking log
  }

  return {
    outcome,
    responseMessage,
    agreedPrice,
    counterPrice,
    reason,
  };
}
