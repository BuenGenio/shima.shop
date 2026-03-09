class ScopeFilter extends HTMLElement {
  connectedCallback() {
    this.innerHTML = `<select class="scope-filter" aria-label="Filter by scope">
      <option value="">All scopes</option>
    </select>`
    this._select = this.querySelector('select')
    this._select.addEventListener('change', () => {
      this.dispatchEvent(new CustomEvent('filter-change', {
        detail: { value: this._select.value },
        bubbles: true,
      }))
    })
  }

  set scopes(list) {
    if (!this._select) return
    const current = this._select.value
    this._select.innerHTML = '<option value="">All scopes</option>' +
      list.map(s => `<option value="${s}" ${s === current ? 'selected' : ''}>${s}</option>`).join('')
    this._select.value = current
  }

  get value() { return this._select?.value || '' }

  set value(v) { if (this._select) this._select.value = v }
}

customElements.define('scope-filter', ScopeFilter)
