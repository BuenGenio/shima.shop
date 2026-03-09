/**
 * Cart: products, kits, qty, dynamic line and total prices
 */
import {
  storeState,
  updateCartItem,
  removeFromCart,
  getCartTotal,
  getCartCount,
  onCartChange,
  loadCart,
} from './store-state.js'
import { navigateTo } from './store-router.js'

const CHECKOUT_API = import.meta.env.VITE_CHECKOUT_API || '/api/checkout'

export function initCart() {
  loadCart()
  updateCartBadge()
  onCartChange(updateCartBadge)
}

function updateCartBadge() {
  const el = document.getElementById('cartCount')
  if (el) el.textContent = getCartCount()
}

export function renderCart() {
  const container = document.getElementById('cart-content')
  const view = document.getElementById('view-cart')
  if (!container || !view) return

  if (storeState.cart.length === 0) {
    container.innerHTML = `
      <div class="cart-empty">
        <p>Your cart is empty.</p>
        <a href="#kits" class="btn-cart-shop">Continue shopping</a>
      </div>
    `
    view.hidden = false
    return
  }

  const lines = storeState.cart.map(item => {
    const lineTotal = (item.price || 0) * item.qty
    const currency = item.currency === 'JPY' ? '¥' : item.currency || ''
    return `
      <div class="cart-line" data-type="${item.type}" data-id="${item.id}">
        <div class="cart-line-info">
          <span class="cart-line-name">${escapeHtml(item.name)}</span>
          <span class="cart-line-type">${item.type === 'kit' ? 'Kit' : 'Product'}</span>
        </div>
        <div class="cart-line-qty">
          <input type="number" value="${item.qty}" min="1" max="99" aria-label="Quantity for ${escapeHtml(item.name)}">
        </div>
        <div class="cart-line-price">${currency}${lineTotal}</div>
        <button type="button" class="cart-line-remove" aria-label="Remove">×</button>
      </div>
    `
  })

  const total = getCartTotal()
  const currency = storeState.cart[0]?.currency === 'JPY' ? '¥' : storeState.cart[0]?.currency || ''

  container.innerHTML = `
    <div class="cart-header">
      <h2>Cart</h2>
      <a href="#kits" class="cart-continue">Continue shopping</a>
    </div>
    <div class="cart-lines">
      ${lines.join('')}
    </div>
    <div class="cart-footer">
      <div class="cart-total">
        <span>Total</span>
        <span class="cart-total-amount">${currency}${total}</span>
      </div>
      <button type="button" class="btn-checkout-cart" id="btnCheckoutCart">Checkout</button>
    </div>
  `

  container.querySelectorAll('.cart-line').forEach(line => {
    const type = line.dataset.type
    const id = line.dataset.id
    const qtyInput = line.querySelector('input[type="number"]')
    const removeBtn = line.querySelector('.cart-line-remove')

    qtyInput?.addEventListener('change', () => {
      const qty = Math.max(0, parseInt(qtyInput.value, 10) || 0)
      updateCartItem(type, id, qty)
      renderCart()
    })

    removeBtn?.addEventListener('click', () => {
      removeFromCart(type, id)
      renderCart()
    })
  })

  const checkoutBtn = document.getElementById('btnCheckoutCart')
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCartCheckout)
  }

  view.hidden = false
}

async function handleCartCheckout() {
  const kitItems = storeState.cart.filter(c => c.type === 'kit')
  const productItems = storeState.cart.filter(c => c.type === 'product')

  if (kitItems.length === 0 && productItems.length === 0) return

  if (productItems.length > 0) {
    alert('Checkout for individual products is coming soon. For now, use kit checkout.')
    return
  }

  if (kitItems.length === 1 && productItems.length === 0) {
    const kit = kitItems[0]
    const kitData = storeState.kits.find(k => k.id === kit.id)
    if (kitData) {
      const selectedItems = kitData.items.map(i => i.id)
      try {
        const res = await fetch(CHECKOUT_API, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            kitId: kit.id,
            selectedItems,
            paymentMethod: 'stripe',
          }),
        })
        const data = await res.json()
        if (data.url) {
          window.location.href = data.url
        } else throw new Error(data.error || 'Checkout failed')
      } catch (err) {
        alert(err.message || 'Checkout failed')
      }
      return
    }
  }

  if (kitItems.length > 1) {
    alert('Multiple kits in cart: checkout one at a time for now.')
  }
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
