-- Migration: Shopkeeper Retail & Selling Extensions
-- Can be run against Supabase to support the autonomous retail cycle.
-- Compatible with existing Counter tables (`shops`, `orders`, `mandates`).

-- 1. Items table: Individual garments cataloged from purchased lots/orders
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete set null,
  shop_id uuid references shops(id) on delete set null,
  shopify_product_id text,
  title text not null,
  category text not null default 'Vintage Denim',
  size text not null,
  grade text not null default 'A',
  flaws jsonb not null default '[]'::jsonb,
  cost_basis numeric not null default 0.00,
  list_price numeric not null default 0.00,
  floor_price numeric not null default 0.00,
  current_price numeric not null default 0.00,
  photo_urls text[] not null default '{}',
  status text not null default 'listed' check (status in ('listed', 'reserved', 'sold')),
  days_on_shelf int not null default 0,
  created_at timestamp with time zone default now()
);

-- 2. Retail Negotiations (WhatsApp & Bot inquiries, offers, counters)
create table if not exists retail_negotiations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'agent_storefront', 'web_chat')),
  buyer_identifier text not null,
  buyer_message text not null,
  offer_amount numeric,
  counter_amount numeric,
  outcome text not null check (outcome in ('inquiry', 'countered', 'accepted', 'rejected', 'sold')),
  reasoning text not null,
  created_at timestamp with time zone default now()
);

-- 3. Retail Sales (Completed retail checkouts and revenue attribution)
create table if not exists retail_sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'agent_storefront', 'web_chat')),
  sale_price numeric not null,
  cost_basis numeric not null,
  gross_profit numeric not null,
  buyer_identifier text not null,
  payment_reference text,
  created_at timestamp with time zone default now()
);

-- Realtime subscriptions
alter publication supabase_realtime add table items;
alter publication supabase_realtime add table retail_negotiations;
alter publication supabase_realtime add table retail_sales;
