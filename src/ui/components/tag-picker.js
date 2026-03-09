import { buildDepthMap, sortTreeItems, groupByScope, getTagPath } from './tag-utils.js'

class TagPicker extends HTMLElement {
  connectedCallback() {
    this._allTags = []
    this._assigned = []
    this.classList.add('tag-picker')
    this._render()
  }

  set allTags(v) { this._allTags = v; this._render() }

  get assignedTags() { return this._assigned }
  set assignedTags(v) { this._assigned = v; this._render() }

  _render() {
    const assignedIds = new Set(this._assigned.map(t => t.id))
    const available = this._allTags.filter(t => !assignedIds.has(t.id))

    const pillsHtml = this._assigned.length
      ? this._assigned.map(t => {
          const path = getTagPath(t.id, this._allTags)
          return `<span class="tag-pill" style="background:${t.color || '#6b7280'}" data-tag-id="${t.id}" title="${path}">
            ${path}
            <button type="button" class="tag-pill-remove" data-tag-id="${t.id}" title="Remove tag">&times;</button>
          </span>`
        }).join('')
      : '<span class="tag-picker-empty">No tags assigned</span>'

    const grouped = groupByScope(available)
    const depths = buildDepthMap(this._allTags)
    const optionsHtml = Object.entries(grouped)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([scope, tags]) => {
        const sorted = sortTreeItems(tags)
        return `<optgroup label="${scope}">${sorted.map(t => {
          const d = depths[t.id] || 0
          const prefix = '\u00A0\u00A0'.repeat(d)
          return `<option value="${t.id}">${prefix}${t.name}</option>`
        }).join('')}</optgroup>`
      }).join('')

    this.innerHTML = `
      <div class="tag-picker-title">Tags</div>
      <div class="tag-pills">${pillsHtml}</div>
      ${available.length ? `
        <div class="tag-picker-add">
          <select><option value="">Add a tag\u2026</option>${optionsHtml}</select>
          <button type="button">+ Add</button>
        </div>` : ''}`

    this.querySelectorAll('.tag-pill-remove').forEach(btn => {
      btn.addEventListener('click', (e) => {
        e.preventDefault()
        this.dispatchEvent(new CustomEvent('tag-remove', {
          detail: { tagId: btn.dataset.tagId },
          bubbles: true,
        }))
      })
    })

    const addBtn = this.querySelector('.tag-picker-add button')
    const addSel = this.querySelector('.tag-picker-add select')
    addBtn?.addEventListener('click', (e) => {
      e.preventDefault()
      const tagId = addSel?.value
      if (!tagId) return
      this.dispatchEvent(new CustomEvent('tag-add', {
        detail: { tagId },
        bubbles: true,
      }))
    })
  }
}

customElements.define('tag-picker', TagPicker)
