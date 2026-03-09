/**
 * Order lifecycle: draft → consignment → ready
 * - draft: incomplete order cloned from kit
 * - consignment: shipping details (to/from) added
 * - ready: carrier, pickup, service selected; charges created
 */
import { logOrderEvent } from './order-events.js';

const STATUS_DRAFT = 'draft';
const STATUS_CONSIGNMENT = 'consignment';
const STATUS_READY = 'ready';

export { STATUS_DRAFT, STATUS_CONSIGNMENT, STATUS_READY };

function uid() {
  return `ord_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function hasShippingDetails(data) {
  return !!(
    data.to_name &&
    data.to_address &&
    data.to_country &&
    (data.to_tel || data.to_email)
  );
}

function hasConsignmentOptions(data) {
  return !!(
    data.carrier_name &&
    data.pickup_date &&
    data.pickup_time &&
    data.pickup_address &&
    data.service
  );
}

/**
 * Create order from kit (clone). Initial status: draft.
 */
export async function createOrderFromKit(ctx, { kitId, selectedProductIds }) {
  const db = ctx.db || (await import('./db.js')).getDb(ctx.env);
  const kitRes = await db.execute({
    sql: 'SELECT id, data FROM kits WHERE id = ?',
    args: [kitId],
  });
  if (kitRes.rows.length === 0) throw new Error('Unknown kit');

  const kitData = JSON.parse(kitRes.rows[0].data);
  const productIds = kitData.product_ids || [];
  const validIds = selectedProductIds.filter((id) => productIds.includes(id));
  if (validIds.length === 0) throw new Error('No valid items selected');

  const placeholders = validIds.map(() => '?').join(',');
  const productsRes = await db.execute({
    sql: `SELECT id, data FROM products WHERE id IN (${placeholders})`,
    args: validIds,
  });
  const products = {};
  for (const row of productsRes.rows) {
    products[row.id] = JSON.parse(row.data);
  }

  const orderId = uid();
  const currency = (kitData.currency || 'JPY').toUpperCase();

  await db.execute({
    sql: `INSERT INTO orders (id, kit_id, status, currency, data) VALUES (?, ?, ?, ?, ?)`,
    args: [
      orderId,
      kitId,
      STATUS_DRAFT,
      currency,
      JSON.stringify({
        kit_name: kitData.name,
        selected_items: validIds,
        bundle_price: kitData.bundle_price,
      }),
    ],
  });

  for (const pid of validIds) {
    const p = products[pid];
    await db.execute({
      sql: `INSERT INTO order_items (order_id, product_id, quantity, unit_price, data) VALUES (?, ?, 1, ?, ?)`,
      args: [orderId, pid, p.price || 0, JSON.stringify({ name: p.name })],
    });
  }

  await logOrderEvent(ctx, orderId, 'order_created', {
    kit_id: kitId,
    selected_items: validIds,
    source: 'kit_clone',
  });

  return { orderId, status: STATUS_DRAFT };
}

/**
 * Update order. Upgrades to consignment when shipping details complete.
 */
export async function updateOrder(ctx, orderId, updates) {
  const db = ctx.db || (await import('./db.js')).getDb(ctx.env);
  const orderRes = await db.execute({
    sql: 'SELECT id, status, from_name, from_address, from_country, from_tel, from_email, to_name, to_address, to_country, to_tel, to_email, carrier_name, pickup_date, pickup_time, pickup_address, pickup_notes, service FROM orders WHERE id = ?',
    args: [orderId],
  });
  if (orderRes.rows.length === 0) throw new Error('Order not found');

  const order = orderRes.rows[0];
  const status = order.status;
  const current = {
    from_name: order.from_name,
    from_address: order.from_address,
    from_country: order.from_country,
    from_tel: order.from_tel,
    from_email: order.from_email,
    to_name: order.to_name,
    to_address: order.to_address,
    to_country: order.to_country,
    to_tel: order.to_tel,
    to_email: order.to_email,
    carrier_name: order.carrier_name,
    pickup_date: order.pickup_date,
    pickup_time: order.pickup_time,
    pickup_address: order.pickup_address,
    pickup_notes: order.pickup_notes,
    service: order.service,
  };

  const allowed = [
    'from_name', 'from_address', 'from_country', 'from_tel', 'from_email',
    'to_name', 'to_address', 'to_country', 'to_tel', 'to_email',
    'carrier_name', 'pickup_date', 'pickup_time', 'pickup_address', 'pickup_notes', 'service',
  ];
  const setClauses = [];
  const args = [];

  for (const [k, v] of Object.entries(updates)) {
    if (allowed.includes(k) && v != null) {
      setClauses.push(`${k} = ?`);
      args.push(String(v));
    }
  }
  if (setClauses.length === 0) throw new Error('No valid updates');

  const fullData = { ...current, ...updates };
  let newStatus = status;

  if (status === STATUS_DRAFT && hasShippingDetails(fullData)) {
    newStatus = STATUS_CONSIGNMENT;
    setClauses.push('status = ?');
    args.push(STATUS_CONSIGNMENT);
  } else if (status === STATUS_CONSIGNMENT && hasConsignmentOptions(fullData)) {
    newStatus = STATUS_READY;
    setClauses.push('status = ?');
    args.push(STATUS_READY);
  }

  setClauses.push("updated_at = datetime('now')");
  args.push(orderId);

  await db.execute({
    sql: `UPDATE orders SET ${setClauses.join(', ')} WHERE id = ?`,
    args,
  });

  await logOrderEvent(ctx, orderId, 'order_updated', {
    updates: Object.fromEntries(Object.entries(updates).filter(([k]) => allowed.includes(k))),
    previous_status: status,
    new_status: newStatus,
  });

  return { status: newStatus };
}

/**
 * Add charge item(s) to order. Call when ready to create payment line items.
 */
export async function addOrderCharges(ctx, orderId, charges) {
  const db = ctx.db || (await import('./db.js')).getDb(ctx.env);
  const orderRes = await db.execute({
    sql: 'SELECT id, status, currency FROM orders WHERE id = ?',
    args: [orderId],
  });
  if (orderRes.rows.length === 0) throw new Error('Order not found');
  const order = orderRes.rows[0];
  if (order.status !== STATUS_READY) {
    throw new Error('Order must be in ready status before adding charges');
  }

  const currency = order.currency || 'JPY';
  for (const c of charges) {
    await db.execute({
      sql: `INSERT INTO order_charges (order_id, description, amount, currency, quantity, data)
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [
        orderId,
        c.description || 'Line item',
        c.amount ?? 0,
        c.currency || currency,
        c.quantity ?? 1,
        JSON.stringify(c.data || {}),
      ],
    });
  }

  await logOrderEvent(ctx, orderId, 'charges_added', {
    count: charges.length,
    charges: charges.map((c) => ({ description: c.description, amount: c.amount })),
  });

  return { added: charges.length };
}

/**
 * Get order by id. Logs access.
 */
export async function getOrder(ctx, orderId) {
  const db = ctx.db || (await import('./db.js')).getDb(ctx.env);
  const orderRes = await db.execute({
    sql: 'SELECT * FROM orders WHERE id = ?',
    args: [orderId],
  });
  if (orderRes.rows.length === 0) return null;

  await logOrderEvent(ctx, orderId, 'order_accessed', { action: 'get' });

  const row = orderRes.rows[0];
  const itemsRes = await db.execute({
    sql: 'SELECT * FROM order_items WHERE order_id = ?',
    args: [orderId],
  });
  const chargesRes = await db.execute({
    sql: 'SELECT * FROM order_charges WHERE order_id = ?',
    args: [orderId],
  });

  return {
    id: row.id,
    kit_id: row.kit_id,
    status: row.status,
    currency: row.currency,
    from_name: row.from_name,
    from_address: row.from_address,
    from_country: row.from_country,
    from_tel: row.from_tel,
    from_email: row.from_email,
    to_name: row.to_name,
    to_address: row.to_address,
    to_country: row.to_country,
    to_tel: row.to_tel,
    to_email: row.to_email,
    carrier_name: row.carrier_name,
    pickup_date: row.pickup_date,
    pickup_time: row.pickup_time,
    pickup_address: row.pickup_address,
    pickup_notes: row.pickup_notes,
    service: row.service,
    data: JSON.parse(row.data || '{}'),
    created_at: row.created_at,
    updated_at: row.updated_at,
    items: itemsRes.rows.map((r) => ({
      product_id: r.product_id,
      quantity: r.quantity,
      unit_price: r.unit_price,
      data: JSON.parse(r.data || '{}'),
    })),
    charges: chargesRes.rows.map((r) => ({
      id: r.id,
      description: r.description,
      amount: r.amount,
      currency: r.currency,
      quantity: r.quantity,
      data: JSON.parse(r.data || '{}'),
    })),
  };
}
