import { getDb } from '../lib/db.js';
import { getProvider, toMinorUnits } from '../lib/payments/index.js';
import { getGatewayConfig } from '../lib/payment-gateways.js';
import { log } from '../lib/logger.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function buildLineItems(kitData, products, validItems, allSelected) {
  const currency = (kitData.currency || 'JPY').toUpperCase();
  const toAmount = (price) => toMinorUnits(price, currency);

  if (allSelected && kitData.bundle_price) {
    return [{
      id: 'bundle',
      name: `${kitData.name} (Complete)`,
      amount: toAmount(kitData.bundle_price),
      quantity: 1,
      currency,
    }];
  }
  return validItems.map(id => ({
    id,
    name: products[id].name,
    amount: toAmount(products[id].price),
    quantity: 1,
    currency,
    description: products[id].comment,
  }));
}


export async function onRequestPost(context) {
  const { env, request } = context;

  try {
    const body = await request.json();
    const { kitId, selectedItems, paymentMethod } = body;
    if (!kitId || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return Response.json(
        { error: 'Missing kitId or selectedItems' },
        { status: 400, headers: corsHeaders },
      );
    }

    const db = getDb(env);

    const kitResult = await db.execute({
      sql: 'SELECT id, data FROM kits WHERE id = ?',
      args: [kitId],
    });
    if (kitResult.rows.length === 0) {
      return Response.json(
        { error: 'Unknown kit' },
        { status: 400, headers: corsHeaders },
      );
    }
    const kitData = JSON.parse(kitResult.rows[0].data);
    const allProductIds = kitData.product_ids || [];

    const placeholders = selectedItems.map(() => '?').join(',');
    const productsResult = await db.execute({
      sql: `SELECT id, data FROM products WHERE id IN (${placeholders})`,
      args: selectedItems,
    });

    const products = {};
    for (const row of productsResult.rows) {
      products[row.id] = JSON.parse(row.data);
    }

    const validItems = selectedItems.filter(id => products[id]);
    if (validItems.length === 0) {
      return Response.json(
        { error: 'No valid items selected' },
        { status: 400, headers: corsHeaders },
      );
    }

    const allSelected = validItems.length === allProductIds.length;
    const lineItems = buildLineItems(kitData, products, validItems, allSelected);
    const origin = new URL(request.url).origin;
    const successUrl = `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl = `${origin}/`;
    const metadata = { kit: kitId, items: validItems.join(','), reference: `kit-${kitId}-${Date.now()}` };

    let providerId = paymentMethod || 'stripe';
    let config = await getGatewayConfig(db, providerId, null, env);
    if (!config && providerId === 'stripe' && env.STRIPE_SECRET_KEY) {
      config = { secretKey: env.STRIPE_SECRET_KEY };
    }
    if (!config) {
      return Response.json(
        { error: `Payment method "${providerId}" is not configured or enabled` },
        { status: 400, headers: corsHeaders },
      );
    }

    const provider = getProvider(providerId, config);
    const result = await provider.createCheckout({
      lineItems,
      successUrl,
      cancelUrl,
      metadata,
      origin,
    });

    if (result.method === 'POST' && result.formData) {
      return Response.json({
        url: result.url,
        method: 'POST',
        formData: result.formData,
        sessionId: result.sessionId,
      }, { headers: corsHeaders });
    }

    if (result.url) {
      return Response.json({ url: result.url, sessionId: result.sessionId }, { headers: corsHeaders });
    }

    return Response.json(
      { error: 'Checkout failed: no redirect URL' },
      { status: 500, headers: corsHeaders },
    );
  } catch (err) {
    await log({ db: getDb(env), env }, 'error', 'checkout', 'Checkout failed', { err: err.message, stack: err.stack });
    return Response.json(
      { error: err.message || 'Failed to create checkout session' },
      { status: 500, headers: corsHeaders },
    );
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
