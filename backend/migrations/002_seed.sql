-- 002_seed.sql: Seed Data for Counter Shopping Bot

-- Seed Shop
insert into shops (id, name, channel, currency)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  'Vintage Threads London',
  'Depop',
  'GBP'
) on conflict (id) do nothing;

-- Seed Shop History (Demonstrating why W28-W32 is the mandate)
insert into shop_history (shop_id, category, size, grade, sold_price, days_to_sell, outcome) values
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W28 L30', 'A', 45.00, 3, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W29 L32', 'A', 48.00, 4, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W30 L32', 'A', 50.00, 2, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W30 L30', 'A', 45.00, 5, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W31 L32', 'A', 45.00, 6, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W32 L32', 'A', 52.00, 3, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W32 L34', 'A', 48.00, 7, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W30 L32', 'B', 35.00, 12, 'sold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W36 L32', 'A', 30.00, 65, 'unsold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W38 L30', 'A', 28.00, 80, 'unsold'),
('a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11', 'Levi''s 501', 'W40 L32', 'B', 25.00, 95, 'returned');

-- Seed Mandate
insert into mandates (shop_id, max_landed_price, min_waist, max_waist, not_as_described_limit, ask_conditions, rules_sentences)
values (
  'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  18.00,
  28,
  32,
  2,
  '["grade_mismatch", "price_over_cap"]'::jsonb,
  '[
    "Landed price at or under £18 per piece.",
    "Waist sizes 28-32 only. Those sizes sell in this shop.",
    "Refuse a supplier whose recent orders were not as described twice.",
    "Ask the buyer when the photo grade disagrees with the claimed grade, or when the price breaks £18. Otherwise buy."
  ]'::jsonb
);

-- Seed Suppliers
insert into suppliers (id, name, not_as_described_count, typical_ship_days, is_live) values
('11111111-1111-1111-1111-111111111111', 'Supplier A (Cheap Wholesale)', 2, 28, false),
('22222222-2222-2222-2222-222222222222', 'Supplier B (Premium Denim Lot)', 0, 5, false),
('33333333-3333-3333-3333-333333333333', 'Supplier C (Bulk Garments Ltd)', 0, 7, false),
('44444444-4444-4444-4444-444444444444', 'Supplier D (Euro Vintage Hub - Live)', 0, 5, true)
on conflict (id) do nothing;
