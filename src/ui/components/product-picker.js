/**
 * Product picker for adding products to a Kit (Bundle).
 * Displays assigned products with add/remove; value is array of product IDs.
 */
class ProductPicker extends HTMLElement {
  connectedCallback() {
    this._products = []
    this._value = []
    const init = this.dataset.initValue
    if (init) {
      try {
        this._value = JSON.parse(init.replace(/&quot;/g, '"'))
      } catch (_) {}
    }
    this.classList.add('product-picker')
    this._render()
  }

  set products(v) {
    this._products = Array.isArray(v) ? v : []
    this._render()
  }

  get value() {
    return [...this._value]
  }

  set value(v) {
    this._value = Array.isArray(v) ? v : []
    this._render()
  }

  _render() {
    const assignedIds = new Set(this._value)
    const available = this._products.filter((p) => !assignedIds.has(p.id))

    const listHtml =
      this._value.length > 0
        ? this._value
            .map((id) => {
              const p = this._products.find((x) => x.id === id)
              const label = p ? `${p.name}${p.flavor ? ` (${p.flavor})` : ''} — ${p.currency || ''}${p.price ?? ''}` : id
              return `<li class="product-picker-item">
                <span class="product-picker-item-label">${escapeHtml(label)}</span>
                <button type="button" class="product-picker-remove" data-product-id="${escapeHtml(id)}" title="Remove">&times;</button>
              </li>`
            })
            .join('')
        : '<li class="product-picker-empty">No products in bundle</li>'

    const optionsHtml = available
      .map(
        (p) =>
          `<option value="${escapeHtml(p.id)}">${escapeHtml(p.name)}${p.flavor ? ` (${p.flavor})` : ''} — ${p.currency || ''}${p.price ?? ''}</option>`
      )
      .join('')

    this.innerHTML = `
      <div class="product-picker-title">Products in bundle</div>
      <ul class="product-picker-list">${listHtml}</ul>
      ${available.length ? `
        <div class="product-picker-add">
          <select aria-label="Add product to bundle">
            <option value="">Add product…</option>
            ${optionsHtml}
          </select>
          <button type="button">+ Add</button>
        </div>` : ''}`

    this.querySelectorAll('.product-picker-remove').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        const id = btn.dataset.productId
        this._value = this._value.filter((x) => x !== id)
        this._render()
        this.dispatchEvent(new CustomEvent('change', { bubbles: true }))
      })
    })

    const addBtn = this.querySelector('.product-picker-add button')
    const addSel = this.querySelector('.product-picker-add select')
    addBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      const id = addSel?.value
      if (!id) return
      this._value = [...this._value, id]
      this._render()
      this.dispatchEvent(new CustomEvent('change', { bubbles: true }))
    })
  }
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

customElements.define('product-picker', ProductPicker)
