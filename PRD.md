# Counter



## Summary



Counter is a shopping bot for independent vintage resellers. The buyer states what they need in one message. Counter already knows what sells in their shop, posts that demand to supplier agents, checks bundle photos against the claimed grade, negotiates, and buys only when the purchase fits a standing mandate. If a rule breaks, the buyer gets one decision card and one tap.

This document is the product spec for the Grok Bot Commerce London Hackathon on Saturday 28 September 2024 at Fleek HQ. The Saturday build is a working demo of one demand, four supplier agents, one autonomous buy, one approval, and a ledger. The full product described here is the target the demo has to make believable in three minutes.

## Context



The event asks teams to build a bot that shops for a person, using Cursor, Grok Bots, Origin, and Supabase, on real commerce infrastructure (Shopify and modern commerce APIs). Wassist and Supabase are technology partners. The Fleek team is on the judging panel.

Fleek is a London B2B marketplace for wholesale secondhand fashion. Buyers are vintage stores and online resellers. Suppliers are used-clothing wholesalers. Fleek's own product copy says buyers can make an offer, post a sourcing request and let suppliers compete, and request a video handpick before they commit. Buyer protection covers orders that are cancelled, lost, or significantly not as described.

Judging criteria, from the event page:

* Technical execution


* Product thinking


* AI leverage and autonomy


* Commerce innovation


* Real-world usefulness


* UX


* Demo quality



Code freeze is 16:45. The top five teams demo live for three minutes each from 17:15. Teams are one to three people.

## Problem



A reseller's week is a sourcing job. They scroll bundles, message suppliers, compare grades, and guess which lot will sell in their shop. The listing says Grade A. The photos disagree. A cheaper supplier has been wrong before. Shipping takes four weeks. Doing this well takes hours, and a bad bundle ties up cash.

A shopping bot that searches a catalog and adds the cheapest match makes this worse. It completes the task and skips the judgment. The buyer still has to check every offer, which means the bot did not shop.

Counter shops the way a careful buyer does. It knows the shop, it argues with the listing, and it leaves a record of every offer it refused.

## User



The user is an independent reseller who buys wholesale vintage to resell on Depop, Vinted, Shopify, or in a small shop. They source often, they have a point of view about what sells, and they do not want to operate a dashboard.

Saturday's demo user is a Depop seller of Levi's 501s. Their shop history is seeded. They are not asked to sign up, connect a store, or configure rules during the demo.

## Product



Counter has four parts.

* **Shop history.** Past sales, returns, and unsold stock. On Saturday this is seeded in Supabase. In the full product it is imported from the reseller's Shopify store.


* **Mandate.** Standing rules written in plain language, derived from shop history and edited by the buyer. A mandate includes a max landed price, acceptable sizes, suppliers to avoid, and the cases that require a tap. Landed price means the item price plus shipping.


* **Buyer bot.** Receives a demand, posts it to supplier agents, reads offers, checks photos, counters or walks away, and either buys or asks.


* **Ledger.** Every offer, refusal, counteroffer, grade dissent, and purchase. The buyer can read why Counter acted. The demo shows this ledger. It is the trust surface.



A supplier agent is the other party. It receives a demand and returns photos, a claimed grade, a unit price, a ship window, and a supplier record. On Saturday, four supplier agents are ours. Three reply from fixtures. One replies live.

### The rules the demo mandate contains



The demo buyer's mandate, shown in four sentences:

* Landed price at or under £18 per piece.


* Waist sizes 28-32 only. Those sizes sell in this shop.


* Refuse a supplier whose recent orders were not as described twice.


* Ask the buyer when the photo grade disagrees with the claimed grade, or when the price breaks £18. Otherwise buy.



"Not as described" means the received goods materially missed the listings: wrong grade, wrong category, or damage the photos hid.

### What Counter decides on an offer



For each offer, Counter records:

* Claimed grade and the grade it assigns from the photos.


* Landed unit price against the mandate cap.


* Whether the sizes match what the shop sells.


* Ship window.


* The supplier's not-as-described count in the ledger.


* The action: buy, counter, refuse, or ask.



Actions:

* **Buy.** Every rule passes. Counter places the order and writes the receipt. It does not ask.


* **Counter.** The lot is close, and a lower price or a grade correction would make it fit. Counter sends a counteroffer and waits.


* **Refuse.** A rule fails and a counteroffer would not fix it. Examples: wrong sizes, or a supplier with two not-as-described orders. Counter writes the refusal and moves on.


* **Ask.** The lot is worth buying and one rule needs the buyer. Counter sends a decision card.



## Saturday scope



In scope for code freeze:

* One seeded buyer and one shop history.


* One mandate, visible in plain language.


* One demand, sent in a single message.


* Four supplier agents. Three fixture replies, one live reply.


* Photo check on at least one bundle, with the damage marked on the image.


* One refusal, one counteroffer that is accepted, one autonomous buy, one decision card.


* A ledger row for every action.


* A single screen the buyer watches: the thread, then the decision card.



Out of scope on Saturday:

* Accounts, billing, and a real Fleek or Shopify connection. We do not have Fleek API access for this build.


* A rule editor. The mandate is seeded and shown, not configured live.


* Multi-buyer, multi-shop, and recurring demands.


* Real payment capture. The "buy" writes an order row. If time allows, that order also becomes a draft product in a Shopify dev store.


* Video handpick, returns, and shipping tracking.


* A supplier dashboard. Suppliers are agents, not a second UI.



## Demo script



Runtime is three minutes. All supplier replies except one are seeded, so a stalled live reply does not kill the demo. Speak the lines below; the UI should already be on the matching state.

| Time | What the room sees |
| --- | --- |
| 0:00 | The buyer message: "I need about 40 Grade A Levi's 501s, waist 28-32, under £18 landed, the kind that sells in my shop. Budget £600. Only ping me if the grade looks wrong or the price breaks the cap." The mandate is on screen in four sentences.

 |
| 0:30 | Four supplier threads return photos, claimed grade, unit price, and ship window.

 |
| 1:10 | Supplier A is the cheapest. Counter refuses. The ledger row says the ship window is slow and this supplier has two not-as-described orders.

 |
| 1:40 | Supplier C claims Grade A. Counter marks three damaged pairs on the photo and sends a counteroffer at £14.

 |
| 2:00 | Supplier D pings. The price is inside the cap and the grade now matches, so Counter buys with no tap.

 |
| 2:30 | A second lot is £2 over the cap. The decision card shows claimed grade, seen grade, landed cost, and the rule that fired. The buyer taps once.

 |
| 2:50 | The receipt: money left on the table by the refusal, the grade dissent, and the two orders. The buyer opened no store.

 |

Use fixture numbers that the ledger can add up on stage. Do not invent a savings figure in the UI that the rows do not support.

## Requirements



### Demand



* The buyer can submit a demand as one text message.


* Counter extracts quantity, category, grade, size range, max landed price, and total budget.


* If a field is missing, Counter fills it from the mandate and says what it assumed, in the thread.


* The demand is stored before any supplier is contacted.



### Mandate



* The mandate is stored as structured rules and rendered as plain sentences.


* Every buy, refusal, counteroffer, and ask cites the rule that fired.


* A buy cannot complete if a cited rule failed and the buyer has not tapped.



### Supplier agents



* Each supplier agent accepts a demand and returns one offer: photos, claimed grade, unit price, currency, shipping cost, ship window in days, and available quantity.


* Offers are stored as rows. The buyer bot reads rows. It does not scrape a chat log to decide.


* Three agents return fixtures from Supabase. One agent generates a live reply during the demo.


* A supplier agent can accept, reject, or counter a counteroffer.



### Photo check



* For at least the Grade A offer in the script, Counter inspects the photos and writes a seen grade plus a short reason.


* When the seen grade is worse than the claimed grade, the UI marks the offending region on the image.


* The dissent is a ledger row, tied to the offer.



### Decisions



* Counter chooses buy, counter, refuse, or ask for every offer, and writes the reason.


* A buy inside the mandate creates an order and a receipt with no decision card.


* An ask creates one decision card. Approve places the order. Decline writes a refusal. There is no third state in the demo.


* The buyer never sees a checkout page.



### Ledger and receipt



* The ledger lists every offer and the action taken, in time order.


* Opening a row shows the rule, the numbers, and any photo dissent.


* The closing receipt sums only figures present in the ledger: pieces bought, total spend, offers refused, and counters accepted.



## UX



One screen. Top: the buyer's message and Counter's replies, in a thread. Under that, supplier offers appear as they arrive, each with photo, price, grade, and the action Counter took. The decision card replaces the thread only when Counter asks. After the tap, the thread returns with the receipt.

The mandate is visible from the start, as four sentences, not a settings form.

Copy is short and specific. "Refused. Two not-as-described orders." is the standard. No scores, no percentages the ledger cannot explain, no charts.

The screen must be readable from the back of a demo room: large type, one offer in focus at a time, the marked photo big enough to see the damage.

## Data



Supabase tables:

* `shops`. One row on Saturday. Name, channel (Depop), currency (GBP).


* `shop_history`. Sold, returned, and unsold items. Fields: category, size, grade, sold_price, days_to_sell, outcome ('sold', 'returned', 'unsold').


* `mandates`. Shop id, max landed unit price, size range, not-as-described limit, ask conditions, and the four rendered sentences.


* `demands`. Raw message, parsed quantity, category, grade, sizes, max unit price, budget, status.


* `suppliers`. Name, not-as-described count, typical ship days, live or fixture.


* `offers`. Supplier id, demand id, claimed grade, seen grade, seen grade reason, unit price, shipping, ship days, quantity, photo urls, status ('open', 'countered', 'accepted', 'refused', 'asked').


* `actions`. Offer id, action ('buy', 'counter', 'refuse', 'ask'), rule cited, note, created at.


* `orders`. Offer id, quantity, unit price, shipping, total, status ('placed', 'declined').



Row-level security can be a single demo user. Do not leave the project open to anonymous writes.

## Architecture



The buyer bot is a Grok Bot with a small tool set over Supabase:

* `create_demand`

* `list_offers`

* `record_grade`

* `send_counteroffer`

* `decide` (buy, refuse, or ask)


* `place_order`


Supplier agents write offers through the same database. Fixture agents insert rows when the demo starts. The live agent is a second Grok Bot, or a Wassist agent if that access is ready before lunch. Both paths write the same 'offers' shape. The buyer bot does not care which one replied.

The web app reads Supabase and renders the thread, offers, decision card, and ledger. It does not contain shopping logic. If the bot is slow, the screen still updates from the rows.

Origin hosts the repo. Cursor is the build environment.

Shopify, if reached: on `place_order`, create a draft product in a dev store with the offer's title, price, and photo. Failure to reach Shopify does not block the demo. The order row is the source of truth on Saturday.

## Stack



* Cursor for the build.


* Origin for the git repo.


* Grok Bot for the buyer bot and the live supplier agent.


* Supabase for data, auth, and realtime updates to the screen.


* A small web UI, one page.


* Wassist if a WhatsApp supplier thread is working before lunch. It is a bonus surface, not a dependency.


* Shopify dev store for the optional draft product.



## Risks



* The live supplier reply fails on stage. Mitigation: three fixture agents already carry the refusal, the counteroffer, and the autonomous buy. The live reply is the second lot, the one that asks for a tap. If it does not arrive, trigger that offer from a fixture button off-screen.


* Photo grading is inconsistent between runs. Mitigation: pin the Grade A dissent to one known image and one known prompt. Do not grade a random upload on stage.


* The demo becomes a tour of tables. Mitigation: the presenter follows the script and stays on the thread. The ledger is shown once, at the receipt.


* Wassist setup eats the morning. Mitigation: start on Supabase offers. Add WhatsApp only after the script runs end to end locally.


* Scope grows into a marketplace. Mitigation: suppliers are agents we control. We are not building Fleek.



## Success



Saturday is successful when a cold viewer can answer three questions after three minutes:

* What did the buyer ask for?


* What did Counter refuse, and why?


* What did Counter buy without asking, and what did it stop to ask?



The build is successful when that script runs once on the venue network before 16:45, from seeded data, with the ledger matching the words on screen.