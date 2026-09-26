# Backend Workspace (Hacker 2)

This directory is the **isolated workspace for Hacker 2**. All database migrations, Grok bot tools, supplier simulations, and vision scripts live strictly in this folder.

Refer to:
* Implementation details: [../HACKER_2_PLAN.md](file:///Users/prakashverma/src/shopping-bot/HACKER_2_PLAN.md)
* Shared Data Contract: [../CONTRACT.md](file:///Users/prakashverma/src/shopping-bot/CONTRACT.md)

---

## Workspace Rules (Zero Merge Conflicts)
1. **Never edit files outside of `backend/`**.
2. Put all database scripts, agent tools, and vision pipelines here.
3. Manage your own dependencies (`package.json` or `pyproject.toml`) and `.env` inside this directory.

---

## Suggested Structure
```
backend/
├── migrations/
│   ├── 001_schema.sql              # The 8 Supabase tables from CONTRACT.md
│   └── 002_seed.sql                # Seed shop history, mandate, and 4 suppliers
├── scripts/
│   └── simulate_suppliers.ts       # Timed insertion of fixture offers (A, B, C)
├── src/
│   ├── agent/
│   │   ├── buyer_bot.ts            # Grok Buyer Bot definition & loop
│   │   └── tools.ts                # create_demand, list_offers, decide, place_order
│   ├── vision/
│   │   └── inspect_photos.ts       # Image defect detection & coordinates
│   └── suppliers/
│       └── live_supplier.ts        # Supplier D live responder
├── package.json
└── .env                            # SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, XAI_API_KEY
```
