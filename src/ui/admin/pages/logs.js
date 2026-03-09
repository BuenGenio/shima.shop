/**
 * Logs admin - view, filter, and purge application logs from db
 * Uses /api/logs GET (severity, type, from, to, q, limit, offset) and DELETE (days, before)
 */
import { toast } from '../../components/toast.js'

const LOGS_API = '/api/logs'

async function logsApi(params = {}) {
  const q = new URLSearchParams()
  if (params.severity) q.set('severity', params.severity)
  if (params.type) q.set('type', params.type)
  if (params.from) q.set('from', params.from)
  if (params.to) q.set('to', params.to)
  if (params.q) q.set('q', params.q)
  q.set('limit', params.limit ?? 100)
  q.set('offset', params.offset ?? 0)
  const res = await fetch(`${LOGS_API}?${q}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to fetch logs')
  return data
}

async function purgeLogs(days) {
  const res = await fetch(`${LOGS_API}?days=${days}`, { method: 'DELETE' })
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to purge logs')
  return data
}

const SEVERITY_CLASS = {
  debug: 'log-sev-debug',
  info: 'log-sev-info',
  warn: 'log-sev-warn',
  error: 'log-sev-error',
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleString(undefined, {
    dateStyle: 'short',
    timeStyle: 'medium',
  })
}

function toIsoLocal(el) {
  if (!el?.value) return undefined
  const d = new Date(el.value)
  return isNaN(d.getTime()) ? undefined : d.toISOString().slice(0, 19).replace('T', ' ')
}

function renderLogRow(log) {
  const sevClass = SEVERITY_CLASS[log.severity] || ''
  const metaStr = log.metadata && Object.keys(log.metadata).length
    ? JSON.stringify(log.metadata)
    : ''
  return `
    <tr class="${sevClass}">
      <td class="log-time">${formatDate(log.createdAt)}</td>
      <td class="log-severity">${log.severity}</td>
      <td class="log-type">${log.type || '—'}</td>
      <td class="log-message">${escapeHtml(log.message)}</td>
      <td class="log-source">${escapeHtml(log.source || '—')}</td>
      <td class="log-meta">${metaStr ? `<code>${escapeHtml(metaStr)}</code>` : '—'}</td>
    </tr>
  `
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

export async function renderLogsPanel() {
  const body = document.getElementById('logs-panel-body')
  const severityEl = document.getElementById('logs-severity')
  const typeEl = document.getElementById('logs-type')
  const qEl = document.getElementById('logs-q')
  const fromEl = document.getElementById('logs-from')
  const toEl = document.getElementById('logs-to')

  if (!body) return

  const severity = severityEl?.value || ''
  const type = typeEl?.value || ''
  const q = qEl?.value?.trim() || ''
  const from = toIsoLocal(fromEl)
  const to = toIsoLocal(toEl)

  body.innerHTML = '<p class="loading">Loading logs…</p>'

  try {
    const { logs } = await logsApi({
      severity: severity || undefined,
      type: type || undefined,
      q: q || undefined,
      from,
      to,
    })

    if (!logs || logs.length === 0) {
      const hasFilters = severity || type || q || from || to
      body.innerHTML = `
        <div class="empty-state">
          <p>No logs found${hasFilters ? ' for the selected filters.' : '.'}</p>
          <p class="text-muted">Enable <strong>Database</strong> in Logging targets to store logs.</p>
        </div>
      `
      return
    }

    const types = [...new Set(logs.map(l => l.type).filter(Boolean))].sort()
    if (typeEl && types.length) {
      const currentVal = typeEl.value
      const opts = typeEl.querySelectorAll('option')
      const known = [...opts].slice(1).map(o => o.value)
      types.forEach(t => {
        if (!known.includes(t)) {
          const opt = document.createElement('option')
          opt.value = t
          opt.textContent = t
          typeEl.appendChild(opt)
        }
      })
    }

    const table = `
      <div class="admin-table-wrap">
        <table class="admin-table logs-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Severity</th>
              <th>Type</th>
              <th>Message</th>
              <th>Source</th>
              <th>Metadata</th>
            </tr>
          </thead>
          <tbody>
            ${logs.map(renderLogRow).join('')}
          </tbody>
        </table>
      </div>
    `
    body.innerHTML = table
  } catch (e) {
    body.innerHTML = `
      <div class="empty-state">
        <p>Could not load logs: ${escapeHtml(e.message)}</p>
      </div>
    `
    toast('Failed to load logs', 'error')
  }
}

export function bindLogsFilters(onFilterChange) {
  const severityEl = document.getElementById('logs-severity')
  const typeEl = document.getElementById('logs-type')
  const qEl = document.getElementById('logs-q')
  const fromEl = document.getElementById('logs-from')
  const toEl = document.getElementById('logs-to')
  const refreshBtn = document.getElementById('logs-refresh')
  const purgeBtn = document.getElementById('logs-purge')
  const purgeDaysEl = document.getElementById('logs-purge-days')

  const apply = () => {
    renderLogsPanel()
    onFilterChange?.()
  }

  severityEl?.addEventListener('change', apply)
  typeEl?.addEventListener('change', apply)
  qEl?.addEventListener('change', apply)
  qEl?.addEventListener('keydown', (e) => { if (e.key === 'Enter') apply() })
  fromEl?.addEventListener('change', apply)
  toEl?.addEventListener('change', apply)
  refreshBtn?.addEventListener('click', apply)

  purgeBtn?.addEventListener('click', async () => {
    const days = parseInt(purgeDaysEl?.value || '30', 10)
    if (isNaN(days) || days < 1) {
      toast('Enter a valid number of days', 'error')
      return
    }
    if (!confirm(`Delete all logs older than ${days} days? This cannot be undone.`)) return
    try {
      const { deleted } = await purgeLogs(days)
      toast(`Purged ${deleted} log(s)`)
      apply()
    } catch (e) {
      toast(e.message || 'Purge failed', 'error')
    }
  })
}
