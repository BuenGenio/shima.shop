import { createClient } from '@libsql/client/web'

export function getDb(env) {
  return createClient({
    url: env.TURSO_DATABASE_URL,
    authToken: env.TURSO_AUTH_TOKEN,
  })
}

const TABLE_MAP = {
  products: 'products',
  categories: 'categories',
  kits: 'kits',
  subscriptions: 'subscriptions',
  shipping: 'shipping_methods',
  currencies: 'currencies',
  tags: 'tags',
}

export function resolveTable(section) {
  return TABLE_MAP[section] || null
}
