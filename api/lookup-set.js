const BRICKSET_BASE_URL = 'https://brickset.com/api/v3.asmx'

/**
 * Realiza una petición POST form-urlencoded contra Brickset API v3
 */
async function callBrickset(method, params) {
  const body = new URLSearchParams(params)

  const response = await fetch(`${BRICKSET_BASE_URL}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: body.toString(),
  })

  if (!response.ok) {
    const errorText = await response.text().catch(() => '')
    throw new Error(`Brickset HTTP ${response.status} en ${method}: ${errorText.slice(0, 160)}`)
  }

  const data = await response.json()

  if (data.status !== 'success') {
    throw new Error(data.message || `Error de Brickset en ${method}`)
  }

  return data
}

/**
 * Normaliza la lista de instrucciones devolviendo solo PDFs únicos y con etiquetas legibles
 */
function normalizeManuals(rawInstructions = []) {
  const seenUrls = new Set()

  return rawInstructions
    .filter((item) => {
      const url = item?.URL?.trim()
      if (!url || seenUrls.has(url)) return false
      const isPdf = /\.pdf(\?|$)/i.test(url) || url.includes('product.bi.core.pdf')
      if (!isPdf) return false
      seenUrls.add(url)
      return true
    })
    .map((item, index) => {
      const rawDesc = (item.description || '').trim()
      let regionHint = ''
      if (/\bV29\b/i.test(rawDesc)) regionHint = ' (EU/Int)'
      else if (/\bV39\b/i.test(rawDesc)) regionHint = ' (NA)'

      const label = rawDesc
        ? `Manual ${index + 1}${regionHint} · ${rawDesc}`
        : `Manual ${index + 1}${regionHint}`

      return {
        label,
        url: item.URL.trim(),
      }
    })
}

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    res.setHeader('Allow', 'GET')
    return res.status(405).json({ error: 'Método no permitido. Usa GET.' })
  }

  const apiKey = process.env.BRICKSET_API_KEY
  if (!apiKey) {
    return res.status(500).json({
      error: 'Falta configurar BRICKSET_API_KEY en las variables de entorno del servidor.',
    })
  }

  const rawInput = String(req.query.setNumber || '').trim()
  if (!rawInput || !/^[a-zA-Z0-9-]+$/.test(rawInput)) {
    return res.status(400).json({
      error: 'Introduce un número de set válido (por ejemplo: 75192 o 10316-1).',
    })
  }

  const hasVariant = rawInput.includes('-')
  const baseNumber = rawInput.split('-')[0]
  const normalizedSetNumber = hasVariant ? rawInput : `${rawInput}-1`
  const legoServiceUrl = `https://www.lego.com/es-es/service/buildinginstructions/${encodeURIComponent(baseNumber)}`

  try {
    // 1. Buscar metadatos del set
    let setsData = await callBrickset('getSets', {
      apiKey,
      userHash: '',
      params: JSON.stringify({
        setNumber: normalizedSetNumber,
        pageSize: 5,
      }),
    })

    if (!setsData.sets || setsData.sets.length === 0) {
      setsData = await callBrickset('getSets', {
        apiKey,
        userHash: '',
        params: JSON.stringify({
          query: baseNumber,
          pageSize: 10,
        }),
      })
    }

    const matchedSet =
      setsData.sets?.find((s) => `${s.number}-${s.numberVariant}` === normalizedSetNumber) ||
      setsData.sets?.find((s) => String(s.number) === baseNumber)

    if (!matchedSet) {
      return res.status(404).json({
        error: `No se encontró el set "${rawInput}" en Brickset.`,
        legoServiceUrl,
      })
    }

    const fullSetNumber = `${matchedSet.number}-${matchedSet.numberVariant}`

    // 2. Obtener PDFs: getInstructions2 recibe setNumber ("75192-1"); getInstructions recibe setID
    let manuals = []
    try {
      const instructionsData = await callBrickset('getInstructions2', {
        apiKey,
        setNumber: fullSetNumber,
      })
      manuals = normalizeManuals(instructionsData.instructions)
    } catch {
      try {
        const fallbackData = await callBrickset('getInstructions', {
          apiKey,
          setID: String(matchedSet.setID),
        })
        manuals = normalizeManuals(fallbackData.instructions)
      } catch (fallbackError) {
        console.warn('[api/lookup-set] Sin manuales disponibles en Brickset:', fallbackError.message)
      }
    }

    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=43200')

    return res.status(200).json({
      setNumber: fullSetNumber,
      baseNumber: String(matchedSet.number),
      name: matchedSet.name,
      year: matchedSet.year || null,
      theme: matchedSet.theme || null,
      pieces: matchedSet.pieces || null,
      imageUrl: matchedSet.image?.imageURL || matchedSet.image?.thumbnailURL || '',
      manuals,
      legoServiceUrl,
    })
  } catch (error) {
    console.error('[api/lookup-set] Error:', error)
    return res.status(502).json({
      error: 'No se pudo consultar el catálogo de Brickset en este momento.',
      details: error.message,
      legoServiceUrl,
    })
  }
}