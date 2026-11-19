<script setup>
import { ref, onMounted } from 'vue'
import { useLegoSets } from '@/composables/useLegoSets'
import AppHeader from '@/components/layout/AppHeader.vue'
import SetFormModal from '@/components/sets/SetFormModal.vue'
import PdfViewerModal from '@/components/viewer/PdfViewerModal.vue'
import ConfirmDialog from '@/components/ui/ConfirmDialog.vue'
import PinModal from '@/components/ui/PinModal.vue'

const { fetchSets, createSet, updateSet, deleteSet } = useLegoSets()

const isPinModalOpen = ref(false)
const isFormOpen = ref(false)
const editingSet = ref(null)
const savingSet = ref(false)

const viewerSet = ref(null)

const deletingSet = ref(null)
const isDeleting = ref(false)

onMounted(() => {
  fetchSets()
})

function openCreateModal() {
  editingSet.value = null
  isFormOpen.value = true
}

function openEditModal(set) {
  editingSet.value = set
  isFormOpen.value = true
}

async function handleSaveSet(payload) {
  savingSet.value = true
  try {
    if (payload.id) {
      await updateSet(payload.id, payload)
    } else {
      await createSet(payload)
    }
    isFormOpen.value = false
    editingSet.value = null
  } catch (err) {
    alert(err.message || 'Error al guardar el set.')
  } finally {
    savingSet.value = false
  }
}

async function handleConfirmDelete() {
  if (!deletingSet.value) return
  isDeleting.value = true
  try {
    await deleteSet(deletingSet.value.id)
    deletingSet.value = null
  } catch (err) {
    alert(err.message || 'No se pudo eliminar el set.')
  } finally {
    isDeleting.value = false
  }
}
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader
      @open-create="openCreateModal"
      @open-pin="isPinModalOpen = true"
    />

    <main class="flex-1">
      <RouterView
        @open-create="openCreateModal"
        @open-pin="isPinModalOpen = true"
        @open-viewer="viewerSet = $event"
        @edit-set="openEditModal"
        @delete-set="deletingSet = $event"
      />
    </main>

    <PinModal
      :open="isPinModalOpen"
      @close="isPinModalOpen = false"
      @unlocked="fetchSets"
    />

    <SetFormModal
      :open="isFormOpen"
      :initial-set="editingSet"
      :saving="savingSet"
      @close="isFormOpen = false; editingSet = null"
      @save="handleSaveSet"
    />

    <PdfViewerModal
      :set="viewerSet"
      @close="viewerSet = null"
    />

    <ConfirmDialog
      :open="Boolean(deletingSet)"
      title="Eliminar set"
      :message="`¿Seguro que quieres eliminar «${deletingSet?.name}» (#${deletingSet?.set_number})? Esta acción no se puede deshacer.`"
      :loading="isDeleting"
      @cancel="deletingSet = null"
      @confirm="handleConfirmDelete"
    />
  </div>
</template>