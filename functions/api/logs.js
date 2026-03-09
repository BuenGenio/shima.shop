/**
 * GET /api/logs - List logs from db
 * Query params: severity, type, from, to, q, limit, offset
 * DELETE /api/logs - Purge old logs. Query params: days (e.g. 30) or before (ISO date)
 */
import { getDb } from '../lib/db.js';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
};

function parseMetadata(raw) {
  if (raw == null || raw === '') return {};
  try {
    return typeof raw === 'string' ? JSON.parse(raw) : raw;
  } catch (_) {
    return { _parseError: true, raw: String(raw).slice(0, 200) };
  }
}

export async function onRequestGet(context) {
  const db = getDb(context.env);
  const url = new URL(context.request.url);
  const severity = url.searchParams.get('severity');
  const type = url.searchParams.get('type');
  const from = url.searchParams.get('from');
  const to = url.searchParams.get('to');
  const q = url.searchParams.get('q');
  const limit = Math.min(parseInt(url.searchParams.get('limit') || '100', 10), 500);
  const offset = parseInt(url.searchParams.get('offset') || '0', 10);

  let sql = 'SELECT id, severity, type, message, metadata, source, created_at FROM logs WHERE 1=1';
  const args = [];

  if (severity) {
    sql += ' AND severity = ?';
    args.push(severity);
  }
  if (type) {
    sql += ' AND type = ?';
    args.push(type);
  }
  if (from) {
    sql += ' AND created_at >= ?';
    args.push(from);
  }
  if (to) {
    sql += ' AND created_at <= ?';
    args.push(to);
  }
  if (q && q.trim()) {
    const escaped = q.trim().replace(/\\/g, '\\\\').replace(/%/g, '\\%').replace(/_/g, '\\_');
    sql += " AND message LIKE ? ESCAPE '\\'";
    args.push(`%${escaped}%`);
  }

  sql += ' ORDER BY created_at DESC LIMIT ? OFFSET ?';
  args.push(limit, offset);

  const r = await db.execute({ sql, args });
  const logs = r.rows.map(row => ({
    id: row.id,
    severity: row.severity,
    type: row.type,
    message: row.message,
    metadata: parseMetadata(row.metadata),
    source: row.source,
    createdAt: row.created_at,
  }));

  return Response.json({ logs }, { headers: corsHeaders });
}

export async function onRequestDelete(context) {
  const db = getDb(context.env);
  const url = new URL(context.request.url);
  const days = url.searchParams.get('days');
  const before = url.searchParams.get('before');

  let cutoff;
  if (days) {
    const n = parseInt(days, 10);
    if (isNaN(n) || n < 1) {
      return Response.json({ error: 'Invalid days parameter' }, { status: 400, headers: corsHeaders });
    }
    const d = new Date();
    d.setDate(d.getDate() - n);
    cutoff = d.toISOString().slice(0, 19).replace('T', ' ');
  } else if (before) {
    try {
      const d = new Date(before);
      if (isNaN(d.getTime())) throw new Error('Invalid date');
      cutoff = d.toISOString().slice(0, 19).replace('T', ' ');
    } catch (_) {
      return Response.json({ error: 'Invalid before parameter (use ISO date)' }, { status: 400, headers: corsHeaders });
    }
  } else {
    return Response.json({ error: 'Provide days=30 or before=2024-01-01' }, { status: 400, headers: corsHeaders });
  }

  const r = await db.execute({
    sql: 'DELETE FROM logs WHERE created_at < ?',
    args: [cutoff],
  });

  const deleted = r.rowsAffected ?? 0;
  return Response.json({ ok: true, deleted }, { headers: corsHeaders });
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders });
}
