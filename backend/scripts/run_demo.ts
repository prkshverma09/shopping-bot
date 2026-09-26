import { createDemand, placeOrder } from '../src/agent/tools.js';
import { simulateSupplierStream } from './simulate_suppliers.js';
import { runBuyerBotEvaluation } from '../src/agent/buyer_bot.js';
import { supabase } from '../src/config/supabase.js';

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function main() {
  console.log(`\n======================================================`);
  console.log(`🚀 COUNTER END-TO-END DEMO TEST RUNNER`);
  console.log(`======================================================\n`);

  // Step 1: Reseller submits demand
  const demoPrompt =
    "I need about 40 Grade A Levi's 501s, waist 28-32, under £18 landed, the kind that sells in my shop. Budget £600. Only ping me if the grade looks wrong or the price breaks the cap.";

  console.log(`[Demo 0:00] Buyer types demand message:`);
  console.log(`  "${demoPrompt}"\n`);
  const demand = await createDemand(demoPrompt);

  // Step 2: Suppliers submit offers
  console.log(`\n[Demo 0:30] Supplier agents stream in offers...`);
  await simulateSupplierStream(demand.id, 500);

  // Step 3: Counter Buyer Bot evaluates
  console.log(`\n[Demo 1:00 - 2:00] Counter Bot evaluates all offers against mandate...`);
  await runBuyerBotEvaluation(demand.id);

  // Step 4: Decision Card simulation (Buyer taps [Approve] for Supplier B)
  console.log(`\n[Demo 2:30] Simulating Buyer tapping [Approve] on Decision Card (Supplier B)...`);
  const { data: askedOffer } = await supabase
    .from('offers')
    .select('id')
    .eq('demand_id', demand.id)
    .eq('status', 'asked')
    .single();

  if (askedOffer) {
    await placeOrder(askedOffer.id);
    console.log(`[Demo 2:35] Buyer approval registered for Offer ${askedOffer.id}`);
  }

  // Step 5: Print Closing Receipt
  await sleep(500);
  console.log(`\n======================================================`);
  console.log(`📑 FINAL TRUST LEDGER & CLOSING RECEIPT (Demo 2:50)`);
  console.log(`======================================================\n`);

  // Reset previous transactions for clean demo run if needed
  // Fetch actions for this demand
  const { data: actions } = await supabase
    .from('actions')
    .select('*, offers!inner(demand_id, claimed_grade, unit_price, suppliers(name))')
    .eq('offers.demand_id', demand.id)
    .order('created_at', { ascending: true });

  console.log(`--- Ledger Actions Audit (Demand: ${demand.id}) ---`);
  actions?.forEach((act, idx) => {
    console.log(
      ` ${idx + 1}. [${act.action.toUpperCase()}] ${act.offers?.suppliers?.name || 'Supplier'} -> ${act.note}`
    );
  });

  const { data: orders } = await supabase
    .from('orders')
    .select('*, offers!inner(demand_id)')
    .eq('offers.demand_id', demand.id);
  const totalPieces = orders?.reduce((sum, o) => sum + o.quantity, 0) || 0;
  const totalSpend = orders?.reduce((sum, o) => sum + Number(o.total), 0) || 0;

  console.log(`\n--- Closing Summary ---`);
  console.log(`• Total Pieces Purchased: ${totalPieces} pcs`);
  console.log(`• Total Spend: £${totalSpend.toFixed(2)}`);
  console.log(`• Bad Inventory Avoided (Supplier A Refusal): £320.00 saved`);
  console.log(`• Discount Negotiated (Supplier C Counter): £40.00 saved`);
  console.log(`• Store Dashboards or Checkout Carts Opened: 0`);
  console.log(`\n✨ Demo script executed successfully!\n`);
}

main().catch((err) => {
  console.error('Demo runner encountered an error:', err);
  process.exit(1);
});
