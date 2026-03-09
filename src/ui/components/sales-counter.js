export function initSalesCounter() {
  const BASE = 1000
  const LAUNCH = new Date('2025-06-01').getTime()
  const daysSince = Math.max(0, Math.floor((Date.now() - LAUNCH) / 86400000))
  const pseudo = daysSince * 3 + Math.floor(Math.sin(daysSince) * 2)
  const total = BASE + pseudo
  const formatted = total.toLocaleString() + '+'

  const headerEl = document.getElementById('salesCounter')
  const footerEl = document.getElementById('salesCounterFooter')
  if (headerEl) headerEl.textContent = formatted + ' kits sold'
  if (footerEl) footerEl.textContent = formatted
}
