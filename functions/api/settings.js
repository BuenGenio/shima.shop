import { getDb } from '../lib/db.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, PUT, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders })
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const key = url.searchParams.get('key')
  if (!key) return json({ error: 'Missing key' }, 400)

  const db = getDb(context.env)
  const result = await db.execute({
    sql: 'SELECT value FROM settings WHERE key = ?',
    args: [key],
  })

  if (result.rows.length === 0) return json({})
  return json(JSON.parse(result.rows[0].value))
}

export async function onRequestPut(context) {
  const url = new URL(context.request.url)
  const key = url.searchParams.get('key')
  if (!key) return json({ error: 'Missing key' }, 400)

  const body = await context.request.json()
  const db = getDb(context.env)
  await db.execute({
    sql: 'INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value',
    args: [key, JSON.stringify(body)],
  })

  return json({ ok: true })
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
