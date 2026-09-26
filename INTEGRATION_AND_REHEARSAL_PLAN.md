# Integration & Rehearsal Plan: 3-Minute Live Demo

**Goal**: Coordinate the merge between Hacker 1 (Frontend) and Hacker 2 (Backend/Agent) to ensure a flawless 3-minute live presentation before the 16:45 code freeze.

**Shared Standards**:
* [CONTRACT.md](file:///Users/prakashverma/src/shopping-bot/CONTRACT.md)
* [HACKER_1_PLAN.md](file:///Users/prakashverma/src/shopping-bot/HACKER_1_PLAN.md)
* [HACKER_2_PLAN.md](file:///Users/prakashverma/src/shopping-bot/HACKER_2_PLAN.md)

---

## 1. Hackathon Timeline & Integration Checkpoints

```mermaid
timeline
    title Saturday Hackathon Schedule (Code Freeze: 16:45)
    10:00 - 10:30 : Lock Contract & Seed Database
    10:30 - 14:00 : Parallel Sprints (Hacker 1 UI / Hacker 2 Agents)
    14:00 - 14:30 : Checkpoint 1 (Static Realtime End-to-End Test)
    14:30 - 15:45 : Live Agent & Vision Integration
    15:45 - 16:15 : Checkpoint 2 (Full Autonomous Run from UI)
    16:15 - 16:45 : Code Freeze & Pitch Rehearsals
    17:15         : 3-Minute Live Stage Demos
```

### Checkpoint 1: Static Realtime Test (14:00)
* **Goal**: Verify Frontend updates automatically when Backend scripts write to Supabase.
* **Test Steps**:
  1. Hacker 2 runs `simulate_suppliers.ts` to insert 4 offers into Supabase.
  2. Hacker 1 confirms all 4 offer cards appear instantly on screen via Realtime.
  3. Hacker 2 manually inserts an `action = 'ask'` row; Hacker 1 verifies Decision Card pops up immediately.
  4. Hacker 1 taps **Approve**; Hacker 2 confirms an `orders` row is created.

### Checkpoint 2: Full Autonomous Run (15:45)
* **Goal**: Test the system with zero manual database tampering.
* **Test Steps**:
  1. Hacker 1 clicks "Send Demand" on the Web UI.
  2. Grok Bot parses the demand, receives supplier offers, checks photos, and executes rules.
  3. Decision Card appears for Supplier B.
  4. Buyer taps Approve.
  5. Final Receipt calculates exact math matching [CONTRACT.md](file:///Users/prakashverma/src/shopping-bot/CONTRACT.md#2-the-4-demo-scenarios-fixtures--figures).

---

## 2. The 3-Minute Pitch Script Rehearsal

Practice this exact timing on stage. One person speaks while the other drives the screen.

| Timestamp | What the Presenter Says | What the Audience Sees on Screen |
| :--- | :--- | :--- |
| **0:00 - 0:30** | *"Vintage resellers spend 20+ hours a week scrolling wholesale lots, guessing condition, and vetting sketchy sellers. Counter is a shopping bot with a point of view. It knows our shop history, follows our mandate, and buys only when the deal is right."* | • 4 Mandate sentences on top of screen.<br>• Reseller prompt entered and sent.<br>• Thread initializes. |
| **0:30 - 1:10** | *"Counter posts our demand to wholesale supplier agents. Four offers arrive with prices, photos, and shipping windows."* | • 4 supplier cards stream in.<br>• Details clearly visible. |
| **1:10 - 1:40** | *"Supplier A is the cheapest. Standard shopping bots would buy it immediately. Counter refuses. Why? Because our ledger remembers this supplier sent two lots that were not as described, and shipping takes 4 weeks."* | • Supplier A card turns red: **REFUSED**.<br>• Reason chip: *"Two not-as-described orders; 28d delivery"*. |
| **1:40 - 2:00** | *"Supplier C claims Grade A. Counter inspects the photos and disagrees. It marks three frayed hems right on the photo, downgrades to Grade B, and counters at £14. Supplier C accepts."* | • Marked photo zooms in with red defect circles.<br>• Offer countered and accepted at £14. |
| **2:00 - 2:30** | *"Supplier D comes in clean: Grade A confirmed, waist sizes 28-32, landed price £17. Every mandate rule passes. Counter buys it autonomously with zero human clicks."* | • Supplier D card turns green: **BOUGHT AUTONOMOUSLY**.<br>• Order receipt created. |
| **2:30 - 2:50** | *"Supplier B has another pristine lot, but it is £2 over our £18 cap. Counter doesn't guess—it presents one decision card with the exact trade-off. One tap to approve."* | • **1-Tap Decision Card** takes over.<br>• Presenter clicks **[Approve & Buy]**.<br>• Order instantly placed. |
| **2:50 - 3:00** | *"Here is the closing receipt: 40 pieces bought, £740 spent, £360 in bad stock and discounts saved. Not a single cart or store dashboard opened."* | • Trust Ledger & Final Receipt displayed with clean totals matching spoken figures. |

---

## 3. Stage Failure & Risk Mitigation Matrix

Hackathon venue Wi-Fi and live LLM endpoints are notoriously unpredictable. Follow these strict fail-safes during the demo:

| Potential Failure | Root Cause | Fallback Strategy |
| :--- | :--- | :--- |
| **Live Supplier D doesn't reply** | LLM timeout or network latency | Use Hacker 1's hidden drawer (`Shift + D`) to click **[Trigger Supplier D Fixture]**. |
| **Vision Model fails or hallucinates damage markers** | Multimodal API lag or prompt drift | Vision inspection uses cached/pinned coordinates for the demo image if API response exceeds 2.5s. |
| **Venue Wi-Fi drops completely** | Network outage | Run local Vite dev server and local Supabase instance (`supabase start`) on localhost. |
| **Calculated receipt doesn't match spoken words** | Dynamic math error | The closing receipt only aggregates rows physically in `orders` and `actions`. Rehearse with fixed seed IDs. |
