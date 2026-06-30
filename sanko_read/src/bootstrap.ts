import { USE_MOCK } from '@/api/config'
import { mockState } from '@/api/mock/state'
import { seedDemoAnnotationsIfNeeded } from '@/api/mock/demoAnnotations'
import { useUserStore } from '@/stores/user'
import { useProfileStore } from '@/stores/profile'
import { useCatalogPurchaseStore } from '@/stores/catalogPurchase'
import { useBooksStore } from '@/stores/books'
import { useBookshelvesStore } from '@/stores/bookshelves'
import { useReaderAnnotationsStore } from '@/stores/readerAnnotations'
import { useSettingsStore } from '@/stores/settings'

export function clearUserPersonalData() {
  useBooksStore().clearAll()
  useBookshelvesStore().clearAll()
  useReaderAnnotationsStore().clearAll()
  useProfileStore().clear()
  useCatalogPurchaseStore().clear()
}

export async function loadUserPersonalData() {
  const userStore = useUserStore()
  if (!userStore.isLoggedIn) {
    clearUserPersonalData()
    return
  }

  const booksStore = useBooksStore()
  const bookshelvesStore = useBookshelvesStore()
  const annotationsStore = useReaderAnnotationsStore()

  await Promise.all([
    booksStore.fetchAll(),
    bookshelvesStore.fetchAll(),
    annotationsStore.fetchAll(),
    useProfileStore().loadPoints(),
    useCatalogPurchaseStore().loadPurchased(),
  ])

  if (USE_MOCK) {
    let seeded = false
    for (const book of booksStore.books) {
      if (seedDemoAnnotationsIfNeeded(book.id, book.format)) {
        seeded = true
      }
    }
    if (seeded) {
      await annotationsStore.fetchAll()
    }
  }
}

export async function bootstrapApp() {
  const userStore = useUserStore()
  const settingsStore = useSettingsStore()

  await userStore.init()
  await settingsStore.fetchAll()

  if (userStore.isLoggedIn) {
    await loadUserPersonalData()
  } else {
    clearUserPersonalData()
  }

  if (USE_MOCK) {
    settingsApiSyncMock(settingsStore)
  }
}

function settingsApiSyncMock(settingsStore: ReturnType<typeof useSettingsStore>) {
  mockState.settings = { ...settingsStore.toDto() }
}

export async function reloadAfterRestore() {
  const settingsStore = useSettingsStore()
  await settingsStore.fetchAll()
  await loadUserPersonalData()
}
