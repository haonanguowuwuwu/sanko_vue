import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { CatalogBook } from '@/types/catalog'
import {
  fetchPurchasedCatalogIds,
  purchaseCatalogBook,
} from '@/api/catalog'
import { catalogBookRequiresPurchase } from '@/data/catalogBooks'
import { useProfileStore } from '@/stores/profile'
import { useUserStore } from '@/stores/user'

export const useCatalogPurchaseStore = defineStore('catalogPurchase', () => {
  const purchasedIds = ref<Set<string>>(new Set())
  const loaded = ref(false)

  function isPurchased(bookId: string) {
    return purchasedIds.value.has(bookId)
  }

  function canAccessBook(book: CatalogBook | null | undefined) {
    if (!book) return false
    if (!catalogBookRequiresPurchase(book)) return true
    return isPurchased(book.id)
  }

  async function loadPurchased() {
    const userStore = useUserStore()
    if (!userStore.isLoggedIn) {
      purchasedIds.value = new Set()
      loaded.value = false
      return
    }
    const ids = await fetchPurchasedCatalogIds()
    purchasedIds.value = new Set(ids)
    loaded.value = true
  }

  async function purchaseBook(bookId: string) {
    const result = await purchaseCatalogBook(bookId)
    purchasedIds.value = new Set([...purchasedIds.value, bookId])
    const profileStore = useProfileStore()
    profileStore.pointsBalance = result.balance
    return result
  }

  function clear() {
    purchasedIds.value = new Set()
    loaded.value = false
  }

  return {
    purchasedIds,
    loaded,
    isPurchased,
    canAccessBook,
    loadPurchased,
    purchaseBook,
    clear,
  }
})
