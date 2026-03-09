/**
 * Payment gateways seeder.
 * Seeds payment_gateways with all providers × environments (production, sandbox).
 * Preserves existing config and only adds any new provider/environment combos.
 *
 * Run: node db/seed-payments.js
 * Or:  npm run db:seed-payments
 */
import { createClient } from '@libsql/client'
import { readFileSync } from 'node:fs'

export const PAYMENT_PROVIDERS = [
  { id: 'stripe', name: 'Stripe', hasSync: true },
  { id: 'adyen', name: 'Adyen', hasSync: false },
  { id: 'paypal', name: 'PayPal', hasSync: true },
  { id: 'airwallex', name: 'Airwallex', hasSync: false },
  { id: 'paydollar', name: 'PayDollar', hasSync: false },
  { id: 'paymehsbc', name: 'PayMe HSBC', hasSync: false },
  { id: 'alipayhk', name: 'AlipayHK', hasSync: false },
  { id: 'octopus', name: 'Octopus', hasSync: false },
  { id: 'twocheckout', name: '2Checkout', hasSync: false },
  { id: 'verifone', name: 'Verifone', hasSync: false },
  { id: 'monobank', name: 'monobank', hasSync: false },
]

const ENVIRONMENTS = ['production', 'sandbox']

function loadEnv(file) {
  try {
    for (const line of readFileSync(file, 'utf-8').split('\n')) {
      const eq = line.indexOf('=')
      if (eq > 0) {
        const key = line.slice(0, eq).trim()
        const val = line.slice(eq + 1).trim()
        if (key && !process.env[key]) process.env[key] = val
      }
    }
  } catch {}
}
loadEnv('.dev.vars')
loadEnv('.env')

const url = process.env.TURSO_DATABASE_URL || 'file:local.db'
const authToken = process.env.TURSO_AUTH_TOKEN || undefined

const db = createClient({ url, authToken })

async function seed() {
  let added = 0
  for (const provider of PAYMENT_PROVIDERS) {
    for (const env of ENVIRONMENTS) {
      const existing = await db.execute({
        sql: 'SELECT 1 FROM payment_gateways WHERE provider = ? AND environment = ?',
        args: [provider.id, env],
      })
      if (existing.rows.length === 0) {
        await db.execute({
          sql: `INSERT INTO payment_gateways (provider, environment, config, enabled, updated_at)
                VALUES (?, ?, '{}', 0, datetime('now'))`,
          args: [provider.id, env],
        })
        added++
      }
    }
  }

  await db.execute({
    sql: 'INSERT OR IGNORE INTO settings (key, value) VALUES (?, ?)',
    args: ['payment_mode', '"production"'],
  })

  console.log(`Payment gateways seeded. ${added} new row(s) added.`)
  console.log('Available:', PAYMENT_PROVIDERS.map(p => p.id).join(', '))
}

seed()
  .then(() => db.close())
  .catch((err) => {
    console.error(err)
    process.exit(1)
  })
