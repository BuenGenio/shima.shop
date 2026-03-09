/**
 * Application-wide middleware. Logs API requests and responses.
 * Level controls what is logged:
 *   debug: all requests + responses (2xx, 4xx, 5xx)
 *   info:  requests + non-2xx responses
 *   warn:  non-2xx responses and errors
 *   error: 5xx and handler exceptions only
 */
import { getDb } from './lib/db.js';
import { logApiRequest } from './lib/api-logger.js';

async function safeReadJson(res) {
  try {
    const clone = res.clone();
    const text = await clone.text();
    if (!text || text.length > 10000) return text ? `[${text.length} chars]` : null;
    const parsed = JSON.parse(text);
    return typeof parsed === 'object' ? parsed : text;
  } catch (_) {
    return null;
  }
}

async function apiRequestLogger(context) {
  const { request, env } = context;
  const dateStart = new Date().toISOString();
  const url = new URL(request.url);
  const method = request.method;

  let requestData = null;
  if (['POST', 'PUT', 'PATCH'].includes(method)) {
    try {
      const clone = request.clone();
      const body = await clone.json();
      requestData = body;
    } catch (_) {
      requestData = '[parse error]';
    }
  }

  let response;
  let handlerError = null;

  try {
    response = await context.next();
  } catch (err) {
    handlerError = err;
    response = new Response(
      JSON.stringify({ error: err.message || 'Internal server error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const executionTimeMs = Math.round((Date.now() - new Date(dateStart).getTime()));
  const status = response.status;
  let responseData = null;
  if (status >= 400) {
    responseData = await safeReadJson(response);
  }

  try {
    const db = getDb(env);
    await logApiRequest({ db, env }, {
      url: request.url,
      method,
      requestData,
      dateStart,
      executionTimeMs,
      responseStatus: status,
      responseData,
      handlerError: handlerError ? { message: handlerError.message, stack: handlerError.stack } : null,
    });
  } catch (err) {
    console.error('[api-logger]', err.message);
  }

  return response;
}

export const onRequest = [apiRequestLogger];
