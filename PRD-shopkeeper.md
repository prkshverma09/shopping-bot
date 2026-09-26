# Shopkeeper: a secondhand shop with no staff

Product requirements document. Version 0.1, 26 September 2026.

Target: Grok Bot Commerce London Hackathon, Saturday 26 September 2026, Fleek HQ. Track: Merchants ("Build a merchant that runs itself").

## TL;DR

Shopkeeper is a resale clothing shop that runs a full trading cycle without a person. The owner gives it capital and a policy: categories, target margin, maximum cost per item, a cash stop-loss. Shopkeeper then buys wholesale lots, grades and prices every item from photos, writes the listings, sells to humans over WhatsApp and to bots over a machine-readable storefront, marks down slow stock, reorders when inventory runs low, and puts the profit back into buying. The owner reads a profit and loss statement and a decision log. The only action the owner takes is changing the policy.

Build scope is one hackathon day (9:35 to 16:45 code freeze) for a team of up to three. The deliverable is a 3-minute live demo showing one complete cycle: capital to stock to sales to more capital.

## Context

### The event

The brief asks what a merchant looks like when bots run it and when bots buy from it. Shopkeeper answers these questions from the brief:

*   How does a merchant sell to a bot rather than a person?
*   What does a storefront look like when the customer is an AI?
*   Can bots discover and transact with other bots?
*   What does customer loyalty mean when your bot chooses where you buy?
*   How do we make autonomous commerce trustworthy and observable?

Judging criteria: technical execution, product thinking, AI leverage and autonomy, commerce innovation, real-world usefulness, UX, demo quality. The top 5 present live for 3 minutes each.

### The judges and partners

The judges are the Fleek team. Fleek sells graded secondhand clothing wholesale to vintage stores and online resellers, and its FleekSort model grades, prices and categorises garments from photos. Fleek's customers are exactly the people Shopkeeper replaces the manual work for, and Shopkeeper buys its stock from a wholesaler like Fleek. A merchant that sources more often, with less labour, is more demand for Fleek.

Wassist (co-host Josh Warwick) puts an AI sales agent on WhatsApp for a Shopify store. Shopkeeper uses Wassist as its human-facing sales channel.

Grok Bot (xAI) is a persistent agent with a browser. Shopkeeper uses it as the sourcing agent that browses supplier catalogues. Stripe Issuing provides the procurement card with spend controls. Supabase is the database and realtime layer. Shopify is the store.

## Problem

A one-person resale shop is six repetitive jobs: sourcing stock, intake (photograph, grade, price, describe), listing across channels, answering customers, marking down slow items, and fulfilment and reordering. Throughput is limited by the owner's hours, not by capital or demand. Most resellers stop growing at the number of items one person can process in a week.

A second problem is arriving now. Grok Bot can shop and pay on the open web as of August 2026, and other agents will follow. Small merchants have no storefront a bot can read, no way to negotiate with a bot, and no way to accept a bot's payment except by hoping the bot can drive their checkout form. The merchant that sells well to bots in 2027 does not exist yet.

## Goals

1.  An owner can open a shop with capital and a policy in one WhatsApp conversation.
2.  Shopkeeper buys a wholesale lot on its own when projected margin meets the policy target, using a card whose limit is the procurement budget.
3.  Shopkeeper grades, prices, describes and publishes every item in the lot without a human.
4.  Shopkeeper sells the same inventory to a human over WhatsApp and to a bot over a machine-readable storefront, negotiating in both channels above a per-item floor.
5.  Shopkeeper marks down slow items and reorders when stock falls below a threshold and cash allows.
6.  Every purchase, price change, sale and reorder is on a decision log, and the owner sees a live profit and loss statement.

## Non-goals

*   Physical handling. Receiving, photographing and shipping real garments is out of scope; intake runs on supplier photos and shipping is simulated.
*   Multi-shop or multi-owner.
*   Tax, accounting exports, returns.
*   Production payments. Stripe test mode and a Shopify development store throughout.
*   Marketplace channels (Vinted, Depop, eBay) as sales outlets. Mentioned as the roadmap, not built.

## Users

*   **Owner:** a reseller or a person with capital who wants a resale shop but not the labour. Sets policy, reads the profit and loss statement.
*   **Human customer:** a shopper who messages the shop on WhatsApp.
*   **Bot customer:** a buying agent (Grok Bot, or a Diba-style agent) that reads the agent storefront, negotiates and pays.
*   **Supplier:** a wholesaler whose catalogue Shopkeeper buys from. In the demo, a seeded supplier store standing in for Fleek.

## Core concepts

*   **Policy.** The owner's standing instructions: categories, target gross margin, maximum cost per item, minimum grade to buy, cash stop-loss, reorder threshold, markdown schedule.
*   **Treasury.** Cash on hand plus a Stripe Issuing virtual card (test mode) whose spending limit is the procurement budget derived from policy and cash.
*   **Lot.** A wholesale purchase: supplier, item count, cost, photos, projected resale value, projected margin.
*   **Item.** One garment from a lot with a cost basis, grade, attributes, price, floor, status and days on shelf.
*   **Floor.** The lowest price Shopkeeper will accept for an item: cost basis divided by (1 minus minimum margin). Hidden from customers.
*   **Channel.** A place the shop sells. Two are built: the WhatsApp channel (Wassist agent, humans) and the agent storefront (machine-readable catalogue, negotiation and checkout for bots).
*   **Agent storefront.** A JSON document at a well-known URL describing the shop, plus an MCP server or REST endpoint with four tools: search_catalog, get_item, make_offer, checkout. A bot can discover, negotiate and pay without a browser.
*   **Decision.** An append-only ledger event with the reasoning. Types: shop_opened, policy_changed, lot_evaluated, lot_bought, item_listed, price_changed, offer_received, offer_countered, sale_completed, reorder_triggered, stop_loss_hit.

## User stories

1.  As an owner, I open a shop on WhatsApp by stating capital, categories, target margin and limits, and I get back a policy card to confirm.
2.  As an owner, I get a WhatsApp message when Shopkeeper buys a lot, with the projected margin and why it chose that lot.
3.  As an owner, I see a live page with cash, inventory, sales, gross margin and the decision log.
4.  As an owner, I change policy by chat ("stop buying jeans", "raise margin target to 45 percent") and the change takes effect on the next decision.
5.  As a human customer, I ask the shop on WhatsApp for what I want, get a recommendation with photos and a grade, make an offer, and pay in the thread.
6.  As a bot customer, I read the agent storefront, search the catalogue, make an offer, receive a counter, and check out with a card, all over the API.
7.  As an owner, when stock runs low and cash allows, Shopkeeper buys again without asking me.

## Functional requirements

P0 is required for the demo. P1 makes the demo stronger. P2 is stretch.

### Owner interface and policy

*   **FR-1 (P0).** Parse an inbound WhatsApp message into a policy with structured output and reply with a policy card for confirmation.
*   **FR-2 (P0).** On confirmation, create the shop record, set cash, and mint the procurement card.
*   **FR-3 (P0).** Send the owner a message on lot_bought and on sale_completed.
*   **FR-4 (P1).** Accept policy changes by chat and write a policy_changed decision.
*   **FR-5 (P1).** Daily digest message: cash, items sold, margin, items marked down. Triggered manually in the demo.

### Treasury

*   **FR-6 (P0).** Create a Stripe Issuing virtual card (test mode) with a spending limit equal to the procurement budget (cash minus stop-loss reserve).
*   **FR-7 (P0).** Record every card authorization as a treasury entry and reduce cash.
*   **FR-8 (P1).** Use the real-time authorization webhook to decline any charge from a merchant that is not the current supplier or that exceeds the lot's approved cost.
*   **FR-9 (P1).** Increase the card limit when a sale settles, so profit becomes procurement budget.

### Sourcing agent

*   **FR-10 (P0).** Fetch available lots from the supplier catalogue. Primary source is a seeded supplier Shopify store with lot photos; Fleek's catalogue is used if access is available on the day.
*   **FR-11 (P0).** For each lot, estimate resale value per item from lot photos with a vision model and from active comparables (eBay Browse API), then compute projected margin.
*   **FR-12 (P0).** Buy the lot with the highest projected margin that meets policy (margin, max cost per item, minimum grade, categories). Write lot_evaluated for each candidate with the reasoning and lot_bought for the winner.
*   **FR-13 (P1).** Run the sourcing step inside a Grok Bot browser task if Grok Bot exposes a programmable trigger. Otherwise run it as a scheduled job calling the Grok API.

### Intake agent

*   **FR-14 (P0).** For each item in a bought lot, send photos to a vision model with a structured schema and receive grade, category, brand, era, size, colour, material, flaws and a price band.
*   **FR-15 (P0).** Set list price from the band and the policy margin. Set floor from cost basis and minimum margin.
*   **FR-16 (P0).** Generate a title, description and tags and create the product in Shopify with photos, price and grade metadata.
*   **FR-17 (P1).** Render a grade card on the product page: grade, flaws, confidence.

### Sales: WhatsApp channel

*   **FR-18 (P0).** A Wassist agent connected to the shop's Shopify store answers product questions and recommends items.
*   **FR-19 (P0).** The agent negotiates with the item's floor as the hidden minimum and completes checkout in the thread.
*   **FR-20 (P1).** Record offers and the sale as decisions with the negotiation transcript summary.

### Sales: agent storefront

*   **FR-21 (P0).** Publish `/.well-known/agent-store.json`: shop name, categories, currency, policies (returns, shipping), and the endpoint for the tools.
*   **FR-22 (P0).** Implement `search_catalog`, `get_item`, `make_offer` and `checkout` as an MCP server (REST fallback). `make_offer` applies the same floor logic as the WhatsApp channel and returns accept, counter or reject with a short reason.
*   **FR-23 (P0).** `checkout` accepts a Stripe test payment method and marks the item sold.
*   **FR-24 (P1).** Rate-limit and identify bot buyers by a self-declared agent id, and keep per-agent history so repeat buyers can be offered better terms (the loyalty answer).

### Pricing engine

*   **FR-25 (P0).** A scheduled job reprices items by days on shelf according to the policy's markdown schedule, never below floor. Write price_changed decisions.
*   **FR-26 (P1).** Use demand signals (WhatsApp asks, offers received, storefront views) to slow or speed markdowns.
*   **FR-27 (P2).** Bundle offers when a bot or human asks about two or more items.

### Operations

*   **FR-28 (P0).** On sale, mark the item sold, update cash, and create a Shopify fulfilment (shipping simulated).
*   **FR-29 (P0).** When sellable stock falls below the reorder threshold and cash minus stop-loss reserve is above the minimum lot cost, trigger the sourcing agent. Write reorder_triggered.
*   **FR-30 (P0).** When cash falls below stop-loss, pause buying and message the owner. Write stop_loss_hit.

### Owner console

*   **FR-31 (P0).** Web page showing cash, inventory count and value at cost, sales, gross margin, and the decision log as a live timeline (Supabase realtime).
*   **FR-32 (P1).** Per-item view: cost basis, grade, price history, offers.

## Non-functional requirements

*   One full cycle (open shop, buy lot, list items, two sales, markdown, reorder armed) runs in under 3 minutes with demo pacing controls (job intervals configurable).
*   Intake of a 10-item lot completes in under 60 seconds, with items appearing one by one.
*   The console updates within 2 seconds of a decision.
*   No real money. Stripe test mode, Shopify development stores, WhatsApp test number.
*   Secrets in environment variables.

## Architecture

```
Owner (WhatsApp) <---> Shopkeeper API (Node service or Next.js route handlers)
                             |
                             |-- Supabase: shops, policies, treasury, lots, items, decisions; realtime
                             |-- Stripe Issuing (test): procurement card, authorization webhook
                             |-- Sourcing agent: Grok Bot browser task or scheduled job
                             |    |-- Supplier store (seeded Shopify dev store; Fleek if available)
                             |    |-- eBay Browse API (comparables)
                             |-- Intake agent: Grok vision, structured output -> Shopify Admin API
                             |-- Pricing engine: scheduled job
                             |-- Ops: Shopify order webhook -> fulfilment, cash update, reorder check
                             |
Human customers <---> Wassist agent (WhatsApp) <---> Shop Shopify store
Bot customers   <---> Agent storefront: /.well-known/agent-store.json + MCP tools + Stripe checkout
Owner console (Next.js + Supabase realtime): P&L, inventory, decision log
```

All components write decisions to one table. The console renders that table. Jobs are independent and communicate through state in the database, so any one can be stubbed or replayed during the demo.

## Stack

| Concern | Choice | Reason |
| :--- | :--- | :--- |
| Owner and human customer interface | WhatsApp: Wassist agent for customers; Wassist SDK or Twilio sandbox for the owner channel | Co-host's product; nothing new to install |
| Store | Shopify development store (shop) and a second one (supplier) | Real catalogue, orders and fulfilment APIs |
| Procurement payments | Stripe Issuing, test mode | Spend controls make the budget a hard limit |
| Customer payments | Shopify checkout (WhatsApp) and Stripe PaymentIntents (agent storefront) | Two channels, two rails, both test mode |
| Database and realtime | Supabase | Sponsor; live decision log |
| Sourcing runtime | Grok Bot browser task (P1), scheduled job with Grok API (P0) | Sponsor; browser handles arbitrary supplier sites |
| Vision and text | Grok models via xAI API | Grading, pricing, listing copy |
| Agent storefront | MCP server (TypeScript SDK), REST fallback | The protocol buying agents already speak |
| Web | Next.js on Vercel | Fast realtime page |
| Repo and tooling | Cursor, Origin | Sponsor |

## Data model

Supabase tables. All have `id uuid` and `created_at timestamptz`.

*   `shops`: owner_phone, name, shopify_domain, cash_pence, status.
*   `policies`: shop_id, categories text[], target_margin numeric, min_margin numeric, max_item_cost_pence, min_grade text, stop_loss_pence, reorder_threshold int, markdown_schedule jsonb, active bool.
*   `treasury_entries`: shop_id, type (capital_in, lot_purchase, sale, fee), amount_pence, reference, balance_after_pence.
*   `cards`: shop_id, stripe_card_id, limit_pence, status.
*   `lots`: shop_id, supplier, external_id, item_count, cost_pence, photos text[], projected_resale_pence, projected_margin numeric, status (evaluated, bought, rejected), reasoning text.
*   `items`: lot_id, shop_id, shopify_product_id, title, attributes jsonb, grade text, flaws jsonb, cost_basis_pence, list_price_pence, floor_pence, current_price_pence, listed_at, status (listed, reserved, sold), days_on_shelf generated.
*   `offers`: item_id, channel (whatsapp, agent), buyer_ref, amount_pence, response (accept, counter, reject), counter_pence, reason.
*   `orders`: item_id, channel, buyer_ref, amount_pence, payment_ref, fulfilment_ref, status.
*   `decisions`: shop_id, type, item_id nullable, lot_id nullable, payload jsonb, reasoning text. Append only.

## Key flows

### 1. Open the shop

1.  Owner: "Open a shop. 500 pounds. Vintage outerwear and denim. 40 percent margin, max 15 pounds per item, stop if cash goes under 100."
2.  Shopkeeper parses to a policy, replies with a card, owner confirms.
3.  Shop created with cash 500 GBP. Card minted with limit 400 GBP (cash minus stop-loss reserve). Decisions: shop_opened.
4.  Sourcing agent starts.

### 2. Source a lot

1.  Sourcing agent fetches lots from the supplier catalogue: three lots with photos, counts and prices.
2.  For each lot: vision model estimates per-item grade and price band from lot photos; eBay Browse comparables refine the band; projected margin computed. Decision lot_evaluated with reasoning for each.
3.  Lot B (10 items, 120 GBP, projected resale 310 GBP, projected margin 61 percent) meets policy and wins. Lot A fails max cost per item; lot C fails minimum grade.
4.  Sourcing agent buys lot B on the supplier store with the procurement card. Stripe authorizes (120 below 400). Treasury updated, cash 380 GBP. Decision lot_bought. Owner messaged.

### 3. Intake and list

1.  For each of the 10 items: photos and any supplier notes go to the vision model with the item schema.
2.  List price set from the band and target margin; floor set from cost basis (12 GBP each) and minimum margin (30 percent): floor 17.15 GBP.
3.  Title, description and tags generated. Product created in Shopify with grade metadata. Decision item_listed.
4.  Items appear on the storefront one by one. Agent storefront catalogue updates from the same table.

### 4. Sell to a human

1.  Customer on WhatsApp: "got any brown Carhartt in M?"
2.  Wassist agent recommends the matching item with photos and grade B+, price 42 GBP.
3.  Customer offers 35. Agent counters 38 (above floor 17.15, within its concession rule). Customer accepts and pays in the thread.
4.  Shopify order webhook fires. Item sold, cash 418 GBP, fulfilment created. Decision sale_completed. Owner messaged.

### 5. Sell to a bot

1.  A buying agent fetches `/.well-known/agent-store.json`, calls `search_catalog("Levi's 501 32")`, gets one item at 36 GBP.
2.  It calls `make_offer(30)`. Shopkeeper counters 33 with reason "above my floor; two similar items sold this week". The agent accepts, calls checkout with a Stripe test payment method.
3.  Item sold, cash 451 GBP. Decision sale_completed with channel agent and the buyer's agent id.

### 6. Reprice and reorder

1.  Pricing job runs. One seeded item with 14 days on shelf and no offers is marked down 15 percent, still above floor. Decision price_changed.
2.  Stock is 8, threshold is 4. No reorder yet; console shows the trigger armed. In the demo, the threshold is set to 8 during the closing to fire the reorder and show the loop close: reorder_triggered, and the sourcing agent begins evaluating lots again.

## Demo

### Seed data

*   Supplier Shopify development store with three lots: A (8 items, 160 GBP, fails max cost), B (10 items, 120 GBP, wins), C (12 items, 96 GBP, fails minimum grade). Each lot has 6 to 10 photos.
*   Shop Shopify development store, empty at start except one seeded item with days_on_shelf 14 for the markdown moment.
*   Wassist agent on the shop store with a negotiation instruction that reads the floor from product metadata.
*   A buying-agent script that runs the agent storefront flow (search, offer, counter, checkout) on command.
*   Demo WhatsApp numbers for the owner and one customer.

### Three-minute script

*   **0:00 to 0:30.** Presenter as owner sends the opening message on WhatsApp. Policy card returned, confirmed. Console shows cash 500 GBP and a card with a 400 GBP limit.
*   **0:30 to 1:10.** Console decision log: three lots evaluated with one-line reasoning each, lot B bought for 120 GBP. Cash 380 GBP. Owner's phone gets the purchase message.
*   **1:10 to 1:50.** Items appear in the shop one by one with grade cards and generated copy. Show one product page.
*   **1:50 to 2:35.** Split screen. Left: a customer on WhatsApp asks for a brown Carhartt in M, negotiates from 42 to 38, pays. Right: the buying-agent script hits the agent storefront, offers 30, is countered 33, pays. Two sale_completed decisions. Cash 451 GBP.
*   **2:35 to 3:00.** Pricing job marks down the stale item. Presenter lowers the reorder threshold; reorder_triggered fires and the sourcing agent starts a new evaluation. Closing line: the owner sent one message; the shop bought, listed, sold to a person and to a bot, repriced and reordered on its own.

### Fallback

A recorded screen capture of the full flow from the 15:30 rehearsal.

## Success criteria

For the hackathon:

1.  The full cycle runs live with no manual step other than the owner's opening message and the demo's threshold change.
2.  The lot purchase is authorized on the procurement card and reflected in cash.
3.  At least 8 of 10 items are graded, priced and published in Shopify without correction.
4.  One sale to a human over WhatsApp and one sale to a bot over the agent storefront, both above floor.
5.  Purchase and reorder decisions appear on the console with reasoning.

Against the judging criteria:

*   **AI leverage and autonomy:** buying, grading, pricing, writing, negotiating, repricing and reordering with no human, bounded by policy and a card limit.
*   **Commerce innovation:** a merchant with two storefronts, one for people and one for bots, and a floor-based negotiation policy shared across both. Profit turns into procurement budget automatically.
*   **Real-world usefulness:** this is the daily work of Fleek's customers. The pitch line to the judges: every Shopkeeper is a Fleek buyer that never gets tired.
*   **Product thinking:** loyalty becomes per-agent history and terms on the agent storefront. Trust becomes a decision log the owner can read.
*   **UX:** the owner's interface is one WhatsApp thread and one page.
*   **Demo quality:** cash moves, items appear, two negotiations, a markdown and a reorder in three minutes.

## Risks and mitigations

| Risk | Likelihood | Mitigation |
| :--- | :--- | :--- |
| No API access to Fleek's catalogue | High | Seeded supplier Shopify store. Ask the Fleek judges at 9:15; if they can share a catalogue export, load it. |
| Too many moving parts for one day | High | Strict P0 list. Cut order below. Every job can be replayed from seeded state. |
| Wassist agent cannot read a per-item floor or negotiate | Medium | Confirm with Josh Warwick at 9:15. Fall back to a small LLM sales agent on Twilio WhatsApp sandbox that reads the floor from the database. |
| Valuation from photos is off | Medium | Fixed rubric and price bands comparables from eBay Browse; the demo lot is chosen so grades are unambiguous. |
| Grok Bot has no programmable trigger for sourcing | Medium | Scheduled job calling the Grok API against the supplier store's API. Name Grok Bot as the intended runtime. |
| Shopify Admin API rate limits during intake | Low | Create products sequentially with a short delay; it also makes the intake visible. |
| Stripe Issuing test authorizations on a Shopify store | Medium | The supplier store's checkout runs in Shopify test mode with a Stripe test card, and the treasury records the Issuing authorization separately. If wiring the two is slow, record the purchase against the card via a direct Stripe test charge. |

## Scope by time

Team of three. Hacking 9:35 to 16:45.

*   **Person A, sourcing and intake:** supplier store seed, lot fetching, vision valuation and grading, comparables, lot selection, Shopify product creation, listing copy.
*   **Person B, sales channels:** Wassist agent and negotiation instruction, agent storefront JSON and MCP tools, offer logic with floors, Stripe checkout for bots, buying-agent demo script.
*   **Person C, treasury, ops and console:** policy parsing, Stripe Issuing card and webhook, treasury entries, order webhook and fulfilment, pricing job, reorder trigger, console with realtime decision log, owner WhatsApp messages, demo seed and rehearsal.

Timeline:

*   **9:35 to 10:30.** Repo, database schema, two Shopify dev stores, Stripe test account, xAI key, Wassist account. Confirm Wassist capabilities and Fleek catalogue access.
*   **10:30 to 13:30.** P0 in parallel.
*   **13:30 to 15:30.** First end-to-end run on seeded state.
*   **13:30 to 15:30.** P1: grade cards, owner policy changes, per-agent loyalty terms, Grok Bot sourcing.
*   **15:30 to 16:15.** Rehearsal, fallback recording, pitch timing.
*   **16:15 to 16:45.** Freeze. Fix only what broke.

Cut order if behind: bundles (P2), demand-signal pricing, per-agent loyalty terms, Grok Bot browser sourcing (use API job), MCP server (use REST), daily digest.

## Open questions

1.  Can Fleek share a small catalogue export or API access for the day? This changes the demo from "a supplier" to "Fleek".
2.  Does the Wassist agent support reading a per-product floor and a negotiation instruction, and can we drive the owner channel through the same SDK?
3.  Is there an emerging standard for agent storefront discovery we should conform to instead of `/.well-known/agent-store.json`? If a sponsor names one at the briefing, adopt it.
4.  Should profit automatically raise the procurement card limit (FR-9) or wait for the owner's confirmation? Automatic is the stronger autonomy story; owner-gated is the safer product. Default: automatic, with the stop-loss as the safety.
