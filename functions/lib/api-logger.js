/**
 * API request/response logger. Logs based on app.settings.log-level:
 *   debug: all requests + responses
 *   info:  requests + non-2xx responses
 *   warn:  non-2xx and errors
 *   error: 5xx and handler exceptions only
 */
import { getDb } from './db.js';
import { log } from './logger.js';

const SENSITIVE_KEYS = new Set([
  'password', 'secret', 'secretKey', 'apiKey', 'clientSecret', 'token',
  'smtp_pass', 'privateKey', 'secureHashSecret',
]);

function sanitize(obj) {
  if (obj == null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) return obj.map(sanitize);
  const out = {};
  for (const [k, v] of Object.entries(obj)) {
    const lower = k.toLowerCase();
    const isSensitive = [...SENSITIVE_KEYS].some(s => lower.includes(s.toLowerCase()));
    out[k] = isSensitive ? '[REDACTED]' : sanitize(v);
  }
  return out;
}

function getDomain(pathname) {
  const m = pathname.replace(/^\/api\/?/, '').match(/^([^/]+)/);
  return m ? m[1] : 'api';
}

function severityForStatus(status, handlerError) {
  if (handlerError) return 'error';
  if (status >= 500) return 'error';
  if (status >= 400) return 'warn';
  return 'debug';
}

/**
 * Log an API request/response. Severity is derived from response status;
 * logger filters by configured log-level.
 */
export async function logApiRequest(ctx, opts) {
  const {
    url,
    method,
    requestData,
    dateStart,
    executionTimeMs,
    responseStatus,
    responseData,
    handlerError,
  } = opts;

  const pathname = typeof url === 'string' ? new URL(url, 'http://x').pathname : url.pathname;
  const domain = getDomain(pathname);
  const status = responseStatus ?? 0;
  const severity = severityForStatus(status, handlerError);

  const metadata = {
    url: typeof url === 'string' ? url : url.href,
    method: method || 'GET',
    domain,
    date_start: dateStart,
    execution_time_ms: executionTimeMs,
    response_status: status,
  };
  if (requestData != null) {
    metadata.request_data = sanitize(requestData);
  }
  if (responseData != null && status >= 400) {
    metadata.response_data = sanitize(responseData);
  }
  if (handlerError) {
    metadata.handler_error = handlerError;
  }

  const statusStr = status ? ` ${status}` : '';
  const msg = handlerError
    ? `API ${method} ${pathname} failed: ${handlerError.message}`
    : `API ${method} ${pathname}${statusStr}`;

  await log(ctx, severity, 'api', msg, metadata, domain);
}
