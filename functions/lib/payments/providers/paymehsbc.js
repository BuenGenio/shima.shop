/**
 * PayMe by HSBC (Hong Kong) payment provider.
 * Creates payment request and returns PayCode/URL for customer to pay.
 */
export function createPayMeHSBCProvider(config) {
  if (!config?.clientId || !config?.clientSecret) throw new Error('PayMe HSBC client ID and secret required');
  const baseUrl = config.sandbox
    ? 'https://sandbox.api.payme.hsbc.com.hk'
    : 'https://api.payme.hsbc.com.hk';

  async function signRequest(method, path, body, timestamp) {
    const message = `(request-target): ${method.toLowerCase()} ${path}\ndate: ${timestamp}`;
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(config.clientSecret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(message));
    return btoa(String.fromCharCode(...new Uint8Array(sig)));
  }

  return {
    id: 'paymehsbc',
    name: 'PayMe HSBC',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const currency = (lineItems[0]?.currency || 'HKD').toUpperCase();
      const ref = metadata?.reference || `kit-${Date.now()}`;

      const timestamp = new Date().toUTCString();
      const path = '/v1/payment-requests';
      const body = {
        amount: amount / (currency === 'JPY' ? 1 : 100),
        currency,
        reference: ref,
        returnUrl: successUrl || `${origin}/success.html`,
        cancelUrl: cancelUrl || `${origin}/`,
        description: lineItems.map(i => i.name).join(', ').slice(0, 200),
      };

      const signature = await signRequest('POST', path, body, timestamp);

      const res = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Date': timestamp,
          'Authorization': `Signature keyId="${config.clientId}",algorithm="hmac-sha256",signature="${signature}"`,
        },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'PayMe HSBC payment request failed');
      }
      const data = await res.json();
      return { url: data.paymentUrl || data.redirectUrl || data.url, sessionId: data.id || ref };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
