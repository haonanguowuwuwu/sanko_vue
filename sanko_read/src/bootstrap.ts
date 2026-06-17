import { USE_MOCK } from '@/api/config'
import { mockState } from '@/api/mock/state'
import { useUserStore } from '@/stores/user'
import { useBooksStore } from '@/stores/books'
import { useBookshelvesStore } from '@/stores/bookshelves'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import { useSettingsStore } from '@/stores/settings'

export async function bootstrapApp() {
  const userStore = useUserStore()
  const booksStore = useBooksStore()
  const bookshelvesStore = useBookshelvesStore()
  const annotationsStore = useReaderAnnotationsStore()
  const settingsStore = useSettingsStore()

  await userStore.init()
  await settingsStore.fetchAll()

  await Promise.all([
    booksStore.fetchAll(),
    bookshelvesStore.fetchAll(),
    annotationsStore.fetchAll(),
  ])

  if (USE_MOCK) {
    settingsApiSyncMock(settingsStore)
  }
}

function settingsApiSyncMock(settingsStore: ReturnType<typeof useSettingsStore>) {
  mockState.settings = { ...settingsStore.toDto() }
}

export async function reloadAfterRestore() {
  const booksStore = useBooksStore()
  const bookshelvesStore = useBookshelvesStore()
  const annotationsStore = useReaderAnnotationsStore()
  const settingsStore = useSettingsStore()

  await settingsStore.fetchAll()
  await Promise.all([
    booksStore.fetchAll(),
    bookshelvesStore.fetchAll(),
    annotationsStore.fetchAll(),
  ])
}
