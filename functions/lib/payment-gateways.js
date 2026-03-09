/**
 * Payment gateways DB access.
 * Reads/writes payment_gateways table and payment_mode setting.
 */

export const ENVIRONMENTS = ['production', 'sandbox', 'test'];

const SANDBOX_PROVIDERS = new Set(['paypal', 'paydollar', 'paymehsbc', 'alipayhk', 'octopus', 'twocheckout', 'verifone']);
const ENV_PROVIDERS = new Set(['adyen', 'airwallex']);

function injectEnvFlags(config, providerId, environment) {
  const resolved = { ...config };
  const isSandbox = environment === 'sandbox' || environment === 'test';
  if (SANDBOX_PROVIDERS.has(providerId)) resolved.sandbox = isSandbox;
  if (ENV_PROVIDERS.has(providerId)) resolved.environment = isSandbox ? 'test' : 'production';
  return resolved;
}

/**
 * Normalize provider environment to standard values.
 * production | sandbox | test
 */
export function normalizeEnvironment(env) {
  if (!env) return 'production';
  const e = String(env).toLowerCase();
  if (['production', 'live', 'prod'].includes(e)) return 'production';
  if (['sandbox', 'demo'].includes(e)) return 'sandbox';
  if (['test'].includes(e)) return 'test';
  return env;
}

/**
 * Get active payment mode from settings or env.
 */
export async function getPaymentMode(db, env = {}) {
  const mode = env.PAYMENT_MODE;
  if (mode === 'test' || mode === 'sandbox') return 'sandbox';
  if (mode === 'production') return 'production';
  try {
    const r = await db.execute({
      sql: 'SELECT value FROM settings WHERE key = ?',
      args: ['payment_mode'],
    });
    if (r.rows.length > 0) {
      const v = JSON.parse(r.rows[0].value);
      return normalizeEnvironment(v);
    }
  } catch (_) {}
  return 'production';
}

/**
 * List all gateways, optionally filtered by provider, environment, or deleted state.
 */
export async function listGateways(db, opts = {}) {
  const { provider, environment, enabledOnly, includeDeleted } = opts;
  let sql = 'SELECT id, provider, environment, config, enabled, created_at, updated_at, deleted_at FROM payment_gateways WHERE 1=1';
  const args = [];
  if (!includeDeleted) {
    sql += ' AND deleted_at IS NULL';
  }
  if (provider) {
    sql += ' AND provider = ?';
    args.push(provider);
  }
  if (environment) {
    sql += ' AND environment = ?';
    args.push(environment);
  }
  if (enabledOnly) {
    sql += ' AND enabled = 1';
  }
  sql += ' ORDER BY provider, environment';
  const r = await db.execute({ sql, args });
  return r.rows.map(row => ({
    id: row.id,
    provider: row.provider,
    environment: row.environment,
    config: JSON.parse(row.config || '{}'),
    enabled: !!row.enabled,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    deletedAt: row.deleted_at || null,
  }));
}

/**
 * Get config for a provider in the active mode.
 * Falls back to production if sandbox/test not found.
 * Injects sandbox/environment flags for providers that need them.
 */
export async function getGatewayConfig(db, providerId, mode, env = {}) {
  const m = normalizeEnvironment(mode || await getPaymentMode(db, env));
  const r = await db.execute({
    sql: 'SELECT config, enabled FROM payment_gateways WHERE provider = ? AND environment = ? AND deleted_at IS NULL',
    args: [providerId, m],
  });
  if (r.rows.length > 0 && r.rows[0].enabled) {
    const config = JSON.parse(r.rows[0].config || '{}');
    return injectEnvFlags(config, providerId, m);
  }
  if (m !== 'production') {
    const fallback = await db.execute({
      sql: 'SELECT config, enabled FROM payment_gateways WHERE provider = ? AND environment = ? AND deleted_at IS NULL',
      args: [providerId, 'production'],
    });
    if (fallback.rows.length > 0 && fallback.rows[0].enabled) {
      const config = JSON.parse(fallback.rows[0].config || '{}');
      return injectEnvFlags(config, providerId, 'production');
    }
  }
  return null;
}

/**
 * Upsert a gateway (provider + environment). Clears deleted_at if restoring.
 */
export async function upsertGateway(db, { provider, environment, config, enabled }) {
  const env = normalizeEnvironment(environment);
  const configStr = JSON.stringify(config || {});
  await db.execute({
    sql: `INSERT INTO payment_gateways (provider, environment, config, enabled, updated_at, deleted_at)
          VALUES (?, ?, ?, ?, datetime('now'), NULL)
          ON CONFLICT(provider, environment) DO UPDATE SET
            config = excluded.config,
            enabled = excluded.enabled,
            updated_at = datetime('now'),
            deleted_at = NULL`,
    args: [provider, env, configStr, enabled ? 1 : 0],
  });
}

/**
 * Set gateway enabled state. Creates row if not exists.
 */
export async function setGatewayEnabled(db, provider, environment, enabled) {
  const env = normalizeEnvironment(environment);
  await db.execute({
    sql: `INSERT INTO payment_gateways (provider, environment, config, enabled, updated_at)
          VALUES (?, ?, '{}', ?, datetime('now'))
          ON CONFLICT(provider, environment) DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = datetime('now')`,
    args: [provider, env, enabled ? 1 : 0],
  });
}

/**
 * Soft delete all gateway rows for a provider.
 */
export async function softDeleteGateway(db, provider) {
  await db.execute({
    sql: 'UPDATE payment_gateways SET deleted_at = datetime("now"), enabled = 0, updated_at = datetime("now") WHERE provider = ? AND deleted_at IS NULL',
    args: [provider],
  });
}

/**
 * Restore soft-deleted gateway rows for a provider.
 */
export async function restoreGateway(db, provider) {
  await db.execute({
    sql: 'UPDATE payment_gateways SET deleted_at = NULL, updated_at = datetime("now") WHERE provider = ?',
    args: [provider],
  });
}

/**
 * Hard delete gateway rows for a provider (permanent).
 */
export async function hardDeleteGateway(db, provider) {
  await db.execute({
    sql: 'DELETE FROM payment_gateways WHERE provider = ?',
    args: [provider],
  });
}

/**
 * Set global payment mode.
 */
export async function setPaymentMode(db, mode) {
  const m = normalizeEnvironment(mode);
  await db.execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: ['payment_mode', JSON.stringify(m)],
  });
}
