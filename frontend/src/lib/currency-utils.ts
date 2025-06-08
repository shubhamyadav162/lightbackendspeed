/**
 * Currency utility functions for the LightSpeedPay platform
 * Handles currency conversion, formatting, and gateway currency support
 */

// Supported currencies
export enum Currency {
  INR = 'INR',
  USD = 'USD',
  EUR = 'EUR',
  GBP = 'GBP',
  SGD = 'SGD',
  AED = 'AED',
}

// Currency symbols
export const currencySymbols: Record<Currency, string> = {
  [Currency.INR]: '₹',
  [Currency.USD]: '$',
  [Currency.EUR]: '€',
  [Currency.GBP]: '£',
  [Currency.SGD]: 'S$',
  [Currency.AED]: 'د.إ',
};

// Gateway currency support matrix
export type GatewayCurrencySupport = Record<string, Currency[]>;

export const gatewayCurrencySupport: GatewayCurrencySupport = {
  razorpay: [Currency.INR, Currency.USD],
  phonepe: [Currency.INR],
  stripe: [Currency.INR, Currency.USD, Currency.EUR, Currency.GBP, Currency.SGD, Currency.AED],
  sandbox: Object.values(Currency), // Sandbox supports all currencies
};

// Mock exchange rates (in a real implementation, these would be fetched from an API)
export type ExchangeRates = Record<Currency, Record<Currency, number>>;

// Base exchange rates (relative to USD)
const baseRates: Record<Currency, number> = {
  [Currency.USD]: 1,
  [Currency.INR]: 83.12,
  [Currency.EUR]: 0.92,
  [Currency.GBP]: 0.79,
  [Currency.SGD]: 1.34,
  [Currency.AED]: 3.67,
};

// Generate exchange rates for all currency pairs
export const exchangeRates: ExchangeRates = Object.values(Currency).reduce(
  (rates, fromCurrency) => {
    rates[fromCurrency] = Object.values(Currency).reduce(
      (currencyRates, toCurrency) => {
        // Calculate cross-rate
        currencyRates[toCurrency] = baseRates[toCurrency] / baseRates[fromCurrency];
        return currencyRates;
      },
      {} as Record<Currency, number>
    );
    return rates;
  },
  {} as ExchangeRates
);

/**
 * Formats a currency amount with the appropriate symbol and decimals
 */
export function formatCurrency(
  amount: number,
  currency: Currency = Currency.INR,
  options: Intl.NumberFormatOptions = {}
): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2,
    ...options,
  }).format(amount);
}

/**
 * Converts an amount from one currency to another
 */
export function convertCurrency(
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency
): number {
  if (fromCurrency === toCurrency) {
    return amount;
  }
  
  const rate = exchangeRates[fromCurrency][toCurrency];
  return amount * rate;
}

/**
 * Determines which gateways support a specific currency
 */
export function getGatewaysForCurrency(currency: Currency): string[] {
  return Object.entries(gatewayCurrencySupport)
    .filter(([_, currencies]) => currencies.includes(currency))
    .map(([gateway]) => gateway);
}

/**
 * Checks if a gateway supports a specific currency
 */
export function doesGatewaySupportCurrency(gateway: string, currency: Currency): boolean {
  return gatewayCurrencySupport[gateway]?.includes(currency) ?? false;
}

/**
 * Returns all currencies supported by a specific gateway
 */
export function getSupportedCurrencies(gateway: string): Currency[] {
  return gatewayCurrencySupport[gateway] || [];
}

/**
 * Returns the default currency for a country code
 */
export function getDefaultCurrencyForCountry(countryCode: string): Currency {
  const countryToCurrency: Record<string, Currency> = {
    IN: Currency.INR,
    US: Currency.USD,
    GB: Currency.GBP,
    EU: Currency.EUR,
    SG: Currency.SGD,
    AE: Currency.AED,
    // Add more mappings as needed
  };
  
  return countryToCurrency[countryCode] || Currency.USD;
}

export default {
  Currency,
  currencySymbols,
  gatewayCurrencySupport,
  exchangeRates,
  formatCurrency,
  convertCurrency,
  getGatewaysForCurrency,
  doesGatewaySupportCurrency,
  getSupportedCurrencies,
  getDefaultCurrencyForCountry,
}; 