<script setup>
import { AlertCircle, X } from 'lucide-vue-next'

defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  title: {
    type: String,
    default: 'Confirmar acción',
  },
  message: {
    type: String,
    required: true,
  },
  confirmLabel: {
    type: String,
    default: 'Eliminar',
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['confirm', 'cancel'])
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      @click.self="emit('cancel')"
    >
      <div class="w-full max-w-md overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[0_6px_0_0_#0f172a]">
        <div class="flex items-center justify-between border-b-2 border-slate-900 bg-lego-red px-5 py-3.5 text-white">
          <div class="flex items-center gap-2">
            <AlertCircle class="h-5 w-5" />
            <h3 class="text-base font-black">{{ title }}</h3>
          </div>
          <button
            type="button"
            class="rounded-lg p-1 text-white/80 hover:bg-red-700 hover:text-white cursor-pointer"
            @click="emit('cancel')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <div class="p-6">
          <p class="text-sm font-medium text-slate-700 leading-relaxed">
            {{ message }}
          </p>

          <div class="mt-6 flex justify-end gap-3">
            <button
              type="button"
              class="btn-brick rounded-xl border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
              :disabled="loading"
              @click="emit('cancel')"
            >
              Cancelar
            </button>
            <button
              type="button"
              class="btn-brick rounded-xl border-slate-900 bg-lego-red px-4 py-2 text-sm font-extrabold text-white hover:bg-red-700 disabled:opacity-50 cursor-pointer"
              :disabled="loading"
              @click="emit('confirm')"
            >
              {{ loading ? 'Eliminando...' : confirmLabel }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>