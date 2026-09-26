# Frontend Workspace (Hacker 1)

This directory is the **isolated workspace for Hacker 1**. All UI code, styling, and Supabase client listeners live strictly in this folder.

Refer to:
* Implementation details: [../HACKER_1_PLAN.md](file:///Users/prakashverma/src/shopping-bot/HACKER_1_PLAN.md)
* Shared Data Contract: [../CONTRACT.md](file:///Users/prakashverma/src/shopping-bot/CONTRACT.md)

---

## Workspace Rules (Zero Merge Conflicts)
1. **Never edit files outside of `frontend/`**.
2. Put all components, styles, and web assets here.
3. Manage your own `package.json` and `.env.local` inside this directory.

---

## Suggested Structure
```
frontend/
├── src/
│   ├── components/
│   │   ├── MandateBar.tsx          # 4 plain sentences
│   │   ├── DemandInput.tsx         # Pre-filled prompt bar
│   │   ├── OfferCard.tsx           # Incoming supplier offer cards
│   │   ├── MarkedPhoto.tsx         # Image with defect pin/box overlays
│   │   ├── DecisionCard.tsx        # 1-Tap takeover modal (Approve/Decline)
│   │   ├── TrustLedger.tsx         # Action rows audit table
│   │   ├── FinalReceipt.tsx        # Total items, spend & money saved
│   │   └── PresenterDrawer.tsx     # Hidden shortcuts (Shift + D)
│   ├── lib/
│   │   └── supabase.ts             # Supabase client & realtime subscriptions
│   ├── App.tsx
│   └── main.tsx
├── public/
├── package.json
├── tailwind.config.js
└── .env.local                      # VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY
```
