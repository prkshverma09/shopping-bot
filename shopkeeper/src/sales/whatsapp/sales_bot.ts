import { supabase } from '../../db/supabase.js';
import { Item, RetailSale } from '../../types.js';
import { negotiatePrice, NegotiationResult } from './negotiator.js';
import { openai, DEFAULT_MODEL } from '../../intake/ai_client.js';

export interface WhatsAppInboundMessage {
  fromPhone: string;
  body: string;
  fallbackItems?: Item[];
}

export interface WhatsAppAgentReply {
  replyText: string;
  matchedItem?: Item;
  negotiation?: NegotiationResult;
}

/**
 * Handles incoming customer messages from WhatsApp:
 * 1. Categorizes intent (search, inspect, negotiate, checkout).
 * 2. Matches items in inventory.
 * 3. Applies floor-guarded negotiation if price is mentioned.
 */
export async function handleWhatsAppMessage(msg: WhatsAppInboundMessage): Promise<WhatsAppAgentReply> {
  const { fromPhone, body } = msg;

  // 1. Fetch available listed inventory
  let inventory: Item[] = msg.fallbackItems || [];

  try {
    const { data: items } = await supabase
      .from('items')
      .select('*')
      .eq('status', 'listed')
      .order('created_at', { ascending: false })
      .limit(10);

    if (items && items.length > 0) {
      inventory = items as Item[];
    }
  } catch (err) {
    // quiet fallback
  }

  // 2. Check for explicit price offer e.g. "£30", "30 pounds", "can you do 35"
  const priceMatch = body.match(/(?:£|\$|pounds|for\s+)(\d+(\.\d{2})?)/i) || body.match(/\b(\d{2})\b/);
  const offeredAmount = priceMatch ? parseFloat(priceMatch[1]) : null;

  // Find most relevant item in stock (e.g. matching size or first available)
  let matchedItem = inventory[0];
  const sizeMatch = body.match(/(\d{2})/);
  if (sizeMatch && inventory.length > 0) {
    const requestedWaist = sizeMatch[1];
    const found = inventory.find(i => i.size.includes(`W${requestedWaist}`));
    if (found) matchedItem = found;
  }

  // If the user made an offer on an item
  if (offeredAmount && matchedItem && offeredAmount <= matchedItem.list_price * 1.5) {
    const negotiation = await negotiatePrice(matchedItem, offeredAmount, 'whatsapp', fromPhone);
    return {
      replyText: negotiation.responseMessage,
      matchedItem,
      negotiation,
    };
  }

  // Fallback to conversational response with inventory recommendation
  if (!openai || inventory.length === 0) {
    if (matchedItem) {
      return {
        replyText: `Hey! Yes, we have ${matchedItem.title} in stock (Grade ${matchedItem.grade}, ${matchedItem.size}) listed at £${matchedItem.current_price}. Interested?`,
        matchedItem,
      };
    }
    return {
      replyText: "Hey! We sell authenticated vintage Levi's 501s and denim. What waist size are you hunting for?",
    };
  }

  try {
    const inventorySummary = inventory
      .map(i => `- ${i.title} (${i.size}, Grade ${i.grade}) at £${i.current_price}`)
      .join('\n');

    const prompt = `You are a friendly, knowledgeable WhatsApp sales assistant for "Vintage Threads London".
Available in-stock inventory:
${inventorySummary}

Customer message: "${body}"

Reply warmly in 1-2 conversational sentences. Suggest a matching piece with price and grade, and ask if they'd like to claim it or make an offer.`;

    const completion = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [{ role: 'user', content: prompt }],
      max_tokens: 150,
    });

    const reply = completion.choices[0]?.message?.content || `Hey! Check out our ${matchedItem?.title || 'denim'} for £${matchedItem?.current_price || 42}!`;

    return {
      replyText: reply,
      matchedItem,
    };
  } catch (err) {
    return {
      replyText: `Hey! We've got ${matchedItem?.title || "Vintage Levi's 501s"} in stock right now for £${matchedItem?.current_price || 42}. Let me know if you want to make an offer!`,
      matchedItem,
    };
  }
}

/**
 * Complete a retail sale on WhatsApp or Storefront
 */
export async function completeRetailSale(
  itemId: string,
  salePrice: number,
  channel: 'whatsapp' | 'agent_storefront' = 'whatsapp',
  buyerIdentifier: string = 'customer-whatsapp'
): Promise<RetailSale> {
  const { data: item } = await supabase
    .from('items')
    .select('*')
    .eq('id', itemId)
    .single();

  const costBasis = Number(item?.cost_basis || 17.0);
  const grossProfit = Number((salePrice - costBasis).toFixed(2));

  // Mark item as sold
  await supabase
    .from('items')
    .update({ status: 'sold' })
    .eq('id', itemId);

  // Record retail sale
  const { data: sale, error } = await supabase
    .from('retail_sales')
    .insert({
      item_id: itemId,
      channel,
      sale_price: salePrice,
      cost_basis: costBasis,
      gross_profit: grossProfit,
      buyer_identifier: buyerIdentifier,
      payment_reference: `sim_pay_${Date.now()}`,
    })
    .select()
    .single();

  if (error) {
    console.error('[Sale Error] Failed to record retail sale:', error);
  } else {
    console.log(`\n🎉 [RETAIL SALE COMPLETED]`);
    console.log(`  Item: ${item?.title || itemId}`);
    console.log(`  Channel: ${channel.toUpperCase()} | Sale Price: £${salePrice} | Gross Profit: £${grossProfit}`);
  }

  return sale || {
    item_id: itemId,
    channel,
    sale_price: salePrice,
    cost_basis: costBasis,
    gross_profit: grossProfit,
    buyer_identifier: buyerIdentifier,
  };
}
