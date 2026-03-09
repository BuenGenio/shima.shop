/**
 * GET /api/media/[...path] - Serve images from R2
 * path may be array (e.g. ["products","xyz","123.jpg"]) - joined with '/' for R2 key
 */
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type',
}

function json(data, status = 200) {
  return Response.json(data, { status, headers: corsHeaders })
}

export async function onRequestGet(context) {
  const { env, params } = context
  const bucket = env.BUCKET
  if (!bucket) return json({ error: 'Storage not configured' }, 503)

  const pathParam = params.path
  const key = Array.isArray(pathParam) ? pathParam.join('/') : (pathParam || '')
  if (!key) return json({ error: 'Path required' }, 400)

  try {
    const object = await bucket.get(key)
    if (!object) return json({ error: 'Not found' }, 404)

    const contentType = object.httpMetadata?.contentType || 'application/octet-stream'
    const headers = {
      ...corsHeaders,
      'Content-Type': contentType,
      'Cache-Control': 'public, max-age=31536000, immutable',
    }

    return new Response(object.body, {
      status: 200,
      headers,
    })
  } catch (err) {
    console.error('[media]', err)
    return json({ error: 'Failed to serve file' }, 500)
  }
}

export async function onRequestOptions() {
  return new Response(null, { headers: corsHeaders })
}
