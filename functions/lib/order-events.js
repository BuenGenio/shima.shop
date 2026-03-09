/**
 * Order audit events - full accountability and compliance.
 * Logs every access/update with: user, activity, timestamps, origin, technology, method, payload.
 */
import { getDb } from './db.js';

export function extractRequestOrigin(request) {
  const headers = request?.headers || {};
  const get = (h) => {
    if (typeof headers.get === 'function') return headers.get(h) || headers.get(h.toLowerCase()) || '';
    const k = h.toLowerCase();
    return headers[h] || headers[k] || '';
  };
  return {
    origin_ip: get('CF-Connecting-IP') || get('X-Forwarded-For')?.split(',')[0]?.trim() || get('X-Real-IP') || null,
    user_agent: get('User-Agent') || null,
    origin_country: get('CF-IPCountry') || null,
    technology: get('Sec-CH-UA') || null,
    method: request?.method || null,
  };
}

/**
 * Log an order event. Call on every create/read/update/access.
 */
export async function logOrderEvent(ctx, orderId, activity, payload = {}) {
  const { request, userId } = ctx;
  const db = ctx.db || getDb(ctx.env);
  const origin = request ? extractRequestOrigin(request) : {};

  await db.execute({
    sql: `INSERT INTO order_events (order_id, activity, user_id, origin_ip, origin_country, user_agent, technology, method, payload)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      orderId,
      activity,
      userId || null,
      origin.origin_ip || null,
      origin.origin_country || null,
      origin.user_agent || null,
      origin.technology || null,
      origin.method || null,
      JSON.stringify(typeof payload === 'object' ? payload : { raw: payload }),
    ],
  });
}
