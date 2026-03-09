export function buildDepthMap(items) {
  const byId = {}
  for (const item of items) byId[item.id] = item
  const cache = {}
  function depth(id) {
    if (cache[id] !== undefined) return cache[id]
    const item = byId[id]
    if (!item || !item.parent_id || !byId[item.parent_id]) return (cache[id] = 0)
    return (cache[id] = 1 + depth(item.parent_id))
  }
  for (const item of items) depth(item.id)
  return cache
}

export function sortTreeItems(items) {
  const byId = {}
  const childrenOf = {}
  for (const item of items) {
    byId[item.id] = item
    const pid = item.parent_id || '__root__'
    if (!childrenOf[pid]) childrenOf[pid] = []
    childrenOf[pid].push(item)
  }
  const result = []
  function walk(parentId) {
    const children = childrenOf[parentId] || []
    for (const child of children) {
      result.push(child)
      walk(child.id)
    }
  }
  walk('__root__')
  for (const item of items) {
    if (!result.includes(item)) result.push(item)
  }
  return result
}

export function getTagPath(tagId, allTags) {
  const byId = {}
  for (const t of allTags) byId[t.id] = t
  const parts = []
  let cur = byId[tagId]
  while (cur) {
    parts.unshift(cur.name)
    cur = cur.parent_id ? byId[cur.parent_id] : null
  }
  return parts.join(' \u203A ')
}

export function groupByScope(tags) {
  const grouped = {}
  for (const t of tags) {
    const s = t.scope || 'other'
    if (!grouped[s]) grouped[s] = []
    grouped[s].push(t)
  }
  return grouped
}
