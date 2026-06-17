import { ref } from 'vue'
import { defineStore } from 'pinia'
import type { Bookshelf } from '@/types/bookshelf'
import * as bookshelvesApi from '@/api/bookshelves'

export const useBookshelvesStore = defineStore('bookshelves', () => {
  const shelves = ref<Bookshelf[]>([])
  const loading = ref(false)
  const initialized = ref(false)

  async function fetchAll() {
    loading.value = true
    try {
      shelves.value = await bookshelvesApi.listBookshelves()
      initialized.value = true
    } finally {
      loading.value = false
    }
  }

  function getShelfById(id: string) {
    return shelves.value.find((s) => s.id === id)
  }

  async function addShelf(name: string) {
    const shelf = await bookshelvesApi.createBookshelf(name)
    shelves.value.push(shelf)
    return shelf
  }

  async function renameShelf(id: string, name: string) {
    const shelf = await bookshelvesApi.renameBookshelf(id, name)
    const index = shelves.value.findIndex((s) => s.id === id)
    if (index !== -1) {
      shelves.value[index] = shelf
    }
  }

  async function removeShelf(id: string) {
    await bookshelvesApi.deleteBookshelf(id)
    shelves.value = shelves.value.filter((s) => s.id !== id)
  }

  async function reorderShelves(fromIndex: number, toIndex: number) {
    if (fromIndex === toIndex || fromIndex < 0 || toIndex < 0) return
    if (fromIndex >= shelves.value.length || toIndex >= shelves.value.length) return
    const list = [...shelves.value]
    const [moved] = list.splice(fromIndex, 1)
    if (moved) {
      list.splice(toIndex, 0, moved)
      shelves.value = list
      await bookshelvesApi.reorderBookshelves(list.map((s) => s.id))
    }
  }

  async function addBookToShelf(shelfId: string, bookId: string) {
    await bookshelvesApi.addBookToShelf(shelfId, bookId)
    const shelf = getShelfById(shelfId)
    if (shelf && !shelf.bookIds.includes(bookId)) {
      shelf.bookIds.push(bookId)
    }
  }

  async function addBookToShelves(shelfIds: string[], bookId: string) {
    await Promise.all(shelfIds.map((id) => addBookToShelf(id, bookId)))
  }

  async function addBooksToShelf(shelfId: string, bookIds: string[]) {
    await Promise.all(bookIds.map((bookId) => addBookToShelf(shelfId, bookId)))
  }

  function removeBookFromAllShelves(bookId: string) {
    shelves.value.forEach((shelf) => {
      shelf.bookIds = shelf.bookIds.filter((id) => id !== bookId)
    })
  }

  function getBooksInShelf(shelfId: string, allBookIds: string[]) {
    const shelf = getShelfById(shelfId)
    if (!shelf) return []
    return shelf.bookIds.filter((id) => allBookIds.includes(id))
  }

  function applyRemoteData(nextShelves: Bookshelf[]) {
    shelves.value = nextShelves.map((s) => ({ ...s, bookIds: [...s.bookIds] }))
  }

  return {
    shelves,
    loading,
    initialized,
    fetchAll,
    getShelfById,
    addShelf,
    renameShelf,
    removeShelf,
    reorderShelves,
    addBookToShelf,
    addBookToShelves,
    addBooksToShelf,
    removeBookFromAllShelves,
    getBooksInShelf,
    applyRemoteData,
  }
})
