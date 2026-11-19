<script setup>
import { Plus, Boxes, Loader2 } from 'lucide-vue-next'
import { useLegoSets } from '@/composables/useLegoSets'
import { usePinAuth } from '@/composables/usePinAuth'
import SetCard from '@/components/sets/SetCard.vue'

const emit = defineEmits(['open-create', 'open-pin', 'open-viewer', 'edit-set', 'delete-set'])

const { isUnlocked } = usePinAuth()
const { pendingSets, loading, error, searchQuery, toggleBuiltStatus } = useLegoSets()

function handleAddClick() {
  if (!isUnlocked.value) {
    emit('open-pin')
    return
  }
  emit('open-create')
}
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Placa de cabecera con fondo sólido -->
    <div class="mb-7 flex items-center justify-between rounded-2xl border-2 border-slate-900 bg-white px-5 py-4 shadow-[0_4px_0_0_#0f172a]">
      <div class="flex items-start gap-3.5 sm:items-center">
        <span class="mt-1 h-9 w-2 shrink-0 rounded-full bg-lego-blue sm:mt-0" aria-hidden="true" />
        <div>
          <h1 class="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            Sets por montar
          </h1>
          <p class="mt-0.5 text-sm font-medium text-slate-600">
            Abre el manual PDF y guarda la página donde te quedaste para retomarlo después.
          </p>
        </div>
      </div>
    </div>

    <div v-if="loading" class="flex justify-center py-20">
      <Loader2 class="h-8 w-8 animate-spin text-lego-blue" />
    </div>

    <div v-else-if="error" class="rounded-2xl border-2 border-slate-900 bg-red-50 p-6 text-sm font-bold text-lego-red shadow-[0_4px_0_0_#0f172a]">
      {{ error }}
    </div>

    <div
      v-else-if="pendingSets.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-900 bg-white px-6 py-16 text-center shadow-[0_5px_0_0_#0f172a]"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-900 bg-lego-yellow text-slate-950">
        <Boxes class="h-6 w-6" />
      </div>
      <h2 class="mt-4 text-base font-extrabold text-slate-950">
        {{ searchQuery ? 'Sin coincidencias' : 'No tienes sets pendientes de montaje' }}
      </h2>
      <p class="mt-1 max-w-sm text-sm font-medium text-slate-600">
        {{
          searchQuery
            ? 'Prueba con otro número de set o nombre.'
            : 'Añade tu primer set indicando su número para descargar automáticamente las instrucciones.'
        }}
      </p>
      <button
        v-if="!searchQuery"
        type="button"
        class="btn-brick mt-5 inline-flex items-center gap-2 rounded-xl border-slate-900 bg-lego-blue px-4 py-2 text-sm font-extrabold text-white hover:bg-blue-600 cursor-pointer"
        @click="handleAddClick"
      >
        <Plus class="h-4 w-4 stroke-[2.5]" />
        <span>Añadir primer set</span>
      </button>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <SetCard
        v-for="set in pendingSets"
        :key="set.id"
        :set="set"
        @open-viewer="emit('open-viewer', $event)"
        @toggle-built="toggleBuiltStatus($event)"
        @edit="emit('edit-set', $event)"
        @delete="emit('delete-set', $event)"
      />
    </div>
  </section>
</template>