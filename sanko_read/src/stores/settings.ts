import { ref, watch } from 'vue'
import { defineStore } from 'pinia'
import type { BookReadStatusFilter } from '@/utils/bookReadStatus'
import * as settingsApi from '@/api/settings'
import type { AppSettingsDto } from '@/api/types'

export type ExportFormat = 'json' | 'markdown' | 'csv' | 'txt'
export type BookViewMode = 'grid' | 'list'

export const useSettingsStore = defineStore('settings', () => {
  const disableRecycleBin = ref(true)
  const hideBookshelfBooks = ref(false)
  const directDeleteFromShelf = ref(false)

  const noPdfCoverAsBookCover = ref(true)
  const noCropBookCovers = ref(false)
  const showBookshelfBookCount = ref(true)
  const enableSoftwareProtection = ref(false)
  const bookViewMode = ref<BookViewMode>('grid')
  const bookReadStatusFilter = ref<BookReadStatusFilter>('全部')
  /** 0 = 大，100 = 小 */
  const cardCoverSize = ref(67)

  const notesExportFormat = ref<ExportFormat | ''>('')
  const highlightsExportFormat = ref<ExportFormat | ''>('')

  const initialized = ref(false)
  const syncing = ref(false)

  function applyDto(dto: AppSettingsDto) {
    disableRecycleBin.value = dto.disableRecycleBin
    hideBookshelfBooks.value = dto.hideBookshelfBooks
    directDeleteFromShelf.value = dto.directDeleteFromShelf
    noPdfCoverAsBookCover.value = dto.noPdfCoverAsBookCover
    noCropBookCovers.value = dto.noCropBookCovers
    showBookshelfBookCount.value = dto.showBookshelfBookCount
    enableSoftwareProtection.value = dto.enableSoftwareProtection
  }

  function toDto(): AppSettingsDto {
    return {
      disableRecycleBin: disableRecycleBin.value,
      hideBookshelfBooks: hideBookshelfBooks.value,
      directDeleteFromShelf: directDeleteFromShelf.value,
      noPdfCoverAsBookCover: noPdfCoverAsBookCover.value,
      noCropBookCovers: noCropBookCovers.value,
      showBookshelfBookCount: showBookshelfBookCount.value,
      enableSoftwareProtection: enableSoftwareProtection.value,
    }
  }

  async function fetchAll() {
    syncing.value = true
    try {
      const dto = await settingsApi.fetchSettings()
      applyDto(dto)
      initialized.value = true
    } finally {
      syncing.value = false
    }
  }

  async function persistPartial(payload: Partial<AppSettingsDto>) {
    if (syncing.value) return
    syncing.value = true
    try {
      const dto = await settingsApi.updateSettings(payload)
      applyDto(dto)
    } finally {
      syncing.value = false
    }
  }

  watch(
    [
      disableRecycleBin,
      hideBookshelfBooks,
      directDeleteFromShelf,
      noPdfCoverAsBookCover,
      noCropBookCovers,
      showBookshelfBookCount,
      enableSoftwareProtection,
    ],
    () => {
      if (!initialized.value || syncing.value) return
      void persistPartial(toDto())
    },
  )

  return {
    disableRecycleBin,
    hideBookshelfBooks,
    directDeleteFromShelf,
    noPdfCoverAsBookCover,
    noCropBookCovers,
    showBookshelfBookCount,
    enableSoftwareProtection,
    bookViewMode,
    bookReadStatusFilter,
    cardCoverSize,
    notesExportFormat,
    highlightsExportFormat,
    initialized,
    fetchAll,
    applyDto,
    toDto,
  }
})
