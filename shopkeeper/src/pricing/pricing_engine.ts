export interface PricingBounds {
  costBasis: number;
  listPrice: number;
  floorPrice: number;
}

/**
 * Calculates retail pricing based on cost basis and margin policies:
 * - listPrice: Price displayed to customers (aiming for target margin ~55%)
 * - floorPrice: Absolute lowest counter price allowed during negotiations (e.g. 30% min margin)
 */
export function calculateItemPricing(
  unitCost: number,
  shippingPerUnit: number,
  targetMargin: number = 0.55,
  minMargin: number = 0.30
): PricingBounds {
  const costBasis = Number((unitCost + shippingPerUnit).toFixed(2));

  // floor = cost / (1 - minMargin)
  const floorPrice = Number((costBasis / (1 - minMargin)).toFixed(2));

  // list = cost / (1 - targetMargin)
  const rawListPrice = Number((costBasis / (1 - targetMargin)).toFixed(2));
  // Round to friendly price ending in .00
  const listPrice = Math.round(rawListPrice);

  return {
    costBasis,
    listPrice,
    floorPrice,
  };
}
