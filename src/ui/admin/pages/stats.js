/**
 * Stats dashboards: Page Views, Origins & Traffic, Technology, Grafana Push
 * Each has: graph, fulltext + date range filters, data export
 */
import { toast } from '../../components/toast.js'

const STATS_API = '/api/stats'

function toIsoLocal(el) {
  if (!el?.value) return ''
  const d = new Date(el.value)
  return isNaN(d.getTime()) ? '' : d.toISOString().slice(0, 19).replace('T', ' ')
}

function buildParams(dashboard, filters) {
  const q = new URLSearchParams()
  q.set('dashboard', dashboard)
  if (filters.q) q.set('q', filters.q)
  if (filters.from) q.set('from', filters.from)
  if (filters.to) q.set('to', filters.to)
  return q
}

async function fetchStats(dashboard, filters) {
  const params = buildParams(dashboard, filters)
  const res = await fetch(`${STATS_API}?${params}`)
  const data = await res.json()
  if (!res.ok) throw new Error(data?.error || 'Failed to fetch stats')
  return data
}

function escapeHtml(s) {
  if (typeof s !== 'string') return ''
  const div = document.createElement('div')
  div.textContent = s
  return div.innerHTML
}

function renderBarChart(series, maxBars = 14) {
  if (!series?.length) return '<p class="stats-empty">No data</p>'
  const max = Math.max(...series.map((s) => s.count), 1)
  const items = series.slice(-maxBars)
  return `
    <div class="stats-chart">
      ${items
        .map(
          (s) => `
        <div class="stats-bar-wrap">
          <div class="stats-bar" style="height:${(s.count / max) * 100}%" title="${escapeHtml(s.date)}: ${s.count}"></div>
          <span class="stats-bar-label">${escapeHtml(s.date?.slice(5) || s.date)}</span>
        </div>`
        )
        .join('')}
    </div>`
}

function renderBreakdown(items, labelKey = 'path', countKey = 'count') {
  if (!items?.length) return '<p class="stats-empty">No data</p>'
  return `
    <ul class="stats-breakdown">
      ${items
        .map(
          (i) => `
        <li><span class="stats-breakdown-label">${escapeHtml(i[labelKey] || i.name || i.source || '—')}</span>
        <span class="stats-breakdown-count">${i[countKey]}</span></li>`
        )
        .join('')}
    </ul>`
}

function exportCsv(raw, columns) {
  if (!raw?.length) return ''
  const headers = columns || Object.keys(raw[0] || {})
  const rows = [headers.join(',')]
  for (const row of raw) {
    rows.push(headers.map((h) => `"${String(row[h] ?? '').replace(/"/g, '""')}"`).join(','))
  }
  return rows.join('\n')
}

function exportJson(data) {
  return JSON.stringify(data, null, 2)
}

function downloadBlob(content, filename, mime) {
  const blob = new Blob([content], { type: mime })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

export function renderDashboard(cardId, dashboard, data) {
  const card = document.getElementById(cardId)
  if (!card) return

  const filters = {
    q: card.querySelector('.stats-filter-q')?.value?.trim() || '',
    from: toIsoLocal(card.querySelector('.stats-filter-from')),
    to: toIsoLocal(card.querySelector('.stats-filter-to')),
  }

  let chartHtml = ''
  let breakdownHtml = ''

  if (dashboard === 'page-views') {
    chartHtml = renderBarChart(data.series)
    breakdownHtml = renderBreakdown(data.breakdown, 'path', 'count')
  } else if (dashboard === 'origins') {
    chartHtml = renderBarChart(data.series)
    breakdownHtml = renderBreakdown(data.breakdown, 'source', 'count')
  } else if (dashboard === 'technology') {
    chartHtml = renderBarChart(data.series)
    const b = data.breakdown || {}
    breakdownHtml = `
      <div class="stats-tech-grid">
        <div><h5>Browser</h5>${renderBreakdown(b.browser, 'name', 'count')}</div>
        <div><h5>OS</h5>${renderBreakdown(b.os, 'name', 'count')}</div>
        <div><h5>Device</h5>${renderBreakdown(b.device, 'name', 'count')}</div>
      </div>`
  } else if (dashboard === 'grafana') {
    chartHtml = renderBarChart(data.series)
    breakdownHtml = `
      <p class="text-muted">Push metrics to Grafana. Configure endpoint in Settings.</p>
      <p><code>POST /api/stats/grafana/push</code></p>`
  }

  const chartEl = card.querySelector('.stats-chart-wrap')
  const breakdownEl = card.querySelector('.stats-breakdown-wrap')
  if (chartEl) chartEl.innerHTML = chartHtml
  if (breakdownEl) breakdownEl.innerHTML = breakdownHtml

  card.dataset.statsData = JSON.stringify(data)
}

export async function loadDashboard(cardId, dashboard) {
  const card = document.getElementById(cardId)
  if (!card) return

  const filters = {
    q: card.querySelector('.stats-filter-q')?.value?.trim() || '',
    from: toIsoLocal(card.querySelector('.stats-filter-from')),
    to: toIsoLocal(card.querySelector('.stats-filter-to')),
  }

  const loading = card.querySelector('.stats-loading')
  if (loading) loading.hidden = false

  try {
    const data = await fetchStats(dashboard, filters)
    renderDashboard(cardId, dashboard, data)
  } catch (err) {
    toast(err.message || 'Failed to load stats', 'error')
    const chartEl = card.querySelector('.stats-chart-wrap')
    if (chartEl) chartEl.innerHTML = `<p class="stats-error">${escapeHtml(err.message)}</p>`
  } finally {
    if (loading) loading.hidden = true
  }
}

export function bindStatsFilters() {
  document.querySelectorAll('.stats-card').forEach((card) => {
    const dashboard = card.dataset.dashboard
    const cardId = card.id
    if (!dashboard || !cardId) return

    const refresh = () => loadDashboard(cardId, dashboard)

    card.querySelector('.stats-filter-q')?.addEventListener('input', (e) => {
      if (e.target.value.length >= 2 || e.target.value === '') refresh()
    })
    card.querySelector('.stats-filter-q')?.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') refresh()
    })
    card.querySelector('.stats-filter-from')?.addEventListener('change', refresh)
    card.querySelector('.stats-filter-to')?.addEventListener('change', refresh)
    card.querySelector('.stats-btn-refresh')?.addEventListener('click', refresh)

    card.querySelector('.stats-btn-export-csv')?.addEventListener('click', () => {
      const raw = JSON.parse(card.dataset.statsData || '{}').raw || []
      const csv = exportCsv(raw, ['id', 'path', 'referrer', 'referrerHost', 'userAgent', 'createdAt'])
      downloadBlob(csv, `stats-${dashboard}-${new Date().toISOString().slice(0, 10)}.csv`, 'text/csv')
      toast('Exported CSV')
    })

    card.querySelector('.stats-btn-export-json')?.addEventListener('click', () => {
      const data = JSON.parse(card.dataset.statsData || '{}')
      downloadBlob(exportJson(data), `stats-${dashboard}-${new Date().toISOString().slice(0, 10)}.json`, 'application/json')
      toast('Exported JSON')
    })
  })
}
