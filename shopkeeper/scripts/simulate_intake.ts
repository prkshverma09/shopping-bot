import { intakePurchasedLot } from '../src/intake/intake_lot.js';
import { WholesaleLotInput } from '../src/types.js';

async function main() {
  console.log('========================================================');
  console.log('🧪 Simulating Shopkeeper Wholesale Intake');
  console.log('========================================================\n');

  // Represents an autonomous purchase from Counter (e.g. Supplier D: 20 pcs @ £15 + £2 ship)
  const purchasedWholesaleLot: WholesaleLotInput = {
    order_id: 'ord_demo_euro_vintage_401',
    quantity: 20,
    unit_cost: 15.0,
    shipping_cost: 40.0, // £2 per piece landed = £17.00 cost basis
    category: "Levi's 501",
    grade: 'A',
    photo_urls: [
      'https://images.unsplash.com/photo-1542272604-780c96856592?auto=format&fit=crop&w=600&q=80',
      'https://images.unsplash.com/photo-1582552938357-32b906df40cb?auto=format&fit=crop&w=600&q=80',
    ],
  };

  const items = await intakePurchasedLot(purchasedWholesaleLot, 3);

  console.log('\n[Summary of Intake]');
  console.log(`Generated ${items.length} items successfully.`);
  items.forEach((it, idx) => {
    console.log(
      `  [${idx + 1}] ${it.title} | Size: ${it.size} | Grade: ${it.grade} | Cost: £${it.cost_basis} -> List: £${it.list_price} (Floor: £${it.floor_price})`
    );
  });
}

main().catch(console.error);
