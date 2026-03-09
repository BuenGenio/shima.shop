/**
 * Product detail page: images, description, attributes in side card
 */
import { storeState, getProductTags, addToCart } from './store-state.js'
import { navigateTo } from './store-router.js'

export function renderProductPage(productId) {
  const container = document.getElementById('product-detail')
  const view = document.getElementById('view-product')
  if (!container || !view) return

  const product = storeState.products.find(p => p.id === productId)
  if (!product) {
    container.innerHTML = '<p class="product-not-found">Product not found.</p>'
    view.hidden = false
    return
  }

  const tags = getProductTags(productId)
  const categoryTags = tags.filter(t => t.scope === 'category')
  const attributeTags = tags.filter(t => t.scope === 'attribute')

  const currency = product.currency === 'JPY' ? '¥' : product.currency || ''
  const price = `${currency}${product.price}`

  const attributes = []
  if (product.flavor) attributes.push({ label: 'Flavor', value: product.flavor })
  if (product.pack_size) attributes.push({ label: 'Pack Size', value: product.pack_size })
  if (product.currency) attributes.push({ label: 'Currency', value: product.currency })
  categoryTags.forEach(t => attributes.push({ label: 'Category', value: t.name }))
  attributeTags.forEach(t => attributes.push({ label: t.name, value: '' }))

  container.innerHTML = `
    <div class="product-page-layout">
      <div class="product-page-main">
        <div class="product-page-gallery">
          ${product.image ? `<img src="${escapeHtml(product.image)}" alt="${escapeHtml(product.name)}" class="product-image">` : '<div class="product-image-placeholder">No image</div>'}
        </div>
        <div class="product-page-info">
          <a href="#kits" class="product-back">← Back to kits</a>
          <h1 class="product-title">${escapeHtml(product.name)}</h1>
          ${product.flavor ? `<p class="product-flavor">${escapeHtml(product.flavor)}</p>` : ''}
          <p class="product-price">${price}</p>
          ${product.description ? `<div class="product-description">${escapeHtml(product.description)}</div>` : ''}
          <div class="product-actions">
            <label class="product-qty-label">
              Qty
              <input type="number" id="productQty" class="product-qty-input" value="1" min="1" max="99" aria-label="Quantity">
            </label>
            <button type="button" class="btn-add-to-cart" data-product-id="${product.id}">Add to cart</button>
          </div>
        </div>
      </div>
      <aside class="product-page-sidebar">
        <div class="product-attributes-card">
          <h3>Details</h3>
          <dl class="product-attributes">
            ${attributes.map(a => `<dt>${escapeHtml(a.label)}</dt><dd>${escapeHtml(a.value) || '—'}</dd>`).join('')}
          </dl>
          ${attributeTags.length ? `
            <h4>Tags</h4>
            <div class="product-tag-pills">
              ${attributeTags.map(t => `<span class="tag-pill" style="--tag-color:${t.color || '#888'}">${escapeHtml(t.name)}</span>`).join('')}
            </div>
          ` : ''}
        </div>
      </aside>
    </div>
  `

  const addBtn = container.querySelector('.btn-add-to-cart')
  const qtyInput = container.querySelector('#productQty')
  if (addBtn) {
    addBtn.addEventListener('click', () => {
      const qty = Math.max(1, parseInt(qtyInput?.value || 1, 10) || 1)
      addToCart({
        type: 'product',
        id: product.id,
        name: product.name,
        price: product.price,
        currency: product.currency,
        qty,
      })
      addBtn.textContent = 'Added!'
      setTimeout(() => { addBtn.textContent = 'Add to cart' }, 1500)
    })
  }

  view.hidden = false
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}
