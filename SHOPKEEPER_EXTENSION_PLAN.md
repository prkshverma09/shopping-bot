# Implementation Plan: Extending Counter with Shopkeeper (Listing Intake & WhatsApp Selling Agent)

**Document Version:** 1.0  
**Target Project:** `shopping-bot` (Counter) extended with `PRD-shopkeeper.md`  
**Purpose:** Provide an end-to-end, phased technical plan to extend the wholesale purchasing bot (Counter) into a full-cycle resale shop that generates individual retail listings from bought lots and negotiates/sells them over WhatsApp (and simulated bot channels).  
**Status:** Plan Only (No code changes implemented yet).

---

## 1. Executive Summary & Feasibility Assessment

### Can Counter be extended with Shopkeeper?
**Yes, cleanly and synergistically.**

The current Counter implementation solves **Autonomous Wholesale Procurement**:
1. Demand ingestion from reseller.
2. Wholesale supplier evaluation (reputation, shipping, price caps).
3. Vision-based bundle inspection (dissenting grade and damage markers).
4. Autonomous order placement / 1-tap decision approval.
5. Trust ledger and receipt.

`PRD-shopkeeper.md` solves the downstream **Intake, Retail Listing, and Sales** cycle:
1. **Intake Agent:** When an order is placed (or lot purchased), take bundle photos and metadata, break the lot into individual sellable garments (`items`), use Vision LLM to grade, describe, and calculate retail `list_price` and negotiation `floor`.
2. **Shopify & Storefront Sync:** Automatically publish the items as products in Shopify (or local DB storefront).
3. **WhatsApp Sales Agent (Wassist / Twilio / Webhook):** Let prospective human shoppers query inventory over WhatsApp (e.g. *"Got any Grade A Levi's in waist 30?"*), negotiate above the minimum floor price, and convert to sales.
4. **Agent Storefront (Bot-to-Bot):** Expose machine-readable endpoints (`/.well-known/agent-store.json` and REST/MCP) for buying bots to discover, negotiate, and checkout.
5. **Cycle Closure (Cash & P&L):** Margin from retail sales updates shop treasury/cash, completing the loop back into procurement.

---

## 2. Architectural Blueprint

```
                      +------------------------------------------+
                      |         COUNTER (Existing Phase)         |
                      |   Wholesale Demand -> Offers -> Orders   |
                      +--------------------+---------------------+
                                           |
                                           | triggers on order placed
                                           v
                      +------------------------------------------+
                      |       SHOPKEEPER INTAKE EXTENSION        |
                      |    Lot Breakdown & Multimodal Grading    |
                      +--------------------+---------------------+
                                           |
                    +----------------------+----------------------+
                    |                                             |
                    v                                             v
         +--------------------+                        +--------------------+
         |   Shopify Admin    |                        | Supabase `items`   |
         | Draft/Live Product |                        | Cost, Grade, Floor |
         +--------------------+                        +--------------------+
                    |                                             |
                    +----------------------+----------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |          RETAIL SALES CHANNELS           |
                      |  1. WhatsApp Sales Agent (Wassist/Twilio)|
                      |  2. Agent Storefront (REST / MCP)        |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |    Sales & Floor Negotiation Engine     |
                      | Accepts/Counters/Rejects against floor   |
                      +--------------------+---------------------+
                                           |
                                           v
                      +------------------------------------------+
                      |          TREASURY & DECISION LOG         |
                      |      P&L, Capital Recovery, Reorder      |
                      +------------------------------------------+
```

---

## 3. Database Schema Extensions (Supabase)

To support individual item intake, negotiation floors, and WhatsApp/bot sales, the following tables extend the existing schema without breaking existing tables:

### 3.1 New & Enhanced Tables

```sql
-- 1. Extend orders table or reference order_id
-- Existing `orders` table links to wholesale lot purchase.

-- 2. Items table: Individual garments derived from bought lots
create table if not exists items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid references orders(id) on delete cascade,
  shop_id uuid references shops(id),
  shopify_product_id text,
  title text not null,
  category text not null,               -- e.g. "Levi's 501"
  size text not null,                   -- e.g. "W31 L32"
  grade text not null,                  -- e.g. "A", "B+"
  flaws jsonb default '[]'::jsonb,       -- e.g. ["minor pocket fade"]
  cost_basis numeric not null,          -- unit landed price from wholesale order
  list_price numeric not null,          -- target retail listing price
  floor_price numeric not null,         -- minimum acceptable counter price
  current_price numeric not null,       -- live asking price
  photo_urls text[] not null,
  status text not null default 'listed' check (status in ('listed', 'reserved', 'sold')),
  days_on_shelf int not null default 0,
  created_at timestamp with time zone default now()
);

-- 3. Retail Offers & Inquiries (WhatsApp & Bot conversations)
create table if not exists retail_negotiations (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id) on delete set null,
  channel text not null check (channel in ('whatsapp', 'agent_storefront', 'web_chat')),
  buyer_identifier text not null,        -- WhatsApp phone number or Bot Agent ID
  buyer_message text,
  offer_amount numeric,
  counter_amount numeric,
  outcome text not null check (outcome in ('inquiry', 'countered', 'accepted', 'rejected', 'sold')),
  reasoning text not null,
  created_at timestamp with time zone default now()
);

-- 4. Retail Sales (Completed customer transactions)
create table if not exists retail_sales (
  id uuid primary key default gen_random_uuid(),
  item_id uuid references items(id),
  channel text not null,
  sale_price numeric not null,
  gross_profit numeric not null,         -- sale_price - cost_basis
  buyer_identifier text not null,
  payment_reference text,
  created_at timestamp with time zone default now()
);
```

---

## 4. Phase-by-Phase Implementation Plan

### Phase 1: Intake & Multimodal Item Listing Engine
**Goal:** Automatically break down purchased lots into individual product listings with vision-generated copy, grades, list prices, and hidden floors.

1. **Lot Intake Pipeline (`backend/src/intake/`):**
   - Hook into `placeOrder(offerId)` in `backend/src/agent/tools.ts`.
   - When an order is placed (e.g. 20 pairs of 501s from Supplier D or Supplier B), spawn the `intakeLot` handler.
   - Disaggregate the lot into individual item entries (e.g. 20 individual pairs with varying sizes: W29, W30, W31, W32).
2. **Vision Listing Generator (`backend/src/vision/generate_listing.ts`):**
   - Feed individual piece photo(s) to multimodal model (`gpt-4o-mini`, `gemini-1.5-flash`, or Grok Vision).
   - Structured Output:
     - `title`: e.g., *"Vintage Levi's 501 Straight Leg Denim - W31 L32"*
     - `grade`: `"Grade A"`
     - `flaws`: `["Subtle whiskers fade on thigh", "No fraying on hems"]`
     - `suggested_retail_price`: e.g. `£45.00`
   - Calculate Pricing Bounds:
     - Cost Basis = `order.unit_price + (order.shipping / order.quantity)` (e.g. `£17.00`).
     - List Price = `£42.00` (aiming for ~60% margin).
     - Floor Price = `Cost / (1 - min_margin)` = `£17.00 / (1 - 0.30)` = `£24.28` (or fixed floor e.g. `£25.00`).
3. **Shopify Dev Store Sync (`backend/src/services/shopify.ts`):**
   - Create live/draft product via Shopify Admin REST/GraphQL API.
   - Populate tags, metafields (`floor_price`, `grade`, `source_lot_id`), photos, and inventory count = 1.
   - Store `shopify_product_id` in Supabase `items`.

---

### Phase 2: WhatsApp Sales Agent (Human Selling Channel)
**Goal:** Enable human shoppers on WhatsApp to discover items, get photos/recommendations, negotiate price, and buy.

1. **WhatsApp Messaging Ingestion:**
   - **Option A (Wassist Integration):** Register Shopify webhook and Wassist custom tool that injects the negotiation floor logic into Wassist assistant instructions.
   - **Option B (Twilio WhatsApp Sandbox / Meta Cloud API):** Provide an independent lightweight Node service (`backend/src/whatsapp/`) that listens to inbound WhatsApp webhooks.
2. **Negotiation Bot Prompt & Policy:**
   - System prompt instructions:
     - "You are the shop assistant for Vintage Threads London."
     - "Recommend available items from the catalog."
     - "You can negotiate discounts, but NEVER sell an item below its `floor_price` (£XX.XX)."
     - "If a customer offers below the floor, politely decline or counter at the floor with justification (e.g. 'Grade A vintage denim in high demand')."
     - "If an offer is above the floor, accept and provide the checkout link."
3. **Audit Trail Recording:**
   - Every WhatsApp inquiry, customer offer, bot counter, and checkout agreement writes to `retail_negotiations` and logs an entry to the Trust Ledger.

---

### Phase 3: Agent Storefront (Bot-to-Bot Selling Channel)
**Goal:** Allow other AI buying agents (like Counter bots or Grok bots) to search catalog, negotiate, and checkout via API.

1. **Discovery Endpoint (`/.well-known/agent-store.json`):**
   - Serve manifest defining the shop's categories, currency (`GBP`), shipping policies, and available API/MCP endpoints.
2. **Storefront API / MCP Server (`backend/src/storefront/`):**
   - `search_catalog(query, size, category, min_grade)`: Returns listed inventory with grades, photos, and list prices.
   - `get_item(itemId)`: Returns comprehensive product specifications and grade card.
   - `make_offer(itemId, offerPrice, agentId)`:
     - If `offerPrice >= current_price`: Accept immediately.
     - If `offerPrice >= floor_price`: Accept or counter at mid-point with rationale.
     - If `offerPrice < floor_price`: Reject or counter at `floor_price`.
   - `checkout(itemId, buyerInfo, paymentMethod)`:
     - Marks item `status = 'sold'`.
     - Creates `retail_sales` record.
     - Decrements Shopify stock.

---

### Phase 4: Frontend UI Extensions (Owner Console & Dual Channel View)
**Goal:** Enhance the single-screen demo dashboard so the judges can watch the procurement turn into retail sales in real-time.

1. **Two-Tier Dashboard Split:**
   - **Top / Left Pane:** Counter Wholesale Procurement (The existing 4 supplier cards, photo inspection, and decision card).
   - **Bottom / Right Pane:** Shopkeeper Retail Inventory & Live Sales Feed:
     - **Live Storefront Grid:** Shows newly listed items appearing live as orders are placed.
     - **WhatsApp / Bot Negotiation Terminal:** Shows the live chat bubble:
       - Customer: *"Can you do £32 for the W31 501s?"*
       - Bot: *"I can do £36 for Grade A condition."*
       - Customer: *"Deal!"* -> Status: **SOLD (£36.00)**.
2. **Unified P&L & Cash Card:**
   - Total Wholesale Sourcing Spend: `-£740.00`
   - Total Retail Revenue: `+£180.00` (e.g. first 4 items sold)
   - Realized Gross Margin: `52%`
   - Available Sourcing Capital Recharged: `£440.00`

---

## 5. Demo Script Integration (The 3-Minute Hackathon Demo)

The existing 3-minute pitch can smoothly absorb this extension without losing punch:

| Time | Current Counter Flow | Shopkeeper Extension Overlay |
| :--- | :--- | :--- |
| **0:00 - 1:00** | Reseller states demand -> Counter evaluates 4 wholesale suppliers. | Unchanged. |
| **1:00 - 2:00** | Photo inspection dissent on Supplier C -> Autonomous buy on Supplier D. | As soon as Supplier D is bought, the console shows **"Auto-Intake Triggered: 20 Items Cataloged & Pushed to Store"**. |
| **2:00 - 2:30** | Decision card approved for Supplier B. | 20 more items cataloged. Total inventory: 40 pcs live. |
| **2:30 - 2:50** | Final procurement receipt displayed. | **Live Selling Demonstration:**<br>1. WhatsApp customer offers £30 for item #1; bot counters £35 and customer accepts.<br>2. A buying bot hits the Agent Storefront, offers £38 for item #2 and checks out.<br>Both sales register on screen in real time. |
| **2:50 - 3:00** | Closing: "0 store checkouts opened." | Closing: *"From raw wholesale prompt, to AI grading and purchase, to AI listing, to selling over WhatsApp and agent APIs—a complete self-operating resale business."* |

---

## 6. Implementation Task Breakdown & Time Estimates

| Task ID | Component | Description | Est. Time | Priority |
| :--- | :--- | :--- | :--- | :--- |
| **T-1** | Database Migration | Add `items`, `retail_negotiations`, and `retail_sales` tables with Supabase realtime enabled. | 25 min | P0 |
| **T-2** | Intake Service | Build `intake_lot.ts` to transform an `orders` row into discrete `items` records with cost basis. | 35 min | P0 |
| **T-3** | Multimodal Listing Generator | Vision prompt to generate title, grade badge, flaws list, suggested list price, and calculated floor. | 45 min | P0 |
| **T-4** | Negotiation Engine | Core function `evaluateRetailOffer(itemId, offerPrice)` applying margin floor constraints. | 30 min | P0 |
| **T-5** | WhatsApp Bot Webhook | Twilio/Wassist webhook handler to process incoming messages and conduct negotiations. | 45 min | P0 |
| **T-6** | Agent Storefront API | JSON discovery endpoint + `search_catalog` & `make_offer` REST endpoints. | 30 min | P1 |
| **T-7** | Frontend Sales Stream | Add live WhatsApp negotiation widget & inventory ticker to `frontend/src/App.tsx`. | 45 min | P0 |
| **T-8** | Demo Simulator Script | `simulate_sales.ts` to trigger realistic human & bot purchases for smooth live pitching. | 25 min | P0 |

---

## 7. Key Trade-offs & Hackathon Safeguards

1. **Avoid Physical Reality Hurdles:** Intake operates on the supplier's bundle photos or pre-seeded individual item photos.
2. **Shopify Rate Limits & Credentials:** Keep Supabase as the source of truth for the live UI. Push to Shopify asynchronously so API latency never freezes the demo.
3. **WhatsApp Sandbox Fallback:** Always pair the live WhatsApp phone webhook with a simulation script (`npm run demo:sale`) in case venue cellular coverage or WhatsApp webhook delivery experiences lag.
4. **Negotiation Floor Inviolability:** The floor logic is deterministic math (`cost_basis / (1 - min_margin)`), not an unconstrained LLM guess, preventing hallucinations where items are sold at a loss.
