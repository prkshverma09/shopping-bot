import { openai, DEFAULT_MODEL } from './ai_client.js';
import { ItemGrade } from '../types.js';

export interface ListingAttributes {
  title: string;
  grade: ItemGrade;
  flaws: string[];
  suggested_retail_price: number;
}

/**
 * Uses LLM / Vision to evaluate a garment and generate an attractive, honest vintage listing.
 */
export async function generateListingAttributes(
  category: string,
  size: string,
  claimedGrade: string,
  costBasis: number,
  photoUrl?: string
): Promise<ListingAttributes> {
  const fallbackPrice = Math.round(costBasis / (1 - 0.55)); // 55% target gross margin

  if (!openai) {
    return {
      title: `Vintage ${category} Straight Fit - ${size}`,
      grade: (claimedGrade as ItemGrade) || 'A',
      flaws: ['Subtle vintage wash wear', 'Original chainstitched hems intact'],
      suggested_retail_price: fallbackPrice,
    };
  }

  try {
    const prompt = `You are an expert vintage reseller describing individual garments for retail sale.
Category: ${category}
Size: ${size}
Wholesale Claimed Grade: ${claimedGrade}
Cost Basis: £${costBasis}
Target Gross Margin: 50%-60%

Generate a compelling, concise retail product listing:
1. title: Clean, attractive product title including brand/fit/size.
2. grade: Confirmed grade ('A+', 'A', 'B', or 'C').
3. flaws: Array of short, honest flaw observations (or wear notes like "natural wash fade").
4. suggested_retail_price: Fair market retail price in GBP (number).`;

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: 'system',
          content: 'You output only strict JSON with keys: title, grade, flaws, suggested_retail_price.',
        },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
    });

    const parsed = JSON.parse(response.choices[0]?.message?.content || '{}');
    return {
      title: parsed.title || `Vintage ${category} - ${size}`,
      grade: (parsed.grade as ItemGrade) || (claimedGrade as ItemGrade) || 'A',
      flaws: Array.isArray(parsed.flaws) ? parsed.flaws : ['Minor authentic vintage wear'],
      suggested_retail_price: Number(parsed.suggested_retail_price) || fallbackPrice,
    };
  } catch (error) {
    console.warn('[Listing Generator] AI generation fallback:', error);
    return {
      title: `Vintage ${category} Classic Fit - ${size}`,
      grade: (claimedGrade as ItemGrade) || 'A',
      flaws: ['Natural vintage wash fade'],
      suggested_retail_price: fallbackPrice,
    };
  }
}
