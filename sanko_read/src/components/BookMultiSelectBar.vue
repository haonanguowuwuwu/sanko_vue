<script setup lang="ts">
import { computed, ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useBooksStore } from '@/stores/books'
import BookDeleteDialog from '@/components/BookDeleteDialog.vue'
import AddToBookshelfDialog from '@/components/AddToBookshelfDialog.vue'

const props = defineProps<{
  bookIds: string[]
}>()

const booksStore = useBooksStore()
const { allSelectedFavorited, selectedCount, selectedIds } = storeToRefs(booksStore)
const showDeleteDialog = ref(false)
const showAddToShelfDialog = ref(false)

const selectedBookIds = computed(() => [...selectedIds.value])

const isAllSelectedInScope = computed(() => booksStore.isAllSelectedInList(props.bookIds))

const favoriteLabel = computed(() =>
  allSelectedFavorited.value ? '从喜欢移除' : '添加到喜欢',
)

const handleCancel = () => {
  booksStore.exitSelectionMode()
}

const handleFavorite = async () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('请先选择书籍')
    return
  }
  if (allSelectedFavorited.value) {
    await booksStore.removeSelectedFromFavorites()
    ElMessage.success(`已将 ${selectedCount.value} 本书从喜欢移除`)
  } else {
    await booksStore.addSelectedToFavorites()
    ElMessage.success(`已将 ${selectedCount.value} 本书添加到喜欢`)
  }
  booksStore.exitSelectionMode()
}

const handleBookshelf = () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('请先选择书籍')
    return
  }
  showAddToShelfDialog.value = true
}

const onAddToShelfSuccess = () => {
  ElMessage.success(`已将 ${selectedCount.value} 本书添加到书架`)
  booksStore.exitSelectionMode()
}

const handleDelete = () => {
  if (selectedCount.value === 0) {
    ElMessage.warning('请先选择书籍')
    return
  }
  if (booksStore.isRecycleBinEnabled()) {
    void booksStore.moveSelectedToRecycleBin().then(() => {
      ElMessage.success(`已将 ${selectedCount.value} 本书移入回收站`)
    })
  } else {
    showDeleteDialog.value = true
  }
}

const confirmDelete = async () => {
  const count = selectedCount.value
  await booksStore.removeSelected()
  ElMessage.success(count === 1 ? '已删除书籍' : `已删除 ${count} 本书籍`)
}

const handleSelectAll = () => {
  booksStore.selectAllFromList(props.bookIds)
}
</script>

<template>
  <div class="multi-select-bar">
    <button type="button" class="multi-select-bar__btn multi-select-bar__btn--cancel" @click="handleCancel">
      取消
    </button>
    <button type="button" class="multi-select-bar__btn" @click="handleFavorite">{{ favoriteLabel }}</button>
    <button type="button" class="multi-select-bar__btn" @click="handleBookshelf">添加到书架</button>
    <button type="button" class="multi-select-bar__btn" @click="handleDelete">删除</button>
    <button type="button" class="multi-select-bar__btn" @click="handleSelectAll">
      {{ isAllSelectedInScope ? '取消全选' : '全选' }}
    </button>
  </div>

  <BookDeleteDialog v-model:visible="showDeleteDialog" append-to-body @confirm="confirmDelete" />
  <AddToBookshelfDialog
    v-model:visible="showAddToShelfDialog"
    :book-ids="selectedBookIds"
    @success="onAddToShelfSuccess"
  />
</template>

<style scoped>
.multi-select-bar {
  position: fixed;
  left: var(--sidebar-current-width, 220px);
  right: 0;
  bottom: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 48px;
  padding: 20px 40px;
  background: var(--sanko-bg);
  border-top: 1px solid var(--sanko-border);
  z-index: 100;
}

.multi-select-bar__btn {
  border: none;
  background: none;
  padding: 0;
  font-size: 16px;
  font-weight: 500;
  color: var(--sanko-text);
  cursor: pointer;
  transition: color 0.15s;
}

.multi-select-bar__btn:hover {
  color: var(--sanko-green);
}

.multi-select-bar__btn--cancel {
  color: #c0392b;
}

.multi-select-bar__btn--cancel:hover {
  color: #a93226;
}
</style>
