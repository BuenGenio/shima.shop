import Stripe from 'stripe';

/**
 * Stripe payment provider.
 * Supports product sync via Stripe Products API.
 */
export function createStripeProvider(config) {
  if (!config?.secretKey) throw new Error('Stripe secret key required');
  const stripe = new Stripe(config.secretKey);

  return {
    id: 'stripe',
    name: 'Stripe',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const session = await stripe.checkout.sessions.create({
        mode: 'payment',
        line_items: lineItems.map(item => {
          const currency = (item.currency || 'jpy').toLowerCase();
          const unitAmount = currency === 'jpy' ? Math.round(item.amount) : Math.round(item.amount * 100);
          return {
            price_data: {
              currency,
              product_data: {
                name: item.name,
                description: item.description,
                images: item.image ? [item.image] : undefined,
              },
              unit_amount: unitAmount,
            },
            quantity: item.quantity || 1,
          };
        }),
        success_url: successUrl || `${origin}/success.html?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: cancelUrl || `${origin}/`,
        metadata: metadata || {},
      });
      return { url: session.url, sessionId: session.id };
    },

    async syncProducts(products, db) {
      const results = [];
      for (const p of products) {
        const existing = await db.execute({
          sql: 'SELECT external_id FROM product_external_ids WHERE product_id = ? AND provider = ?',
          args: [p.id, 'stripe'],
        });
        const extId = existing.rows[0]?.external_id;

        const productData = {
          name: p.name,
          description: p.comment || p.description || '',
          metadata: { shima_product_id: p.id },
        };

        let stripeProduct;
        if (extId) {
          stripeProduct = await stripe.products.update(extId, productData);
          const priceList = await stripe.prices.list({ product: extId, active: true });
          const price = priceList.data[0];
          const amount = Math.round(p.price || 0);
          const currency = (p.currency || 'jpy').toLowerCase();
          if (price && price.unit_amount !== amount) {
            await stripe.prices.update(price.id, { active: false });
            await stripe.prices.create({
              product: extId,
              currency,
              unit_amount: amount,
            });
          } else if (!price) {
            await stripe.prices.create({
              product: extId,
              currency,
              unit_amount: amount,
            });
          }
        } else {
          const currency = (p.currency || 'jpy').toLowerCase();
          stripeProduct = await stripe.products.create({
            ...productData,
            default_price_data: {
              currency,
              unit_amount: Math.round(p.price || 0),
            },
          });
        }

        await db.execute({
          sql: `INSERT INTO product_external_ids (product_id, provider, external_id, external_data, updated_at)
                VALUES (?, ?, ?, ?, datetime('now'))
                ON CONFLICT(product_id, provider) DO UPDATE SET
                  external_id = excluded.external_id,
                  external_data = excluded.external_data,
                  updated_at = datetime('now')`,
          args: [p.id, 'stripe', stripeProduct.id, JSON.stringify({ priceId: stripeProduct.default_price })],
        });
        results.push({ productId: p.id, externalId: stripeProduct.id });
      }
      return results;
    },

    async syncSubscriptions(subscriptions, db) {
      const results = [];
      for (const s of subscriptions) {
        const existing = await db.execute({
          sql: 'SELECT external_id FROM subscription_external_ids WHERE subscription_id = ? AND provider = ?',
          args: [s.id, 'stripe'],
        });
        const extId = existing.rows[0]?.external_id;

        const intervalMap = { weekly: 'week', biweekly: 'week', monthly: 'month', quarterly: 'month', yearly: 'year' };
        const interval = intervalMap[s.interval] || 'month';
        const intervalCount = s.interval === 'biweekly' ? 2 : s.interval === 'quarterly' ? 3 : 1;

        if (extId) {
          await stripe.products.update(extId, {
            name: s.name,
            description: s.description || '',
            metadata: { shima_subscription_id: s.id },
          });
          results.push({ subscriptionId: s.id, externalId: extId });
        } else {
          const product = await stripe.products.create({
            name: s.name,
            description: s.description || '',
            metadata: { shima_subscription_id: s.id },
          });
          const amount = (s.amount || s.price || 0) * (1 - (s.discount || 0) / 100);
          await stripe.prices.create({
            product: product.id,
            currency: 'jpy',
            recurring: { interval, interval_count: intervalCount },
            unit_amount: Math.round(amount),
          });
          await db.execute({
            sql: `INSERT INTO subscription_external_ids (subscription_id, provider, external_id, external_data, updated_at)
                  VALUES (?, ?, ?, ?, datetime('now'))
                  ON CONFLICT(subscription_id, provider) DO UPDATE SET
                    external_id = excluded.external_id,
                    updated_at = datetime('now')`,
            args: [s.id, 'stripe', product.id, '{}'],
          });
          results.push({ subscriptionId: s.id, externalId: product.id });
        }
      }
      return results;
    },
  };
}
