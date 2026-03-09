/**
 * Payment methods admin - configure providers and sync products/subscriptions
 * Uses /api/payments for provider config (GET list, PUT save) and /api/payments/sync for product sync
 */
import { toast } from '../../components/toast.js'

const PAYMENTS_API = '/api/payments'
const PAYMENTS_SYNC_API = '/api/payments-sync'

/** Per-provider field definitions. Each has test and production credential sets. */
const CREDENTIAL_FIELDS = {
  stripe: [
    { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    { key: 'publishableKey', label: 'Publishable Key', type: 'text' },
  ],
  adyen: [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    { key: 'merchantAccount', label: 'Merchant Account', type: 'text', required: true },
  ],
  paypal: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
  ],
  airwallex: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
    { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    { key: 'merchantAccountId', label: 'Merchant Account ID (optional)', type: 'text' },
  ],
  paydollar: [
    { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
    { key: 'secureHashSecret', label: 'Secure Hash Secret', type: 'password', required: true },
    { key: 'notifyUrl', label: 'Notify URL (optional)', type: 'text' },
  ],
  paymehsbc: [
    { key: 'clientId', label: 'Client ID', type: 'text', required: true },
    { key: 'clientSecret', label: 'Client Secret', type: 'password', required: true },
  ],
  alipayhk: [
    { key: 'appId', label: 'App ID', type: 'text', required: true },
    { key: 'privateKey', label: 'Private Key (PEM)', type: 'textarea' },
  ],
  octopus: [
    { key: 'merchantId', label: 'Merchant ID', type: 'text', required: true },
    { key: 'apiKey', label: 'API Key', type: 'password', required: true },
  ],
  twocheckout: [
    { key: 'merchantCode', label: 'Merchant Code', type: 'text', required: true },
    { key: 'secretKey', label: 'Secret Key', type: 'password', required: true },
    { key: 'country', label: 'Country Code', type: 'text', placeholder: 'JP' },
  ],
  verifone: [
    { key: 'apiKey', label: 'API Key', type: 'password', required: true },
    { key: 'entityId', label: 'Entity ID', type: 'text', required: true },
  ],
  monobank: [
    { key: 'token', label: 'X-Token', type: 'password', required: true },
    { key: 'webhookUrl', label: 'Webhook URL (optional)', type: 'text' },
  ],
}

const PROVIDER_NAMES = {
  stripe: 'Stripe',
  adyen: 'Adyen',
  paypal: 'PayPal',
  airwallex: 'Airwallex',
  paydollar: 'PayDollar',
  paymehsbc: 'PayMe HSBC',
  alipayhk: 'AlipayHK',
  octopus: 'Octopus',
  twocheckout: '2Checkout',
  verifone: 'Verifone',
  monobank: 'monobank',
}

async function paymentsApi(path, opts = {}) {
  const url = path ? `${PAYMENTS_API}${path}` : PAYMENTS_API
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json' },
    ...opts,
  })
  return res.json()
}

function renderField(group, f, val) {
  if (val && f.type === 'password' && val.includes('****')) val = ''
  const isPass = f.type === 'password'
  const inputType = isPass ? 'password' : (f.type === 'textarea' ? 'textarea' : 'text')
  const opts = (f.options || []).map(o => `<option value="${o}" ${val === o ? 'selected' : ''}>${o}</option>`).join('')
  const ph = f.placeholder ? ` placeholder="${f.placeholder}"` : ''
  const name = group ? `${group}.${f.key}` : f.key
  if (f.type === 'select') {
    return `<label class="field"><span class="field-label">${f.label}</span>
      <select name="${name}">${opts}</select></label>`
  }
  if (f.type === 'textarea') {
    return `<label class="field full-width"><span class="field-label">${f.label}</span>
      <textarea name="${name}" rows="3">${val}</textarea></label>`
  }
  return `<label class="field"><span class="field-label">${f.label}</span>
    <input type="${inputType}" name="${name}" value="${val}"${ph} autocomplete="off"></label>`
}

function renderProviderCard(provider) {
  const fields = CREDENTIAL_FIELDS[provider.id] || []
  const config = provider.config || {}
  const enabled = provider.enabled
  const hasSync = provider.hasSync
  const isDeleted = !!provider.deletedAt

  // Support legacy flat config: use for both sections until migrated
  const hasNested = config.test != null || config.production != null
  const testConfig = hasNested ? (config.test || {}) : config
  const prodConfig = hasNested ? (config.production || {}) : config

  const testHtml = fields.map(f => renderField('test', f, testConfig[f.key] ?? '')).join('')
  const prodHtml = fields.map(f => renderField('production', f, prodConfig[f.key] ?? '')).join('')

  const formActions = isDeleted
    ? `<div class="form-actions">
        <button type="button" class="btn-restore" data-provider="${provider.id}" data-action="restore">Restore</button>
        <button type="button" class="btn-hard-delete" data-provider="${provider.id}" data-action="hard-delete" title="Permanently delete">Delete permanently</button>
      </div>`
    : `<div class="form-actions">
        <button type="submit" class="btn-save">Save</button>
        <button type="button" class="btn-trash" data-provider="${provider.id}" data-action="trash" title="Move to trash">Trash</button>
      </div>`

  return `
    <div class="payment-provider-card ${isDeleted ? 'deleted' : ''}" data-provider="${provider.id}" data-enabled="${enabled}" data-deleted="${isDeleted}">
      <div class="provider-header">
        <label class="provider-toggle">
          <input type="checkbox" ${enabled ? 'checked' : ''} data-provider="${provider.id}" class="provider-enabled">
          <span>${PROVIDER_NAMES[provider.id] || provider.id}</span>
        </label>
        ${hasSync ? `<button type="button" class="btn-sync" data-provider="${provider.id}">Sync Products</button>` : ''}
      </div>
      <div class="provider-config" ${enabled ? '' : 'style="display:none"'}>
        <form class="provider-form" data-provider="${provider.id}">
          <div class="config-section">
            <h4 class="config-section-title">Test / Sandbox</h4>
            <div class="form-grid">${testHtml}</div>
          </div>
          <div class="config-section">
            <h4 class="config-section-title">Production</h4>
            <div class="form-grid">${prodHtml}</div>
          </div>
          ${formActions}
        </form>
      </div>
    </div>
  `
}

function filterProviders(providers, filter) {
  if (filter === 'enabled') return providers.filter(p => p.enabled)
  if (filter === 'disabled') return providers.filter(p => !p.enabled)
  return providers
}

export async function renderPaymentsPanel() {
  const body = document.getElementById('payments-panel-body')
  if (!body) return

  const panel = body.closest('.tab-panel')
  if (!panel) return

  try {
    const data = await paymentsApi('?deleted=1')
    const providers = data.providers || []
    const paymentMode = data.paymentMode || 'production'
    const disabledProviders = providers.filter(p => !p.enabled && !p.deletedAt)
    const filterOptions = [
      { value: 'all', label: 'All' },
      { value: 'enabled', label: 'Enabled' },
      { value: 'disabled', label: 'Disabled' },
      { value: 'trash', label: 'Trash' },
    ]
    const addOptions = disabledProviders.length > 0
      ? disabledProviders.map(p => `<option value="${p.id}">${PROVIDER_NAMES[p.id] || p.id}</option>`).join('')
      : ''

    body.innerHTML = `
      <div class="payments-toolbar">
        <label class="payments-mode-label">
          <span class="field-label">Payment mode</span>
          <select id="payment-mode" class="payment-mode-select" aria-label="Test or production mode">
            <option value="test" ${paymentMode === 'test' ? 'selected' : ''}>Test / Sandbox</option>
            <option value="production" ${paymentMode === 'production' ? 'selected' : ''}>Production</option>
          </select>
        </label>
        <label class="payments-filter-label">
          <span class="field-label">Filter</span>
          <select id="payment-filter" class="payment-filter-select" aria-label="Filter payment methods">
            ${filterOptions.map(o => `<option value="${o.value}">${o.label}</option>`).join('')}
          </select>
        </label>
        <label class="payments-add-label">
          <span class="field-label">Add</span>
          <select id="payment-add" class="payment-add-select" aria-label="Add payment method" ${disabledProviders.length === 0 ? 'disabled' : ''}>
            <option value="">+ Add payment method…</option>
            ${addOptions}
          </select>
        </label>
      </div>
      <div class="payments-intro">
        <p>Configure payment methods for checkout. Enter <strong>Test</strong> and <strong>Production</strong> credentials for each provider. Use the mode selector to switch which credentials are used for checkout and sync.</p>
      </div>
      <div class="payments-providers" id="payments-providers">
        ${providers.map(renderProviderCard).join('')}
      </div>
      <div class="payments-sync-all">
        <button type="button" class="btn-sync-all" id="btnSyncAll">Sync All (Stripe & PayPal)</button>
        <span class="sync-status" id="syncStatus"></span>
      </div>
    `

    body.querySelectorAll('.provider-enabled').forEach(cb => {
      cb.addEventListener('change', async (e) => {
        const card = e.target.closest('.payment-provider-card')
        const configEl = card.querySelector('.provider-config')
        const enabled = e.target.checked
        configEl.style.display = enabled ? '' : 'none'
        await saveProviderEnabled(e.target.dataset.provider, enabled, card)
      })
    })

    body.querySelectorAll('.provider-form').forEach(form => {
      form.addEventListener('submit', async (e) => {
        e.preventDefault()
        const providerId = form.dataset.provider
        const fd = new FormData(form)
        const config = {}
        for (const [k, v] of fd) {
          if (k.startsWith('test.')) {
            config.test = config.test || {}
            config.test[k.slice(5)] = v
          } else if (k.startsWith('production.')) {
            config.production = config.production || {}
            config.production[k.slice(11)] = v
          }
        }
        await saveProviderConfig(providerId, config)
      })
    })

    body.querySelectorAll('.btn-sync').forEach(btn => {
      btn.addEventListener('click', () => syncProvider(btn.dataset.provider))
    })

    body.querySelectorAll('.btn-trash').forEach(btn => {
      btn.addEventListener('click', () => handleTrash(btn.dataset.provider))
    })

    body.querySelectorAll('.btn-restore').forEach(btn => {
      btn.addEventListener('click', () => handleRestore(btn.dataset.provider))
    })

    body.querySelectorAll('.btn-hard-delete').forEach(btn => {
      btn.addEventListener('click', () => handleHardDelete(btn.dataset.provider))
    })

    document.getElementById('btnSyncAll')?.addEventListener('click', syncAll)

    document.getElementById('payment-mode')?.addEventListener('change', async (e) => {
      const mode = e.target.value
      try {
        await paymentsApi('', { method: 'PUT', body: JSON.stringify({ paymentMode: mode }) })
        toast(`Payment mode set to ${mode}`)
      } catch (err) {
        toast(err.message || 'Save failed', 'error')
      }
    })

    document.getElementById('payment-filter')?.addEventListener('change', (e) => {
      const filter = e.target.value
      body.querySelectorAll('.payment-provider-card').forEach(card => {
        const enabled = card.dataset.enabled === 'true'
        const deleted = card.dataset.deleted === 'true'
        const show =
          (filter === 'all' && !deleted) ||
          (filter === 'enabled' && !deleted && enabled) ||
          (filter === 'disabled' && !deleted && !enabled) ||
          (filter === 'trash' && deleted)
        card.style.display = show ? '' : 'none'
      })
    })

    document.getElementById('payment-add')?.addEventListener('change', async (e) => {
      const providerId = e.target.value
      if (!providerId) return
      e.target.value = ''
      await saveProviderEnabled(providerId, true)
      await renderPaymentsPanel()
    })

    document.getElementById('payment-filter')?.dispatchEvent(new Event('change'))
  } catch (err) {
    body.innerHTML = `<p class="error">Failed to load payment providers: ${err.message}</p>`
  }
}

async function saveProviderEnabled(providerId, enabled, card = null) {
  try {
    await paymentsApi('', {
      method: 'PUT',
      body: JSON.stringify({ providerId, enabled }),
    })
    if (card) card.dataset.enabled = String(enabled)
    toast(`${PROVIDER_NAMES[providerId]} ${enabled ? 'enabled' : 'disabled'}`)
  } catch (err) {
    toast(err.message || 'Save failed', 'error')
  }
}

async function saveProviderConfig(providerId, config) {
  try {
    await paymentsApi('', {
      method: 'PUT',
      body: JSON.stringify({ providerId, config }),
    })
    toast(`${PROVIDER_NAMES[providerId]} config saved`)
  } catch (err) {
    toast(err.message || 'Save failed', 'error')
  }
}

async function handleTrash(providerId) {
  const name = PROVIDER_NAMES[providerId] || providerId
  if (!confirm(`Move ${name} to trash? You can restore it later from the Trash filter.`)) return
  try {
    await paymentsApi(`?providerId=${providerId}`, { method: 'DELETE' })
    toast(`${name} moved to trash`)
    await renderPaymentsPanel()
  } catch (err) {
    toast(err.message || 'Failed to move to trash', 'error')
  }
}

async function handleRestore(providerId) {
  try {
    await paymentsApi('', {
      method: 'PUT',
      body: JSON.stringify({ providerId, restore: true }),
    })
    toast(`${PROVIDER_NAMES[providerId] || providerId} restored`)
    await renderPaymentsPanel()
  } catch (err) {
    toast(err.message || 'Restore failed', 'error')
  }
}

async function handleHardDelete(providerId) {
  const name = PROVIDER_NAMES[providerId] || providerId
  if (!confirm(`Permanently delete ${name}? This cannot be undone.`)) return
  try {
    await paymentsApi(`?providerId=${providerId}&hard=1`, { method: 'DELETE' })
    toast(`${name} permanently deleted`)
    await renderPaymentsPanel()
  } catch (err) {
    toast(err.message || 'Delete failed', 'error')
  }
}

async function syncProvider(providerId) {
  const status = document.getElementById('syncStatus')
  if (status) status.textContent = 'Syncing…'
  try {
    const res = await fetch(PAYMENTS_SYNC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ providers: [providerId] }),
    })
    const data = await res.json()
    const r = data.results?.products?.[providerId]
    const count = r?.count ?? r?.error ?? 0
    if (status) status.textContent = typeof count === 'number' ? `Synced ${count} products` : count
    toast(typeof count === 'number' ? `Synced ${count} products to ${PROVIDER_NAMES[providerId]}` : (r?.error || 'Sync failed'), typeof count === 'number' ? undefined : 'error')
  } catch (err) {
    if (status) status.textContent = 'Error'
    toast(err.message || 'Sync failed', 'error')
  }
}

async function syncAll() {
  const status = document.getElementById('syncStatus')
  if (status) status.textContent = 'Syncing…'
  try {
    const res = await fetch(PAYMENTS_SYNC_API, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ syncProducts: true, syncSubscriptions: true }),
    })
    const data = await res.json()
    const total = Object.values(data.results?.products || {}).reduce((s, r) => s + (r.count || 0), 0)
    if (status) status.textContent = `Synced ${total} products`
    toast(`Synced ${total} products to payment providers`)
  } catch (err) {
    if (status) status.textContent = 'Error'
    toast(err.message || 'Sync failed', 'error')
  }
}
