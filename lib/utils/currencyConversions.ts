type CurrencyCode = '$' | '€' | '¥' | '₩' | '元';
type PlanType = 'automate' | 'scale';

const CURRENCY_CONVERSIONS: Record<CurrencyCode, {automate: number, scale: number}> = {
  '$': { automate: 12, scale: 59 },
  '€': { automate: 12, scale: 59 },
  '¥': { automate: 1_900, scale: 9_250},
  '₩': { automate: 17_250, scale:85_500 },
  '元': { automate: 90, scale: 435 }
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