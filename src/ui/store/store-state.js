/**
 * Shared store state: products, kits, categories, tags, cart, filters
 */
export const storeState = {
  products: [],
  kits: [],
  categories: [],
  tags: [],
  tagAssignments: [],
  paymentMethods: [],
  filters: { q: '', categoryId: '', tagIds: [] },
  cart: [], // { type: 'product'|'kit', id, qty, price, currency, name, ... }
}

export function getProductTags(productId) {
  return storeState.tagAssignments
    .filter(a => a.entityType === 'products' && a.entityId === productId)
    .map(a => storeState.tags.find(t => t.id === a.tagId))
    .filter(Boolean)
}

export function getKitTags(kitId) {
  return storeState.tagAssignments
    .filter(a => a.entityType === 'kits' && a.entityId === kitId)
    .map(a => storeState.tags.find(t => t.id === a.tagId))
    .filter(Boolean)
}

export function getCategoryTags() {
  return storeState.tags.filter(t => t.scope === 'category')
}

export function getAttributeTags() {
  return storeState.tags.filter(t => t.scope === 'attribute')
}

export function addToCart(item) {
  const existing = storeState.cart.find(
    c => c.type === item.type && c.id === item.id
  )
  if (existing) {
    existing.qty += item.qty || 1
  } else {
    storeState.cart.push({ ...item, qty: item.qty || 1 })
  }
  persistCart()
  notifyCartChange()
}

export function updateCartItem(type, id, qty) {
  const item = storeState.cart.find(c => c.type === type && c.id === id)
  if (!item) return
  if (qty <= 0) {
    storeState.cart = storeState.cart.filter(c => !(c.type === type && c.id === id))
  } else {
    item.qty = qty
  }
  persistCart()
  notifyCartChange()
}

export function removeFromCart(type, id) {
  storeState.cart = storeState.cart.filter(c => !(c.type === type && c.id === id))
  persistCart()
  notifyCartChange()
}

export function getCartTotal() {
  return storeState.cart.reduce((sum, item) => sum + (item.price || 0) * item.qty, 0)
}

export function getCartCount() {
  return storeState.cart.reduce((sum, item) => sum + item.qty, 0)
}

const CART_KEY = 'shima_cart'
function persistCart() {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(storeState.cart))
  } catch (_) {}
}

export function loadCart() {
  try {
    const raw = localStorage.getItem(CART_KEY)
    if (raw) storeState.cart = JSON.parse(raw)
  } catch (_) {}
}

const listeners = []

export function onCartChange(fn) {
  listeners.push(fn)
  return () => listeners.splice(listeners.indexOf(fn), 1)
}

function notifyCartChange() {
  listeners.forEach(fn => fn())
}
