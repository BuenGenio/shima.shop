/**
 * GET /api/orders/:id - Get order (logs access)
 * PATCH /api/orders/:id - Update order (shipping, consignment options)
 */
import { getDb } from '../../lib/db.js';
import { getOrder, updateOrder, addOrderCharges } from '../../lib/orders.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

export async function onRequestGet(context) {
  const { env, request, params } = context;
  const orderId = params.id;
  if (!orderId) return json({ error: 'Order ID required' }, 400);

  try {
    const db = getDb(env);
    const ctx = { env, db, request };
    const order = await getOrder(ctx, orderId);
    if (!order) return json({ error: 'Order not found' }, 404);
    return json(order);
  } catch (err) {
    return json({ error: err.message || 'Failed to get order' }, 500);
  }
}

export async function onRequestPatch(context) {
  const { env, request, params } = context;
  const orderId = params.id;
  if (!orderId) return json({ error: 'Order ID required' }, 400);

  try {
    const body = await request.json();
    const db = getDb(env);
    const ctx = { env, db, request };

    if (body.charges && Array.isArray(body.charges)) {
      await addOrderCharges(ctx, orderId, body.charges);
      const order = await getOrder(ctx, orderId);
      return json(order);
    }

    const result = await updateOrder(ctx, orderId, body);
    const order = await getOrder(ctx, orderId);
    return json({ ...order, status: result.status });
  } catch (err) {
    return json({ error: err.message || 'Failed to update order' }, 400);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
