/**
 * monobank (Ukraine) payment provider.
 * Uses monobank Acquiring API - creates invoice and returns checkout URL.
 */
export function createMonobankProvider(config) {
  if (!config?.token) throw new Error('monobank X-Token required');
  const baseUrl = 'https://api.monobank.ua';

  return {
    id: 'monobank',
    name: 'monobank',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const currency = (lineItems[0]?.currency || 'UAH').toUpperCase();
      const ref = metadata?.reference || `kit-${Date.now()}`;

      const ccyMap = { UAH: 980, USD: 840, EUR: 978, JPY: 392 };
      const ccy = ccyMap[currency] || 980;
      const amountKop = currency === 'UAH' ? Math.round(amount / 100) : Math.round(amount);

      const res = await fetch(`${baseUrl}/api/merchant/invoice/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Token': config.token,
        },
        body: JSON.stringify({
          amount: amountKop,
          ccy,
          merchantPaymInfo: {
            reference: ref,
            destination: lineItems.map(i => i.name).join(', ').slice(0, 100),
            basketOrder: lineItems.map((item, i) => ({
              name: item.name,
              qty: item.quantity || 1,
              sum: Math.round((item.amount || 0) * (item.quantity || 1) / (currency === 'JPY' ? 1 : 100)),
              unit: 'шт',
              code: item.id || `item-${i}`,
            })),
          },
          redirectUrl: successUrl || `${origin}/success.html`,
          webhookUrl: config.webhookUrl || '',
          validity: 3600,
          paymentType: 'debit',
        }),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.errText || err.message || 'monobank invoice failed');
      }
      const data = await res.json();
      const pageUrl = data.pageUrl || data.url;
      if (!pageUrl) throw new Error('monobank: no checkout URL in response');
      return { url: pageUrl, sessionId: data.invoiceId || ref };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}
