import { getDb, resolveTable } from '../lib/db.js'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders })
}

function parseTag(row) {
  return { id: row.id, parent_id: row.parent_id || null, ...JSON.parse(row.data) }
}

function buildTree(flatTags) {
  const map = {}
  const roots = []
  for (const t of flatTags) {
    map[t.id] = { ...t, children: [] }
  }
  for (const t of flatTags) {
    if (t.parent_id && map[t.parent_id]) {
      map[t.parent_id].children.push(map[t.id])
    } else {
      roots.push(map[t.id])
    }
  }
  return roots
}

export async function onRequestGet(context) {
  const url = new URL(context.request.url)
  const entityType = url.searchParams.get('entity_type')
  const entityId = url.searchParams.get('entity_id')
  const scope = url.searchParams.get('scope')
  const tagId = url.searchParams.get('tag_id')
  const descendants = url.searchParams.get('descendants')
  const tree = url.searchParams.get('tree')

  const db = getDb(context.env)

  if (descendants) {
    const result = await db.execute({
      sql: `WITH RECURSIVE tree AS (
        SELECT id, parent_id, data FROM tags WHERE id = ?
        UNION ALL
        SELECT t.id, t.parent_id, t.data FROM tags t JOIN tree ON t.parent_id = tree.id
      ) SELECT id, parent_id, data FROM tree`,
      args: [descendants],
    })
    const tags = result.rows.map(parseTag)
    return json(tree === '1' ? buildTree(tags) : tags)
  }

  if (entityType && entityId) {
    let sql = 'SELECT t.id, t.parent_id, t.data FROM tags t INNER JOIN tag_assignments ta ON ta.tag_id = t.id WHERE ta.entity_type = ? AND ta.entity_id = ?'
    const args = [entityType, entityId]

    if (scope) {
      sql += " AND json_extract(t.data, '$.scope') = ?"
      args.push(scope)
    }

    sql += ' ORDER BY t.parent_id NULLS FIRST, t.id'
    const result = await db.execute({ sql, args })
    const tags = result.rows.map(parseTag)
    return json(tags)
  }

  if (tagId) {
    const result = await db.execute({
      sql: 'SELECT entity_type, entity_id, created_at FROM tag_assignments WHERE tag_id = ? ORDER BY entity_type, entity_id',
      args: [tagId],
    })
    return json(result.rows)
  }

  if (scope) {
    const result = await db.execute({
      sql: "SELECT id, parent_id, data FROM tags WHERE json_extract(data, '$.scope') = ? ORDER BY parent_id NULLS FIRST, id",
      args: [scope],
    })
    const tags = result.rows.map(parseTag)
    return json(tree === '1' ? buildTree(tags) : tags)
  }

  const result = await db.execute('SELECT id, parent_id, data FROM tags ORDER BY parent_id NULLS FIRST, id')
  const tags = result.rows.map(parseTag)
  return json(tree === '1' ? buildTree(tags) : tags)
}

export async function onRequestPost(context) {
  const db = getDb(context.env)
  const body = await context.request.json()

  const { tag_id, entity_type, entity_id } = body
  if (!tag_id || !entity_type || !entity_id) {
    return json({ error: 'tag_id, entity_type, and entity_id are required' }, 400)
  }

  await db.execute({
    sql: 'INSERT OR IGNORE INTO tag_assignments (tag_id, entity_type, entity_id) VALUES (?, ?, ?)',
    args: [tag_id, entity_type, entity_id],
  })

  return json({ ok: true }, 201)
}

export async function onRequestDelete(context) {
  const url = new URL(context.request.url)
  const tagId = url.searchParams.get('tag_id')
  const entityType = url.searchParams.get('entity_type')
  const entityId = url.searchParams.get('entity_id')

  if (!tagId || !entityType || !entityId) {
    return json({ error: 'tag_id, entity_type, and entity_id are required' }, 400)
  }

  const db = getDb(context.env)
  await db.execute({
    sql: 'DELETE FROM tag_assignments WHERE tag_id = ? AND entity_type = ? AND entity_id = ?',
    args: [tagId, entityType, entityId],
  })

  return json({ ok: true })
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
