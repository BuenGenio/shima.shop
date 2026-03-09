/**
 * Payment provider registry and factory.
 * All 11 payment methods with unified createCheckout interface.
 * Supports test/production credential sets per provider.
 */
import { createStripeProvider } from './providers/stripe.js';
import { createAdyenProvider } from './providers/adyen.js';
import { createPayPalProvider } from './providers/paypal.js';
import { createAirwallexProvider } from './providers/airwallex.js';
import { createPayDollarProvider } from './providers/paydollar.js';
import { createPayMeHSBCProvider } from './providers/paymehsbc.js';
import { createAlipayHKProvider } from './providers/alipayhk.js';
import { createOctopusProvider } from './providers/octopus.js';
import { createTwoCheckoutProvider } from './providers/twocheckout.js';
import { createVerifoneProvider } from './providers/verifone.js';
import { createMonobankProvider } from './providers/monobank.js';

export const PROVIDER_IDS = [
  'stripe', 'adyen', 'paypal', 'airwallex', 'paydollar',
  'paymehsbc', 'alipayhk', 'octopus', 'twocheckout', 'verifone', 'monobank',
];

const FACTORIES = {
  stripe: createStripeProvider,
  adyen: createAdyenProvider,
  paypal: createPayPalProvider,
  airwallex: createAirwallexProvider,
  paydollar: createPayDollarProvider,
  paymehsbc: createPayMeHSBCProvider,
  alipayhk: createAlipayHKProvider,
  octopus: createOctopusProvider,
  twocheckout: createTwoCheckoutProvider,
  verifone: createVerifoneProvider,
  monobank: createMonobankProvider,
};

/** Providers that use sandbox flag (test URL vs production URL) */
const SANDBOX_PROVIDERS = new Set(['paypal', 'paydollar', 'paymehsbc', 'alipayhk', 'octopus', 'twocheckout', 'verifone']);
/** Providers that use environment flag */
const ENV_PROVIDERS = new Set(['adyen', 'airwallex']);

/**
 * Resolve provider config for the given mode (test | production).
 * Supports both new format (config.test / config.production) and legacy flat config.
 */
export function resolveProviderConfig(providerId, storedConfig, mode) {
  if (!storedConfig) return null;
  const m = mode === 'test' ? 'test' : 'production';

  let resolved;
  if (storedConfig.test != null || storedConfig.production != null) {
    resolved = { ...(storedConfig[m] || {}) };
  } else {
    resolved = { ...storedConfig };
  }

  if (SANDBOX_PROVIDERS.has(providerId)) {
    resolved.sandbox = m === 'test';
  }
  if (ENV_PROVIDERS.has(providerId)) {
    resolved.environment = m === 'test' ? 'test' : 'production';
  }
  return resolved;
}

export function getProvider(id, config) {
  const factory = FACTORIES[id];
  if (!factory) throw new Error(`Unknown payment provider: ${id}`);
  return factory(config);
}

export function getProvidersWithSync() {
  return ['stripe', 'paypal'];
}

export function toMinorUnits(amount, currency) {
  const noDecimals = ['JPY', 'KRW', 'VND', 'HUF', 'UAH'];
  return noDecimals.includes((currency || 'JPY').toUpperCase())
    ? Math.round(amount)
    : Math.round(amount * 100);
}
