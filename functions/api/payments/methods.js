/**
 * GET /api/payments/methods - Public list of enabled payment methods for checkout
 */
import { getDb } from '../../lib/db.js';
import { PROVIDER_IDS } from '../../lib/payments/index.js';
import { listGateways } from '../../lib/payment-gateways.js';

const PROVIDER_NAMES = {
  stripe: 'Card (Stripe)',
  adyen: 'Card (Adyen)',
  paypal: 'PayPal',
  airwallex: 'Card (Airwallex)',
  paydollar: 'PayDollar',
  paymehsbc: 'PayMe HSBC',
  alipayhk: 'AlipayHK',
  octopus: 'Octopus',
  twocheckout: '2Checkout',
  verifone: 'Verifone',
  monobank: 'monobank',
};

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestGet(context) {
  const db = getDb(context.env);
  const gateways = await listGateways(db, { enabledOnly: true });
  const enabledIds = [...new Set(gateways.map(g => g.provider))];
  let methods = PROVIDER_IDS
    .filter(id => enabledIds.includes(id))
    .map(id => ({ id, name: PROVIDER_NAMES[id] || id }));
  if (methods.length === 0 && context.env.STRIPE_SECRET_KEY) {
    methods = [{ id: 'stripe', name: 'Card (Stripe)' }];
  }
  return Response.json({ methods }, { headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
