<script setup>
import { ref, watch } from 'vue'
import { Lock, X, Loader2 } from 'lucide-vue-next'
import { usePinAuth } from '@/composables/usePinAuth'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'unlocked'])

const { verifyAndUnlock } = usePinAuth()

const pin = ref('')
const loading = ref(false)
const errorMsg = ref('')

watch(
  () => props.open,
  (isOpen) => {
    if (isOpen) {
      pin.value = ''
      errorMsg.value = ''
    }
  }
)

async function handleSubmit() {
  loading.value = true
  errorMsg.value = ''
  try {
    await verifyAndUnlock(pin.value)
    emit('unlocked')
    emit('close')
  } catch (err) {
    errorMsg.value = err.message || 'PIN incorrecto.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="w-full max-w-xs overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[0_6px_0_0_#0f172a]">
        <div class="flex items-center justify-between border-b-2 border-slate-900 bg-lego-yellow px-5 py-3.5">
          <div class="flex items-center gap-2">
            <Lock class="h-4 w-4 text-slate-950 stroke-[2.5]" />
            <h3 class="text-base font-black text-slate-950">Desbloquear edición</h3>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-slate-800 hover:bg-amber-300 cursor-pointer"
            @click="emit('close')"
          >
            <X class="h-4 w-4" />
          </button>
        </div>

        <div class="p-5">
          <p class="text-xs font-medium text-slate-600 leading-relaxed">
            Introduce tu PIN para añadir, editar, archivar sets o sincronizar la página en la nube.
          </p>

          <form class="mt-4 space-y-3" @submit.prevent="handleSubmit">
            <input
              v-model="pin"
              type="password"
              inputmode="numeric"
              placeholder="••••"
              autofocus
              required
              class="w-full rounded-xl border-2 border-slate-900 px-3.5 py-2.5 text-center font-mono text-lg font-bold tracking-widest focus:border-lego-blue focus:outline-none"
            />

            <p v-if="errorMsg" class="text-xs font-bold text-lego-red text-center">
              {{ errorMsg }}
            </p>

            <button
              type="submit"
              class="btn-brick inline-flex w-full items-center justify-center gap-2 rounded-xl border-slate-900 bg-lego-blue px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
              :disabled="loading"
            >
              <Loader2 v-if="loading" class="h-4 w-4 animate-spin" />
              <span>Desbloquear</span>
            </button>
          </form>
        </div>
      </div>
    </div>
  </Teleport>
</template>