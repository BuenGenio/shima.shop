import { SECTIONS } from './sections.js'
import { testYamatoConnection } from './yamato-client.js'
import { renderPaymentsPanel } from './payments.js'
import { renderLogsPanel, bindLogsFilters } from './logs.js'
import { loadDashboard, bindStatsFilters } from './stats.js'
import { getAdminRoute, setAdminRoute } from './admin-router.js'
import { toast } from '../../components/toast.js'
import { buildDepthMap, sortTreeItems } from '../../components/tag-utils.js'
import '../../components/scope-filter.js'
import '../../components/tag-select.js'
import '../../components/tag-picker.js'
import '../../components/product-picker.js'

const API_BASE = '/api'

async function api(path, opts = {}) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

let backdrop, modalTitle, modalForm
let currentModal = { section: null, id: null }
let sectionCache = {}
let allTags = []

const ENTITY_TYPE_MAP = {
  products: 'products',
  categories: 'categories',
  kits: 'kits',
  subscriptions: 'subscriptions',
  shipping: 'shipping_methods',
  currencies: 'currencies',
}

async function loadAllTags() {
  allTags = await api('/tags')
}

async function renderSection(sectionKey) {
  const cfg = SECTIONS[sectionKey]
  if (!cfg) return

  const listEl = document.getElementById(`list-${sectionKey}`)
  if (!listEl) return

  const items = await api(`/admin?section=${sectionKey}`)
  sectionCache[sectionKey] = items

  const scopeFilterEl = document.querySelector('scope-filter')
  if (sectionKey === 'tags' && scopeFilterEl) {
    const scopes = [...new Set(items.map(i => i.scope).filter(Boolean))].sort()
    scopeFilterEl.scopes = scopes
  }

  let displayItems = items
  if (sectionKey === 'tags' && scopeFilterEl?.value) {
    displayItems = items.filter(i => i.scope === scopeFilterEl.value)
  }

  if (!Array.isArray(displayItems) || displayItems.length === 0) {
    const activeScope = scopeFilterEl?.value
    listEl.innerHTML = `
      <div class="empty-state">
        <p>No ${cfg.label.toLowerCase()}s${activeScope ? ` with scope "${activeScope}"` : ''} yet.</p>
        <button class="btn-add" data-section="${sectionKey}">+ Add ${cfg.label}</button>
      </div>`
    bindAddButtons()
    return
  }

  const depthMap = sectionKey === 'tags' ? buildDepthMap(displayItems) : {}

  const ths = cfg.columns.map(c => `<th>${c.label}</th>`).join('') + '<th></th>'
  const sortedItems = sectionKey === 'tags' ? sortTreeItems(displayItems) : displayItems
  const rows = sortedItems.map(item => {
    const tds = cfg.columns.map(c => {
      if (c.render === 'treeName') {
        const depth = depthMap[item.id] || 0
        const indent = depth > 0 ? `<span class="tree-indent" style="padding-left:${depth * 20}px">${'└ '.repeat(0)}${'  '.repeat(0)}</span>` : ''
        const prefix = depth > 0 ? '<span class="tree-branch">└ </span>' : ''
        return `<td><span style="padding-left:${depth * 20}px">${prefix}${item.name || ''}</span></td>`
      }
      if (c.render === 'productCount') {
        const ids = item[c.key]
        const count = Array.isArray(ids) ? ids.length : (ids ? String(ids).split(',').filter(Boolean).length : 0)
        return `<td>${count}</td>`
      }
      const val = item[c.key] ?? ''
      if (c.color && val) {
        return `<td><span class="color-swatch" style="background:${val}"></span>${val}</td>`
      }
      if (c.mono) return `<td style="font-family:var(--mono)">${val}</td>`
      return `<td>${val}</td>`
    }).join('')
    return `<tr>
      ${tds}
      <td class="td-actions">
        <button class="btn-edit" data-section="${sectionKey}" data-id="${item.id}">Edit</button>
        <button class="btn-delete" data-section="${sectionKey}" data-id="${item.id}">Delete</button>
      </td>
    </tr>`
  }).join('')

  listEl.innerHTML = `
    <div class="admin-table-wrap">
      <table class="admin-table">
        <thead><tr>${ths}</tr></thead>
        <tbody>${rows}</tbody>
      </table>
    </div>`

  listEl.querySelectorAll('.btn-edit').forEach(btn => {
    btn.addEventListener('click', () => openModal(btn.dataset.section, btn.dataset.id))
  })

  listEl.querySelectorAll('.btn-delete').forEach(btn => {
    btn.addEventListener('click', () => deleteItem(btn.dataset.section, btn.dataset.id))
  })
}

function renderFieldHtml(f, existing) {
  const val = existing[f.key] ?? ''
  const req = f.required ? 'required' : ''
  const cls = f.full ? 'field full-width' : 'field'

  if (f.type === 'textarea') {
    return `<label class="${cls}"><span class="field-label">${f.label}</span>
      <textarea name="${f.key}" ${req}>${val}</textarea></label>`
  }
  if (f.type === 'select') {
    const opts = (f.options || []).map(o =>
      `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`
    ).join('')
    return `<label class="${cls}"><span class="field-label">${f.label}</span>
      <select name="${f.key}" ${req}>${opts}</select></label>`
  }
  if (f.type === 'dynamic_select' && f.dynamic === 'tags') {
    return `<label class="${cls}"><span class="field-label">${f.label}</span>
      <tag-select name="${f.key}" data-exclude-id="${existing.id || ''}" data-init-value="${val}"></tag-select></label>`
  }
  if (f.type === 'product_picker') {
    const initVal = Array.isArray(val) ? val : (val ? String(val).split(',').filter(Boolean) : [])
    const initStr = JSON.stringify(initVal).replace(/"/g, '&quot;')
    return `<label class="${cls}"><span class="field-label">${f.label}</span>
      <product-picker name="${f.key}" data-init-value="${initStr}"></product-picker></label>`
  }
  const inputType = f.type === 'password' ? 'password' : f.type
  return `<label class="${cls}"><span class="field-label">${f.label}</span>
    <input type="${inputType}" name="${f.key}" value="${val}" ${req} autocomplete="off"></label>`
}

async function openModal(sectionKey, itemId) {
  const cfg = SECTIONS[sectionKey]
  if (!cfg) return

  if (cfg.customModal && sectionKey === 'products') {
    await openProductModal(itemId)
    return
  }

  currentModal = { section: sectionKey, id: itemId || null }

  const isEdit = !!itemId
  modalTitle.textContent = isEdit ? `Edit ${cfg.label}` : `Add ${cfg.label}`

  let existing = {}
  if (isEdit && sectionCache[sectionKey]) {
    existing = sectionCache[sectionKey].find(i => i.id === itemId) || {}
  }

  const ungrouped = cfg.fields.filter(f => !f.group)
  const ungroupedHtml = ungrouped.map(f => renderFieldHtml(f, existing)).join('')

  const showTagPicker = sectionKey !== 'tags' && isEdit

  modalForm.innerHTML = `
    <div class="form-grid">${ungroupedHtml}</div>
    <div id="carrierGroups"></div>
    ${showTagPicker ? '<tag-picker></tag-picker>' : ''}
    <div class="form-actions">
      <button type="button" class="btn-cancel" id="btnModalCancel">Cancel</button>
      <button type="submit" class="btn-save">${isEdit ? 'Update' : 'Create'}</button>
    </div>`

  renderCarrierGroups(cfg, existing)

  if (sectionKey === 'kits') {
    const picker = modalForm.querySelector('product-picker')
    if (picker) {
      const products = sectionCache['products'] || []
      picker.products = products
      const initVal = existing.product_ids ?? existing.data?.product_ids ?? []
      picker.value = Array.isArray(initVal) ? initVal : (initVal ? String(initVal).split(',').filter(Boolean) : [])
    }
  }

  modalForm.querySelectorAll('tag-select').forEach(el => {
    const excludeId = el.dataset.excludeId
    const initValue = el.dataset.initValue
    el.tags = allTags
    if (excludeId) el.exclude = [excludeId]
    if (initValue) el.value = initValue
  })

  if (showTagPicker) {
    const picker = modalForm.querySelector('tag-picker')
    const entityType = ENTITY_TYPE_MAP[sectionKey] || sectionKey
    const assigned = await api(`/tags?entity_type=${entityType}&entity_id=${itemId}`)
    picker.allTags = allTags
    picker.assignedTags = assigned

    picker.addEventListener('tag-add', async (e) => {
      const tagId = e.detail.tagId
      await api('/tags', {
        method: 'POST',
        body: JSON.stringify({ tag_id: tagId, entity_type: entityType, entity_id: itemId }),
      })
      const tag = allTags.find(t => t.id === tagId)
      if (tag) picker.assignedTags = [...picker.assignedTags, tag]
    })

    picker.addEventListener('tag-remove', async (e) => {
      const tagId = e.detail.tagId
      await api(`/tags?tag_id=${tagId}&entity_type=${entityType}&entity_id=${itemId}`, { method: 'DELETE' })
      picker.assignedTags = picker.assignedTags.filter(t => t.id !== tagId)
    })
  }

  backdrop.hidden = false
  modalForm.querySelector('input, select, textarea')?.focus()

  document.getElementById('btnModalCancel').addEventListener('click', closeModal)

  const carrierSelect = modalForm.querySelector('[name="carrier"]')
  if (carrierSelect) {
    carrierSelect.addEventListener('change', () => renderCarrierGroups(cfg, existing, carrierSelect.value))
  }
}

function closeModal() {
  backdrop.hidden = true
  currentModal = { section: null, id: null }
}

async function openProductModal(itemId) {
  currentModal = { section: 'products', id: itemId || null }
  const cfg = SECTIONS.products
  const isEdit = !!itemId
  modalTitle.textContent = isEdit ? `Edit ${cfg.label}` : `Add ${cfg.label}`

  let existing = {}
  if (isEdit && sectionCache.products) {
    existing = sectionCache.products.find(i => i.id === itemId) || {}
  }

  const langs = getLanguages()
  let currencies = sectionCache.currencies || await api('/admin?section=currencies')
  if (!Array.isArray(currencies) || currencies.length === 0) {
    currencies = [{ code: 'USD', symbol: '$', name: 'US Dollar' }]
  }
  const currencyOptions = currencies.map(c => `<option value="${c.code || c.symbol}" ${(existing.currency || '') === (c.code || c.symbol) ? 'selected' : ''}>${c.symbol || c.code} ${c.name || c.code || ''}</option>`).join('')

  const translations = existing.translations || {}
  const defaultLang = langs[0]?.code || 'EN'
  const activeLang = defaultLang
  const t = translations[activeLang] || {}
  const images = Array.isArray(existing.images) ? existing.images : []

  const langSwitcherHtml = langs.map(l => `
    <button type="button" class="modal-lang-btn ${l.code === activeLang ? 'active' : ''}" data-lang="${l.code}">${l.flag || ''} ${l.code}</button>
  `).join('')

  modalForm.innerHTML = `
    <div class="modal-tabs">
      <button type="button" class="modal-tab active" data-tab="product">Product</button>
      <button type="button" class="modal-tab" data-tab="images">Images / Media</button>
    </div>
    <div class="modal-tab-panel active" id="product-tab">
      <div class="modal-lang-switcher">${langSwitcherHtml}</div>
      <div class="form-grid">
        <label class="field"><span class="field-label">Name</span><input type="text" name="name" value="${(t.name || existing.name || '').replace(/"/g, '&quot;')}" required></label>
        <label class="field"><span class="field-label">Slug</span><input type="text" name="slug" value="${(t.slug || existing.slug || '').replace(/"/g, '&quot;')}"></label>
        <label class="field"><span class="field-label">Pack Size</span><input type="text" name="pack_size" value="${(existing.pack_size || '').replace(/"/g, '&quot;')}"></label>
        <label class="field"><span class="field-label">Variant</span><input type="text" name="variant" value="${(existing.variant || '').replace(/"/g, '&quot;')}"></label>
        <label class="field full-width">
          <span class="field-label">Price</span>
          <div class="price-form-group">
            <select name="currency" class="currency-select">${currencyOptions}</select>
            <input type="number" name="price" step="0.01" value="${existing.price ?? ''}" required class="price-input" placeholder="0.00">
          </div>
        </label>
        <label class="field full-width"><span class="field-label">Comment / Details</span><textarea name="comment">${(t.comment || existing.comment || '').replace(/</g, '&lt;').replace(/>/g, '&gt;')}</textarea></label>
      </div>
    </div>
    <div class="modal-tab-panel" id="images-tab">
      <div class="modal-lang-switcher">${langSwitcherHtml}</div>
      <div class="images-grid" id="product-images-grid">
        <div class="images-grid-cell upload-cell" id="upload-cell">
          <input type="file" id="product-image-upload" accept="image/*" aria-label="Upload image">
          <span>+</span>
        </div>
        ${images.map(url => `<div class="images-grid-cell"><img src="${url}" alt=""><button type="button" class="btn-remove-img" data-url="${url.replace(/"/g, '&quot;')}">×</button></div>`).join('')}
      </div>
    </div>
    <div class="form-actions">
      <button type="button" class="btn-cancel" id="btnModalCancel">Cancel</button>
      <button type="submit" class="btn-save">${isEdit ? 'Update' : 'Create'}</button>
    </div>
  `

  const productImages = [...images]
  modalForm.dataset.productImages = JSON.stringify(productImages)

  modalForm.querySelectorAll('.modal-tab').forEach(btn => {
    btn.addEventListener('click', () => {
      modalForm.querySelectorAll('.modal-tab').forEach(b => b.classList.remove('active'))
      modalForm.querySelectorAll('.modal-tab-panel').forEach(p => p.classList.remove('active'))
      btn.classList.add('active')
      const tab = btn.dataset.tab
      document.getElementById(tab === 'product' ? 'product-tab' : 'images-tab').classList.add('active')
    })
  })

  const uploadCell = document.getElementById('upload-cell')
  const uploadInput = document.getElementById('product-image-upload')
  uploadCell?.addEventListener('click', () => uploadInput?.click())
  uploadInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    const fd = new FormData()
    fd.append('file', file)
    fd.append('productId', itemId || 'temp')
    try {
      const res = await fetch(`${API_BASE}/upload`, { method: 'POST', body: fd })
      const data = await res.json()
      if (data.error) throw new Error(data.error)
      const url = data.url || (data.key ? `/api/media/${data.key}` : null)
      if (!url) throw new Error('No URL returned')
      productImages.push(url)
      modalForm.dataset.productImages = JSON.stringify(productImages)
      const grid = document.getElementById('product-images-grid')
      const cell = document.createElement('div')
      cell.className = 'images-grid-cell'
      cell.innerHTML = `<img src="${url}" alt=""><button type="button" class="btn-remove-img" data-url="${url.replace(/"/g, '&quot;')}">×</button>`
      grid.insertBefore(cell, uploadCell)
      cell.querySelector('.btn-remove-img').addEventListener('click', () => {
        const idx = productImages.indexOf(url)
        if (idx >= 0) productImages.splice(idx, 1)
        modalForm.dataset.productImages = JSON.stringify(productImages)
        cell.remove()
      })
      toast('Image uploaded')
    } catch (err) {
      toast(err.message || 'Upload failed', 'error')
    }
    uploadInput.value = ''
  })

  modalForm.querySelectorAll('.btn-remove-img').forEach(btn => {
    btn.addEventListener('click', () => {
      const url = btn.dataset.url
      const idx = productImages.indexOf(url)
      if (idx >= 0) productImages.splice(idx, 1)
      modalForm.dataset.productImages = JSON.stringify(productImages)
      btn.closest('.images-grid-cell').remove()
    })
  })

  document.getElementById('btnModalCancel').addEventListener('click', closeModal)
  backdrop.hidden = false
  modalForm.querySelector('input, select, textarea')?.focus()
}

async function handleProductModalSubmit(e) {
  e.preventDefault()
  const { id } = currentModal
  const fd = new FormData(modalForm)
  const imagesJson = modalForm.dataset.productImages
  const images = imagesJson ? JSON.parse(imagesJson) : []

  const data = {
    name: fd.get('name') ?? '',
    slug: fd.get('slug') ?? '',
    pack_size: fd.get('pack_size') ?? '',
    variant: fd.get('variant') ?? '',
    price: fd.get('price') ? Number(fd.get('price')) : null,
    currency: fd.get('currency') ?? '',
    comment: fd.get('comment') ?? '',
    images,
  }

  if (id) {
    await api(`/admin?section=products&id=${id}`, { method: 'PUT', body: JSON.stringify(data) })
  } else {
    await api(`/admin?section=products`, { method: 'POST', body: JSON.stringify(data) })
  }

  await renderSection('products')
  closeModal()
  toast(id ? 'Product updated' : 'Product created')
}

async function handleModalSubmit(e) {
  e.preventDefault()
  const { section, id } = currentModal
  const cfg = SECTIONS[section]
  if (!cfg) return

  if (section === 'products') {
    if (modalForm.querySelector('.modal-tabs')) {
      await handleProductModalSubmit(e)
      return
    }
  }

  const fd = new FormData(modalForm)
  const data = {}
  for (const f of cfg.fields) {
    if (f.type === 'product_picker') {
      const picker = modalForm.querySelector('product-picker')
      data[f.key] = picker?.value ?? []
      continue
    }
    if (!modalForm.querySelector(`[name="${f.key}"]`)) continue
    let val = fd.get(f.key) ?? ''
    if (f.type === 'number' && val !== '') val = Number(val)
    if (f.type === 'dynamic_select' && val === '') val = null
    data[f.key] = val
  }

  if (id) {
    await api(`/admin?section=${section}&id=${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    })
  } else {
    await api(`/admin?section=${section}`, {
      method: 'POST',
      body: JSON.stringify(data),
    })
  }

  if (section === 'tags') await loadAllTags()
  await renderSection(section)
  closeModal()
  toast(id ? `${cfg.label} updated` : `${cfg.label} created`)
}

async function deleteItem(sectionKey, itemId) {
  const cfg = SECTIONS[sectionKey]
  if (!cfg) return
  if (!confirm(`Delete this ${cfg.label.toLowerCase()}?`)) return

  await api(`/admin?section=${sectionKey}&id=${itemId}`, { method: 'DELETE' })
  if (sectionKey === 'tags') await loadAllTags()
  await renderSection(sectionKey)
  toast(`${cfg.label} deleted`)
}

function renderCarrierGroups(cfg, existing, carrierOverride) {
  const container = document.getElementById('carrierGroups')
  if (!container) return

  const carrier = carrierOverride ?? (existing.carrier || '')
  const groupMap = {}
  const groupOrder = []
  for (const f of cfg.fields) {
    if (f.group) {
      if (!groupMap[f.group]) {
        groupMap[f.group] = { fields: [], showWhen: f.showWhen }
        groupOrder.push(f.group)
      }
      groupMap[f.group].fields.push(f)
    }
  }

  let html = ''
  for (const gName of groupOrder) {
    const g = groupMap[gName]
    if (g.showWhen && g.showWhen !== carrier) continue

    const fieldsStr = g.fields.map(f => renderFieldHtml(f, existing)).join('')
    const isApiGroup = gName.toLowerCase().includes('api') && g.showWhen === 'yamato'
    const testBtn = isApiGroup
      ? `<div class="form-group-action"><button type="button" class="btn-test" id="btnTestYamato">Test Connection</button><span class="test-status" id="testStatus"></span></div>`
      : ''

    html += `
      <div class="form-group">
        <h4 class="form-group-title">${gName}</h4>
        <div class="form-grid">${fieldsStr}</div>
        ${testBtn}
      </div>`
  }

  container.innerHTML = html

  container.querySelectorAll('tag-select').forEach(el => {
    const excludeId = el.dataset.excludeId
    const initValue = el.dataset.initValue
    el.tags = allTags
    if (excludeId) el.exclude = [excludeId]
    if (initValue) el.value = initValue
  })

  document.getElementById('btnTestYamato')?.addEventListener('click', () => testYamatoConnection(modalForm))
}

const APPEARANCE_KEY = 'settings.ui.appearance'
const LANGUAGES_KEY = 'settings.languages'
const BG_MAX_SIZE = 400 * 1024 // 400KB

let languagesList = []

async function loadAppearanceSettings() {
  const data = await api(`/settings?key=${APPEARANCE_KEY}`)
  const form = document.getElementById('form-appearance')
  if (form) {
    const colorMode = data['color-mode'] ?? data.colorMode ?? 'auto'
    const activeTheme = data['active-theme'] ?? data.activeTheme ?? ''
    const theme = data.theme || {}
    const colorScheme = theme.color_scheme ?? theme.colorScheme ?? 'soft'
    const background = theme.background ?? ''
    const menuPosition = data['menu-position'] ?? data.menuPosition ?? 'sidebar_left'
    const language = data.language ?? 'EN'

    const colorModeEl = form.elements['color-mode']
    const activeThemeEl = form.elements['active-theme']
    const colorSchemeEl = form.elements['theme.color_scheme']
    const menuPositionEl = form.elements['menu-position']
    const languageEl = form.elements['language']
    const bgDataEl = document.getElementById('appearance-background-data')
    const bgPreviewEl = document.getElementById('appearance-background-preview')

    if (colorModeEl) colorModeEl.value = colorMode
    if (activeThemeEl) activeThemeEl.value = activeTheme
    if (colorSchemeEl) colorSchemeEl.value = colorScheme
    if (menuPositionEl) menuPositionEl.value = menuPosition
    if (languageEl) languageEl.value = language
    if (bgDataEl) bgDataEl.value = background
    if (bgPreviewEl && background) {
      bgPreviewEl.style.backgroundImage = `url(${background})`
      bgPreviewEl.classList.add('has-bg')
    }
  }
  if (Object.keys(data).length) applyAppearance(data)
}

function buildAppearancePayload(form) {
  const theme = {}
  const colorSchemeEl = form.elements['theme.color_scheme']
  const bgDataEl = document.getElementById('appearance-background-data')
  if (colorSchemeEl) theme.color_scheme = colorSchemeEl.value || 'soft'
  if (bgDataEl?.value) theme.background = bgDataEl.value

  return {
    'color-mode': form.elements['color-mode']?.value || 'auto',
    'active-theme': form.elements['active-theme']?.value || '',
    theme,
    'menu-position': form.elements['menu-position']?.value || 'sidebar_left',
    language: form.elements['language']?.value || 'EN',
  }
}

async function handleAppearanceSubmit(e) {
  e.preventDefault()
  const form = e.target
  const payload = buildAppearancePayload(form)
  await api(`/settings?key=${APPEARANCE_KEY}`, {
    method: 'PUT',
    body: JSON.stringify(payload),
  })
  applyAppearance(payload)
  toast('Appearance saved')
}

function applyAppearance(data) {
  const colorMode = data['color-mode'] ?? data.colorMode ?? 'auto'
  document.documentElement.setAttribute('data-theme', colorMode)
  try {
    localStorage.setItem('adhd_theme', colorMode)
  } catch (_) {}
  const lbl = document.getElementById('themeLabel')
  const ico = document.getElementById('themeIcon')
  if (lbl) lbl.textContent = colorMode[0].toUpperCase() + colorMode.slice(1)
  if (ico) ico.textContent = colorMode === 'auto' ? '◐' : colorMode === 'dark' ? '☾' : '☼'

  const menuPosition = data['menu-position'] ?? data.menuPosition ?? 'sidebar_left'
  const layout = document.getElementById('admin-layout') || document.querySelector('.admin-layout')
  if (layout) layout.setAttribute('data-menu-position', menuPosition)

  const bg = data.theme?.background
  if (bg) {
    document.body.style.backgroundImage = `url(${bg})`
    document.body.style.backgroundSize = 'cover'
  } else {
    document.body.style.backgroundImage = ''
    document.body.style.backgroundSize = ''
  }
}

async function loadMailSettings() {
  const data = await api('/settings?key=mail')
  const form = document.getElementById('form-mail')
  if (!form) return

  for (const [key, val] of Object.entries(data)) {
    const el = form.elements[key]
    if (el) el.value = val
  }
}

async function loadLoggingSettings() {
  const data = await api('/settings?key=app.settings')
  const form = document.getElementById('form-logging')
  if (!form) return

  const level = data['log-level'] || data.logLevel || 'info'
  const verbosity = data['log-verbosity'] || data.logVerbosity || 'normal'
  let drivers = data['log-drivers']
  if (!Array.isArray(drivers) || drivers.length === 0) {
    const single = data['log-driver'] || data.logDriver || 'console'
    drivers = single ? [single] : ['console']
  }

  const levelEl = form.elements['log-level']
  const verbosityEl = form.elements['log-verbosity']
  const consoleEl = form.elements['log-driver-console']
  const dbEl = form.elements['log-driver-db']
  if (levelEl) levelEl.value = level
  if (verbosityEl) verbosityEl.value = verbosity
  if (consoleEl) consoleEl.checked = drivers.includes('console')
  if (dbEl) dbEl.checked = drivers.includes('db')
}

async function loadLanguagesSettings() {
  const data = await api(`/settings?key=${LANGUAGES_KEY}`)
  languagesList = Array.isArray(data) ? [...data] : (data?.languages ? [...data.languages] : [])
  if (languagesList.length === 0) {
    languagesList = [
      { code: 'EN', name: 'English', flag: '🇬🇧' },
      { code: 'ES', name: 'Español', flag: '🇪🇸' },
      { code: 'UA', name: 'Українська', flag: '🇺🇦' },
      { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
      { code: 'NL', name: 'Nederlands', flag: '🇳🇱' },
    ]
  }
  renderLanguagesList()
}

export function getLanguages() {
  return languagesList.length ? languagesList : [
    { code: 'EN', name: 'English', flag: '🇬🇧' },
    { code: 'ES', name: 'Español', flag: '🇪🇸' },
    { code: 'UA', name: 'Українська', flag: '🇺🇦' },
    { code: 'DE', name: 'Deutsch', flag: '🇩🇪' },
    { code: 'NL', name: 'Nederlands', flag: '🇳🇱' },
  ]
}

function renderLanguagesList() {
  const container = document.getElementById('languages-list')
  if (!container) return
  container.innerHTML = languagesList.map((lang, i) => `
    <div class="languages-item" data-index="${i}">
      <span class="lang-flag">${lang.flag || ''}</span>
      <span class="lang-code">${lang.code || ''}</span>
      <span class="lang-name">${lang.name || ''}</span>
      <button type="button" class="btn-remove-lang" data-index="${i}">Remove</button>
    </div>
  `).join('')
  container.querySelectorAll('.btn-remove-lang').forEach(btn => {
    btn.addEventListener('click', () => {
      languagesList.splice(Number(btn.dataset.index), 1)
      renderLanguagesList()
    })
  })
}

function handleAddLanguage() {
  const form = document.getElementById('form-languages')
  if (!form) return
  const codeEl = form.querySelector('[name="lang-code"]')
  const nameEl = form.querySelector('[name="lang-name"]')
  const flagEl = form.querySelector('[name="lang-flag"]')
  const code = codeEl?.value?.trim()
  const name = nameEl?.value?.trim()
  if (!code || !name) return
  const existing = languagesList.findIndex(l => l.code === code)
  const item = { code, name, flag: flagEl?.value?.trim() || '' }
  if (existing >= 0) languagesList[existing] = item
  else languagesList.push(item)
  codeEl.value = ''
  nameEl.value = ''
  if (flagEl) flagEl.value = ''
  renderLanguagesList()
}

async function handleLanguagesSubmit(e) {
  e.preventDefault()
  await api(`/settings?key=${LANGUAGES_KEY}`, {
    method: 'PUT',
    body: JSON.stringify(languagesList),
  })
  toast('Languages saved')
}

async function handleLoggingSubmit(e) {
  e.preventDefault()
  const form = e.target
  const data = await api('/settings?key=app.settings')
  const merged = { ...data }
  merged['log-level'] = form.elements['log-level']?.value || 'info'
  merged['log-verbosity'] = form.elements['log-verbosity']?.value || 'normal'
  const drivers = []
  if (form.elements['log-driver-console']?.checked) drivers.push('console')
  if (form.elements['log-driver-db']?.checked) drivers.push('db')
  merged['log-drivers'] = drivers.length ? drivers : ['console']

  await api('/settings?key=app.settings', {
    method: 'PUT',
    body: JSON.stringify(merged),
  })
  toast('Logging settings saved')
}

async function handleMailSubmit(e) {
  e.preventDefault()
  const form = e.target
  const data = {}
  const fields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_encryption', 'from_name', 'from_email']
  for (const f of fields) {
    data[f] = form.elements[f]?.value ?? ''
  }
  if (data.smtp_port) data.smtp_port = Number(data.smtp_port)

  await api('/settings?key=mail', {
    method: 'PUT',
    body: JSON.stringify(data),
  })
  toast('Mail settings saved')
}

function switchTab(tabKey) {
  document.querySelectorAll('.nav-item').forEach(p => {
    const isActive = p.dataset.tab === tabKey
    p.classList.toggle('active', isActive)
    p.setAttribute('aria-selected', isActive)
  })

  document.querySelectorAll('.tab-panel').forEach(p => {
    const isActive = p.id === `panel-${tabKey}`
    p.classList.toggle('active', isActive)
    p.hidden = !isActive
  })
}

function openSettingsSection(sectionId) {
  document.querySelectorAll('.accordion-card').forEach(d => {
    d.open = d.id === sectionId
  })
}

function applyRoute(route) {
  switchTab(route.tab)
  if (route.tab === 'settings') {
    const hasLogsParams = route.params.severity || route.params.type || route.params.q || route.params.from || route.params.to
    const section = route.section || (hasLogsParams ? 'system' : null)
    openSettingsSection(`settings-${section || 'appearance'}`)
  }
  if (route.tab === 'settings') {
    const sev = document.getElementById('logs-severity')
    const type = document.getElementById('logs-type')
    const q = document.getElementById('logs-q')
    const from = document.getElementById('logs-from')
    const to = document.getElementById('logs-to')
    if (sev && route.params.severity) sev.value = route.params.severity
    if (type && route.params.type) type.value = route.params.type
    if (q && route.params.q) q.value = route.params.q
    if (from && route.params.from) from.value = route.params.from
    if (to && route.params.to) to.value = route.params.to
    renderLogsPanel()
  }
  if (route.tab === 'tags' && route.params.scope) {
    const scopeEl = document.querySelector('scope-filter')
    if (scopeEl) scopeEl.value = route.params.scope
    renderSection('tags')
  }
  if (route.tab === 'stats') {
    loadDashboard('stats-page-views', 'page-views')
    loadDashboard('stats-origins', 'origins')
    loadDashboard('stats-technology', 'technology')
    loadDashboard('stats-grafana', 'grafana')
  }
}

function syncUrlFromState() {
  const route = getAdminRoute()
  const params = { ...route.params }
  if (route.tab === 'settings') {
    const sev = document.getElementById('logs-severity')
    const type = document.getElementById('logs-type')
    const q = document.getElementById('logs-q')
    const from = document.getElementById('logs-from')
    const to = document.getElementById('logs-to')
    if (sev) params.severity = sev.value || ''
    if (type) params.type = type.value || ''
    if (q) params.q = q.value?.trim() || ''
    if (from) params.from = from.value || ''
    if (to) params.to = to.value || ''
  }
  if (route.tab === 'tags') {
    const scopeEl = document.querySelector('scope-filter')
    if (scopeEl) params.scope = scopeEl?.value || ''
  }
  if (route.tab === 'settings') {
    const openDetails = document.querySelector('.accordion-card[open]')
    const section = openDetails?.id?.replace('settings-', '') || null
    setAdminRoute({ tab: route.tab, section, params })
  } else {
    setAdminRoute({ tab: route.tab, section: null, params })
  }
}

function bindAddButtons() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.onclick = () => openModal(btn.dataset.section)
  })
}

function isHorizontalMenu() {
  const layout = document.getElementById('admin-layout') || document.querySelector('.admin-layout')
  const pos = layout?.getAttribute('data-menu-position') || 'sidebar_left'
  return pos === 'floating_top' || pos === 'above_content'
}

function closeAllNavDropdowns() {
  document.querySelectorAll('.nav-group-title[data-dropdown-trigger]').forEach(btn => {
    btn.setAttribute('aria-expanded', 'false')
  })
}

function bindNavDropdowns() {
  document.querySelectorAll('.nav-group-title[data-dropdown-trigger]').forEach(trigger => {
    trigger.addEventListener('click', (e) => {
      if (!isHorizontalMenu()) return
      e.stopPropagation()
      const isOpen = trigger.getAttribute('aria-expanded') === 'true'
      closeAllNavDropdowns()
      if (!isOpen) trigger.setAttribute('aria-expanded', 'true')
    })
  })
  document.addEventListener('click', () => {
    if (isHorizontalMenu()) closeAllNavDropdowns()
  })
  document.querySelector('.admin-nav')?.addEventListener('click', (e) => e.stopPropagation())
}

export async function initAdmin() {
  backdrop = document.getElementById('modalBackdrop')
  modalTitle = document.getElementById('modalTitle')
  modalForm = document.getElementById('modalForm')

  await loadAllTags()

  const loadPromises = Object.keys(SECTIONS).map(key => renderSection(key))
  loadPromises.push(loadAppearanceSettings())
  loadPromises.push(loadLanguagesSettings())
  loadPromises.push(loadMailSettings())
  loadPromises.push(loadLoggingSettings())
  loadPromises.push(renderPaymentsPanel())
  loadPromises.push(renderLogsPanel())
  await Promise.all(loadPromises)

  applyRoute(getAdminRoute())
  window.addEventListener('hashchange', () => applyRoute(getAdminRoute()))
  bindLogsFilters(() => syncUrlFromState())
  bindStatsFilters()

  document.querySelectorAll('.nav-item').forEach(item => {
    item.addEventListener('click', () => {
      if (isHorizontalMenu()) closeAllNavDropdowns()
    })
  })

  document.querySelectorAll('.accordion-card').forEach(details => {
    details.addEventListener('toggle', () => {
      if (details.open) syncUrlFromState()
    })
  })

  bindNavDropdowns()

  document.querySelector('scope-filter')?.addEventListener('filter-change', () => {
    renderSection('tags')
    syncUrlFromState()
  })

  bindAddButtons()

  modalForm.addEventListener('submit', handleModalSubmit)

  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeModal()
  })

  document.querySelector('.modal-close')?.addEventListener('click', closeModal)

  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && !backdrop.hidden) closeModal()
  })

  document.getElementById('form-appearance')?.addEventListener('submit', handleAppearanceSubmit)
  document.getElementById('form-languages')?.addEventListener('submit', handleLanguagesSubmit)
  document.getElementById('btn-add-lang')?.addEventListener('click', handleAddLanguage)
  document.getElementById('form-mail')?.addEventListener('submit', handleMailSubmit)
  document.getElementById('form-logging')?.addEventListener('submit', handleLoggingSubmit)

  const bgInput = document.getElementById('appearance-background')
  const bgPreview = document.getElementById('appearance-background-preview')
  const bgData = document.getElementById('appearance-background-data')
  const btnClearBg = document.getElementById('btn-clear-background')
  bgInput?.addEventListener('change', async (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > BG_MAX_SIZE) {
      toast('Image too large (max 400KB)', 'error')
      return
    }
    const base64 = await new Promise((res, rej) => {
      const r = new FileReader()
      r.onload = () => res(r.result)
      r.onerror = rej
      r.readAsDataURL(file)
    })
    if (bgData) bgData.value = base64
    if (bgPreview) {
      bgPreview.style.backgroundImage = `url(${base64})`
      bgPreview.classList.add('has-bg')
    }
  })
  btnClearBg?.addEventListener('click', () => {
    if (bgData) bgData.value = ''
    if (bgPreview) {
      bgPreview.style.backgroundImage = ''
      bgPreview.classList.remove('has-bg')
    }
    if (bgInput) bgInput.value = ''
  })

  document.getElementById('sidebar-toggle')?.addEventListener('click', () => {
    document.getElementById('admin-sidebar')?.classList.toggle('collapsed')
    const btn = document.getElementById('sidebar-toggle')
    if (btn) btn.setAttribute('aria-expanded', document.getElementById('admin-sidebar')?.classList.contains('collapsed') ? 'false' : 'true')
  })

  document.querySelectorAll('.settings-cards-add').forEach(btn => {
    btn.addEventListener('click', () => {
      const grid = btn.nextElementSibling
      if (!grid?.classList.contains('settings-cards')) return
      const current = grid.classList.contains('cols-2') ? 2 : grid.classList.contains('cols-3') ? 3 : 1
      const next = (current % 3) + 1
      grid.classList.remove('cols-1', 'cols-2', 'cols-3')
      grid.classList.add(`cols-${next}`)
      btn.title = `${next} column${next > 1 ? 's' : ''}`
    })
  })
}
