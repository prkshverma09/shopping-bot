export type ItemGrade = 'A+' | 'A' | 'B' | 'C';
export type ItemStatus = 'listed' | 'reserved' | 'sold';
export type ChannelType = 'whatsapp' | 'agent_storefront' | 'web_chat';
export type NegotiationOutcome = 'inquiry' | 'countered' | 'accepted' | 'rejected' | 'sold';

export interface Item {
  id: string;
  order_id?: string;
  shop_id?: string;
  shopify_product_id?: string;
  title: string;
  category: string;
  size: string;
  grade: ItemGrade;
  flaws: string[];
  cost_basis: number;
  list_price: number;
  floor_price: number;
  current_price: number;
  photo_urls: string[];
  status: ItemStatus;
  days_on_shelf: number;
  created_at?: string;
}

export interface RetailNegotiation {
  id?: string;
  item_id?: string;
  channel: ChannelType;
  buyer_identifier: string;
  buyer_message: string;
  offer_amount?: number;
  counter_amount?: number;
  outcome: NegotiationOutcome;
  reasoning: string;
  created_at?: string;
}

export interface RetailSale {
  id?: string;
  item_id: string;
  channel: ChannelType;
  sale_price: number;
  cost_basis: number;
  gross_profit: number;
  buyer_identifier: string;
  payment_reference?: string;
  created_at?: string;
}

export interface WholesaleLotInput {
  order_id: string;
  quantity: number;
  unit_cost: number;
  shipping_cost: number;
  category: string;
  grade: string;
  photo_urls: string[];
}
