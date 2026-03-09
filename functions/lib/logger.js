/**
 * Application logger with configurable level and multiple drivers.
 * Settings: app.settings.log-level (debug|info|warn|error)
 *           app.settings.log-drivers (array: ["console","db"]) - multiple targets work concurrently
 * Legacy:   app.settings.log-driver (single) still supported, normalized to array
 */
import { getDb } from './db.js';

const LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const DEFAULT_LEVEL = 'info';
const VALID_DRIVERS = new Set(['console', 'db']);

function normalizeDrivers(s) {
  if (Array.isArray(s['log-drivers'])) {
    return s['log-drivers']
      .filter(d => VALID_DRIVERS.has(String(d).toLowerCase()))
      .map(d => String(d).toLowerCase());
  }
  const single = s['log-driver'] || s.logDriver;
  if (single) {
    const d = String(single).toLowerCase();
    return VALID_DRIVERS.has(d) ? [d] : ['console'];
  }
  return ['console'];
}

async function getLogSettings(db) {
  try {
    const r = await db.execute({
      sql: 'SELECT value FROM settings WHERE key = ?',
      args: ['app.settings'],
    });
    if (r.rows.length > 0) {
      const s = JSON.parse(r.rows[0].value);
      return {
        level: (s['log-level'] || s.logLevel || DEFAULT_LEVEL).toLowerCase(),
        drivers: normalizeDrivers(s),
      };
    }
  } catch (_) {}
  return { level: DEFAULT_LEVEL, drivers: ['console'] };
}

function shouldLog(configuredLevel, messageLevel) {
  const cfg = LEVELS[configuredLevel] ?? LEVELS.info;
  const msg = LEVELS[messageLevel] ?? LEVELS.info;
  return msg >= cfg;
}

async function writeToDb(db, severity, type, message, metadata = {}, source) {
  try {
    await db.execute({
      sql: `INSERT INTO logs (severity, type, message, metadata, source, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))`,
      args: [severity, type, String(message), JSON.stringify(metadata), source || null],
    });
  } catch (err) {
    console.error('[logger] Failed to write to db:', err.message);
  }
}

function writeToConsole(severity, type, message, metadata) {
  const prefix = `[${type}]`;
  const metaStr = Object.keys(metadata || {}).length ? ` ${JSON.stringify(metadata)}` : '';
  switch (severity) {
    case 'debug':
      console.debug(prefix, message, metaStr);
      break;
    case 'info':
      console.info(prefix, message, metaStr);
      break;
    case 'warn':
      console.warn(prefix, message, metaStr);
      break;
    case 'error':
      console.error(prefix, message, metaStr);
      break;
    default:
      console.log(prefix, message, metaStr);
  }
}

/**
 * Log a message. db and env are required for db driver.
 * @param {object} ctx - { db, env } - db from getDb(env)
 * @param {string} severity - debug|info|warn|error
 * @param {string} type - application|system|status|...
 * @param {string} message - Log message
 * @param {object} metadata - Optional structured data
 * @param {string} source - Optional source identifier
 */
export async function log(ctx, severity, type, message, metadata = {}, source) {
  const { db, env } = ctx || {};
  const settings = db ? await getLogSettings(db) : { level: DEFAULT_LEVEL, drivers: ['console'] };

  if (!shouldLog(settings.level, severity)) return;

  let meta = {};
  if (metadata instanceof Error) {
    meta = { error: metadata.message, stack: metadata.stack };
  } else if (metadata && typeof metadata === 'object') {
    meta = { ...metadata };
  } else if (metadata != null) {
    meta = { raw: metadata };
  }

  const drivers = settings.drivers || ['console'];
  const typeStr = type || 'application';

  if (drivers.includes('console')) {
    writeToConsole(severity, typeStr, message, meta);
  }
  if (drivers.includes('db') && db) {
    await writeToDb(db, severity, typeStr, message, meta, source);
  }
}

/**
 * Create a logger bound to a context. Returns { debug, info, warn, error }.
 */
export function createLogger(ctx) {
  return {
    debug: (type, message, metadata, source) => log(ctx, 'debug', type, message, metadata, source),
    info: (type, message, metadata, source) => log(ctx, 'info', type, message, metadata, source),
    warn: (type, message, metadata, source) => log(ctx, 'warn', type, message, metadata, source),
    error: (type, message, metadata, source) => log(ctx, 'error', type, message, metadata, source),
  };
}
