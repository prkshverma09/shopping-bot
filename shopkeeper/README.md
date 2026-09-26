# Shopkeeper: Autonomous Secondhand Shop Engine

`shopkeeper` implements the downstream resale capabilities defined in `PRD-shopkeeper.md` in a completely standalone, isolated package without modifying the Counter wholesale bot codebase (`backend/` or `frontend/`).

---

## 1. What Shopkeeper Does

1. **Autonomous Wholesale Intake (`src/intake/`):**
   - Disaggregates wholesale orders/lots into individual retail items.
   - Generates authentic vintage titles, descriptions, verified grades, and flaw observations using LLM / Multimodal AI.
   - Computes target **list prices** (~55% gross margin) and secret **negotiation floors** (~30% minimum margin).
2. **WhatsApp Human Sales Bot (`src/sales/whatsapp/`):**
   - Ingests customer inquiries and matches them against active inventory.
   - Negotiates offers using a strict floor-bound policy:
     - Rejects or counters low-balls below `floor_price`.
     - Meets in the middle for reasonable offers.
     - Accepts offers within concession threshold.
3. **Machine-Readable Agent Storefront (`src/sales/storefront/`):**
   - Publishes `/.well-known/agent-store.json` discovery manifest.
   - Exposes tools (`search_catalog`, `make_offer`, `agentCheckout`) for external buying bots.
4. **Decision & Sales Ledger (`src/db/schema.sql`):**
   - Tables: `items`, `retail_negotiations`, `retail_sales`.

---

## 2. Running Standalone Demonstrations

All scripts run out-of-the-box in isolation from the `shopkeeper/` directory:

```bash
cd shopkeeper

# 1. Simulate Wholesale Lot Intake (breaks lot into graded, priced retail pieces)
npm run simulate:intake

# 2. Simulate WhatsApp Customer Negotiation (inquiry -> low-ball reject -> counter -> accept)
npm run simulate:whatsapp

# 3. Simulate Machine-to-Machine Agent Storefront (agent discovery -> search -> offer -> checkout)
npm run simulate:storefront

# 4. Simulate Complete Full-Cycle Demo (Wholesale Lot -> Intake -> Human WhatsApp Sale -> Bot Sale)
npm run simulate:cycle
```

---

## 3. Database Schema

The database migration is located at [`src/db/schema.sql`](file:///Users/prakashverma/src/shopping-bot/shopkeeper/src/db/schema.sql). When ready to integrate with a live Supabase instance, execute this migration. In the meantime, all scripts function with automatic resilient fallbacks for offline demoing.
