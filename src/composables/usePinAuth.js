import { ref, computed } from 'vue'

const STORAGE_KEY = 'lego_manuals_admin_pin'
const storedPin = ref(localStorage.getItem(STORAGE_KEY) || '')

export function usePinAuth() {
  const isUnlocked = computed(() => storedPin.value.length > 0)

  function getAuthHeaders() {
    return {
      'Content-Type': 'application/json',
      'x-admin-pin': storedPin.value,
    }
  }

  async function verifyAndUnlock(candidatePin) {
    const cleanPin = String(candidatePin || '').trim()
    if (!cleanPin) {
      throw new Error('Introduce un PIN.')
    }

    const response = await fetch('/api/sets?action=verify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-admin-pin': cleanPin,
      },
    })

    if (!response.ok) {
      const data = await response.json().catch(() => ({}))
      throw new Error(data.error || 'PIN incorrecto.')
    }

    storedPin.value = cleanPin
    localStorage.setItem(STORAGE_KEY, cleanPin)
  }

  function lock() {
    storedPin.value = ''
    localStorage.removeItem(STORAGE_KEY)
  }

  return {
    isUnlocked,
    getAuthHeaders,
    verifyAndUnlock,
    lock,
  }
}