<script setup>
import { Search, Plus, Lock, Unlock, X } from 'lucide-vue-next'
import { usePinAuth } from '@/composables/usePinAuth'
import { useLegoSets } from '@/composables/useLegoSets'

const emit = defineEmits(['open-create', 'open-pin'])

const { isUnlocked, lock } = usePinAuth()
const { searchQuery, totalPendingCount, totalBuiltCount } = useLegoSets()

function handleAddClick() {
  if (!isUnlocked.value) {
    emit('open-pin')
    return
  }
  emit('open-create')
}
</script>

<template>
  <header class="sticky top-0 z-30 border-b-4 border-slate-900 bg-lego-studs-yellow shadow-sm">
    <div class="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div class="flex flex-col gap-3 py-3 md:h-20 md:flex-row md:items-center md:justify-between md:py-0">
        <!-- Marca + Navegación -->
        <div class="flex items-center justify-between gap-5">
          <RouterLink to="/" class="group flex items-center gap-3">
            <!-- Icono SVG de ladrillo LEGO rojo 2x2 -->
            <div
              class="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-slate-900 bg-lego-red shadow-[0_3px_0_0_#0f172a] transition-transform group-hover:-translate-y-0.5"
            >
              <svg viewBox="0 0 36 36" class="h-7 w-7" fill="none" aria-hidden="true">
                <rect x="4" y="11" width="28" height="19" rx="3" fill="#d01012" stroke="#ffffff" stroke-width="2" />
                <rect x="8" y="6" width="8" height="5" rx="1.5" fill="#ffcf00" stroke="#ffffff" stroke-width="1.5" />
                <rect x="20" y="6" width="8" height="5" rx="1.5" fill="#ffcf00" stroke="#ffffff" stroke-width="1.5" />
              </svg>
            </div>
            <div class="leading-none">
              <span class="block text-xl font-black tracking-tight text-slate-950 uppercase">
                LEGO <span class="rounded-md bg-lego-red px-1.5 py-0.5 text-white">Manuals</span>
              </span>
            </div>
          </RouterLink>

          <nav class="flex items-center gap-1.5 rounded-xl border-2 border-slate-900 bg-amber-300/90 p-1 shadow-[0_3px_0_0_#0f172a]">
            <RouterLink
              to="/"
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 transition-colors hover:bg-white/60"
              active-class="!bg-white !text-slate-950 shadow-xs"
              exact-active-class="!bg-white !text-slate-950 shadow-xs"
            >
              <span>Por montar</span>
              <span class="rounded-md border border-slate-900/20 bg-lego-yellow px-1.5 py-0.5 font-mono text-xs font-extrabold text-slate-950">
                {{ totalPendingCount }}
              </span>
            </RouterLink>

            <RouterLink
              to="/montados"
              class="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-bold text-slate-800 transition-colors hover:bg-white/60"
              active-class="!bg-white !text-slate-950 shadow-xs"
            >
              <span>Montados</span>
              <span class="rounded-md border border-slate-900/20 bg-emerald-200 px-1.5 py-0.5 font-mono text-xs font-extrabold text-emerald-950">
                {{ totalBuiltCount }}
              </span>
            </RouterLink>
          </nav>
        </div>

        <!-- Buscador + Acciones estilo brick -->
        <div class="flex items-center gap-2.5">
          <div class="relative flex-1 md:w-64">
            <Search class="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              v-model="searchQuery"
              type="text"
              placeholder="Buscar set o número..."
              class="w-full rounded-xl border-2 border-slate-900 bg-white py-2 pr-8 pl-9 text-sm font-medium text-slate-900 placeholder:text-slate-400 shadow-[0_3px_0_0_#0f172a] focus:border-lego-blue focus:outline-none"
            />
            <button
              v-if="searchQuery"
              type="button"
              class="absolute top-1/2 right-2.5 -translate-y-1/2 text-slate-400 hover:text-slate-700 cursor-pointer"
              @click="searchQuery = ''"
            >
              <X class="h-4 w-4" />
            </button>
          </div>

          <button
            type="button"
            class="btn-brick inline-flex shrink-0 items-center gap-1.5 rounded-xl border-slate-900 bg-lego-blue px-3.5 py-2 text-sm font-bold text-white hover:bg-blue-600 cursor-pointer"
            @click="handleAddClick"
          >
            <Plus class="h-4 w-4 stroke-[2.5]" />
            <span>Añadir set</span>
          </button>

          <button
            v-if="isUnlocked"
            type="button"
            title="Edición desbloqueada (pulsa para bloquear)"
            class="btn-brick inline-flex items-center gap-1.5 rounded-xl border-slate-900 bg-lego-green px-3 py-2 text-xs font-bold text-white hover:bg-emerald-600 cursor-pointer"
            @click="lock"
          >
            <Unlock class="h-4 w-4" />
            <span class="hidden lg:inline">Desbloqueado</span>
          </button>

          <button
            v-else
            type="button"
            title="Modo solo lectura (pulsa para introducir PIN)"
            class="btn-brick inline-flex items-center gap-1.5 rounded-xl border-slate-900 bg-white px-3 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
            @click="emit('open-pin')"
          >
            <Lock class="h-4 w-4" />
            <span class="hidden lg:inline">Solo lectura</span>
          </button>
        </div>
      </div>
    </div>
  </header>
</template>