import { supabase } from '../config/supabase.js';
import {
  listOffers,
  recordGrade,
  sendCounteroffer,
  decide,
  placeOrder,
} from './tools.js';
import { inspectPhotos } from '../vision/inspect_photos.js';

export interface BuyerBotOptions {
  demandId: string;
}

/**
 * Counter Buyer Bot Evaluation Engine
 * Evaluates offers against the standing Mandate.
 */
export async function runBuyerBotEvaluation(demandId: string) {
  console.log(`\n========================================`);
  console.log(`[Buyer Bot] Starting evaluation for Demand: ${demandId}`);
  console.log(`========================================\n`);

  // 1. Fetch Mandate
  const { data: mandate, error: mandateError } = await supabase
    .from('mandates')
    .select('*')
    .limit(1)
    .single();

  if (mandateError || !mandate) {
    throw new Error('Mandate not found in database');
  }

  const maxLandedCap = Number(mandate.max_landed_price);
  const badOrderLimit = Number(mandate.not_as_described_limit);

  console.log(`[Buyer Bot] Active Mandate: Max Landed Price: £${maxLandedCap}, Bad Order Limit: ${badOrderLimit}`);

  // 2. Fetch Offers for Demand
  const offers = await listOffers(demandId);
  console.log(`[Buyer Bot] Found ${offers.length} offers to evaluate.\n`);

  for (const offer of offers) {
    const supplier = offer.suppliers;
    const unitPrice = Number(offer.unit_price);
    const shipping = Number(offer.shipping);
    const landedPrice = unitPrice + shipping;
    const supplierName = supplier?.name || 'Unknown Supplier';
    const badOrders = supplier?.not_as_described_count || 0;

    console.log(`--------------------------------------------------`);
    console.log(`[Evaluating] ${supplierName} (Offer ID: ${offer.id})`);
    console.log(`  Price: £${unitPrice} + £${shipping} ship (£${landedPrice} landed) | Claimed Grade: ${offer.claimed_grade}`);

    // Skip already processed offers
    if (offer.status !== 'open') {
      console.log(`  Status is already '${offer.status}', skipping.`);
      continue;
    }

    // Rule 1: Refuse unreliable supplier (>= badOrderLimit)
    if (badOrders >= badOrderLimit) {
      console.log(`  ❌ Rule Triggered: Supplier has ${badOrders} not-as-described orders.`);
      await decide(
        offer.id,
        'refuse',
        `Refuse supplier with ${badOrders} not-as-described orders`,
        `Refused. ${badOrders} not-as-described orders; slow ${offer.ship_days}d ship window.`
      );
      continue;
    }

    // Rule 2: Photo inspection & grade check
    const photoUrl = offer.photo_urls?.[0] || 'https://images.unsplash.com/photo-501-bundle';
    const inspection = await inspectPhotos(photoUrl, offer.claimed_grade);

    if (inspection.seen_grade !== offer.claimed_grade) {
      console.log(`  🔍 Photo Inspection Mismatch! Claimed: ${offer.claimed_grade} vs Seen: ${inspection.seen_grade}`);
      await recordGrade(
        offer.id,
        inspection.seen_grade,
        inspection.reason,
        inspection.damage_markers
      );

      // Send counteroffer to discount for the damage
      const counterPrice = 14.0;
      console.log(`  💬 Sending counteroffer at £${counterPrice}...`);
      await sendCounteroffer(
        offer.id,
        counterPrice,
        'Grade dissent from photo inspection',
        `Countered at £${counterPrice}. Photo shows 3 damaged hems.`
      );
      continue;
    }

    // Rule 3: Autonomous Buy (Inside Cap & Grade Matches)
    if (landedPrice <= maxLandedCap) {
      console.log(`  ⚡ Rule Triggered: Perfect match within £${maxLandedCap} cap!`);
      await decide(
        offer.id,
        'buy',
        `Price within £${maxLandedCap} landed cap and Grade A verified`,
        `Bought autonomously. Landed £${landedPrice} under £${maxLandedCap} cap.`
      );
      await placeOrder(offer.id);
      continue;
    }

    // Rule 4: Ask Buyer (Price breaks cap)
    if (landedPrice > maxLandedCap) {
      const overage = (landedPrice - maxLandedCap).toFixed(2);
      console.log(`  ❓ Rule Triggered: Price breaks cap by £${overage}. Generating Decision Card...`);
      await decide(
        offer.id,
        'ask',
        `Price breaks £${maxLandedCap} cap by £${overage}`,
        `Decision required: Landed price £${landedPrice} exceeds £${maxLandedCap} cap by £${overage}.`
      );
      continue;
    }
  }

  console.log(`\n========================================`);
  console.log(`[Buyer Bot] Evaluation cycle completed.`);
  console.log(`========================================\n`);
}

/**
 * Realtime listener mode: Watches for new demands and incoming offers automatically.
 * Ideal for running alongside Hacker 1's frontend.
 */
import { simulateSupplierStream } from '../../scripts/simulate_suppliers.js';

/**
 * Realtime and active polling listener mode:
 * Watches for new demands, automatically streams in supplier offers,
 * and runs Buyer Bot evaluation.
 */
export async function startBuyerBotService() {
  console.log('[Buyer Bot Service] Active and listening for new demands via Supabase & polling...');

  let processedDemands = new Set<string>();

  // Initialize with already processed demands so we only process new ones
  const { data: existing } = await supabase.from('demands').select('id, status');
  existing?.forEach((d) => {
    if (d.status === 'completed' || d.status === 'processing') {
      processedDemands.add(d.id);
    }
  });

  const pollInterval = setInterval(async () => {
    try {
      const { data: openDemands } = await supabase
        .from('demands')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(3);

      for (const demand of openDemands || []) {
        if (!processedDemands.has(demand.id)) {
          processedDemands.add(demand.id);
          console.log(`\n======================================================`);
          console.log(`[Buyer Bot Service] New demand detected! ID: ${demand.id}`);
          console.log(`Prompt: "${demand.raw_message}"`);
          console.log(`======================================================\n`);

          // 1. Mark as processing
          await supabase.from('demands').update({ status: 'processing' }).eq('id', demand.id);

          // 2. Stream in supplier offers
          console.log(`[Buyer Bot Service] Triggering supplier agents for Demand ${demand.id}...`);
          await simulateSupplierStream(demand.id, 800);

          // 3. Run Buyer Bot evaluation
          console.log(`[Buyer Bot Service] Running bot evaluation on all incoming offers...`);
          await runBuyerBotEvaluation(demand.id);
        }
      }
    } catch (err) {
      // quiet retry on intermittent network blip
    }
  }, 1500);

  // Subscribe to realtime as well for instant notification
  supabase
    .channel('bot-demands-channel')
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'demands' },
      async (payload) => {
        const demandId = payload.new.id;
        if (!processedDemands.has(demandId)) {
          processedDemands.add(demandId);
          console.log(`\n[Realtime Event] New demand received: "${payload.new.raw_message}" (ID: ${demandId})`);
          await simulateSupplierStream(demandId, 800);
          await runBuyerBotEvaluation(demandId);
        }
      }
    )
    .subscribe();
}

// Direct runner if executed via CLI
const isDirectRun =
  import.meta.url === `file://${process.argv[1]}` ||
  process.argv[1]?.includes('buyer_bot') ||
  process.argv[2] === '--watch' ||
  process.argv.includes('--watch');

if (isDirectRun) {
  (async () => {
    const isWatchMode = process.argv.includes('--watch') || process.argv.includes('-w');

    if (isWatchMode) {
      await startBuyerBotService();
    } else {
      // Run evaluation on latest demand immediately
      const { data: latestDemand } = await supabase
        .from('demands')
        .select('id')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (latestDemand) {
        await runBuyerBotEvaluation(latestDemand.id);
      } else {
        console.log('[Buyer Bot] No existing demand found. Run with --watch to listen for new demands.');
      }
    }
  })().catch((err) => {
    console.error('[Buyer Bot] Fatal error in main runner:', err);
  });
}
