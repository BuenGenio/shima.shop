/**
 * Admin URL routing: hash for tab/section, searchParams for filters.
 * Examples:
 *   /admin/#products
 *   /admin/#settings-appearance
 *   /admin/#settings?severity=error&type=api&q=search
 *   /admin/#tags?scope=product
 */
const VALID_TABS = ['products', 'categories', 'kits', 'subscriptions', 'tags', 'stats', 'reports', 'settings']
const VALID_SECTIONS = ['appearance', 'mail', 'system', 'payment-methods', 'shipping', 'currencies']

export function getAdminRoute() {
  const hash = (location.hash || '').slice(1) || 'products'
  const parts = hash.split('-')
  const tabPart = parts[0]
  const sectionPart = parts.slice(1).join('-') || null
  const tab = VALID_TABS.includes(tabPart) ? tabPart : (tabPart === 'settings' && sectionPart ? 'settings' : 'products')
  const section = tab === 'settings' && sectionPart && VALID_SECTIONS.includes(sectionPart) ? sectionPart : null

  const params = Object.fromEntries(new URLSearchParams(location.search))
  return {
    tab,
    section,
    params: {
      severity: params.severity || '',
      type: params.type || '',
      q: params.q || '',
      from: params.from || '',
      to: params.to || '',
      scope: params.scope || '',
    },
  }
}

export function setAdminRoute({ tab, section, params }) {
  const hash = section ? `${tab}-${section}` : tab
  const search = new URLSearchParams()
  if (params) {
    if (params.severity) search.set('severity', params.severity)
    if (params.type) search.set('type', params.type)
    if (params.q) search.set('q', params.q)
    if (params.from) search.set('from', params.from)
    if (params.to) search.set('to', params.to)
    if (params.scope) search.set('scope', params.scope)
  }
  const query = search.toString()
  const newUrl = location.pathname + (query ? `?${query}` : '') + `#${hash}`
  history.replaceState(null, '', newUrl)
}

export function buildAdminHref(tab, section = null, params = {}) {
  const hash = section ? `${tab}-${section}` : tab
  const search = new URLSearchParams()
  if (params.severity) search.set('severity', params.severity)
  if (params.type) search.set('type', params.type)
  if (params.q) search.set('q', params.q)
  if (params.from) search.set('from', params.from)
  if (params.to) search.set('to', params.to)
  if (params.scope) search.set('scope', params.scope)
  const query = search.toString()
  return (query ? `?${query}` : '') + `#${hash}`
}
