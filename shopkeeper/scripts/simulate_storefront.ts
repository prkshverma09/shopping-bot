import {
  getAgentStorefrontManifest,
  searchCatalog,
  makeOffer,
  agentCheckout,
} from '../src/sales/storefront/agent_storefront.js';
import { intakePurchasedLot } from '../src/intake/intake_lot.js';
import { WholesaleLotInput } from '../src/types.js';

async function main() {
  console.log('========================================================');
  console.log('🤖 Simulating Machine-to-Machine Agent Storefront (Bot Channel)');
  console.log('========================================================\n');

  const buyerAgentId = 'diba_buyer_agent_099';

  // Seed sample intake items
  const sampleLot: WholesaleLotInput = {
    order_id: 'ord_demo_euro_vintage_401',
    quantity: 20,
    unit_cost: 15.0,
    shipping_cost: 40.0,
    category: "Levi's 501",
    grade: 'A',
    photo_urls: ['https://images.unsplash.com/photo-1542272604-780c96856592'],
  };
  const activeInventory = await intakePurchasedLot(sampleLot, 2);

  // 1. Agent discovers storefront
  console.log('\n[Step 1: Buying Agent fetches /.well-known/agent-store.json]');
  const manifest = getAgentStorefrontManifest();
  console.log('Manifest:', JSON.stringify(manifest, null, 2));

  // 2. Agent searches catalog
  console.log('\n[Step 2: Buying Agent calls search_catalog(size="30")]');
  const catalog = await searchCatalog(undefined, '30', activeInventory);
  console.log(`Found ${catalog.length} items matching criteria.`);

  const targetItem = catalog[0] || activeInventory[0];
  console.log(`Selected: "${targetItem.title}" | List: £${targetItem.current_price} | Floor: £${targetItem.floor_price}\n`);

  // 3. Agent sends programmatic offer
  const botOfferPrice = Math.round(Number(targetItem.current_price) * 0.88); // 12% discount request
  console.log(`[Step 3: Buying Agent calls make_offer(itemId="${targetItem.id}", price=£${botOfferPrice})]`);
  const offerResult = await makeOffer(targetItem, botOfferPrice, buyerAgentId);
  console.log('Storefront Response:');
  console.log(`  Outcome: ${offerResult.outcome.toUpperCase()}`);
  console.log(`  Message: "${offerResult.responseMessage}"`);
  console.log(`  Reason: ${offerResult.reason}`);

  // 4. Automated checkout
  const finalPrice = offerResult.agreedPrice || offerResult.counterPrice || targetItem.current_price;
  console.log(`\n[Step 4: Buying Agent settles payment via agentCheckout at £${finalPrice}]`);
  const sale = await agentCheckout(targetItem.id, finalPrice, buyerAgentId);
  console.log(`✓ Order settled! Gross profit: £${sale.gross_profit}`);
}

main().catch(console.error);
