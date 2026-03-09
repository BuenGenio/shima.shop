/**
 * GET /api/stats - Analytics dashboards data
 * Query: dashboard (page-views|origins|technology|grafana), q (fulltext), from, to
 * Returns aggregated series for charts + raw data for export
 */
import { getDb } from '../lib/db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders });
}

function parseReferrerHost(referrer) {
  if (!referrer || typeof referrer !== 'string') return '(direct)';
  try {
    const u = new URL(referrer);
    return u.hostname || '(direct)';
  } catch (_) {
    return '(direct)';
  }
}

function parseUserAgent(ua) {
  if (!ua) return { browser: 'Unknown', os: 'Unknown', device: 'Unknown' };
  const u = String(ua);
  let browser = 'Unknown';
  let os = 'Unknown';
  let device = 'Desktop';
  if (u.includes('Chrome') && !u.includes('Edg')) browser = 'Chrome';
  else if (u.includes('Firefox')) browser = 'Firefox';
  else if (u.includes('Safari') && !u.includes('Chrome')) browser = 'Safari';
  else if (u.includes('Edg')) browser = 'Edge';
  if (u.includes('Windows')) os = 'Windows';
  else if (u.includes('Mac')) os = 'macOS';
  else if (u.includes('Linux')) os = 'Linux';
  else if (u.includes('Android')) os = 'Android';
  else if (u.includes('iPhone') || u.includes('iPad')) os = 'iOS';
  if (u.includes('Mobile') || u.includes('Android')) device = 'Mobile';
  else if (u.includes('Tablet') || u.includes('iPad')) device = 'Tablet';
  return { browser, os, device };
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  const url = new URL(context.request.url);
  const dashboard = url.searchParams.get('dashboard') || 'page-views';
  const q = url.searchParams.get('q') || '';
  const from = url.searchParams.get('from') || '';
  const to = url.searchParams.get('to') || '';

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
    sql += " AND (path LIKE ? ESCAPE '\\' OR referrer LIKE ? ESCAPE '\\' OR referrer_host LIKE ? ESCAPE '\\')";
    const like = `%${escaped}%`;
    args.push(like, like, like);
  }

  const r = await db.execute({ sql: sql + ' ORDER BY created_at ASC', args });
  const rows = r.rows;

  const raw = rows.map((row) => ({
    id: row.id,
    path: row.path,
    referrer: row.referrer || '',
    referrerHost: row.referrer_host || parseReferrerHost(row.referrer),
    userAgent: row.user_agent || '',
    createdAt: row.created_at,
  }));

  if (dashboard === 'page-views') {
    const byDate = {};
    for (const r of raw) {
      const d = (r.createdAt || '').slice(0, 10);
      byDate[d] = (byDate[d] || 0) + 1;
    }
    const series = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
    const byPath = {};
    for (const r of raw) {
      byPath[r.path] = (byPath[r.path] || 0) + 1;
    }
    const breakdown = Object.entries(byPath)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([path, count]) => ({ path, count }));
    return json({ series, breakdown, raw });
  }

  if (dashboard === 'origins') {
    const byReferrer = {};
    for (const r of raw) {
      const host = r.referrerHost || parseReferrerHost(r.referrer);
      byReferrer[host] = (byReferrer[host] || 0) + 1;
    }
    const breakdown = Object.entries(byReferrer)
      .sort((a, b) => b[1] - a[1])
      .map(([source, count]) => ({ source, count }));
    const byDate = {};
    for (const r of raw) {
      const d = (r.createdAt || '').slice(0, 10);
      byDate[d] = (byDate[d] || 0) + 1;
    }
    const series = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
    return json({ series, breakdown, raw });
  }

  if (dashboard === 'technology') {
    const byBrowser = {};
    const byOs = {};
    const byDevice = {};
    for (const r of raw) {
      const tech = parseUserAgent(r.userAgent);
      byBrowser[tech.browser] = (byBrowser[tech.browser] || 0) + 1;
      byOs[tech.os] = (byOs[tech.os] || 0) + 1;
      byDevice[tech.device] = (byDevice[tech.device] || 0) + 1;
    }
    const breakdown = {
      browser: Object.entries(byBrowser).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, count: v })),
      os: Object.entries(byOs).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, count: v })),
      device: Object.entries(byDevice).sort((a, b) => b[1] - a[1]).map(([k, v]) => ({ name: k, count: v })),
    };
    const byDate = {};
    for (const r of raw) {
      const d = (r.createdAt || '').slice(0, 10);
      byDate[d] = (byDate[d] || 0) + 1;
    }
    const series = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
    return json({ series, breakdown, raw });
  }

  if (dashboard === 'grafana') {
    const byDate = {};
    for (const r of raw) {
      const d = (r.createdAt || '').slice(0, 10);
      byDate[d] = (byDate[d] || 0) + 1;
    }
    const series = Object.entries(byDate)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([date, count]) => ({ date, count }));
    return json({
      series,
      raw,
      grafana: {
        pushUrl: '/api/stats/grafana/push',
        metrics: ['page_views_total'],
      },
    });
  }

  return json({ error: 'Unknown dashboard' }, 400);
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
