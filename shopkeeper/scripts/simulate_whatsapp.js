import { handleWhatsAppMessage, completeRetailSale } from '../src/sales/whatsapp/sales_bot.js';
import { intakePurchasedLot } from '../src/intake/intake_lot.js';
async function main() {
    console.log('========================================================');
    console.log('📱 Simulating WhatsApp Customer Negotiation (Human Channel)');
    console.log('========================================================\n');
    const customerPhone = '+447911123456';
    // Seed / generate sample intake items for the test
    const sampleLot = {
        order_id: 'ord_demo_euro_vintage_401',
        quantity: 20,
        unit_cost: 15.0,
        shipping_cost: 40.0,
        category: "Levi's 501",
        grade: 'A',
        photo_urls: ['https://images.unsplash.com/photo-1542272604-780c96856592'],
    };
    const activeInventory = await intakePurchasedLot(sampleLot, 2);
    // 1. Initial inquiry
    console.log('\n[Step 1: Customer asks about denim in size 31]');
    console.log(`Customer: "Hey! Do you have any vintage 501s in waist 31?"`);
    const reply1 = await handleWhatsAppMessage({
        fromPhone: customerPhone,
        body: 'Hey! Do you have any vintage 501s in waist 31?',
        fallbackItems: activeInventory,
    });
    console.log(`Bot Reply:\n"${reply1.replyText}"\n`);
    const item = reply1.matchedItem || activeInventory[0];
    console.log(`Target Item: "${item.title}" | List: £${item.list_price} | Secret Floor: £${item.floor_price}\n`);
    // 2. Customer makes low-ball offer (below floor)
    console.log('[Step 2: Customer low-balls below floor]');
    const lowOffer = Math.floor(Number(item.floor_price) - 5);
    console.log(`Customer: "Would you take £${lowOffer} for them today?"`);
    const reply2 = await handleWhatsAppMessage({
        fromPhone: customerPhone,
        body: `Would you take £${lowOffer} for them today?`,
        fallbackItems: activeInventory,
    });
    console.log(`Bot Reply (Floor Protection Activated):\n"${reply2.replyText}"\n`);
    // 3. Customer makes acceptable counter offer
    console.log('[Step 3: Customer makes reasonable offer above floor]');
    const acceptableOffer = Math.floor(Number(item.list_price) - 4);
    console.log(`Customer: "Okay fair enough, how about £${acceptableOffer}?"`);
    const reply3 = await handleWhatsAppMessage({
        fromPhone: customerPhone,
        body: `Okay fair enough, how about £${acceptableOffer}?`,
        fallbackItems: activeInventory,
    });
    console.log(`Bot Reply:\n"${reply3.replyText}"\n`);
    // 4. Complete checkout
    if (reply3.negotiation?.outcome === 'accepted') {
        console.log('[Step 4: Customer checks out]');
        await completeRetailSale(item.id, acceptableOffer, 'whatsapp', customerPhone);
    }
}
main().catch(console.error);
