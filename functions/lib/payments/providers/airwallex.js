/**
 * Airwallex payment provider.
 * Uses Hosted Payment Page or Payment Intent - line items at checkout.
 */
export function createAirwallexProvider(config) {
  if (!config?.clientId || !config?.apiKey) throw new Error('Airwallex client ID and API key required');
  const baseUrl = config.environment === 'production'
    ? 'https://api.airwallex.com'
    : 'https://api-demo.airwallex.com';

  let accessToken = null;
  let tokenExpiry = 0;

  async function getAccessToken() {
    if (accessToken && Date.now() < tokenExpiry) return accessToken;
    const res = await fetch(`${baseUrl}/api/v1/authentication/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        x_client_id: config.clientId,
        x_api_key: config.apiKey,
      }),
    });
    if (!res.ok) throw new Error('Airwallex auth failed');
    const data = await res.json();
    accessToken = data.token;
    tokenExpiry = Date.now() + (data.expires_in - 60) * 1000;
    return accessToken;
  }

  return {
    id: 'airwallex',
    name: 'Airwallex',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const token = await getAccessToken();
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const currency = (lineItems[0]?.currency || 'JPY').toUpperCase();

      const res = await fetch(`${baseUrl}/api/v1/pa/payment_intents/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          request_id: `pi_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
          merchant_order_id: metadata?.reference || `kit-${Date.now()}`,
          amount: amount / (currency === 'JPY' ? 1 : 100),
          currency,
          return_url: successUrl || `${origin}/success.html`,
          ...(config.merchantAccountId && { merchant_account_id: config.merchantAccountId }),
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || err.error || 'Airwallex payment failed');
      }
      const data = await res.json();
      const hostedUrl = data.redirect_url || data.url;
      if (hostedUrl) return { url: hostedUrl, sessionId: data.id };
      return { url: `${origin}/checkout.html?intent=${data.id}`, sessionId: data.id };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
