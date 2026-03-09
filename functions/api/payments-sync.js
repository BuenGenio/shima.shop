/**
 * POST /api/payments-sync - Sync products and subscriptions to payment providers
 */
import { getDb } from '../lib/db.js';
import { getProvider, getProvidersWithSync } from '../lib/payments/index.js';
import { getGatewayConfig } from '../lib/payment-gateways.js';
import { log } from '../lib/logger.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = getDb(env);
  const body = await request.json().catch(() => ({}));
  const targetProviders = body.providers || getProvidersWithSync();
  const syncProducts = body.syncProducts !== false;
  const syncSubscriptions = body.syncSubscriptions !== false;

  const results = { products: {}, subscriptions: {} };

  for (const providerId of targetProviders) {
    if (!getProvidersWithSync().includes(providerId)) continue;

    const config = await getGatewayConfig(db, providerId, null, env);
    if (!config) continue;

    try {
      const provider = getProvider(providerId, config);
      if (syncProducts && provider.syncProducts) {
        const productsResult = await db.execute('SELECT id, data FROM products ORDER BY created_at');
        const products = productsResult.rows.map(row => ({ id: row.id, ...JSON.parse(row.data) }));
        const synced = await provider.syncProducts(products, db);
        results.products[providerId] = { count: synced.length, items: synced };
        await log({ db, env }, 'info', 'payments-sync', `Synced ${synced.length} products to ${providerId}`, { count: synced.length }, providerId);
      }
      if (syncSubscriptions && provider.syncSubscriptions) {
        const subsResult = await db.execute('SELECT id, data FROM subscriptions ORDER BY created_at');
        const subscriptions = subsResult.rows.map(row => ({ id: row.id, ...JSON.parse(row.data) }));
        const synced = await provider.syncSubscriptions(subscriptions, db);
        results.subscriptions[providerId] = { count: synced.length, items: synced };
      }
    } catch (err) {
      await log({ db, env }, 'error', 'payments-sync', `Sync failed for ${providerId}`, { err: err.message }, providerId);
      results.products[providerId] = results.products[providerId] || { error: err.message };
      results.subscriptions[providerId] = results.subscriptions[providerId] || { error: err.message };
    }
  }
  return json({ ok: true, results });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
