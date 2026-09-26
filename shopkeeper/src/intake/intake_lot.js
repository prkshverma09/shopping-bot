import { supabase } from '../db/supabase.js';
import { calculateItemPricing } from '../pricing/pricing_engine.js';
import { generateListingAttributes } from './listing_generator.js';
// Distribution of fast-selling vintage waist sizes
const DEMO_SIZES = ['W29 L30', 'W30 L32', 'W31 L32', 'W32 L30', 'W32 L32'];
/**
 * Breaks down a purchased wholesale order/lot into individual retail items
 * and stores them in Supabase.
 */
export async function intakePurchasedLot(lot, countToGenerate) {
    const itemCount = countToGenerate || Math.min(lot.quantity, 5); // default to 5 representative items for fast demo
    const shippingPerUnit = lot.shipping_cost / lot.quantity;
    const pricing = calculateItemPricing(lot.unit_cost, shippingPerUnit);
    console.log(`\n[Shopkeeper Intake] Processing lot from Order: ${lot.order_id}`);
    console.log(`  Quantity: ${lot.quantity} | Landed Cost: £${pricing.costBasis}/pc`);
    console.log(`  List Price: £${pricing.listPrice} | Secret Floor: £${pricing.floorPrice}`);
    const createdItems = [];
    for (let i = 0; i < itemCount; i++) {
        const size = DEMO_SIZES[i % DEMO_SIZES.length];
        const photoUrl = lot.photo_urls[i % lot.photo_urls.length] || 'https://images.unsplash.com/photo-1542272604-780c96856592';
        const attributes = await generateListingAttributes(lot.category, size, lot.grade, pricing.costBasis, photoUrl);
        // Verify if order_id is a valid UUID, otherwise leave null so DB constraint is satisfied
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(lot.order_id);
        const itemRecord = {
            order_id: isUuid ? lot.order_id : undefined,
            title: attributes.title,
            category: lot.category,
            size: size,
            grade: attributes.grade,
            flaws: attributes.flaws,
            cost_basis: pricing.costBasis,
            list_price: pricing.listPrice,
            floor_price: pricing.floorPrice,
            current_price: pricing.listPrice,
            photo_urls: [photoUrl],
            status: 'listed',
            days_on_shelf: 0,
        };
        const { data, error } = await supabase
            .from('items')
            .insert(itemRecord)
            .select()
            .single();
        if (error) {
            console.error(`  [Intake Error] Failed to insert item ${i + 1}:`, error.message);
            // Fallback return object in memory
            createdItems.push({
                ...itemRecord,
                id: itemRecord.id || `mock-item-${i + 1}`,
            });
        }
        else {
            console.log(`  ✓ Item cataloged: "${data.title}" (ID: ${data.id}) - Listed at £${data.list_price}`);
            createdItems.push(data);
        }
    }
    return createdItems;
}
