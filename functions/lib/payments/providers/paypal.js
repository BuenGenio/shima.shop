/**
 * PayPal payment provider.
 * Supports product sync via Catalog Products API.
 */
export function createPayPalProvider(config) {
  if (!config?.clientId || !config?.clientSecret) throw new Error('PayPal client ID and secret required');
  const baseUrl = config.sandbox
    ? 'https://api-m.sandbox.paypal.com'
    : 'https://api-m.paypal.com';

  let accessToken = null;
  let tokenExpiry = 0;

  async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;
    const res = await fetch(`${baseUrl}/v1/oauth2/token`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: `Basic ${btoa(`${config.clientId}:${config.clientSecret}`)}`,
      },
      body: 'grant_type=client_credentials',
    });
    if (!res.ok) throw new Error('PayPal auth failed');
    const data = await res.json();
    accessToken = data.access_token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  }

  return {
    id: 'paypal',
    name: 'PayPal',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const token = await getAccessToken();
      const currency = (lineItems[0]?.currency || 'JPY').toUpperCase();
      const div = ['JPY', 'KRW', 'VND', 'HUF', 'UAH'].includes(currency) ? 1 : 100;
      const total = lineItems.reduce((s, i) => s + (i.amount || 0) * (i.quantity || 1), 0) / div;
      const purchaseUnits = [{
        amount: {
          currency_code: currency,
          value: total.toFixed(currency === 'JPY' ? 0 : 2),
        },
        items: lineItems.map(item => ({
          name: item.name,
          quantity: String(item.quantity || 1),
          unit_amount: { currency_code: currency, value: ((item.amount || 0) / div).toFixed(currency === 'JPY' ? 0 : 2) },
        })),
        reference_id: metadata?.reference || `kit-${Date.now()}`,
      }];

      const res = await fetch(`${baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: purchaseUnits,
          application_context: {
            return_url: successUrl || `${origin}/success.html`,
            cancel_url: cancelUrl || `${origin}/`,
          },
        }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'PayPal order failed');
      }
      const data = await res.json();
      const approveLink = data.links?.find(l => l.rel === 'approve');
      return { url: approveLink?.href, sessionId: data.id };
    },

    async syncProducts(products, db) {
      const token = await getAccessToken();
      const results = [];
      for (const p of products) {
        const existing = await db.execute({
          sql: 'SELECT external_id FROM product_external_ids WHERE product_id = ? AND provider = ?',
          args: [p.id, 'paypal'],
        });
        const extId = existing.rows[0]?.external_id;

        const productPayload = {
          name: p.name,
          description: p.comment || p.description || '',
          type: 'PHYSICAL',
          category: 'FOOD_AND_GROCERY',
        };

        let productId;
        if (extId) {
          await fetch(`${baseUrl}/v1/catalogs/products/${extId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(productPayload),
          });
          productId = extId;
        } else {
          const res = await fetch(`${baseUrl}/v1/catalogs/products`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify(productPayload),
          });
          if (!res.ok) throw new Error('PayPal product create failed');
          const data = await res.json();
          productId = data.id;
        }

        await db.execute({
          sql: `INSERT INTO product_external_ids (product_id, provider, external_id, external_data, updated_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                ON CONFLICT(product_id, provider) DO UPDATE SET
                  external_id = excluded.external_id,
                  updated_at = datetime('now')`,
          args: [p.id, 'paypal', productId, '{}'],
        });
        results.push({ productId: p.id, externalId: productId });
      }
      return results;
    },

    syncSubscriptions: null,
  };
}
