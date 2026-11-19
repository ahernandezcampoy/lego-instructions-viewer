<script setup>
import { ref, watch, computed, onMounted, onUnmounted } from 'vue'
import {
  X,
  ExternalLink,
  FileText,
  Bookmark,
  Minus,
  Plus,
  Check,
  Loader2,
} from 'lucide-vue-next'
import { useLegoSets } from '@/composables/useLegoSets'

const props = defineProps({
  set: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close'])

const { updateReadingProgress } = useLegoSets()

const selectedIndex = ref(0)
const pageInput = ref(1)
const activePage = ref(1)
const saveStatus = ref('') // '', 'saving', 'saved-cloud', 'saved-local'

const manuals = computed(() => (Array.isArray(props.set?.manuals) ? props.set.manuals : []))
const activeManual = computed(() => manuals.value[selectedIndex.value] || null)

const externalPdfUrl = computed(() => {
  if (!activeManual.value?.url) return ''
  const baseUrl = activeManual.value.url.split('#')[0]
  return `${baseUrl}#page=${activePage.value}`
})

const iframeSrc = computed(() => {
  if (!activeManual.value?.url) return ''
  const baseUrl = activeManual.value.url.split('#')[0]

  try {
    const parsed = new URL(baseUrl)
    if (
      (parsed.hostname === 'www.lego.com' || parsed.hostname === 'lego.com') &&
      parsed.pathname.startsWith('/cdn/')
    ) {
      return `/api/pdf?url=${encodeURIComponent(baseUrl)}#page=${activePage.value}`
    }
  } catch {
    // Fallback a URL directa
  }

  return `${baseUrl}#page=${activePage.value}`
})

async function applyAndSavePage(rawPage) {
  if (!props.set) return

  const clampedPage = Math.max(1, Math.floor(Number(rawPage) || 1))
  pageInput.value = clampedPage
  activePage.value = clampedPage
  saveStatus.value = 'saving'

  try {
    const result = await updateReadingProgress(props.set.id, selectedIndex.value, clampedPage)
    saveStatus.value = result?.syncedToCloud ? 'saved-cloud' : 'saved-local'
  } catch (err) {
    console.error('[PdfViewerModal] Error guardando página:', err)
    saveStatus.value = 'saved-local'
  }
}

function stepPage(delta) {
  applyAndSavePage(activePage.value + delta)
}

function handlePageSubmit() {
  applyAndSavePage(pageInput.value)
}

async function selectManual(idx) {
  if (idx === selectedIndex.value || !props.set) return
  selectedIndex.value = idx
  pageInput.value = 1
  activePage.value = 1
  saveStatus.value = 'saving'

  try {
    const result = await updateReadingProgress(props.set.id, idx, 1)
    saveStatus.value = result?.syncedToCloud ? 'saved-cloud' : 'saved-local'
  } catch {
    saveStatus.value = 'saved-local'
  }
}

watch(
  () => props.set,
  (newSet) => {
    saveStatus.value = ''
    if (!newSet) return

    const savedIdx = Math.min(
      Math.max(0, newSet.last_manual_index || 0),
      Math.max(0, manuals.value.length - 1)
    )
    const savedPage = Math.max(1, newSet.last_page || 1)

    selectedIndex.value = savedIdx
    pageInput.value = savedPage
    activePage.value = savedPage
  },
  { immediate: true }
)

function handleKeydown(e) {
  if (e.key === 'Escape' && props.set) {
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', handleKeydown))
onUnmounted(() => window.removeEventListener('keydown', handleKeydown))
</script>

<template>
  <Teleport to="body">
    <div
      v-if="set"
      class="fixed inset-0 z-50 flex flex-col bg-slate-950 text-white"
    >
      <!-- Barra superior del visor -->
      <header class="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 bg-slate-900 px-4 py-2.5">
        <div class="flex items-center gap-2.5 min-w-0">
          <span class="shrink-0 rounded-lg bg-lego-yellow px-2.5 py-1 font-mono text-xs font-extrabold text-slate-950">
            #{{ set.set_number }}
          </span>
          <h2 class="truncate text-sm font-bold text-white max-w-44 sm:max-w-72">
            {{ set.name }}
          </h2>
        </div>

        <!-- Selector numérico de página guardada -->
        <div v-if="activeManual" class="flex items-center gap-2">
          <form
            class="flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 p-1"
            @submit.prevent="handlePageSubmit"
          >
            <span class="hidden sm:inline-flex items-center gap-1 pl-2 pr-1 text-xs font-medium text-slate-300">
              <Bookmark class="h-3.5 w-3.5 text-lego-yellow" />
              Pág.
            </span>

            <button
              type="button"
              class="rounded-lg p-1 text-slate-300 hover:bg-slate-700 hover:text-white disabled:opacity-35 cursor-pointer"
              :disabled="activePage <= 1"
              title="Restar 1 página"
              @click="stepPage(-1)"
            >
              <Minus class="h-3.5 w-3.5" />
            </button>

            <input
              v-model.number="pageInput"
              type="number"
              min="1"
              aria-label="Número de página"
              class="w-14 rounded-lg border border-slate-600 bg-slate-900 px-2 py-1 text-center font-mono text-xs font-bold text-white focus:border-lego-blue focus:outline-none"
              @blur="handlePageSubmit"
            />

            <button
              type="button"
              class="rounded-lg p-1 text-slate-300 hover:bg-slate-700 hover:text-white cursor-pointer"
              title="Sumar 1 página"
              @click="stepPage(1)"
            >
              <Plus class="h-3.5 w-3.5" />
            </button>

            <button
              type="submit"
              class="rounded-lg bg-lego-blue px-2.5 py-1 text-xs font-semibold text-white hover:bg-blue-700 transition-colors cursor-pointer"
            >
              Guardar
            </button>
          </form>

          <span
            v-if="saveStatus === 'saving'"
            class="hidden md:inline-flex items-center gap-1 text-xs text-slate-400"
          >
            <Loader2 class="h-3.5 w-3.5 animate-spin" />
            Guardando...
          </span>
          <span
            v-else-if="saveStatus === 'saved-cloud'"
            class="hidden md:inline-flex items-center gap-1 text-xs font-medium text-emerald-400"
          >
            <Check class="h-3.5 w-3.5" />
            Guardado
          </span>
          <span
            v-else-if="saveStatus === 'saved-local'"
            class="hidden md:inline-flex items-center gap-1 text-xs font-medium text-amber-300"
            title="Guardado en este navegador. Desbloquea el candado para sincronizar en la nube."
          >
            <Check class="h-3.5 w-3.5" />
            Local
          </span>
        </div>

        <!-- Abrir externo + Cerrar -->
        <div class="flex items-center gap-2">
          <a
            v-if="externalPdfUrl"
            :href="externalPdfUrl"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1.5 rounded-xl border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700"
          >
            <ExternalLink class="h-3.5 w-3.5" />
            <span class="hidden sm:inline">Abrir PDF externo</span>
          </a>

          <button
            type="button"
            class="inline-flex items-center justify-center rounded-xl bg-slate-800 p-2 text-slate-300 hover:bg-lego-red hover:text-white transition-colors cursor-pointer"
            title="Cerrar visor (Esc)"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>
      </header>

      <!-- Selector de cuadernos si el set tiene más de 1 PDF -->
      <div
        v-if="manuals.length > 1"
        class="flex items-center gap-1.5 overflow-x-auto border-b border-slate-800 bg-slate-900/80 px-4 py-2"
      >
        <button
          v-for="(manual, idx) in manuals"
          :key="idx"
          type="button"
          class="inline-flex shrink-0 items-center gap-1.5 rounded-lg px-3 py-1 text-xs font-semibold transition-colors cursor-pointer"
          :class="
            selectedIndex === idx
              ? 'bg-lego-blue text-white'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          "
          @click="selectManual(idx)"
        >
          <FileText class="h-3.5 w-3.5" />
          <span class="max-w-52 truncate">{{ manual.label }}</span>
        </button>
      </div>

      <!-- Visor PDF nativo -->
      <main class="relative flex-1 bg-slate-900">
        <iframe
          v-if="iframeSrc"
          :key="iframeSrc"
          :src="iframeSrc"
          class="h-full w-full border-0 bg-white"
          title="Visor de instrucciones LEGO"
        />
        <div v-else class="flex h-full items-center justify-center text-sm text-slate-400">
          Este set no tiene ningún manual PDF asociado.
        </div>
      </main>
    </div>
  </Teleport>
</template>