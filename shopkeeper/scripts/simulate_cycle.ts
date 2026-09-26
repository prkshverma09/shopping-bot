import { intakePurchasedLot } from '../src/intake/intake_lot.js';
import { handleWhatsAppMessage, completeRetailSale } from '../src/sales/whatsapp/sales_bot.js';
import { makeOffer, agentCheckout, searchCatalog } from '../src/sales/storefront/agent_storefront.js';
import { WholesaleLotInput } from '../src/types.js';

async function main() {
  console.log('\n================================================================');
  console.log('🔄 SHOPKEEPER: FULL AUTONOMOUS RETAIL CYCLE DEMONSTRATION');
  console.log('================================================================\n');

  // STAGE 1: Wholesale Lot Intake from Counter Order
  console.log('--- STAGE 1: Wholesale Lot Intake ---');
  const wholesaleOrder: WholesaleLotInput = {
    order_id: `ord_${Date.now()}`,
    quantity: 20,
    unit_cost: 15.0,
    shipping_cost: 40.0, // £17.00 landed cost basis
    category: "Levi's 501",
    grade: 'A',
    photo_urls: [
      'https://images.unsplash.com/photo-1542272604-780c96856592',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb',
    ],
  };

  const catalogedItems = await intakePurchasedLot(wholesaleOrder, 3);
  console.log(`\n✓ Intake Complete: 3 unique items cataloged with AI copy and pricing bounds.\n`);

  // STAGE 2: Human Sale via WhatsApp
  console.log('--- STAGE 2: Human WhatsApp Channel Sale ---');
  const humanItem = catalogedItems[0];
  console.log(`Shopper inquiring about: "${humanItem.title}"`);
  console.log(`  List: £${humanItem.list_price} | Floor: £${humanItem.floor_price}`);

  // Customer offers acceptable price
  const humanOffer = Math.floor(humanItem.list_price - 3);
  console.log(`  Customer WhatsApp: "Can you do £${humanOffer}?"`);
  const reply = await handleWhatsAppMessage({
    fromPhone: '+447911987654',
    body: `Can you do £${humanOffer}?`,
    fallbackItems: catalogedItems,
  });
  console.log(`  Shopkeeper WhatsApp Reply: "${reply.replyText}"`);

  if (reply.negotiation?.outcome === 'accepted' || reply.negotiation?.outcome === 'countered') {
    const agreedPrice = reply.negotiation.agreedPrice || reply.negotiation.counterPrice || humanOffer;
    await completeRetailSale(humanItem.id, agreedPrice, 'whatsapp', '+447911987654');
  }

  // STAGE 3: Bot Sale via Agent Storefront
  console.log('\n--- STAGE 3: Bot-to-Bot Agent Storefront Sale ---');
  const botItem = catalogedItems[1] || catalogedItems[0];
  console.log(`Autonomous Buying Agent targeting: "${botItem.title}"`);
  const botOfferPrice = Math.round(Number(botItem.current_price) * 0.90);
  console.log(`  Bot sends make_offer(£${botOfferPrice})`);

  const negotiation = await makeOffer(botItem, botOfferPrice, 'agent-grok-crawler');
  console.log(`  Storefront Response: [${negotiation.outcome.toUpperCase()}] "${negotiation.responseMessage}"`);

  const settledPrice = negotiation.agreedPrice || negotiation.counterPrice || botItem.current_price;
  await agentCheckout(botItem.id, settledPrice, 'agent-grok-crawler');

  console.log('\n================================================================');
  console.log('🏁 CYCLE COMPLETE: Wholesale -> AI Intake -> Human & Bot Sales');
  console.log('================================================================\n');
}

main().catch(console.error);
