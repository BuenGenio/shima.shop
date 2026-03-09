import { SECTIONS } from './sections.js'
import { seedIfEmpty } from './seed.js'
import { testYamatoConnection } from './yamato-client.js'
import { toast } from '../../components/toast.js'

const Store = {
  get(key) {
    try { return JSON.parse(localStorage.getItem(`admin_${key}`)) || [] }
    catch { return [] }
  },
  set(key, data) {
    localStorage.setItem(`admin_${key}`, JSON.stringify(data))
  },
  getObj(key) {
    try { return JSON.parse(localStorage.getItem(`admin_${key}`)) || {} }
    catch { return {} }
  },
  setObj(key, data) {
    localStorage.setItem(`admin_${key}`, JSON.stringify(data))
  },
}

function uid() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7)
}

let backdrop, modalTitle, modalForm
let currentModal = { section: null, id: null }

function renderSection(sectionKey) {
  const cfg = SECTIONS[sectionKey]
  if (!cfg) return

  const listEl = document.getElementById(`list-${sectionKey}`)
  if (!listEl) return

  const items = Store.get(cfg.storeKey)

  if (items.length === 0) {
    listEl.innerHTML = `
      <div class="empty-state">
        <p>No ${cfg.label.toLowerCase()}s yet.</p>
        <button class="btn-add" data-section="${sectionKey}">+ Add ${cfg.label}</button>
      </div>`
    bindAddButtons()
    return
  }

  const ths = cfg.columns.map(c => `<th>${c.label}</th>`).join('') + '<th></th>'
  const rows = items.map(item => {
    const tds = cfg.columns.map(c => {
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
  const inputType = f.type === 'password' ? 'password' : f.type
  return `<label class="${cls}"><span class="field-label">${f.label}</span>
    <input type="${inputType}" name="${f.key}" value="${val}" ${req} autocomplete="off"></label>`
}

function openModal(sectionKey, itemId) {
  const cfg = SECTIONS[sectionKey]
  if (!cfg) return

  currentModal = { section: sectionKey, id: itemId || null }

  const isEdit = !!itemId
  modalTitle.textContent = isEdit ? `Edit ${cfg.label}` : `Add ${cfg.label}`

  let existing = {}
  if (isEdit) {
    const items = Store.get(cfg.storeKey)
    existing = items.find(i => i.id === itemId) || {}
  }

  const ungrouped = cfg.fields.filter(f => !f.group)
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

  const ungroupedHtml = ungrouped.map(f => renderFieldHtml(f, existing)).join('')

  let groupsHtml = ''
  for (const gName of groupOrder) {
    const g = groupMap[gName]
    const carrierVal = existing.carrier || ''
    const visible = !g.showWhen || g.showWhen === carrierVal
    const fieldsStr = g.fields.map(f => renderFieldHtml(f, existing)).join('')

    const isApiGroup = gName.toLowerCase().includes('api') && g.showWhen === 'yamato'
    const testBtn = isApiGroup
      ? `<div class="form-group-action"><button type="button" class="btn-test" id="btnTestYamato">Test Connection</button><span class="test-status" id="testStatus"></span></div>`
      : ''

    groupsHtml += `
      <div class="form-group" data-show-when="${g.showWhen || ''}" ${visible ? '' : 'style="display:none"'}>
        <h4 class="form-group-title">${gName}</h4>
        <div class="form-grid">${fieldsStr}</div>
        ${testBtn}
      </div>`
  }

  modalForm.innerHTML = `
    <div class="form-grid">${ungroupedHtml}</div>
    ${groupsHtml}
    <div class="form-actions">
      <button type="button" class="btn-cancel" id="btnModalCancel">Cancel</button>
      <button type="submit" class="btn-save">${isEdit ? 'Update' : 'Create'}</button>
    </div>`

  backdrop.hidden = false
  modalForm.querySelector('input, select, textarea')?.focus()

  document.getElementById('btnModalCancel').addEventListener('click', closeModal)

  const carrierSelect = modalForm.querySelector('[name="carrier"]')
  if (carrierSelect) {
    carrierSelect.addEventListener('change', () => updateGroupVisibility(carrierSelect.value))
  }

  document.getElementById('btnTestYamato')?.addEventListener('click', () => testYamatoConnection(modalForm))
}

function closeModal() {
  backdrop.hidden = true
  currentModal = { section: null, id: null }
}

function handleModalSubmit(e) {
  e.preventDefault()
  const { section, id } = currentModal
  const cfg = SECTIONS[section]
  if (!cfg) return

  const fd = new FormData(modalForm)
  const data = {}
  for (const f of cfg.fields) {
    let val = fd.get(f.key) ?? ''
    if (f.type === 'number' && val !== '') val = Number(val)
    data[f.key] = val
  }

  const items = Store.get(cfg.storeKey)

  if (id) {
    const idx = items.findIndex(i => i.id === id)
    if (idx >= 0) items[idx] = { ...items[idx], ...data }
  } else {
    data.id = uid()
    items.push(data)
  }

  Store.set(cfg.storeKey, items)
  renderSection(section)
  closeModal()
  toast(id ? `${cfg.label} updated` : `${cfg.label} created`)
}

function deleteItem(sectionKey, itemId) {
  const cfg = SECTIONS[sectionKey]
  if (!cfg) return
  if (!confirm(`Delete this ${cfg.label.toLowerCase()}?`)) return

  const items = Store.get(cfg.storeKey).filter(i => i.id !== itemId)
  Store.set(cfg.storeKey, items)
  renderSection(sectionKey)
  toast(`${cfg.label} deleted`)
}

function updateGroupVisibility(carrier) {
  modalForm.querySelectorAll('.form-group[data-show-when]').forEach(g => {
    const sw = g.dataset.showWhen
    g.style.display = (!sw || sw === carrier) ? '' : 'none'
  })
}

function loadMailSettings() {
  const data = Store.getObj('mail')
  const form = document.getElementById('form-mail')
  if (!form) return

  for (const [key, val] of Object.entries(data)) {
    const el = form.elements[key]
    if (el) el.value = val
  }
}

function handleMailSubmit(e) {
  e.preventDefault()
  const form = e.target
  const data = {}
  const fields = ['smtp_host', 'smtp_port', 'smtp_user', 'smtp_pass', 'smtp_encryption', 'from_name', 'from_email']
  for (const f of fields) {
    data[f] = form.elements[f]?.value ?? ''
  }
  if (data.smtp_port) data.smtp_port = Number(data.smtp_port)
  Store.setObj('mail', data)
  toast('Mail settings saved')
}

function switchTab(tabKey) {
  document.querySelectorAll('.tab-pill').forEach(p => {
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

function bindAddButtons() {
  document.querySelectorAll('.btn-add').forEach(btn => {
    btn.onclick = () => openModal(btn.dataset.section)
  })
}

export function initAdmin() {
  backdrop = document.getElementById('modalBackdrop')
  modalTitle = document.getElementById('modalTitle')
  modalForm = document.getElementById('modalForm')

  seedIfEmpty(Store)

  for (const key of Object.keys(SECTIONS)) {
    renderSection(key)
  }

  loadMailSettings()

  document.querySelectorAll('.tab-pill').forEach(pill => {
    pill.addEventListener('click', () => switchTab(pill.dataset.tab))
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

  document.getElementById('form-mail')?.addEventListener('submit', handleMailSubmit)
}
