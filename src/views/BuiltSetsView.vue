<script setup>
import { CheckCircle2, Loader2 } from 'lucide-vue-next'
import { useLegoSets } from '@/composables/useLegoSets'
import SetCard from '@/components/sets/SetCard.vue'

const emit = defineEmits(['open-viewer', 'edit-set', 'delete-set'])

const { builtSets, loading, error, searchQuery, toggleBuiltStatus } = useLegoSets()
</script>

<template>
  <section class="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
    <!-- Placa de cabecera con fondo sólido -->
    <div class="mb-7 flex items-center justify-between rounded-2xl border-2 border-slate-900 bg-white px-5 py-4 shadow-[0_4px_0_0_#0f172a]">
      <div class="flex items-start gap-3.5 sm:items-center">
        <span class="mt-1 h-9 w-2 shrink-0 rounded-full bg-lego-green sm:mt-0" aria-hidden="true" />
        <div>
          <h1 class="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
            Sets montados
          </h1>
          <p class="mt-0.5 text-sm font-medium text-slate-600">
            Archivo histórico de tus sets terminados. Puedes consultar sus manuales o devolverlos a pendientes.
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
      v-else-if="builtSets.length === 0"
      class="flex flex-col items-center justify-center rounded-2xl border-2 border-slate-900 bg-white px-6 py-16 text-center shadow-[0_5px_0_0_#0f172a]"
    >
      <div class="flex h-12 w-12 items-center justify-center rounded-2xl border-2 border-slate-900 bg-emerald-100 text-lego-green">
        <CheckCircle2 class="h-6 w-6" />
      </div>
      <h2 class="mt-4 text-base font-extrabold text-slate-950">
        {{ searchQuery ? 'Sin coincidencias en montados' : 'Aún no hay sets archivados como montados' }}
      </h2>
      <p class="mt-1 max-w-sm text-sm font-medium text-slate-600">
        Cuando completes un montaje desde la pestaña principal, aparecerá guardado aquí.
      </p>
    </div>

    <div v-else class="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      <SetCard
        v-for="set in builtSets"
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