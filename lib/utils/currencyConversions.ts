type CurrencyCode = '$' | '€' | '¥' | '₩' | '元';
type PlanType = 'automate' | 'scale';

const CURRENCY_CONVERSIONS: Record<CurrencyCode, {automate: number, scale: number}> = {
  '$': { automate: 15, scale: 45 },
  '€': { automate: 15, scale: 45 },
  '¥': { automate: 2_455, scale: 7_350},
  '₩': { automate: 22_850, scale: 68_500 },
  '元': { automate: 110, scale: 340 }
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