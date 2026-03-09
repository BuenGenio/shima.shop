import '../styles/base.css'
import '../styles/layout.css'
import '../styles/store.css'
import { initTheme } from '../ui/components/theme-switcher.js'
import { initSalesCounter } from '../ui/components/sales-counter.js'
import { renderKits } from '../ui/pages/store.js'

initTheme()

document.addEventListener('DOMContentLoaded', () => {
  renderKits()
  initSalesCounter()
})
