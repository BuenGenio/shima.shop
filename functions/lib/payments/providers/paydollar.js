/**
 * PayDollar (AsiaPay) payment provider.
 * Uses PayGate redirect - form POST to PayDollar hosted page.
 */
export function createPayDollarProvider(config) {
  if (!config?.merchantId || !config?.secureHashSecret) throw new Error('PayDollar merchant ID and secure hash secret required');
  const baseUrl = config.sandbox
    ? 'https://test.paydollar.com/b2cDemo/eng/payment/payForm.jsp'
    : 'https://www.paydollar.com/b2c2/eng/payment/payForm.jsp';

  async function buildSecureHash(params, secret) {
    const str = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
    const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(str));
    return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  return {
    id: 'paydollar',
    name: 'PayDollar',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const currency = (lineItems[0]?.currency || 'JPY').toUpperCase();
      const orderRef = metadata?.reference || `kit-${Date.now()}`;
      const amountVal = currency === 'JPY' ? (amount / 1).toFixed(0) : (amount / 100).toFixed(2);

      const params = {
        merId: config.merchantId,
        orderRef,
        amount: amountVal,
        currCode: currency === 'JPY' ? '392' : '840',
        payType: 'N',
        lang: 'E',
        successUrl: successUrl || `${origin}/success.html`,
        failUrl: cancelUrl || `${origin}/`,
        cancelUrl: cancelUrl || `${origin}/`,
        notifyUrl: config.notifyUrl || '',
        payMethod: 'ALL',
      };

      const secureHash = await buildSecureHash(params, config.secureHashSecret);
      params.secureHash = secureHash;

      return {
        url: baseUrl,
        method: 'POST',
        formData: params,
        sessionId: orderRef,
      };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
