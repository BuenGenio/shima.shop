/**
 * POST /api/page-views - Record a page view (call from store frontend)
 * GET /api/page-views - List raw page views (for export)
 */
import { getDb } from '../lib/db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function parseReferrerHost(referrer) {
  if (!referrer) return '';
  try {
    return new URL(referrer).hostname || '';
  } catch (_) {
    return '';
  }
}

export async function onRequestPost(context) {
  const { env, request } = context;
  const db = getDb(env);
  try {
    const body = (await request.json().catch(() => ({}))) || {};
    const path = body.path || new URL(request.url).searchParams.get('path') || '/';
    const referrer = body.referrer || request.headers.get('Referer') || request.headers.get('referer') || '';
    const userAgent = body.userAgent || request.headers.get('User-Agent') || request.headers.get('user-agent') || '';
    const referrerHost = parseReferrerHost(referrer);

    await db.execute({
      sql: 'INSERT INTO page_views (path, referrer, user_agent, referrer_host) VALUES (?, ?, ?, ?)',
      args: [path, referrer, userAgent, referrerHost],
    });
    return Response.json({ ok: true }, { status: 201, headers: corsHeaders });
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500, headers: corsHeaders });
  }
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  const url = new URL(context.request.url);
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';
  const q = url.searchParams.get('q') || '';
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '500', 10), 2000);

  let sql = 'SELECT id, path, referrer, user_agent, referrer_host, created_at FROM page_views WHERE 1=1';
  const args = [];
  if (from) {
    sql += ' AND created_at >= ?';
    args.push(from);
  }
  if (to) {
    sql += ' AND created_at <= ?';
    args.push(to);
  }
  if (q && q.trim()) {
    const escaped = q.trim().replace(/%/g, '\\%').replace(/_/g, '\\_');
    sql += " AND (path LIKE ? OR referrer LIKE ? OR referrer_host LIKE ?) ESCAPE '\\'";
    const like = `%${escaped}%`;
    args.push(like, like, like);
  }
  sql += ' ORDER BY created_at DESC LIMIT ?';
  args.push(limit);

  const r = await db.execute({ sql, args });
  const rows = r.rows.map((row) => ({
    id: row.id,
    path: row.path,
    referrer: row.referrer || '',
    userAgent: row.user_agent || '',
    referrerHost: row.referrer_host || '',
    createdAt: row.created_at,
  }));
  return Response.json({ pageViews: rows }, { headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
