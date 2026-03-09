/**
 * Search panel: fulltext search with dropdown, category and tag filters
 */
import { storeState, getCategoryTags, getAttributeTags } from './store-state.js'
import { navigateTo } from './store-router.js'

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

export function initSearchPanel(onFilterChange) {
  const input = document.getElementById('searchInput')
  const resultsEl = document.getElementById('searchResults')
  const categorySelect = document.getElementById('filterCategory')
  const tagsTrigger = document.getElementById('filterTagsTrigger')
  const tagsDropdown = document.getElementById('filterTagsDropdown')
  const tagsList = document.getElementById('filterTagsList')
  const tagsCount = document.getElementById('filterTagsCount')

  if (!input || !resultsEl) return

  function populateFilters() {
    if (!categorySelect) return

    while (categorySelect.options.length > 1) categorySelect.options.remove(1)

    const categoryTags = getCategoryTags()
    const categories = storeState.categories || []
    const seen = new Set()

    categories.forEach(c => {
      if (c.id && c.name && !seen.has('c-' + c.id)) {
        seen.add('c-' + c.id)
        const opt = document.createElement('option')
        opt.value = 'c-' + c.id
        opt.textContent = c.name
        categorySelect.appendChild(opt)
      }
    })
    categoryTags.forEach(t => {
      if (t.id && t.name && !seen.has(t.id)) {
        seen.add(t.id)
        const opt = document.createElement('option')
        opt.value = t.id
        opt.textContent = t.name
        categorySelect.appendChild(opt)
      }
    })

    if (!tagsList) return
    tagsList.innerHTML = ''
    const allTags = [...getCategoryTags(), ...getAttributeTags()]
    allTags.forEach(t => {
      const label = document.createElement('label')
      label.className = 'filter-tag-option'
      label.innerHTML = '<input type="checkbox" value="' + escapeHtml(t.id) + '"> <span>' + escapeHtml(t.name || t.id) + '</span>'
      tagsList.appendChild(label)
    })
  }

  populateFilters()

  if (tagsTrigger && tagsDropdown && tagsList) {
    tagsTrigger.addEventListener('click', e => {
      e.stopPropagation()
      const open = tagsDropdown.hidden
      tagsDropdown.hidden = !open
      tagsTrigger.setAttribute('aria-expanded', String(!open))
    })

    document.addEventListener('click', e => {
      if (!e.target.closest('.filter-tags-wrap')) {
        tagsDropdown.hidden = true
        tagsTrigger.setAttribute('aria-expanded', 'false')
      }
    })

    tagsList.addEventListener('change', e => {
      if (e.target.type === 'checkbox') {
        const checked = Array.from(tagsList.querySelectorAll('input:checked')).map(cb => cb.value)
        storeState.filters.tagIds = checked
        tagsCount.textContent = checked.length ? '(' + checked.length + ')' : ''
        onFilterChange?.()
      }
    })
  }

  if (categorySelect) {
    categorySelect.addEventListener('change', () => {
      const val = categorySelect.value
      if (val.startsWith('c-')) {
        const catId = val.slice(2)
        const catTag = getCategoryTags().find(t => {
          const cat = storeState.categories.find(c => c.id === catId)
          return cat && t.name === cat.name
        })
        storeState.filters.categoryId = catTag ? catTag.id : ''
      } else {
        storeState.filters.categoryId = val
      }
      onFilterChange?.()
    })
  }

  let debounceTimer
  input.addEventListener('input', () => {
    clearTimeout(debounceTimer)
    debounceTimer = setTimeout(() => {
      storeState.filters.q = input.value.trim()
      renderResults()
      onFilterChange?.()
    }, 150)
  })

  input.addEventListener('focus', () => {
    if (storeState.filters.q) renderResults()
  })

  input.addEventListener('keydown', e => {
    if (e.key === 'Escape') {
      resultsEl.hidden = true
      input.blur()
    }
  })

  document.addEventListener('click', e => {
    if (!e.target.closest('.search-wrap')) resultsEl.hidden = true
  })

  function searchProductsAndKits(q) {
    if (!q || q.length < 2) return { products: [], kits: [] }
    const lower = q.toLowerCase()
    const products = (storeState.products || []).filter(
      p =>
        (p.name || '').toLowerCase().includes(lower) ||
        (p.flavor || '').toLowerCase().includes(lower) ||
        (p.comment || '').toLowerCase().includes(lower) ||
        (p.description || '').toLowerCase().includes(lower)
    )
    const kits = (storeState.kits || []).filter(
      k =>
        (k.name || '').toLowerCase().includes(lower) ||
        (k.tagline || '').toLowerCase().includes(lower) ||
        (k.items || []).some(i => (i.name || '').toLowerCase().includes(lower))
    )
    return { products, kits }
  }

  function renderResults() {
    const q = input.value.trim()
    const { products, kits } = searchProductsAndKits(q)

    if (!q || (products.length === 0 && kits.length === 0)) {
      resultsEl.hidden = true
      return
    }

    let html = ''
    products.slice(0, 5).forEach(p => {
      const price = p.currency === 'JPY' ? '¥' + p.price : p.currency + p.price
      html += '<button type="button" class="search-result-item" role="option" data-type="product" data-id="' + p.id + '"><span class="search-result-name">' + escapeHtml(p.name) + (p.flavor ? ' — ' + escapeHtml(p.flavor) : '') + '</span><span class="search-result-price">' + price + '</span></button>'
    })
    kits.slice(0, 3).forEach(k => {
      html += '<button type="button" class="search-result-item" role="option" data-type="kit" data-id="' + k.id + '"><span class="search-result-name">' + escapeHtml(k.name) + ' (Kit)</span><span class="search-result-price">' + k.currency + k.price + '</span></button>'
    })

    resultsEl.innerHTML = html
    resultsEl.hidden = false

    resultsEl.querySelectorAll('.search-result-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const type = btn.dataset.type
        const id = btn.dataset.id
        if (type === 'product') {
          navigateTo('product', id)
        } else {
          navigateTo('kits')
          const kit = document.querySelector('[data-kit="' + id + '"]')
          if (kit) kit.querySelector('[data-action="toggle"]')?.click()
        }
        resultsEl.hidden = true
        input.value = ''
        storeState.filters.q = ''
      })
    })
  }
}
