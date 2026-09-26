-- 001_schema.sql: Supabase Schema for Counter Shopping Bot

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- Drop existing tables if needed (in reverse dependency order)
drop table if exists orders cascade;
drop table if exists actions cascade;
drop table if exists offers cascade;
drop table if exists suppliers cascade;
drop table if exists demands cascade;
drop table if exists mandates cascade;
drop table if exists shop_history cascade;
drop table if exists shops cascade;

-- Table 1: shops
create table shops (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  channel text not null default 'Depop',
  currency text not null default 'GBP',
  created_at timestamp with time zone default now()
);

-- Table 2: shop_history
create table shop_history (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  category text not null,
  size text not null,
  grade text not null,
  sold_price numeric not null,
  days_to_sell int not null,
  outcome text not null check (outcome in ('sold', 'returned', 'unsold')),
  created_at timestamp with time zone default now()
);

-- Table 3: mandates
create table mandates (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  max_landed_price numeric not null default 18.00,
  min_waist int not null default 28,
  max_waist int not null default 32,
  not_as_described_limit int not null default 2,
  ask_conditions jsonb not null default '["grade_mismatch", "price_over_cap"]'::jsonb,
  rules_sentences jsonb not null,
  created_at timestamp with time zone default now()
);

-- Table 4: demands
create table demands (
  id uuid primary key default gen_random_uuid(),
  shop_id uuid references shops(id) on delete cascade,
  raw_message text not null,
  quantity int not null,
  category text not null,
  grade text not null,
  sizes text not null,
  max_unit_price numeric not null,
  budget numeric not null,
  status text not null default 'open' check (status in ('open', 'processing', 'completed')),
  created_at timestamp with time zone default now()
);

-- Table 5: suppliers
create table suppliers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  not_as_described_count int not null default 0,
  typical_ship_days int not null default 7,
  is_live boolean not null default false,
  created_at timestamp with time zone default now()
);

-- Table 6: offers
create table offers (
  id uuid primary key default gen_random_uuid(),
  demand_id uuid references demands(id) on delete cascade,
  supplier_id uuid references suppliers(id) on delete cascade,
  claimed_grade text not null,
  seen_grade text,
  seen_grade_reason text,
  damage_markers jsonb default '[]'::jsonb,
  unit_price numeric not null,
  shipping numeric not null,
  ship_days int not null,
  quantity int not null,
  photo_urls text[] not null default '{}',
  status text not null default 'open' check (status in ('open', 'countered', 'accepted', 'refused', 'asked')),
  created_at timestamp with time zone default now()
);

-- Table 7: actions (Trust Ledger)
create table actions (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete cascade,
  action text not null check (action in ('buy', 'counter', 'refuse', 'ask')),
  rule_cited text not null,
  note text not null,
  created_at timestamp with time zone default now()
);

-- Table 8: orders
create table orders (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid references offers(id) on delete cascade,
  quantity int not null,
  unit_price numeric not null,
  shipping numeric not null,
  total numeric not null,
  status text not null default 'placed' check (status in ('placed', 'declined')),
  shopify_draft_id text,
  created_at timestamp with time zone default now()
);

-- Enable Realtime publication for key tables
alter publication supabase_realtime add table demands;
alter publication supabase_realtime add table offers;
alter publication supabase_realtime add table actions;
alter publication supabase_realtime add table orders;
