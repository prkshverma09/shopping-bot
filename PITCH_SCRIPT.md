# Counter: Live Presentation & Judge Pitch Script

> **Product**: Counter — Autonomous Wholesale Sourcing for Vintage Resellers  
> **Target Audience**: Hackathon Judges, Angel Investors, Reseller Communities  
> **Demo Duration**: 2–3 Minutes  

---

## 🎯 The 30-Second Hook (Problem)

> "Independent vintage clothing resellers spend 15 to 20 hours a week haggling with wholesale suppliers across WhatsApp, Instagram, and dusty spreadsheets. 
> 
> When buying £500 to £1,000 wholesale bales of vintage Levi's 501s, they face two massive risks:
> 1. **Defective Stock**: Wholesalers claim 'Grade A', but send jeans with ripped crotches and frayed hems that won't sell.
> 2. **Margin Squeeze**: Hidden shipping fees and over-cap prices kill their Depop/eBay profit margins.
> 
> Today, we're introducing **Counter** — the autonomous B2B buying bot that negotiates, grades, and buys wholesale inventory according to the reseller's strict mandate."

---

## 🚀 Live Demo Walkthrough (Minute 1:00 – 2:00)

### 1. Mandate & Demand Input (0:00 - 0:30)
* **What you say**:
  > *"Every reseller sets a standing mandate: Max landed price £18, waist sizes 28–32, and refuse suppliers with a track record of inaccurate descriptions.*
  > 
  > *Watch what happens when I type a casual demand prompt into Counter:"*
* **What you do**:
  * Highlight the **Mandate Bar** at the top.
  * Click **[Send Demand]** with the prefilled prompt:
    > *"I need about 40 Grade A Levi's 501s, waist 28-32, under £18 landed, the kind that sells in my shop. Budget £600. Only ping me if the grade looks wrong or the price breaks the cap."*

---

### 2. Autonomous Evaluation & 4 Supplier Scenarios (0:30 - 1:30)
* **What you say**:
  > *"Counter immediately broadcasts the demand to wholesale supplier agents and evaluates their offers in real-time across four distinct scenarios:"*

1. 🔴 **Supplier A (Cheap Wholesale) — Autonomous Refusal**:
   > *"Supplier A looks cheap at £12/pc, but Counter checks their trust record, sees 2 previous 'not-as-described' orders and a 28-day ship time, and **instantly refuses them**."*

2. 🟡 **Supplier C (Bulk Garments Ltd) — Computer Vision & Autonomous Counteroffer**:
   > *"Supplier C claims 'Grade A' for £16/pc. Counter runs our computer vision pipeline over the bundle photos, detects 3 frayed hems and pocket tears, downgrades the lot to Grade B, and **autonomously negotiates a £14/pc counteroffer** — saving £40."*

3. 🟢 **Supplier D (Euro Vintage Hub - Live) — 0-Click Autonomous Buy**:
   > *"Supplier D's agent responds live with clean Grade A stock at £17 landed. Because every rule passes, Counter **buys the 20 pieces autonomously with 0 human clicks**."*

4. 🔵 **Supplier B (Premium Denim Lot) — 1-Tap Decision Card**:
   > *"Supplier B has immaculate Grade A stock, but at £20 landed, it's £2 over our £18 cap. Counter doesn't blindly buy or discard it — it surfaces an interactive **Decision Card** explaining the exact overage."*
* **What you do**:
  * Tap **[Approve & Buy]** on the Decision Card modal.

---

### 3. Closing Receipt & Trust Ledger (1:30 - 2:00)
* **What you say**:
  > *"Look at the final result:
  > * **40 pieces secured** across two verified suppliers.
  > * **£320 in defective stock avoided** by filtering out bad suppliers.
  > * **£40 in discounts negotiated** via computer vision photo audits.
  > * Full cryptographic **Trust Ledger** showing every single autonomous decision."*

---

## 💡 How to Answer Judge Questions (Q&A Cheat Sheet)

### Q1: "How do supplier APIs and the agent network work?"
> *"We are building for the emerging **Agentic Commerce** standard — where each wholesale supplier has their own quoting agent (or API/webhook), and Counter acts as the autonomous buyer agent.*
> 
> *When a reseller clicks 'Send Demand', Counter broadcasts the request across this wholesale agent network:*
> * **Supplier A**: Responds via API with a £12 quote, but Counter's buyer bot refuses them based on historic failure rate.
> * **Supplier C**: Responds via API with a £16 quote + bale photo. Counter's vision bot catches defects and calls their API back with a £14 counteroffer, which they accept.
> * **Supplier D (Live)**: A dynamic supplier agent actively listening to demand broadcasts and submitting quotes in real time.
> * **Supplier B**: Responds via API with a £18 quote, clean but £2 over the price cap, triggering human-in-the-loop approval.*"

### Q2: "How does the Computer Vision photo grading work?"
> *"Our vision engine analyzes supplier bale photos for structural defects — looking at crotches, hems, pocket stitching, and wash wear. If detected flaws conflict with the supplier's claimed grade, Counter automatically recalculates fair market value and sends a discounted counteroffer before the buyer commits any capital."*

### Q3: "What is your business model / monetization?"
> 1. **Take-rate on GMV**: 2–3% transaction fee on wholesale orders processed through Counter.
> 2. **SaaS Subscription**: £29/month for resellers to connect multiple sales channels (Shopify, Depop, eBay) and automate multi-supplier sourcing.
> 3. **Supplier Premium Tools**: Verified supplier badge, instant payment guarantees, and automated quoting bots.

---

## 🛠️ Presenter Pro-Tip (Emergency Hotkey)
If the venue Wi-Fi drops or an external LLM call lags during the live pitch:
* Press **`Shift + D`** to reveal the **Presenter Drawer**.
* You can click the manual simulation buttons to step through Supplier A, C, D, and B instantly.
