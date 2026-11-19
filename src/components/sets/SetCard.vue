<script setup>
import { ref, computed } from 'vue'
import {
  BookOpen,
  CheckCircle2,
  RotateCcw,
  Pencil,
  Trash2,
  ImageOff,
  Calendar,
  FileText,
  Bookmark,
} from 'lucide-vue-next'
import { usePinAuth } from '@/composables/usePinAuth'

const props = defineProps({
  set: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['open-viewer', 'toggle-built', 'edit', 'delete'])

const { isUnlocked } = usePinAuth()
const imgError = ref(false)

const manualsCount = computed(() => (Array.isArray(props.set.manuals) ? props.set.manuals.length : 0))

const hasReadingProgress = computed(() => {
  return (props.set.last_manual_index || 0) > 0 || (props.set.last_page || 1) > 1
})

const formattedBuiltDate = computed(() => {
  if (!props.set.built_at) return null
  return new Intl.DateTimeFormat('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(new Date(props.set.built_at))
})
</script>

<template>
  <article class="group flex flex-col pt-2.5 transition-transform duration-200 hover:-translate-y-1">
    <!-- Fila de 4 tetones superiores del ladrillo LEGO -->
    <div class="grid grid-cols-4 gap-3 px-6 -mb-[2px] z-10" aria-hidden="true">
      <span
        v-for="stud in 4"
        :key="stud"
        class="h-2.5 rounded-t-md border-x-2 border-t-2 border-slate-900 transition-colors"
        :class="set.is_built ? 'bg-lego-green' : 'bg-white'"
      />
    </div>

    <!-- Cuerpo principal del bloque -->
    <div
      class="flex flex-1 flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[0_5px_0_0_#0f172a]"
    >
      <!-- Imagen del set -->
      <div class="relative aspect-4/3 w-full overflow-hidden border-b-2 border-slate-900 bg-slate-50">
        <img
          v-if="set.image_url && !imgError"
          :src="set.image_url"
          :alt="set.name"
          loading="lazy"
          class="h-full w-full object-contain p-3.5 transition-transform duration-300 group-hover:scale-105"
          @error="imgError = true"
        />
        <div
          v-else
          class="flex h-full w-full flex-col items-center justify-center gap-1.5 text-slate-400"
        >
          <ImageOff class="h-8 w-8 stroke-1.5" />
          <span class="text-xs font-bold uppercase tracking-wide">Sin imagen</span>
        </div>

        <!-- Tile impreso con el número de set -->
        <span
          class="absolute top-3 left-3 rounded-lg border-2 border-slate-900 bg-lego-yellow px-2.5 py-0.5 font-mono text-xs font-black text-slate-950 shadow-[0_2px_0_0_#0f172a]"
        >
          #{{ set.set_number }}
        </span>

        <!-- Badge cantidad de manuales -->
        <span
          class="absolute top-3 right-3 inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 px-2 py-0.5 text-xs font-extrabold shadow-[0_2px_0_0_#0f172a]"
          :class="
            manualsCount > 0
              ? 'bg-white text-slate-900'
              : 'bg-amber-200 text-amber-950'
          "
        >
          <FileText class="h-3.5 w-3.5" />
          {{ manualsCount }} {{ manualsCount === 1 ? 'PDF' : 'PDFs' }}
        </span>

        <!-- Marcador de última página leída -->
        <span
          v-if="!set.is_built && manualsCount > 0 && hasReadingProgress"
          class="absolute bottom-2.5 left-3 inline-flex items-center gap-1 rounded-lg border-2 border-slate-900 bg-lego-red px-2.5 py-0.5 text-xs font-extrabold text-white shadow-[0_2px_0_0_#0f172a]"
        >
          <Bookmark class="h-3 w-3" />
          <span v-if="manualsCount > 1">M{{ (set.last_manual_index || 0) + 1 }} · </span>
          Pág. {{ set.last_page || 1 }}
        </span>
      </div>

      <!-- Contenido -->
      <div class="flex flex-1 flex-col justify-between p-4">
        <div>
          <h3 class="line-clamp-2 text-base font-extrabold text-slate-950 leading-snug" :title="set.name">
            {{ set.name }}
          </h3>

          <p
            v-if="set.is_built && formattedBuiltDate"
            class="mt-1.5 inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-bold text-emerald-900"
          >
            <Calendar class="h-3.5 w-3.5" />
            Montado el {{ formattedBuiltDate }}
          </p>
        </div>

        <!-- Barra de acciones táctiles -->
        <div class="mt-4 flex flex-col gap-2 pt-3 border-t-2 border-dashed border-slate-200">
          <button
            v-if="manualsCount > 0"
            type="button"
            class="btn-brick inline-flex w-full items-center justify-center gap-2 rounded-xl border-slate-900 bg-lego-blue px-3.5 py-2 text-sm font-extrabold text-white hover:bg-blue-600 cursor-pointer"
            @click="emit('open-viewer', set)"
          >
            <BookOpen class="h-4 w-4" />
            <span>{{ !set.is_built && hasReadingProgress ? `Continuar (Pág. ${set.last_page})` : 'Ver instrucciones' }}</span>
          </button>

          <button
            v-else-if="isUnlocked"
            type="button"
            class="btn-brick inline-flex w-full items-center justify-center gap-2 rounded-xl border-slate-900 bg-lego-yellow px-3.5 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300 cursor-pointer"
            @click="emit('edit', set)"
          >
            <Pencil class="h-4 w-4" />
            <span>Añadir enlace PDF</span>
          </button>

          <div v-if="isUnlocked" class="flex items-center justify-between gap-1.5">
            <button
              type="button"
              class="btn-brick inline-flex flex-1 items-center justify-center gap-1.5 rounded-xl border-slate-900 px-2.5 py-1.5 text-xs font-extrabold transition-colors cursor-pointer"
              :class="
                set.is_built
                  ? 'bg-slate-100 text-slate-800 hover:bg-slate-200'
                  : 'bg-lego-green text-white hover:bg-emerald-600'
              "
              @click="emit('toggle-built', set)"
            >
              <RotateCcw v-if="set.is_built" class="h-3.5 w-3.5" />
              <CheckCircle2 v-else class="h-3.5 w-3.5" />
              <span>{{ set.is_built ? 'A pendientes' : '¡Montado!' }}</span>
            </button>

            <button
              type="button"
              title="Editar set"
              class="btn-brick rounded-xl border-slate-900 bg-white p-1.5 text-slate-700 hover:bg-slate-100 cursor-pointer"
              @click="emit('edit', set)"
            >
              <Pencil class="h-4 w-4" />
            </button>

            <button
              type="button"
              title="Eliminar set"
              class="btn-brick rounded-xl border-slate-900 bg-white p-1.5 text-lego-red hover:bg-red-50 cursor-pointer"
              @click="emit('delete', set)"
            >
              <Trash2 class="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </article>
</template>