# Payment Integrations

This document describes the payment method integrations implemented in shima.shop.

## Supported Payment Methods

| Provider | Checkout | Product Sync | Notes |
|----------|----------|--------------|-------|
| **Stripe** | ✅ | ✅ Products & Subscriptions | Full catalog sync |
| **Adyen** | ✅ | — | Sessions API |
| **PayPal** | ✅ | ✅ Products | Catalog Products API |
| **Airwallex** | ✅ | — | Payment Intent |
| **PayDollar** | ✅ | — | PayGate form redirect |
| **PayMe HSBC** | ✅ | — | Hong Kong |
| **AlipayHK** | ✅ | — | Hong Kong |
| **Octopus** | ✅ | — | Hong Kong |
| **2Checkout** | ✅ | — | Verifone |
| **Verifone** | ✅ | — | Cloud API |
| **monobank** | ✅ | — | Ukraine |

## Configuration

### Admin Panel

1. Go to **Admin** → **Payment Methods**
2. Set **Payment mode** to Test or Production (determines which credentials are used)
3. Enable the providers you want to use
4. Enter **Test** and **Production** credentials for each provider
5. Click **Save** per provider
6. Use **Sync Products** (Stripe, PayPal) to push your catalog

### Test vs Production

All providers support separate credential sets for test/sandbox and production:

- **Stripe**: Test keys (`sk_test_`, `pk_test_`) and production keys (`sk_live_`, `pk_live_`)
- **PayPal, PayDollar, PayMe HSBC, etc.**: Sandbox vs live credentials
- **Adyen, Airwallex**: Test vs production environment credentials

The **Payment mode** selector (or `PAYMENT_MODE` env var) controls which set is used for checkout and sync.

### Environment Variables (Fallback)

- `PAYMENT_MODE` — `test` or `production` (overrides Admin setting)
- `STRIPE_SECRET_KEY` — Fallback when Stripe not configured in Admin

### Provider-Specific Config (per mode)

Each provider stores `test` and `production` credential sets:

- **Stripe**: `secretKey`, `publishableKey` (both required for production)
- **Adyen**: `apiKey`, `merchantAccount`
- **PayPal**: `clientId`, `clientSecret`
- **Airwallex**: `clientId`, `apiKey`, `merchantAccountId` (optional)
- **PayDollar**: `merchantId`, `secureHashSecret`, `notifyUrl` (optional)
- **PayMe HSBC**: `clientId`, `clientSecret`
- **AlipayHK**: `appId`, `privateKey` (PEM)
- **Octopus**: `merchantId`, `apiKey`
- **2Checkout**: `merchantCode`, `secretKey`, `country`
- **Verifone**: `apiKey`, `entityId`
- **monobank**: `token`, `webhookUrl` (optional)

## Product & Subscription Sync

Stripe and PayPal support syncing your products and subscriptions to their catalogs:

- **Stripe**: Creates/updates Products and Prices; subscriptions create recurring prices
- **PayPal**: Creates/updates Catalog Products

Run sync from Admin → Payment Methods → **Sync Products** or **Sync All**.

API: `POST /api/payments-sync`

```json
{
  "providers": ["stripe", "paypal"],
  "syncProducts": true,
  "syncSubscriptions": true
}
```

## Checkout Flow

1. Customer selects items and clicks **Checkout**
2. If multiple payment methods are enabled, a dropdown appears
3. Request: `POST /api/checkout` with `{ kitId, selectedItems, paymentMethod? }`
4. Response: `{ url }` for redirect, or `{ url, method: "POST", formData }` for form-based (PayDollar)
5. Customer is redirected to the payment provider

## API Endpoints

- `GET /api/payments` — List providers (masked config, admin)
- `PUT /api/payments` — Update provider config
- `GET /api/payments/methods` — Public list of enabled methods (or use /api/store?sections=paymentMethods)
- `POST /api/payments-sync` — Sync products/subscriptions to providers

## Database

- `payment_gateways` — Configured payment methods (provider, environment, config, enabled)
- `product_external_ids` — Maps product_id → provider → external_id
- `subscription_external_ids` — Maps subscription_id → provider → external_id
- `settings.payment_mode` — Active mode (production | sandbox)
