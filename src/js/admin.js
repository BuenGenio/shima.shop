import '../styles/admin.css'
import { initTheme } from '../ui/components/theme-switcher.js'
import { initAdmin } from '../ui/admin/pages/admin.js'

initTheme()

document.addEventListener('DOMContentLoaded', initAdmin)
