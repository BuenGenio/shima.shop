/**
 * AlipayHK payment provider.
 * Integrate via Adyen (recommended) or direct Alipay Open Platform.
 * For direct integration: appId, privateKey (PEM), gatewayUrl.
 */
export function createAlipayHKProvider(config) {
  if (!config?.appId) throw new Error('AlipayHK app ID required');
  const baseUrl = config.gatewayUrl || (config.sandbox
    ? 'https://openapi-sandbox.dl.alipaydev.com/gateway.do'
    : 'https://openapi.alipay.com/gateway.do');

  return {
    id: 'alipayhk',
    name: 'AlipayHK',
    async createCheckout({ lineItems, successUrl, cancelUrl, metadata, origin }) {
      const amount = lineItems.reduce((sum, i) => sum + (i.amount || 0) * (i.quantity || 1), 0);
      const subject = lineItems.map(i => i.name).join(', ').slice(0, 256);
      const outTradeNo = metadata?.reference || `kit-${Date.now()}`;

      const bizContent = {
        out_trade_no: outTradeNo,
        total_amount: (amount / 100).toFixed(2),
        subject,
        product_code: 'FAST_INSTANT_TRADE_PAY',
        return_url: successUrl || `${origin}/success.html`,
      };

      const params = {
        app_id: config.appId,
        method: 'alipay.trade.page.pay',
        charset: 'utf-8',
        sign_type: 'RSA2',
        timestamp: new Date().toISOString().replace(/\.\d{3}Z$/, 'Z'),
        version: '1.0',
        biz_content: JSON.stringify(bizContent),
      };

      if (config.privateKey) {
        const signStr = Object.keys(params).sort().map(k => `${k}=${params[k]}`).join('&');
        const sig = await signRSA2(signStr, config.privateKey);
        params.sign = sig;
      } else if (config.partnerGatewayUrl) {
        return {
          url: config.partnerGatewayUrl,
          method: 'POST',
          formData: { ...params, ...config.partnerExtraParams },
          sessionId: outTradeNo,
        };
      } else {
        throw new Error('AlipayHK: provide privateKey or partnerGatewayUrl');
      }

      return { url: `${baseUrl}?${new URLSearchParams(params)}`, sessionId: outTradeNo };
    },

    syncProducts: null,
    syncSubscriptions: null,
  };
}

async function signRSA2(data, pemKey) {
  const pem = pemKey.replace(/-----BEGIN.*?-----|-----END.*?-----|\s/g, '');
  const binary = Uint8Array.from(atob(pem), c => c.charCodeAt(0));
  const key = await crypto.subtle.importKey('pkcs8', binary, { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['sign']);
  const sig = await crypto.subtle.sign('RSASSA-PKCS1-v1_5', key, new TextEncoder().encode(data));
  return btoa(String.fromCharCode(...new Uint8Array(sig)));
}
