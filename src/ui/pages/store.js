import { svgZipBag, svgBaggie, svgCheck, CONTAINER_SVG } from '../components/icons.js'

const CHECKOUT_API = import.meta.env.VITE_CHECKOUT_API
  || 'https://adhd-stack-checkout.adhd-stack.workers.dev'

const KITS = [
  {
    id: 'cookies',
    name: 'Cookies',
    price: 78800,
    currency: '¥',
    accent: '#8B5E3C',
    accentLight: '#faf3ed',
    tagline: 'Protein · Gluten-Free · Made in Japan',
    bundlePriceId: null,
    items: [
      { id: 'variety-6pack',         name: 'Protein Cookie Variety 6-Pack',  dose: '',              form: null, container: 'cookie', price: 2000,  selected: true, image: null, priceId: null },
      { id: 'cinnamon-almond-12',    name: 'Cinnamon & Almond',             dose: '12 Cookie Set', form: null, container: 'cookie', price: 3360,  selected: true, image: null, priceId: null },
      { id: 'double-choc-12',        name: 'Double Chocolate',              dose: '12 Cookie Set', form: null, container: 'cookie', price: 3360,  selected: true, image: null, priceId: null },
      { id: 'chunk-choc-walnut-12',  name: 'Chunk Chocolate & Walnut',      dose: '12 Cookie Set', form: null, container: 'cookie', price: 3360,  selected: true, image: null, priceId: null },
      { id: 'chocolate-set',         name: 'Protein Cookie Set — Chocolate', dose: '',             form: null, container: 'cookie', price: 3000,  selected: true, image: null, priceId: null },
      { id: 'breakfast-granola-12',  name: 'Breakfast Granola',              dose: '12 Cookie Set', form: null, container: 'cookie', price: 3360,  selected: true, image: null, priceId: null },
      { id: 'double-choc-6',         name: 'Double Chocolate',              dose: '6 Cookies',     form: null, container: 'cookie', price: 1980,  selected: true, image: null, priceId: null },
      { id: 'breakfast-granola-6',   name: 'Breakfast Granola',             dose: '6 Cookies',     form: null, container: 'cookie', price: 1980,  selected: true, image: null, priceId: null },
      { id: 'matcha-macadamia-6',    name: 'Matcha & Macadamia',            dose: '6 Cookies',     form: null, container: 'cookie', price: 1980,  selected: true, image: null, priceId: null },
      { id: 'mix-set-12',            name: 'Protein Cookies Mix Set',       dose: '12 Cookies',    form: null, container: 'cookie', price: 3000,  selected: true, image: null, priceId: null },
      { id: 'bulk-mix-set',          name: 'Protein Cookies Bulk Mix Set',  dose: '8 Cookies',     form: null, container: 'cookie', price: 5700,  selected: true, image: null, priceId: null },
      { id: 'double-choc-24',        name: 'Double Chocolate',              dose: '24 Cookies',    form: null, container: 'cookie', price: 6420,  selected: true, image: null, priceId: null },
      { id: 'breakfast-granola-24',  name: 'Breakfast Granola',             dose: '24 Cookies',    form: null, container: 'cookie', price: 6420,  selected: true, image: null, priceId: null },
      { id: 'matcha-macadamia-24',   name: 'Matcha & Macadamia',            dose: '24 Cookies',    form: null, container: 'cookie', price: 6420,  selected: true, image: null, priceId: null },
      { id: 'cinnamon-almond-6',     name: 'Cinnamon & Almond',             dose: '6 Cookies',     form: null, container: 'cookie', price: 1980,  selected: true, image: null, priceId: null },
      { id: 'chunky-choc-walnut-6',  name: 'Chunky Choc & Walnut',          dose: '6 pieces',      form: null, container: 'cookie', price: 1980,  selected: true, image: null, priceId: null },
      { id: 'salted-caramel-choc',   name: 'Salted Caramel & Chocolate',    dose: '',              form: null, container: 'cookie', price: 1980,  selected: true, image: null, priceId: null },
      { id: 'trial-set',             name: 'Protein Cookie Trial Set',      dose: '6 Cookies',     form: null, container: 'cookie', price: 2100,  selected: true, image: null, priceId: null },
      { id: 'white-day-limited',     name: 'White Day Limited Edition',     dose: '6 Cookies',     form: null, container: 'cookie', price: 2100,  selected: true, image: null, priceId: null },
      { id: 'salted-caramel-choc-12', name: 'Salted Caramel & Chocolate',   dose: '12 Cookie Set', form: null, container: 'cookie', price: 3360,  selected: true, image: null, priceId: null },
      { id: 'matcha-macadamia-12',   name: 'Matcha & Macadamia',            dose: '12 Cookie Set', form: null, container: 'cookie', price: 3360,  selected: true, image: null, priceId: null },
      { id: 'bulk-48',               name: '業務用クッキー',                   dose: '48枚',          form: null, container: 'cookie', price: 9600,  selected: true, image: null, priceId: null },
    ],
  },
]

const state = { expanded: null }

export function renderKits() {
  const grid = document.getElementById('kits-grid')
  grid.innerHTML = KITS.map(renderKitCard).join('')
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
           aria-label="${kit.name}: ${kit.tagline}, ${kit.currency}${kit.price}. Activate to ${isExpanded ? 'collapse' : 'expand'}.">
        <div class="kit-bag-svg" aria-hidden="true">${svgZipBag()}</div>
        <div class="kit-info">
          <h2 class="kit-name">${kit.name}</h2>
          <p class="kit-tagline">${kit.tagline}</p>
          <p class="kit-price">${kit.currency}${kit.price}</p>
          <span class="kit-cta" aria-hidden="true">Click to open</span>
        </div>
      </div>
      <div class="kit-contents" id="kit-contents-${kit.id}" role="region" aria-label="${kit.name} items"${isExpanded ? '' : ' hidden'}>
        <div class="kit-items" role="list" aria-label="Items in ${kit.name}">${itemsHtml}</div>
        <div class="kit-footer">
          <span class="kit-selected-count" aria-live="polite">
            <strong id="count-${kit.id}">${selectedCount}</strong> / ${totalItems} selected
          </span>
          <span class="kit-total" id="total-${kit.id}" aria-live="polite" aria-label="Total price">
            ${kit.currency}${kit.price}
          </span>
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
    html += `<div class="kit-separator"></div>`
    html += `<div class="kit-separator-label">Speciosa Replacement Blend</div>`
    blends.forEach(item => { html += renderItem(kit, item) })
  }

  return html
}

function renderItem(kit, item) {
  const iconHtml = item.image
    ? `<img src="${item.image}" alt="${item.name}">`
    : (CONTAINER_SVG[item.container] || svgBaggie)()

  const componentsHtml = item.components
    ? `<div class="item-components">
        ${item.components.map(c =>
          `<span class="item-component">${c.name}${c.dose ? ' ' + c.dose : ''}</span>`
        ).join('')}
       </div>`
    : ''

  const doseHtml = item.dose
    ? `<span class="item-dose">${item.dose}</span>`
    : ''

  const formTag = item.form && item.form !== 'blend'
    ? `<span class="item-form-tag">${item.form}</span>`
    : item.form === 'blend'
    ? `<span class="item-form-tag">blend</span>`
    : ''

  const a11yName = `${item.selected ? 'Deselect' : 'Select'} ${item.name}${item.dose ? ' ' + item.dose : ''}`

  return `
    <div class="kit-item ${item.selected ? '' : 'deselected'}" data-item="${item.id}" data-kit="${kit.id}" role="listitem">
      <label class="item-check">
        <input type="checkbox" ${item.selected ? 'checked' : ''}
               aria-label="${a11yName}"
               data-action="select" data-kit="${kit.id}" data-item="${item.id}">
        <span class="check-box" aria-hidden="true">${svgCheck()}</span>
      </label>
      <div class="item-icon" aria-hidden="true">${iconHtml}</div>
      <div class="item-info">
        <span class="item-name">${item.name} ${formTag}</span>
        ${doseHtml}
        ${componentsHtml}
      </div>
      <span class="item-price">${kit.currency}${item.price}</span>
    </div>`
}

function bindEvents() {
  document.querySelectorAll('[data-action="toggle"]').forEach(toggle => {
    function activate(e) {
      if (e.target.closest('[data-action="select"]')) return
      if (e.target.closest('[data-action="checkout"]')) return
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

  document.querySelectorAll('[data-action="checkout"]').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation()
      handleCheckout(btn.dataset.kit)
    })
  })
}

function toggleKit(kitId) {
  state.expanded = state.expanded === kitId ? null : kitId
  renderKits()
}

function toggleItem(kitId, itemId, checked) {
  const kit = KITS.find(k => k.id === kitId)
  if (!kit) return
  const item = kit.items.find(i => i.id === itemId)
  if (!item) return

  item.selected = checked

  const row = document.querySelector(`.kit-item[data-item="${itemId}"][data-kit="${kitId}"]`)
  if (row) row.classList.toggle('deselected', !checked)

  updateFooter(kit)
}

function updateFooter(kit) {
  const selected = kit.items.filter(i => i.selected)
  const countEl = document.getElementById(`count-${kit.id}`)
  const totalEl = document.getElementById(`total-${kit.id}`)

  if (countEl) countEl.textContent = selected.length
  if (totalEl) {
    const sum = selected.reduce((s, i) => s + i.price, 0)
    totalEl.textContent = `${kit.currency}${selected.length === kit.items.length ? kit.price : sum}`
  }
}

async function handleCheckout(kitId) {
  const kit = KITS.find(k => k.id === kitId)
  if (!kit) return

  const selectedItems = kit.items.filter(i => i.selected).map(i => i.id)
  if (selectedItems.length === 0) return

  const btn = document.querySelector(`.btn-checkout[data-kit="${kitId}"]`)
  if (btn) {
    btn.disabled = true
    btn.textContent = 'Redirecting…'
  }

  try {
    const res = await fetch(CHECKOUT_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ kitId, selectedItems }),
    })

    const data = await res.json()
    if (data.url) {
      window.location.href = data.url
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
