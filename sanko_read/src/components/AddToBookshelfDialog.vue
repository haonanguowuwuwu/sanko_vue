<script setup lang="ts">
import { ref, watch } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { useBookshelvesStore } from '@/stores/bookshelves'

const props = defineProps<{
  visible: boolean
  bookIds: string[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: [payload: { shelfCount: number }]
}>()

const bookshelvesStore = useBookshelvesStore()
const { shelves } = storeToRefs(bookshelvesStore)
const selectedShelfIds = ref<string[]>([])

const isSingleBook = () => props.bookIds.length === 1

watch(
  () => props.visible,
  (open) => {
    if (!open) return
    if (isSingleBook()) {
      const bookId = props.bookIds[0]!
      selectedShelfIds.value = shelves.value
        .filter((shelf) => shelf.bookIds.includes(bookId))
        .map((shelf) => shelf.id)
    } else {
      selectedShelfIds.value = []
    }
  },
)

const toggleShelf = (shelfId: string) => {
  const list = [...selectedShelfIds.value]
  const index = list.indexOf(shelfId)
  if (index === -1) {
    list.push(shelfId)
  } else {
    list.splice(index, 1)
  }
  selectedShelfIds.value = list
}

const isSelected = (shelfId: string) => selectedShelfIds.value.includes(shelfId)

const handleClose = () => {
  emit('update:visible', false)
}

const handleConfirm = async () => {
  if (!isSingleBook() && selectedShelfIds.value.length === 0) {
    ElMessage.warning('请选择书架')
    return
  }

  if (isSingleBook()) {
    await bookshelvesStore.syncBookOnShelves(props.bookIds[0]!, selectedShelfIds.value)
  } else {
    await Promise.all(
      props.bookIds.map((bookId) =>
        bookshelvesStore.addBookToShelves(selectedShelfIds.value, bookId),
      ),
    )
  }

  emit('update:visible', false)
  emit('success', { shelfCount: selectedShelfIds.value.length })
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="420px"
    :show-close="false"
    :close-on-click-modal="true"
    :close-on-press-escape="true"
    append-to-body
    align-center
    class="add-shelf-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <h3 class="add-shelf-dialog__title">加入书架</h3>

    <p v-if="shelves.length === 0" class="add-shelf-dialog__empty">暂无书架，请先新建书架</p>

    <template v-else>
      <p v-if="isSingleBook()" class="add-shelf-dialog__hint">
        取消勾选并确定，可将书籍从对应书架移除
      </p>

      <ul class="add-shelf-list">
        <li
          v-for="shelf in shelves"
          :key="shelf.id"
          class="add-shelf-item"
          @click="toggleShelf(shelf.id)"
        >
          <span class="add-shelf-item__name">{{ shelf.name }}</span>
          <span
            class="add-shelf-item__checkbox"
            :class="{ 'is-checked': isSelected(shelf.id) }"
            aria-hidden="true"
          >
            <svg v-if="isSelected(shelf.id)" viewBox="0 0 24 24" width="14" height="14" fill="#fff">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z" />
            </svg>
          </span>
        </li>
      </ul>
    </template>

    <div v-if="shelves.length > 0" class="add-shelf-dialog__actions">
      <button type="button" class="add-shelf-dialog__btn add-shelf-dialog__btn--cancel" @click="handleClose">
        取消
      </button>
      <button type="button" class="add-shelf-dialog__btn add-shelf-dialog__btn--confirm" @click="handleConfirm">
        确定
      </button>
    </div>
  </el-dialog>
</template>

<style scoped>
.add-shelf-dialog__title {
  margin: 0 0 12px;
  font-size: 18px;
  font-weight: 700;
  color: var(--sanko-green);
  text-align: center;
}

.add-shelf-dialog__hint {
  margin: 0 0 12px;
  font-size: 12px;
  color: var(--sanko-text-secondary);
  text-align: center;
}

.add-shelf-dialog__empty {
  margin: 0;
  text-align: center;
  color: var(--sanko-text-secondary);
}

.add-shelf-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.add-shelf-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 14px 4px;
  border-bottom: 1px solid var(--sanko-border);
  cursor: pointer;
  font-size: 15px;
  color: var(--sanko-text);
  transition: background 0.15s;
}

.add-shelf-item:first-child {
  border-top: 1px solid var(--sanko-border);
}

.add-shelf-item:hover {
  background: rgba(0, 90, 43, 0.04);
}

.add-shelf-item__name {
  flex: 1;
  min-width: 0;
}

.add-shelf-item__checkbox {
  flex-shrink: 0;
  width: 20px;
  height: 20px;
  border: 2px solid #c5c5c5;
  border-radius: 3px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s, border-color 0.15s;
}

.add-shelf-item__checkbox.is-checked {
  background: var(--sanko-green);
  border-color: var(--sanko-green);
}

.add-shelf-dialog__actions {
  display: flex;
  gap: 16px;
  margin-top: 24px;
}

.add-shelf-dialog__btn {
  flex: 1;
  height: 40px;
  border-radius: 6px;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  border: 1px solid #d9d0c0;
  transition: opacity 0.15s;
}

.add-shelf-dialog__btn:hover {
  opacity: 0.85;
}

.add-shelf-dialog__btn--cancel {
  background: #fff;
  color: var(--sanko-text);
}

.add-shelf-dialog__btn--confirm {
  background: var(--sanko-green);
  border-color: var(--sanko-green);
  color: #fff;
}
</style>

<style>
.add-shelf-dialog .el-dialog {
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 8px;
}

.add-shelf-dialog .el-dialog__header {
  display: none;
}

.add-shelf-dialog .el-dialog__body {
  padding: 28px 32px 24px;
}
</style>
