<script setup>
import { ref, watch, computed } from 'vue'
import {
  X,
  Search,
  Loader2,
  Plus,
  Trash2,
  ExternalLink,
  AlertCircle,
  CheckCircle2,
} from 'lucide-vue-next'
import { useSetLookup } from '@/composables/useSetLookup'

const props = defineProps({
  open: {
    type: Boolean,
    default: false,
  },
  initialSet: {
    type: Object,
    default: null,
  },
  saving: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'save'])

const {
  loading: lookupLoading,
  error: lookupError,
  fallbackLegoUrl,
  lookupSet,
  clearLookupState,
} = useSetLookup()

const setNumber = ref('')
const name = ref('')
const imageUrl = ref('')
const manuals = ref([])
const lookupSuccessMsg = ref('')
const formError = ref('')

const isEditMode = computed(() => Boolean(props.initialSet))

watch(
  () => props.open,
  (isOpen) => {
    if (!isOpen) return
    clearLookupState()
    lookupSuccessMsg.value = ''
    formError.value = ''

    if (props.initialSet) {
      setNumber.value = props.initialSet.set_number || ''
      name.value = props.initialSet.name || ''
      imageUrl.value = props.initialSet.image_url || ''
      manuals.value = Array.isArray(props.initialSet.manuals)
        ? props.initialSet.manuals.map((m) => ({ ...m }))
        : []
    } else {
      setNumber.value = ''
      name.value = ''
      imageUrl.value = ''
      manuals.value = []
    }
  }
)

async function handleLookup() {
  lookupSuccessMsg.value = ''
  formError.value = ''

  const result = await lookupSet(setNumber.value)
  if (!result) return

  if (!name.value.trim()) name.value = result.name
  if (!imageUrl.value.trim()) imageUrl.value = result.imageUrl
  if (result.manuals.length > 0) {
    manuals.value = result.manuals
  }

  lookupSuccessMsg.value = `Datos cargados: ${result.name} (${result.manuals.length} PDFs encontrados).`
}

function addManualRow() {
  manuals.value.push({
    label: `Manual ${manuals.value.length + 1}`,
    url: '',
  })
}

function removeManualRow(index) {
  manuals.value.splice(index, 1)
}

function handleSubmit() {
  formError.value = ''

  if (!setNumber.value.trim()) {
    formError.value = 'El número de set es obligatorio.'
    return
  }
  if (!name.value.trim()) {
    formError.value = 'El nombre del set es obligatorio.'
    return
  }

  const cleanedManuals = manuals.value
    .map((m, idx) => ({
      label: m.label?.trim() || `Manual ${idx + 1}`,
      url: m.url?.trim().replace(/\s/g, '%20') || '',
    }))
    .filter((m) => m.url.length > 0)

  emit('save', {
    id: props.initialSet?.id || null,
    set_number: setNumber.value.trim(),
    name: name.value.trim(),
    image_url: imageUrl.value.trim() || null,
    manuals: cleanedManuals,
  })
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/65 p-4 backdrop-blur-xs"
      @click.self="emit('close')"
    >
      <div class="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-2xl border-2 border-slate-900 bg-white shadow-[0_8px_0_0_#0f172a]">
        <!-- Cabecera -->
        <div class="flex items-center justify-between border-b-2 border-slate-900 bg-lego-red px-6 py-4 text-white">
          <h2 class="text-lg font-black">
            {{ isEditMode ? 'Editar set LEGO' : 'Añadir nuevo set LEGO' }}
          </h2>
          <button
            type="button"
            class="rounded-lg p-1.5 text-white/80 hover:bg-red-700 hover:text-white cursor-pointer"
            @click="emit('close')"
          >
            <X class="h-5 w-5" />
          </button>
        </div>

        <!-- Cuerpo con scroll -->
        <form class="flex-1 overflow-y-auto p-6 space-y-5" @submit.prevent="handleSubmit">
          <!-- Número de set + Autocompletado -->
          <div>
            <label class="block text-sm font-bold text-slate-800 mb-1.5">
              Número de set *
            </label>
            <div class="flex gap-2">
              <input
                v-model="setNumber"
                type="text"
                placeholder="Ej. 75192 o 10316"
                class="w-full rounded-xl border-2 border-slate-900 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-lego-blue focus:outline-none"
                @keydown.enter.prevent="handleLookup"
              />
              <button
                type="button"
                class="btn-brick inline-flex shrink-0 items-center gap-2 rounded-xl border-slate-900 bg-lego-yellow px-4 py-2 text-sm font-extrabold text-slate-950 hover:bg-amber-300 disabled:opacity-50 cursor-pointer"
                :disabled="lookupLoading || !setNumber.trim()"
                @click="handleLookup"
              >
                <Loader2 v-if="lookupLoading" class="h-4 w-4 animate-spin" />
                <Search v-else class="h-4 w-4" />
                <span>Buscar PDFs</span>
              </button>
            </div>

            <!-- Feedback de búsqueda -->
            <div
              v-if="lookupSuccessMsg"
              class="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-emerald-300 bg-emerald-50 px-3.5 py-2.5 text-xs font-bold text-emerald-900"
            >
              <span class="flex items-center gap-1.5">
                <CheckCircle2 class="h-4 w-4 shrink-0 text-emerald-600" />
                {{ lookupSuccessMsg }}
              </span>
              <a
                v-if="fallbackLegoUrl"
                :href="fallbackLegoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex shrink-0 items-center gap-1 font-extrabold underline hover:text-emerald-950"
              >
                Web LEGO
                <ExternalLink class="h-3 w-3" />
              </a>
            </div>

            <div
              v-if="lookupError"
              class="mt-2.5 flex items-center justify-between gap-2 rounded-xl border border-amber-300 bg-amber-50 px-3.5 py-2.5 text-xs font-bold text-amber-900"
            >
              <span class="flex items-center gap-1.5">
                <AlertCircle class="h-4 w-4 shrink-0 text-amber-600" />
                {{ lookupError }}
              </span>
              <a
                v-if="fallbackLegoUrl"
                :href="fallbackLegoUrl"
                target="_blank"
                rel="noopener noreferrer"
                class="inline-flex shrink-0 items-center gap-1 font-extrabold text-lego-blue underline"
              >
                Abrir en LEGO.com
                <ExternalLink class="h-3 w-3" />
              </a>
            </div>
          </div>

          <!-- Nombre + Imagen -->
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="block text-sm font-bold text-slate-800 mb-1.5">
                Nombre del set *
              </label>
              <input
                v-model="name"
                type="text"
                required
                placeholder="Ej. Millennium Falcon"
                class="w-full rounded-xl border-2 border-slate-900 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-lego-blue focus:outline-none"
              />
            </div>

            <div>
              <label class="block text-sm font-bold text-slate-800 mb-1.5">
                URL de imagen (opcional)
              </label>
              <input
                v-model="imageUrl"
                type="url"
                placeholder="https://..."
                class="w-full rounded-xl border-2 border-slate-900 px-3.5 py-2 text-sm font-medium text-slate-900 focus:border-lego-blue focus:outline-none"
              />
            </div>
          </div>

          <!-- Lista de manuales PDF -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <label class="text-sm font-bold text-slate-800">
                Manuales PDF ({{ manuals.length }})
              </label>
              <div class="flex items-center gap-3">
                <button
                  v-if="manuals.length > 1"
                  type="button"
                  class="text-xs font-bold text-slate-500 hover:text-lego-red cursor-pointer"
                  @click="manuals = []"
                >
                  Vaciar lista
                </button>
                <button
                  type="button"
                  class="inline-flex items-center gap-1 text-xs font-extrabold text-lego-blue hover:underline cursor-pointer"
                  @click="addManualRow"
                >
                  <Plus class="h-3.5 w-3.5" />
                  Añadir enlace PDF
                </button>
              </div>
            </div>

            <div
              v-if="manuals.length === 0"
              class="rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 p-4 text-center text-xs font-medium text-slate-500"
            >
              Aún no hay enlaces PDF. Usa "Buscar PDFs" arriba o añade uno manualmente.
            </div>

            <div v-else class="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              <div
                v-for="(manual, index) in manuals"
                :key="index"
                class="flex flex-col gap-2 rounded-xl border-2 border-slate-200 bg-slate-50 p-2.5 sm:flex-row sm:items-center"
              >
                <input
                  v-model="manual.label"
                  type="text"
                  placeholder="Etiqueta (ej. Cuaderno 1)"
                  class="w-full sm:w-44 shrink-0 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 text-xs font-bold text-slate-800 focus:border-lego-blue focus:outline-none"
                />
                <input
                  v-model="manual.url"
                  type="url"
                  placeholder="https://www.lego.com/cdn/...pdf"
                  class="w-full flex-1 rounded-lg border border-slate-300 bg-white px-2.5 py-1.5 font-mono text-xs text-slate-700 focus:border-lego-blue focus:outline-none"
                />
                <div class="flex items-center justify-end gap-1">
                  <a
                    v-if="manual.url"
                    :href="manual.url"
                    target="_blank"
                    rel="noopener noreferrer"
                    title="Probar enlace PDF"
                    class="rounded-lg p-1.5 text-slate-500 hover:bg-white hover:text-lego-blue"
                  >
                    <ExternalLink class="h-4 w-4" />
                  </a>
                  <button
                    type="button"
                    title="Quitar este PDF"
                    class="rounded-lg p-1.5 text-slate-500 hover:bg-red-50 hover:text-lego-red cursor-pointer"
                    @click="removeManualRow(index)"
                  >
                    <Trash2 class="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <p v-if="formError" class="text-sm font-bold text-lego-red">
            {{ formError }}
          </p>

          <!-- Pie del modal -->
          <div class="flex justify-end gap-3 border-t-2 border-slate-200 pt-4">
            <button
              type="button"
              class="btn-brick rounded-xl border-slate-900 bg-white px-4 py-2 text-sm font-bold text-slate-800 hover:bg-slate-100 cursor-pointer"
              :disabled="saving"
              @click="emit('close')"
            >
              Cancelar
            </button>
            <button
              type="submit"
              class="btn-brick rounded-xl border-slate-900 bg-lego-blue px-5 py-2 text-sm font-extrabold text-white hover:bg-blue-600 disabled:opacity-50 cursor-pointer"
              :disabled="saving"
            >
              {{ saving ? 'Guardando...' : isEditMode ? 'Guardar cambios' : 'Guardar set' }}
            </button>
          </div>
        </form>
      </div>
    </div>
  </Teleport>
</template>