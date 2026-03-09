/**
 * POST /api/upload - Upload image to R2
 * multipart/form-data: file (required), productId (optional, for key path)
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

const MAX_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders })
}

function sanitizeFilename(name) {
  return name.replace(/[^a-zA-Z0-9.-]/g, '_').slice(0, 64)
}

export async function onRequestPost(context) {
  const { env, request } = context
  const bucket = env.BUCKET
  if (!bucket) return json({ error: 'Storage not configured' }, 503)

  const contentType = request.headers.get('Content-Type') || ''
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Expected multipart/form-data' }, 400)
  }

  let file, productId
  try {
    const formData = await request.formData()
    file = formData.get('file')
    productId = formData.get('productId') || 'temp'
    if (!file || typeof file.arrayBuffer !== 'function') {
      return json({ error: 'No file in "file" field' }, 400)
    }
  } catch (err) {
    return json({ error: 'Invalid form data' }, 400)
  }

  const type = file.type
  if (!ALLOWED_TYPES.includes(type)) {
    return json({ error: 'Invalid file type. Allowed: jpeg, png, gif, webp' }, 400)
  }

  const buffer = await file.arrayBuffer()
  if (buffer.byteLength > MAX_SIZE) {
    return json({ error: 'File too large (max 5MB)' }, 400)
  }

  const timestamp = Date.now()
  const safeName = sanitizeFilename(file.name || 'image')
  const ext = safeName.includes('.') ? safeName.split('.').pop() : (type.split('/')[1] || 'jpg')
  const key = `products/${productId}/${timestamp}-${safeName}`

  try {
    await bucket.put(key, buffer, {
      httpMetadata: { contentType: type },
    })
    const url = `/api/media/${key}`
    return json({ url, key }, 201)
  } catch (err) {
    console.error('[upload]', err)
    return json({ error: 'Upload failed' }, 500)
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
