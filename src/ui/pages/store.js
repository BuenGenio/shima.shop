import { svgZipBag, svgBaggie, svgCheck, CONTAINER_SVG } from '../components/icons.js'
import { storeState, getKitTags, addToCart } from '../store/store-state.js'
import { initSearchPanel } from '../store/search-panel.js'
import { bindRouter } from '../store/store-router.js'
import { renderProductPage } from '../store/product-page.js'
import { renderCart, initCart } from '../store/cart.js'

const CHECKOUT_API = import.meta.env.VITE_CHECKOUT_API || '/api/checkout'

let PAYMENT_METHODS = []
const state = { expanded: null, paymentMethod: 'stripe' }

function getFilteredKits() {
  let kits = storeState.kits
  const { q, categoryId, tagIds } = storeState.filters

  if (q && q.length >= 2) {
    const lower = q.toLowerCase()
    kits = kits.filter(
      k =>
        (k.name || '').toLowerCase().includes(lower) ||
        (k.tagline || '').toLowerCase().includes(lower) ||
        (k.items || []).some(i => (i.name || '').toLowerCase().includes(lower))
    )
  }

  if (categoryId) {
    kits = kits.filter(k => {
      const tags = getKitTags(k.id)
      return tags.some(t => t.id === categoryId)
    })
  }

  if (tagIds && tagIds.length > 0) {
    kits = kits.filter(k => {
      const tags = getKitTags(k.id)
      return tagIds.some(tid => tags.some(t => t.id === tid))
    })
  }

  return kits
}

export async function initStore() {
  try {
    const storeRes = await fetch('/api/store?sections=products,kits,categories,tags,tagAssignments,paymentMethods')
    if (storeRes.ok) {
      const data = await storeRes.json()
      const isLegacy = Array.isArray(data)
      storeState.kits = isLegacy ? data : (data.kits ?? [])
      storeState.products = isLegacy ? [] : (data.products ?? [])
      storeState.categories = isLegacy ? [] : (data.categories ?? [])
      storeState.tags = isLegacy ? [] : (data.tags ?? [])
      storeState.tagAssignments = isLegacy ? [] : (data.tagAssignments ?? [])
      PAYMENT_METHODS = isLegacy ? [] : (data.paymentMethods ?? [])
      if (PAYMENT_METHODS.length > 0 && !PAYMENT_METHODS.find(m => m.id === state.paymentMethod)) {
        state.paymentMethod = PAYMENT_METHODS[0].id
      }
    }
  } catch {
    // API unavailable
  }

  initCart()
  initSearchPanel(() => renderKits())

  function applyRoute(route) {
    document.getElementById('view-kits')?.setAttribute('hidden', '')
    document.getElementById('view-product')?.setAttribute('hidden', '')
    document.getElementById('view-cart')?.setAttribute('hidden', '')

    if (route.view === 'product') {
      renderProductPage(route.productId)
    } else if (route.view === 'cart') {
      renderCart()
    } else {
      document.getElementById('view-kits')?.removeAttribute('hidden')
      renderKits()
    }
  }

  bindRouter(applyRoute)

  const route = (() => {
    const hash = (window.location.hash || '#kits').slice(1)
    if (hash.startsWith('product/')) return { view: 'product', productId: hash.slice(8) }
    if (hash === 'cart') return { view: 'cart' }
    return { view: 'kits' }
  })()
  applyRoute(route)
}

export async function renderKits() {
  const grid = document.getElementById('kits-grid')
  if (!grid) return

  const kits = getFilteredKits()

  if (kits.length === 0) {
    const hasFilters = storeState.filters.q || storeState.filters.categoryId || (storeState.filters.tagIds && storeState.filters.tagIds.length > 0)
    grid.innerHTML = '<p class="kits-empty">' + (hasFilters ? 'No kits match your filters. <a href="#" id="clearFilters" class="kits-clear-filters">Clear filters</a>' : 'No kits available.') + '</p>'
    const clearBtn = document.getElementById('clearFilters')
    if (clearBtn) {
      clearBtn.addEventListener('click', e => {
        e.preventDefault()
        storeState.filters.q = ''
        storeState.filters.categoryId = ''
        storeState.filters.tagIds = []
        const searchInput = document.getElementById('searchInput')
        const categorySelect = document.getElementById('filterCategory')
        const tagCheckboxes = document.querySelectorAll('.filter-tags-list input:checked')
        if (searchInput) searchInput.value = ''
        if (categorySelect) categorySelect.value = ''
        tagCheckboxes.forEach(cb => { cb.checked = false })
        const tagsCount = document.getElementById('filterTagsCount')
        if (tagsCount) tagsCount.textContent = ''
        renderKits()
      })
    }
    return
  }

  grid.innerHTML = kits.map(k => renderKitCard(k)).join('')
  bindEvents()
}

function renderKitCard(kit) {
  const itemsHtml = renderItems(kit)
  const selectedCount = kit.items.filter(i => i.selected).length
  const totalItems = kit.items.length
  const isExpanded = state.expanded === kit.id

  return `
    <article class="kit-card ${isExpanded ? 'expanded' : ''}"
         data-kit="${kit.id}"
         role="listitem"
         style="--kit-accent: ${kit.accent}; --kit-accent-light: ${kit.accentLight}">
      <div class="kit-bag" data-action="toggle" data-kit="${kit.id}"
           role="button" tabindex="0"
           aria-expanded="${isExpanded}"
           aria-controls="kit-contents-${kit.id}"
           aria-label="${escapeHtml(kit.name)}: ${escapeHtml(kit.tagline)}, ${kit.currency}${kit.price}. Activate to ${isExpanded ? 'collapse' : 'expand'}.">
        <div class="kit-bag-svg" aria-hidden="true">${svgZipBag()}</div>
        <div class="kit-info">
          <h2 class="kit-name">${escapeHtml(kit.name)}</h2>
          <p class="kit-tagline">${escapeHtml(kit.tagline)}</p>
          <p class="kit-price">${kit.currency}${kit.price}</p>
          <span class="kit-cta" aria-hidden="true">Click to open</span>
        </div>
      </div>
      <div class="kit-contents" id="kit-contents-${kit.id}" role="region" aria-label="${escapeHtml(kit.name)} items"${isExpanded ? '' : ' hidden'}>
        <div class="kit-items" role="list" aria-label="Items in ${escapeHtml(kit.name)}">${itemsHtml}</div>
        <div class="kit-footer">
          <span class="kit-selected-count" aria-live="polite">
            <strong id="count-${kit.id}">${selectedCount}</strong> / ${totalItems} selected
          </span>
          <span class="kit-total" id="total-${kit.id}" aria-live="polite" aria-label="Total price">
            ${kit.currency}${kit.price}
          </span>
          <label class="kit-qty-label" aria-label="Quantity">
            <span>Qty</span>
            <input type="number" class="kit-qty-input" data-kit="${kit.id}" value="1" min="1" max="99">
          </label>
          <button type="button" class="btn-add-kit-cart" data-action="add-kit" data-kit="${kit.id}">Add to cart</button>
          ${PAYMENT_METHODS.length > 1 ? `
          <label class="kit-payment-method" aria-label="Payment method">
            <select class="payment-method-select" data-action="payment-method" aria-label="Choose payment method">
              ${PAYMENT_METHODS.map(m => `<option value="${m.id}" ${state.paymentMethod === m.id ? 'selected' : ''}>${escapeHtml(m.name)}</option>`).join('')}
            </select>
          </label>
          ` : ''}
          <button class="btn-checkout" data-action="checkout" data-kit="${kit.id}">
            <svg viewBox="0 0 16 16" fill="none" aria-hidden="true"><path d="M1 1h2l1.5 8h8L15 3H4.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/><circle cx="6" cy="13" r="1.2" fill="currentColor"/><circle cx="11.5" cy="13" r="1.2" fill="currentColor"/></svg>
            Checkout
          </button>
        </div>
      </div>
    </article>`
}

function renderItems(kit) {
  let html = ''
  const blends = kit.items.filter(i => i.form === 'blend')
  const regular = kit.items.filter(i => i.form !== 'blend')

  regular.forEach(item => { html += renderItem(kit, item) })

  if (blends.length) {
    html += '<div class="kit-separator"></div>'
    html += '<div class="kit-separator-label">Speciosa Replacement Blend</div>'
    blends.forEach(item => { html += renderItem(kit, item) })
  }

  return html
}

function renderItem(kit, item) {
  const iconHtml = item.image
    ? '<img src="' + escapeHtml(item.image) + '" alt="' + escapeHtml(item.name) + '">'
    : (CONTAINER_SVG[item.container] || svgBaggie)()

  const componentsHtml = item.components
    ? '<div class="item-components">' + item.components.map(c =>
        '<span class="item-component">' + escapeHtml(c.name) + (c.dose ? ' ' + c.dose : '') + '</span>'
      ).join('') + '</div>'
    : ''

  const doseHtml = item.dose ? '<span class="item-dose">' + escapeHtml(item.dose) + '</span>' : ''


  const formTag = item.form && item.form !== 'blend'
    ? '<span class="item-form-tag">' + escapeHtml(item.form) + '</span>'
    : item.form === 'blend'
    ? '<span class="item-form-tag">blend</span>'
    : ''

  const a11yName = (item.selected ? 'Deselect' : 'Select') + ' ' + item.name + (item.dose ? ' ' + item.dose : '')

  return `
    <div class="kit-item ${item.selected ? '' : 'deselected'}" data-item="${item.id}" data-kit="${kit.id}" role="listitem">
      <label class="item-check">
        <input type="checkbox" ${item.selected ? 'checked' : ''}
               aria-label="${escapeHtml(a11yName)}"
               data-action="select" data-kit="${kit.id}" data-item="${item.id}">
        <span class="check-box" aria-hidden="true">${svgCheck()}</span>
      </label>
      <div class="item-icon" aria-hidden="true">${iconHtml}</div>
      <div class="item-info">
        <a href="#product/${item.id}" class="item-name-link"><span class="item-name">${escapeHtml(item.name)} ${formTag}</span></a>
        ${doseHtml}
        ${componentsHtml}
      </div>
      <span class="item-price">${kit.currency}${item.price}</span>
    </div>`
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function bindEvents() {
  document.querySelectorAll('[data-action="toggle"]').forEach(toggle => {
    function activate(e) {
      if (e.target.closest('[data-action="select"]')) return
      if (e.target.closest('[data-action="checkout"]')) return
      if (e.target.closest('[data-action="add-kit"]')) return
      toggleKit(toggle.dataset.kit)
    }
    toggle.addEventListener('click', activate)
    toggle.addEventListener('keydown', e => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault()
        activate(e)
      }
    })
  })

  document.querySelectorAll('[data-action="select"]').forEach(el => {
    el.addEventListener('change', e => {
      e.stopPropagation()
      toggleItem(el.dataset.kit, el.dataset.item, el.checked)
    })
  })

  document.querySelectorAll('[data-action="add-kit"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      const kit = storeState.kits.find(k => k.id === btn.dataset.kit)
      if (!kit) return
      const qtyInput = btn.closest('.kit-footer')?.querySelector('.kit-qty-input')
      const qty = Math.max(1, parseInt(qtyInput?.value || 1, 10) || 1)
      addToCart({
        type: 'kit',
        id: kit.id,
        name: kit.name,
        price: kit.price,
        currency: kit.currency,
        qty,
      })
      btn.textContent = 'Added!'
      setTimeout(() => { btn.textContent = 'Add to cart' }, 1500)
    })
  })

  document.querySelectorAll('[data-action="checkout"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      handleCheckout(btn.dataset.kit)
    })
  })

  document.querySelectorAll('[data-action="payment-method"]').forEach(sel => {
    sel.addEventListener('change', e => {
      state.paymentMethod = e.target.value
    })
  })
}

function toggleKit(kitId) {
  state.expanded = state.expanded === kitId ? null : kitId
  const grid = document.getElementById('kits-grid')
  const kits = getFilteredKits()
  grid.innerHTML = kits.map(k => renderKitCard(k)).join('')
  bindEvents()
}

function toggleItem(kitId, itemId, checked) {
  const kit = storeState.kits.find(k => k.id === kitId)
  if (!kit) return
  const item = kit.items.find(i => i.id === itemId)
  if (!item) return

  item.selected = checked

  const row = document.querySelector('.kit-item[data-item="' + itemId + '"][data-kit="' + kitId + '"]')
  if (row) row.classList.toggle('deselected', !checked)

  updateFooter(kit)
}

function updateFooter(kit) {
  const selected = kit.items.filter(i => i.selected)
  const countEl = document.getElementById('count-' + kit.id)
  const totalEl = document.getElementById('total-' + kit.id)

  if (countEl) countEl.textContent = selected.length
  if (totalEl) {
    const sum = selected.reduce((s, i) => s + i.price, 0)
    totalEl.textContent = kit.currency + (selected.length === kit.items.length ? kit.price : sum)
  }
}

async function handleCheckout(kitId) {
  const kit = storeState.kits.find(k => k.id === kitId)
  if (!kit) return

  const selectedItems = kit.items.filter(i => i.selected).map(i => i.id)
  if (selectedItems.length === 0) return

  const btn = document.querySelector('.btn-checkout[data-kit="' + kitId + '"]')
  if (btn) {
    btn.disabled = true
    btn.textContent = 'Redirecting…'
  }

  try {
    const res = await fetch(CHECKOUT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        kitId,
        selectedItems,
        paymentMethod: state.paymentMethod,
      }),
    })

    const data = await res.json()
    if (data.url) {
      if (data.method === 'POST' && data.formData) {
        const form = document.createElement('form')
        form.method = 'POST'
        form.action = data.url
        for (const [k, v] of Object.entries(data.formData)) {
          const inp = document.createElement('input')
          inp.type = 'hidden'
          inp.name = k
          inp.value = String(v)
          form.appendChild(inp)
        }
        document.body.appendChild(form)
        form.submit()
      } else {
        window.location.href = data.url
      }
    } else {
      throw new Error(data.error || 'Checkout failed')
    }
  } catch (err) {
    console.error('Checkout failed:', err)
    if (btn) {
      btn.disabled = false
      btn.textContent = 'Checkout'
    }
    alert(err.message || 'Checkout failed. Please try again.')
  }
}
