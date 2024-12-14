type CurrencyCode = '$' | '€' | '¥' | '₩' | '元';
type PlanType = 'automate' | 'scale';

const CURRENCY_CONVERSIONS: Record<CurrencyCode, {automate: number, scale: number}> = {
  '$': { automate: 24, scale: 79 },
  '€': { automate: 24, scale: 79 },
  '¥': { automate: 3_500, scale: 12_000},
  '₩': { automate: 32_000, scale: 110_000 },
  '元': { automate: 170, scale: 570 }
};

export const getLocalizedPrice = (currencySymbol: CurrencyCode, plan: PlanType): number | string => {
  const prices = CURRENCY_CONVERSIONS[currencySymbol] || CURRENCY_CONVERSIONS['$'];
  const price = prices[plan];
  
  // Format numbers with thousand separators based on currency
  if (currencySymbol === '₩' || currencySymbol === '¥') {
    return price.toLocaleString('en-US').replace(',', '.');
  }
  
  return price;
};

// Helper function to get base price (USD) for a plan
export const getBasePrice = (plan: PlanType): number => {
  return CURRENCY_CONVERSIONS['$'][plan];
}; 