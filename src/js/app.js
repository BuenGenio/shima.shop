import '../styles/main.css'
import { initTheme } from '../ui/components/theme-switcher.js'
import { initSalesCounter } from '../ui/components/sales-counter.js'
import { initStore } from '../ui/pages/store.js'

initTheme()

function recordPageView() {
  const path = window.location.pathname || '/'
  const referrer = document.referrer || ''
  const userAgent = navigator.userAgent || ''
  fetch('/api/page-views', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ path, referrer, userAgent }),
  }).catch(() => {})
}

document.addEventListener('DOMContentLoaded', () => {
  initStore()
  initSalesCounter()
  recordPageView()
})
