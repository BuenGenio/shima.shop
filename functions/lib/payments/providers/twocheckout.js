/**
 * 2Checkout (Verifone) payment provider.
 * Uses 2Checkout Payment API / Inline Checkout.
 */
export function createTwoCheckoutProvider(config) {
  if (!config?.merchantCode || !config?.secretKey) throw new Error('2Checkout merchant code and secret key required');
  const baseUrl = config.sandbox
    ? 'https://api.2checkout.com/rest/6.0'
    : 'https://api.2checkout.com/rest/6.0';

  return {
    id: 'twocheckout',
    name: '2Checkout',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const currency = (lineItems[0]?.currency || 'JPY').toUpperCase();
      const items = lineItems.map((item, i) => ({
        Name: item.name,
        Quantity: item.quantity || 1,
        Price: {
          Amount: (item.amount || 0) / (currency === 'JPY' ? 1 : 100),
          Type: 'CUSTOM',
          Currency: currency,
        },
        Tangible: false,
        ProductCode: item.id || `item-${i}`,
      }));

      const res = await fetch(`${baseUrl}/orders`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Avangate-Authentication': `code="${config.merchantCode}" key="${config.secretKey}"`,
        },
        body: JSON.stringify({
          Country: config.country || 'JP',
          Currency: currency,
          CustomerIP: metadata?.customerIp || '127.0.0.1',
          ExternalReference: metadata?.reference || `kit-${Date.now()}`,
          Language: 'en',
          Items: items,
          ReturnURL: successUrl || `${origin}/success.html`,
          Source: 'api',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || err.error || '2Checkout order failed');
      }
      const data = await res.json();
      const checkoutUrl = data.PaymentDetails?.PaymentURL || data.CheckoutURL || data.Url;
      return { url: checkoutUrl || `${origin}/success.html?ref=${data.RefNo}`, sessionId: data.RefNo || data.Id };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
