export const config = {
  runtime: 'edge',
}

const ALLOWED_HOSTS = new Set(['www.lego.com', 'lego.com'])

export default async function handler(request) {
  const { searchParams } = new URL(request.url)
  const targetUrl = (searchParams.get('url') || '').trim()

  let parsed
  try {
    parsed = new URL(targetUrl)
  } catch {
    return new Response('URL no válida', { status: 400 })
  }

  if (
    parsed.protocol !== 'https:' ||
    !ALLOWED_HOSTS.has(parsed.hostname) ||
    !parsed.pathname.startsWith('/cdn/')
  ) {
    return new Response('Origen no permitido', { status: 403 })
  }

  const upstreamHeaders = {}
  const range = request.headers.get('range')
  if (range) upstreamHeaders['range'] = range

  const upstream = await fetch(parsed.toString(), { headers: upstreamHeaders })

  const headers = new Headers()
  for (const key of ['content-type', 'content-length', 'content-range', 'accept-ranges']) {
    const value = upstream.headers.get(key)
    if (value) headers.set(key, value)
  }
  headers.set('cache-control', 'public, max-age=86400')

  return new Response(upstream.body, {
    status: upstream.status,
    headers,
  })
}