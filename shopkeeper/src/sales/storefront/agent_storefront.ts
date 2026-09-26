import { supabase } from '../../db/supabase.js';
import { Item } from '../../types.js';
import { negotiatePrice, NegotiationResult } from '../whatsapp/negotiator.js';
import { completeRetailSale } from '../whatsapp/sales_bot.js';

export interface AgentStorefrontManifest {
  name: string;
  currency: string;
  categories: string[];
  tools_endpoint: string;
  policies: {
    returns: string;
    shipping: string;
  };
}

/**
 * Discovery manifest for external AI shopping agents
 */
export function getAgentStorefrontManifest(): AgentStorefrontManifest {
  return {
    name: 'Vintage Threads London (Shopkeeper Bot Store)',
    currency: 'GBP',
    categories: ["Levi's 501", 'Vintage Denim', 'Outerwear'],
    tools_endpoint: '/api/agent-store/tools',
    policies: {
      returns: '14-day authentic condition returns accepted',
      shipping: 'Tracked Royal Mail 48, £2.50 or free on 2+ items',
    },
  };
}

/**
 * Agent Storefront Tool 1: search_catalog
 */
export async function searchCatalog(query?: string, size?: string, fallbackItems?: Item[]): Promise<Item[]> {
  let dbQuery = supabase.from('items').select('*').eq('status', 'listed');

  if (size) {
    dbQuery = dbQuery.ilike('size', `%${size}%`);
  }
  if (query) {
    dbQuery = dbQuery.ilike('title', `%${query}%`);
  }

  try {
    const { data, error } = await dbQuery.order('created_at', { ascending: false });
    if (data && data.length > 0) {
      return data as Item[];
    }
  } catch (err) {
    // quiet fallback
  }

  return fallbackItems || [];
}

/**
 * Agent Storefront Tool 2: make_offer (Bot-to-Bot Negotiation)
 */
export async function makeOffer(
  itemOrId: string | Item,
  offeredAmount: number,
  buyerAgentId: string = 'external-grok-bot'
): Promise<NegotiationResult> {
  let item: Item | null = typeof itemOrId === 'object' ? itemOrId : null;

  if (!item) {
    try {
      const { data, error } = await supabase
        .from('items')
        .select('*')
        .eq('id', itemOrId)
        .single();
      if (data) item = data as Item;
    } catch (err) {
      // quiet fallback
    }
  }

  if (!item) {
    throw new Error(`Item not found in catalog.`);
  }

  return await negotiatePrice(item, offeredAmount, 'agent_storefront', buyerAgentId);
}

/**
 * Agent Storefront Tool 3: checkout (Machine Payment Settlement)
 */
export async function agentCheckout(
  itemId: string,
  agreedPrice: number,
  buyerAgentId: string = 'external-grok-bot'
) {
  return await completeRetailSale(itemId, agreedPrice, 'agent_storefront', buyerAgentId);
}
