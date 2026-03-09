import { buildDepthMap, sortTreeItems, groupByScope } from './tag-utils.js'

class TagSelect extends HTMLElement {
  connectedCallback() {
    const name = this.getAttribute('name') || ''
    const placeholder = this.getAttribute('placeholder') || '\u2014 None \u2014'
    this.innerHTML = `<select ${name ? `name="${name}"` : ''}><option value="">${placeholder}</option></select>`
    this._select = this.querySelector('select')
    this._tags = []
    this._exclude = new Set()
    this._value = ''
  }

  set tags(list) {
    this._tags = list
    this._render()
  }

  set exclude(ids) {
    this._exclude = new Set(ids)
    this._render()
  }

  get value() { return this._select?.value || '' }

  set value(v) {
    this._value = v
    if (this._select) this._select.value = v
  }

  _render() {
    if (!this._select) return
    const available = this._tags.filter(t => !this._exclude.has(t.id))
    const grouped = groupByScope(available)
    const depths = buildDepthMap(this._tags)
    const placeholder = this.getAttribute('placeholder') || '\u2014 None \u2014'

    let html = `<option value="">${placeholder}</option>`
    for (const [scope, tags] of Object.entries(grouped).sort(([a], [b]) => a.localeCompare(b))) {
      const sorted = sortTreeItems(tags)
      html += `<optgroup label="${scope}">`
      for (const t of sorted) {
        const d = depths[t.id] || 0
        const prefix = '\u00A0\u00A0'.repeat(d)
        html += `<option value="${t.id}" ${this._value === t.id ? 'selected' : ''}>${prefix}${t.name}</option>`
      }
      html += '</optgroup>'
    }

    this._select.innerHTML = html
    if (this._value) this._select.value = this._value
  }
}

customElements.define('tag-select', TagSelect)
