/**
 * GET /api/payments - list gateways and config (masked)
 * PUT /api/payments - update gateway config or payment mode
 */
import { getDb } from '../lib/db.js';
import { getProvidersWithSync, PROVIDER_IDS } from '../lib/payments/index.js';
import {
  listGateways,
  getPaymentMode,
  upsertGateway,
  setPaymentMode,
  softDeleteGateway,
  restoreGateway,
  hardDeleteGateway,
  normalizeEnvironment,
} from '../lib/payment-gateways.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function maskSecret(val) {
  if (!val || typeof val !== 'string') return '';
  if (val.length <= 8) return '****';
  return val.slice(0, 4) + '****' + val.slice(-4);
}

function maskConfig(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  return Object.fromEntries(
    Object.entries(obj).map(([k, v]) => {
      if (v && typeof v === 'object' && !Array.isArray(v)) return [k, maskConfig(v)];
      return [k, /secret|key|token|password/i.test(k) ? maskSecret(v) : v];
    })
  );
}

/** Build providers list from gateways, grouped by provider */
function gatewaysToProviders(gateways) {
  const byProvider = {};
  for (const g of gateways) {
    if (!byProvider[g.provider]) {
      byProvider[g.provider] = {
        id: g.provider,
        enabled: false,
        hasSync: getProvidersWithSync().includes(g.provider),
        config: { test: {}, production: {} },
        deletedAt: g.deletedAt || null,
      };
    }
    const env = normalizeEnvironment(g.environment);
    const key = env === 'production' ? 'production' : 'test';
    byProvider[g.provider].config[key] = maskConfig(g.config);
    if (g.enabled) byProvider[g.provider].enabled = true;
    if (g.deletedAt) byProvider[g.provider].deletedAt = g.deletedAt;
  }
  return PROVIDER_IDS.map(id => ({
    id,
    enabled: !!byProvider[id]?.enabled,
    hasSync: getProvidersWithSync().includes(id),
    config: byProvider[id]?.config ?? { test: {}, production: {} },
    deletedAt: byProvider[id]?.deletedAt ?? null,
  }));
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  const url = new URL(context.request.url);
  const includeDeleted = url.searchParams.get('deleted') === '1';
  const gateways = await listGateways(db, { includeDeleted });
  const paymentMode = await getPaymentMode(db, context.env);
  const providers = gatewaysToProviders(gateways);
  return json({ paymentMode, providers });
}

function deepMergeConfig(existing, incoming) {
  const merged = { ...existing };
  for (const [k, v] of Object.entries(incoming || {})) {
    if (v === '' || v === undefined) continue;
    if (/secret|key|token|password/i.test(k) && typeof v === 'string' && v.includes('****')) continue;
    if (v && typeof v === 'object' && !Array.isArray(v) && (k === 'test' || k === 'production')) {
      merged[k] = deepMergeConfig(merged[k] || {}, v);
    } else {
      merged[k] = v;
    }
  }
  return merged;
}

export async function onRequestPut(context) {
  const { env, request } = context;
  const body = await request.json();
  const db = getDb(env);

  const { providerId, enabled, config, paymentMode, restore } = body;

  if (paymentMode !== undefined) {
    await setPaymentMode(db, paymentMode);
  }

  if (providerId && restore) {
    await restoreGateway(db, providerId);
    return json({ ok: true, providerId, restored: true });
  }

  if (providerId) {
    if (!PROVIDER_IDS.includes(providerId)) return json({ error: `Unknown provider: ${providerId}` }, 400);

    const gateways = await listGateways(db, { provider: providerId, includeDeleted: true });
    const existing = {};
    for (const g of gateways) {
      const key = normalizeEnvironment(g.environment) === 'production' ? 'production' : 'test';
      existing[key] = g.config;
    }
    const merged = deepMergeConfig(existing, config);

    const newEnabled = enabled !== undefined ? !!enabled : gateways.some(g => g.enabled);

    for (const env of ['production', 'sandbox']) {
      const key = env === 'production' ? 'production' : 'test';
      const cfg = merged[key] || {};
      await upsertGateway(db, {
        provider: providerId,
        environment: env,
        config: cfg,
        enabled: newEnabled,
      });
    }
  }

  return json({ ok: true, providerId: providerId || null });
}

export async function onRequestDelete(context) {
  const { env, request } = context;
  const url = new URL(request.url);
  const providerId = url.searchParams.get('providerId');
  const hard = url.searchParams.get('hard') === '1';
  if (!providerId) return json({ error: 'providerId required' }, 400);
  if (!PROVIDER_IDS.includes(providerId)) return json({ error: `Unknown provider: ${providerId}` }, 400);

  const db = getDb(env);
  if (hard) {
    await hardDeleteGateway(db, providerId);
    return json({ ok: true, providerId, mode: 'hard' });
  }
  await softDeleteGateway(db, providerId);
  return json({ ok: true, providerId, mode: 'soft' });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
