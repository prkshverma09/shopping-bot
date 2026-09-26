# 👖 Counter — Autonomous Wholesale Sourcing Bot

> Autonomous wholesale shopping bot for vintage resellers (Levi's 501s). Sets standing purchase mandates, audits defect photos via Computer Vision, negotiates counteroffers, and buys autonomously inside margin caps.

---

## 🏗️ Architecture & Stack

* **Frontend (`/frontend`)**: React 18, Vite, Tailwind CSS, Lucide Icons, Supabase / PostgREST Client.
* **Backend (`/backend`)**: Node.js, TypeScript (`tsx`), OpenAI (`gpt-4o-mini` LLM extraction & Vision photo inspection), Supabase JS Client.
* **Database & API Layer**: PostgreSQL 15 running on port `54322`, PostgREST running on port `3000`.

---

## ⚡ Quick Start & Running the Project

### 1. Prerequisites
* **Node.js** (v20+) & **npm**
* **Docker** (running PostgreSQL and PostgREST containers)
* **OpenAI API Key** (for prompt parameter extraction & vision grading)

---

### 2. Environment Setup

#### Backend (`backend/.env`)
Create `backend/.env` with your Supabase / PostgREST URL and OpenAI key:
```env
SUPABASE_URL=http://127.0.0.1:3000
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImV4cCI6MTk4Mzg3NTIwMH0.ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
```

#### Frontend (`frontend/.env.local`)
Create `frontend/.env.local`:
```env
VITE_SUPABASE_URL=http://127.0.0.1:3000
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4NzUyMDB9.ZXlKaGJHY2lPaUpJVXpJMU5pSXNJblI1Y0NJNklrcFhWQ0o5
```

---

### 3. Start Database Containers

If containers are not already running, start PostgreSQL and PostgREST:
```bash
# PostgreSQL 15 on port 54322
docker run -d --name counter-postgres -e POSTGRES_PASSWORD=postgres -e POSTGRES_DB=postgres -p 54322:5432 postgres:15

# PostgREST on port 3000
docker run -d --name counter-postgrest -e PGRST_DB_URI="postgres://postgres:postgres@host.docker.internal:54322/postgres" -e PGRST_DB_SCHEMAS="public" -e PGRST_DB_ANON_ROLE="postgres" -e PGRST_JWT_SECRET="super-secret-jwt-token-with-at-least-32-characters-long" -p 3000:3000 postgrest/postgrest
```

Seed the database schema & fixtures:
```bash
cd backend
npm install
npm run seed
```

---

### 4. Running the App (Two Terminals)

#### Terminal 1 — Frontend Web App
```bash
cd frontend
npm install
npm run dev
```
* The web app will be available at: **`http://localhost:5173`**

#### Terminal 2 — Backend Buyer Bot Watcher
```bash
cd backend
npm run bot:watch
```
* Watches the database for incoming demand broadcasts, streams supplier quotes, executes computer vision photo audits, and handles autonomous buying.

---

## 🧪 Testing the End-to-End User Flow

1. Open your browser at **`http://localhost:5173`**.
2. Review the top **Mandate Bar** (Max landed price: £18, Waist 28–32, max 2 bad orders).
3. Click **[Send Demand]** with the natural language prompt:
   > *"I need about 40 Grade A Levi's 501s, waist 28-32, under £18 landed, the kind that sells in my shop. Budget £600. Only ping me if the grade looks wrong or the price breaks the cap."*
4. **Observe the Live 4-Supplier Stream**:
   * 🔴 **Supplier A (Cheap Wholesale)**: **Refused** autonomously (2 not-as-described orders on record, 28-day ship window).
   * 🟡 **Supplier C (Bulk Garments Ltd)**: **Counteroffer Sent** (Computer Vision detects 3 frayed hems on photo; lot downgraded to Grade B; countered at £14/pc).
   * 🟢 **Supplier D (Euro Vintage Hub - Live)**: **Bought Autonomously** with 0 clicks (£17 landed is under the £18 cap).
   * 🔵 **Supplier B (Premium Denim Lot)**: **Decision Card Triggered** (£20 landed breaks the £18 cap by £2.00).
5. **Human-in-the-Loop Action**:
   * Click **[Approve & Buy]** on the Decision Card modal for Supplier B.
6. **Review Final Totals**:
   * **40 pieces bought** for **£702 / £740 spend**.
   * **£320 defective stock avoided** on refused lot.
   * **Trust Ledger** displays cryptographic audit trail of all bot actions.

---

## 🕹️ Presenter Controls (Stage Backup)

* Press **`Shift + D`** anywhere in the web app to toggle the hidden **Presenter Drawer**.
* Allows manual step-through of Supplier A, C, D, and B simulation events or one-click demo state reset.

---

## 📂 Project Structure

```
shopping-bot/
├── backend/
│   ├── src/
│   │   ├── agent/
│   │   │   ├── buyer_bot.ts       # Autonomous evaluation engine & watch service
│   │   │   └── tools.ts           # Tools: createDemand, listOffers, recordGrade, decide, placeOrder
│   │   ├── suppliers/
│   │   │   └── live_supplier.ts   # Live Supplier D dynamic agent
│   │   └── vision/
│   │       └── inspect_photos.ts  # OpenAI Vision / photo defect grader
│   └── scripts/
│       ├── run_demo.ts            # CLI demo runner
│       ├── seed_db.ts             # Database seeder
│       └── simulate_suppliers.ts  # Supplier stream simulation
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── DecisionCard.tsx   # 1-Tap Buyer approval modal
│   │   │   ├── DemandInput.tsx    # Sourcing prompt input
│   │   │   ├── FinalReceipt.tsx   # Closing receipt & financial totals
│   │   │   ├── MandateBar.tsx     # Standing purchase rules bar
│   │   │   ├── MarkedPhoto.tsx    # Photo container with SVG defect rings
│   │   │   ├── OfferCard.tsx      # Supplier offer card
│   │   │   ├── PresenterDrawer.tsx# Stage emergency drawer (Shift+D)
│   │   │   └── TrustLedger.tsx    # Transparent action audit log
│   │   └── lib/
│   │       ├── fixtures.ts        # Pinned contract benchmarks
│   │       └── supabase.ts        # Supabase / PostgREST client
├── CONTRACT.md                    # Database schema, figures & event contract
├── PITCH_SCRIPT.md                # 2-Minute live pitch & judge Q&A guide
└── README.md                      # This file
```
