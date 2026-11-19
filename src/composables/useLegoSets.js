import { ref, computed } from 'vue'
import { supabase } from '@/lib/supabase'
import { usePinAuth } from '@/composables/usePinAuth'

const sets = ref([])
const loading = ref(false)
const error = ref(null)
const searchQuery = ref('')

const LOCAL_PROGRESS_PREFIX = 'lego_progress_'

export function useLegoSets() {
  const { isUnlocked, getAuthHeaders, lock } = usePinAuth()

  const matchesQuery = (set) => {
    const q = searchQuery.value.trim().toLowerCase()
    if (!q) return true
    return (
      set.name.toLowerCase().includes(q) ||
      set.set_number.toLowerCase().includes(q)
    )
  }

  const pendingSets = computed(() =>
    sets.value.filter((s) => !s.is_built && matchesQuery(s))
  )

  const builtSets = computed(() =>
    sets.value
      .filter((s) => s.is_built && matchesQuery(s))
      .sort((a, b) => new Date(b.built_at || b.updated_at) - new Date(a.built_at || a.updated_at))
  )

  const totalPendingCount = computed(() => sets.value.filter((s) => !s.is_built).length)
  const totalBuiltCount = computed(() => sets.value.filter((s) => s.is_built).length)

  async function apiMutate(method, body, query = '') {
    const response = await fetch(`/api/sets${query}`, {
      method,
      headers: getAuthHeaders(),
      body: body ? JSON.stringify(body) : undefined,
    })

    const data = await response.json().catch(() => ({}))

    if (response.status === 401) {
      lock()
      throw new Error('PIN inválido o caducado. Desbloquea el candado superior para guardar.')
    }

    if (!response.ok) {
      throw new Error(data.error || 'Error al guardar los cambios.')
    }

    return data
  }

  async function fetchSets() {
    loading.value = true
    error.value = null

    try {
      const { data, error: fetchError } = await supabase
        .from('lego_sets')
        .select('*')
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      sets.value = (data ?? []).map((item) => {
        const localRaw = localStorage.getItem(`${LOCAL_PROGRESS_PREFIX}${item.id}`)
        if (!isUnlocked.value && localRaw) {
          try {
            const parsed = JSON.parse(localRaw)
            return {
              ...item,
              last_manual_index: parsed.last_manual_index ?? item.last_manual_index,
              last_page: parsed.last_page ?? item.last_page,
            }
          } catch {
            return item
          }
        }
        return item
      })
    } catch (err) {
      error.value = err.message || 'Error al cargar los sets.'
      console.error('[useLegoSets] fetchSets:', err)
    } finally {
      loading.value = false
    }
  }

  async function createSet({ set_number, name, image_url, manuals }) {
    const created = await apiMutate('POST', {
      set_number,
      name,
      image_url,
      manuals,
    })
    sets.value.unshift(created)
    return created
  }

  async function updateSet(id, { set_number, name, image_url, manuals }) {
    const updated = await apiMutate('PATCH', {
      id,
      set_number,
      name,
      image_url,
      manuals,
    })
    const idx = sets.value.findIndex((s) => s.id === id)
    if (idx !== -1) sets.value[idx] = updated
    return updated
  }

  async function toggleBuiltStatus(set) {
    const nextBuiltState = !set.is_built
    const updated = await apiMutate('PATCH', {
      id: set.id,
      is_built: nextBuiltState,
      built_at: nextBuiltState ? new Date().toISOString() : null,
    })
    const idx = sets.value.findIndex((s) => s.id === set.id)
    if (idx !== -1) sets.value[idx] = updated
    return updated
  }

  async function updateReadingProgress(setId, lastManualIndex, lastPage) {
    const idx = sets.value.findIndex((s) => s.id === setId)
    if (idx !== -1) {
      sets.value[idx] = {
        ...sets.value[idx],
        last_manual_index: lastManualIndex,
        last_page: lastPage,
      }
    }

    localStorage.setItem(
      `${LOCAL_PROGRESS_PREFIX}${setId}`,
      JSON.stringify({ last_manual_index: lastManualIndex, last_page: lastPage })
    )

    if (!isUnlocked.value) {
      return { syncedToCloud: false }
    }

    const updated = await apiMutate('PATCH', {
      id: setId,
      last_manual_index: lastManualIndex,
      last_page: lastPage,
    })

    if (idx !== -1) sets.value[idx] = updated
    return { syncedToCloud: true }
  }

  async function deleteSet(id) {
    await apiMutate('DELETE', null, `?id=${encodeURIComponent(id)}`)
    localStorage.removeItem(`${LOCAL_PROGRESS_PREFIX}${id}`)
    sets.value = sets.value.filter((s) => s.id !== id)
  }

  return {
    sets,
    loading,
    error,
    searchQuery,
    pendingSets,
    builtSets,
    totalPendingCount,
    totalBuiltCount,
    fetchSets,
    createSet,
    updateSet,
    toggleBuiltStatus,
    updateReadingProgress,
    deleteSet,
  }
}