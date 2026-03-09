/**
 * POST /api/orders - Create order from kit (clone).
 * Creates an initially incomplete order (draft) with full audit logging.
 */
import { getDb } from '../lib/db.js';
import { createOrderFromKit } from '../lib/orders.js';
import { logOrderEvent } from '../lib/order-events.js';

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
  try {
    const body = await request.json();
    const { kitId, selectedItems } = body;
    if (!kitId || !Array.isArray(selectedItems) || selectedItems.length === 0) {
      return json({ error: 'kitId and selectedItems (array) required' }, 400);
    }

    const db = getDb(env);
    const ctx = { env, db, request };
    const result = await createOrderFromKit(ctx, {
      kitId,
      selectedProductIds: selectedItems,
    });

    return json({ orderId: result.orderId, status: result.status }, 201);
  } catch (err) {
    return json({ error: err.message || 'Failed to create order' }, 400);
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
