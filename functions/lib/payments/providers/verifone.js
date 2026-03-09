/**
 * Verifone payment provider.
 * Verifone Cloud / 2Checkout (Verifone acquired 2Checkout).
 * Supports Verifone eCommerce API for online payments.
 */
export function createVerifoneProvider(config) {
  if (!config?.apiKey || !config?.entityId) throw new Error('Verifone API key and entity ID required');
  const baseUrl = config.sandbox
    ? 'https://test.api.verifone.com'
    : 'https://api.verifone.com';

  return {
    id: 'verifone',
    name: 'Verifone',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const currency = (lineItems[0]?.currency || 'JPY').toUpperCase();
      const ref = metadata?.reference || `kit-${Date.now()}`;

      const res = await fetch(`${baseUrl}/v2/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Entity-Id': config.entityId,
        },
        body: JSON.stringify({
          amount: amount / (currency === 'JPY' ? 1 : 100),
          currency,
          reference: ref,
          return_url: successUrl || `${origin}/success.html`,
          cancel_url: cancelUrl || `${origin}/`,
          description: lineItems.map(i => i.name).join(', ').slice(0, 200),
          line_items: lineItems.map(item => ({
            name: item.name,
            quantity: item.quantity || 1,
            unit_amount: (item.amount || 0) / (currency === 'JPY' ? 1 : 100),
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || 'Verifone payment failed');
      }
      const data = await res.json();
      return { url: data.redirect_url || data.payment_url || data.url, sessionId: data.id || ref };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
