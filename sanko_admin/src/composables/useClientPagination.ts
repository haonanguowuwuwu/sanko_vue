import { computed, ref, type Ref } from 'vue'

export function useClientPagination<T>(source: Ref<T[]> | (() => T[]), pageSize = 10) {
  const page = ref(1)
  const size = ref(pageSize)

  const list = computed(() => (typeof source === 'function' ? source() : source.value))

  const total = computed(() => list.value.length)

  const pagedList = computed(() => {
    const start = (page.value - 1) * size.value
    return list.value.slice(start, start + size.value)
  })

  function resetPage() {
    page.value = 1
  }

  return { page, size, total, pagedList, resetPage }
}
