/**
 * Adyen payment provider.
 * Uses Checkout Sessions API - line items passed at checkout (no product catalog sync).
 */
export function createAdyenProvider(config) {
  if (!config?.apiKey || !config?.merchantAccount) throw new Error('Adyen API key and merchant account required');
  const env = config.environment === 'production' ? 'live' : 'test';
  const baseUrl = `https://checkout-${env}.adyen.com`;

  return {
    id: 'adyen',
    name: 'Adyen',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const currency = lineItems[0]?.currency || 'JPY';

      const res = await fetch(`${baseUrl}/v71/sessions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-Key': config.apiKey,
        },
        body: JSON.stringify({
          merchantAccount: config.merchantAccount,
          amount: { value: Math.round(amount * 100), currency },
          returnUrl: successUrl || `${origin}/success.html`,
          reference: metadata?.reference || `kit-${Date.now()}`,
          metadata: metadata || {},
          lineItems: lineItems.map(item => ({
            quantity: item.quantity || 1,
            amountExcludingTax: Math.round((item.amount || 0) * 100),
            taxPercentage: 0,
            description: item.name,
            id: item.id,
          })),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.errorCode || 'Adyen session failed');
      }
      const data = await res.json();
      return { url: data.url || data.redirectUrl, sessionId: data.id };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
