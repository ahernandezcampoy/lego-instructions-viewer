import { ref } from 'vue'

export function useSetLookup() {
  const loading = ref(false)
  const error = ref(null)
  const fallbackLegoUrl = ref('')

  function sanitizePdfUrl(url) {
    if (!url) return ''
    return url.trim().replace(/\s/g, '%20')
  }

  async function lookupSet(rawSetNumber) {
    const cleanNumber = String(rawSetNumber || '').trim()
    if (!cleanNumber) {
      error.value = 'Escribe un número de set antes de buscar.'
      return null
    }

    loading.value = true
    error.value = null
    const baseNum = cleanNumber.split('-')[0]
    fallbackLegoUrl.value = `https://www.lego.com/es-es/service/buildinginstructions/${encodeURIComponent(baseNum)}`

    try {
      const response = await fetch(`/api/lookup-set?setNumber=${encodeURIComponent(cleanNumber)}`)
      const data = await response.json()

      if (data.legoServiceUrl) {
        fallbackLegoUrl.value = data.legoServiceUrl
      }

      if (!response.ok) {
        error.value = data.error || 'No se encontraron datos para ese set.'
        return null
      }

      return {
        setNumber: data.setNumber,
        baseNumber: data.baseNumber,
        name: data.name || '',
        imageUrl: data.imageUrl || '',
        manuals: (data.manuals || []).map((m) => ({
          label: m.label,
          url: sanitizePdfUrl(m.url),
        })),
        legoServiceUrl: fallbackLegoUrl.value,
      }
    } catch (err) {
      error.value = 'Error de conexión al consultar el catálogo.'
      console.error('[useSetLookup] Error:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  function clearLookupState() {
    error.value = null
    fallbackLegoUrl.value = ''
  }

  return {
    loading,
    error,
    fallbackLegoUrl,
    lookupSet,
    clearLookupState,
  }
}