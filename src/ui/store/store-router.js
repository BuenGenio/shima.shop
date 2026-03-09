/**
 * Hash-based routing for store: #kits | #product/:id | #cart
 */
export function getRoute() {
  const hash = (window.location.hash || '#kits').slice(1)
  if (hash.startsWith('product/')) {
    return { view: 'product', productId: hash.slice(8) }
  }
  if (hash === 'cart') return { view: 'cart' }
  return { view: 'kits' }
}

export function navigateTo(view, id) {
  if (view === 'product' && id) {
    window.location.hash = `product/${id}`
  } else if (view === 'cart') {
    window.location.hash = 'cart'
  } else {
    window.location.hash = 'kits'
  }
}

export function bindRouter(onRoute) {
  function handleHashChange() {
    onRoute(getRoute())
  }
  window.addEventListener('hashchange', handleHashChange)
  window.addEventListener('load', handleHashChange)
  return () => {
    window.removeEventListener('hashchange', handleHashChange)
    window.removeEventListener('load', handleHashChange)
  }
}
