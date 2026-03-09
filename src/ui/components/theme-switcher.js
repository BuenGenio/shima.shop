const THEME_KEY = 'adhd_theme'

export function initTheme() {
  const root = document.documentElement
  const mql = window.matchMedia?.('(prefers-color-scheme: dark)') ?? null

  function systemTheme() {
    return mql?.matches ? 'dark' : 'light'
  }

  function applyAttrs(theme) {
    root.setAttribute('data-theme', theme)
    root.setAttribute('data-system', systemTheme())
    const lbl = document.getElementById('themeLabel')
    const ico = document.getElementById('themeIcon')
    const btn = document.getElementById('btnTheme')
    const label = theme[0].toUpperCase() + theme.slice(1)
    if (lbl) lbl.textContent = label
    if (ico) ico.textContent = theme === 'auto' ? '◐' : theme === 'dark' ? '☾' : '☼'
    if (btn) btn.setAttribute('aria-label', `Switch colour theme, currently ${label}`)
  }

  function getTheme() {
    const saved = localStorage.getItem(THEME_KEY)
    return ['auto', 'dark', 'light'].includes(saved) ? saved : 'auto'
  }

  function setTheme(t) {
    localStorage.setItem(THEME_KEY, t)
    applyAttrs(t)
  }

  applyAttrs(getTheme())

  if (mql) {
    mql.addEventListener('change', () => {
      root.setAttribute('data-system', systemTheme())
      if (getTheme() === 'auto') applyAttrs('auto')
    })
  }

  document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('btnTheme')
    if (btn) btn.addEventListener('click', () => {
      const cur = getTheme()
      setTheme(cur === 'auto' ? 'dark' : cur === 'dark' ? 'light' : 'auto')
    })
  })
}
