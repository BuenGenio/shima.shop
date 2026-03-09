import { getDb } from '../lib/db.js'
import { PROVIDER_IDS } from '../lib/payments/index.js'
import { listGateways } from '../lib/payment-gateways.js'

const PROVIDER_NAMES = {
  stripe: 'Card (Stripe)',
  adyen: 'Card (Adyen)',
  paypal: 'PayPal',
  airwallex: 'Card (Airwallex)',
  paydollar: 'PayDollar',
  paymehsbc: 'PayMe HSBC',
  alipayhk: 'AlipayHK',
  octopus: 'Octopus',
  twocheckout: '2Checkout',
  verifone: 'Verifone',
  monobank: 'monobank',
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const VALID_SECTIONS = ['kits', 'products', 'categories', 'tags', 'tagAssignments', 'paymentMethods', 'payments']

export async function onRequestGet(context) {
  const { env, request } = context
  const url = new URL(request.url)
  const sectionsParam = url.searchParams.get('sections')
  const sections = sectionsParam
    ? sectionsParam.split(',').map(s => s.trim()).filter(s => VALID_SECTIONS.includes(s))
    : ['products', 'kits', 'categories', 'tags', 'tagAssignments', 'paymentMethods']

  const db = getDb(env)
  const response = {}

  const wantsKits = sections.includes('kits')
  const wantsProducts = sections.includes('products')
  const wantsCategories = sections.includes('categories')
  const wantsTags = sections.includes('tags')
  const wantsTagAssignments = sections.includes('tagAssignments')
  const wantsPaymentMethods = sections.includes('paymentMethods')

  const promises = []
  if (wantsKits || wantsProducts) promises.push(db.execute('SELECT id, data FROM products ORDER BY created_at'))
  else promises.push(Promise.resolve({ rows: [] }))
  if (wantsKits) promises.push(db.execute('SELECT id, data FROM kits ORDER BY created_at'))
  else promises.push(Promise.resolve({ rows: [] }))
  if (wantsCategories) promises.push(db.execute('SELECT id, data FROM categories ORDER BY id'))
  else promises.push(Promise.resolve({ rows: [] }))
  if (wantsTags || wantsTagAssignments) promises.push(db.execute('SELECT id, parent_id, data FROM tags ORDER BY parent_id NULLS FIRST, id'))
  else promises.push(Promise.resolve({ rows: [] }))
  if (wantsTagAssignments) promises.push(db.execute("SELECT tag_id, entity_type, entity_id FROM tag_assignments WHERE entity_type IN ('products','kits')"))
  else promises.push(Promise.resolve({ rows: [] }))
  if (wantsPaymentMethods) promises.push(listGateways(db, { enabledOnly: true }))
  else promises.push(Promise.resolve([]))

  const [productsResult, kitsResult, categoriesResult, tagsResult, assignmentsResult, gatewaysResult] = await Promise.all(promises)

  const productsById = {}
  for (const row of productsResult.rows) {
    productsById[row.id] = { id: row.id, ...JSON.parse(row.data) }
  }

  if (wantsProducts) {
    response.products = Object.values(productsById).map(p => ({
      ...p,
      description: p.description || p.comment || '',
      image: p.image || (Array.isArray(p.images) && p.images[0]) || null,
      images: p.images || [],
    }))
  }

  if (wantsCategories) {
    response.categories = categoriesResult.rows.map(row => ({ id: row.id, ...JSON.parse(row.data) }))
  }

  if (wantsTags) {
    const allTags = tagsResult.rows.map(row => ({
      id: row.id,
      parent_id: row.parent_id || null,
      ...JSON.parse(row.data),
    }))
    response.tags = allTags.filter(t => ['category', 'attribute', 'status'].includes(t.scope))
  }

  if (wantsTagAssignments) {
    response.tagAssignments = assignmentsResult.rows.map(row => ({
      tagId: row.tag_id,
      entityType: row.entity_type,
      entityId: row.entity_id,
    }))
  }

  if (wantsPaymentMethods) {
    const enabledIds = [...new Set((Array.isArray(gatewaysResult) ? gatewaysResult : []).map(g => g.provider))]
    let paymentMethods = PROVIDER_IDS
      .filter(id => enabledIds.includes(id))
      .map(id => ({ id, name: PROVIDER_NAMES[id] || id }))
    if (paymentMethods.length === 0 && env.STRIPE_SECRET_KEY) {
      paymentMethods = [{ id: 'stripe', name: 'Card (Stripe)' }]
    }
    response.paymentMethods = paymentMethods
  }

  if (wantsKits) {
    const kits = kitsResult.rows.map(row => {
      const data = JSON.parse(row.data)
      const productIds = data.product_ids || []
      const items = productIds
        .map(pid => productsById[pid])
        .filter(Boolean)
        .map(p => ({
          id: p.id,
          name: p.name,
          dose: p.pack_size || '',
          form: null,
          container: 'cookie',
          price: p.price,
          selected: true,
          image: p.image || (Array.isArray(p.images) && p.images[0]) || null,
          priceId: null,
        }))

      return {
        id: row.id,
        name: data.name,
        price: data.bundle_price,
        currency: data.currency === 'JPY' ? '¥' : data.currency,
        accent: data.accent || data.color || '#8B5E3C',
        accentLight: data.accentLight || '#faf3ed',
        tagline: data.tagline || '',
        bundlePriceId: null,
        items,
      }
    })
    response.kits = kits
  }

  return Response.json(response, { headers: corsHeaders })
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
