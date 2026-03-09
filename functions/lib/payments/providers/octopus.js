/**
 * Octopus (Hong Kong) payment provider.
 * Octopus is typically used for transit; e-commerce integration often via gateway (e.g. PayDollar, Adyen).
 * This adapter supports Octopus O! ePay or gateway-based Octopus acceptance.
 */
export function createOctopusProvider(config) {
  if (!config?.merchantId || !config?.apiKey) throw new Error('Octopus merchant ID and API key required');
  const baseUrl = config.sandbox
    ? 'https://sandbox.octopuscards.com/api'
    : 'https://api.octopuscards.com/api';

  return {
    id: 'octopus',
    name: 'Octopus',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const ref = metadata?.reference || `kit-${Date.now()}`;

      const res = await fetch(`${baseUrl}/v1/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`,
          'X-Merchant-Id': config.merchantId,
        },
        body: JSON.stringify({
          amount: amount / 100,
          currency: 'HKD',
          reference: ref,
          return_url: successUrl || `${origin}/success.html`,
          cancel_url: cancelUrl || `${origin}/`,
          description: lineItems.map(i => i.name).join(', ').slice(0, 200),
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Octopus payment failed');
      }
      const data = await res.json();
      return { url: data.payment_url || data.redirectUrl || data.url, sessionId: data.id || ref };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
