import { getDb, resolveTable } from '../lib/db.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders })
}

const HAS_PARENT = new Set(['tags'])

export async function onRequestGet(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const section = url.searchParams.get('section')
  const table = resolveTable(section)
  if (!table) return json({ error: 'Invalid section' }, 400)

  const db = getDb(env)

  if (HAS_PARENT.has(table)) {
    const result = await db.execute(`SELECT id, parent_id, data, created_at, updated_at FROM ${table} ORDER BY parent_id NULLS FIRST, created_at`)
    const items = result.rows.map(row => ({
      id: row.id,
      parent_id: row.parent_id || null,
      ...JSON.parse(row.data),
    }))
    return json(items)
  }

  const result = await db.execute(`SELECT id, data, created_at, updated_at FROM ${table} ORDER BY created_at`)
  const items = result.rows.map(row => ({
    id: row.id,
    ...JSON.parse(row.data),
  }))
  return json(items)
}

export async function onRequestPost(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const section = url.searchParams.get('section')
  const table = resolveTable(section)
  if (!table) return json({ error: 'Invalid section' }, 400)

  const body = await request.json()
  const id = body.id || uid()
  delete body.id
  const parentId = body.parent_id || null
  delete body.parent_id

  const db = getDb(env)

  if (HAS_PARENT.has(table)) {
    await db.execute({
      sql: `INSERT INTO ${table} (id, data, parent_id) VALUES (?, ?, ?)`,
      args: [id, JSON.stringify(body), parentId],
    })
    return json({ id, parent_id: parentId, ...body }, 201)
  }

  await db.execute({
    sql: `INSERT INTO ${table} (id, data) VALUES (?, ?)`,
    args: [id, JSON.stringify(body)],
  })
  return json({ id, ...body }, 201)
}

export async function onRequestPut(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const section = url.searchParams.get('section')
  const id = url.searchParams.get('id')
  const table = resolveTable(section)
  if (!table || !id) return json({ error: 'Invalid section or id' }, 400)

  const body = await request.json()
  delete body.id
  const parentId = body.parent_id ?? null
  delete body.parent_id

  const db = getDb(env)

  if (HAS_PARENT.has(table)) {
    await db.execute({
      sql: `UPDATE ${table} SET data = ?, parent_id = ?, updated_at = datetime('now') WHERE id = ?`,
      args: [JSON.stringify(body), parentId, id],
    })
    return json({ id, parent_id: parentId, ...body })
  }

  await db.execute({
    sql: `UPDATE ${table} SET data = ?, updated_at = datetime('now') WHERE id = ?`,
    args: [JSON.stringify(body), id],
  })
  return json({ id, ...body })
}

export async function onRequestDelete(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const section = url.searchParams.get('section')
  const id = url.searchParams.get('id')
  const table = resolveTable(section)
  if (!table || !id) return json({ error: 'Invalid section or id' }, 400)

  const db = getDb(env)
  await db.execute({
    sql: `DELETE FROM ${table} WHERE id = ?`,
    args: [id],
  })

  return json({ ok: true })
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
