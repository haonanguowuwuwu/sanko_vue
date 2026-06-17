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
  success: []
}>()

const bookshelvesStore = useBookshelvesStore()
const { shelves } = storeToRefs(bookshelvesStore)
const selectedShelfIds = ref<Set<string>>(new Set())

watch(
  () => props.visible,
  (open) => {
    if (open) {
      selectedShelfIds.value = new Set()
    }
  },
)

const toggleShelf = (shelfId: string) => {
  if (selectedShelfIds.value.has(shelfId)) {
    selectedShelfIds.value.delete(shelfId)
  } else {
    selectedShelfIds.value.add(shelfId)
  }
}

const handleClose = () => {
  emit('update:visible', false)
}

const handleConfirm = async () => {
  if (selectedShelfIds.value.size === 0) {
    ElMessage.warning('请选择书架')
    return
  }
  await Promise.all(
    props.bookIds.map((bookId) =>
      bookshelvesStore.addBookToShelves([...selectedShelfIds.value], bookId),
    ),
  )
  emit('update:visible', false)
  emit('success')
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="400px"
    title="添加到书架"
    append-to-body
    align-center
    class="add-shelf-dialog"
    @update:model-value="emit('update:visible', $event)"
  >
    <p v-if="shelves.length === 0" class="add-shelf-dialog__empty">暂无书架，请先新建书架</p>

    <ul v-else class="add-shelf-list">
      <li
        v-for="shelf in shelves"
        :key="shelf.id"
        class="add-shelf-item"
        :class="{ 'is-selected': selectedShelfIds.has(shelf.id) }"
        @click="toggleShelf(shelf.id)"
      >
        {{ shelf.name }}
      </li>
    </ul>

    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" class="add-shelf-confirm" @click="handleConfirm">确定</el-button>
    </template>
  </el-dialog>
</template>

<style scoped>
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
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-size: 15px;
  transition: background 0.15s;
}

.add-shelf-item:hover {
  background: rgba(0, 90, 43, 0.06);
}

.add-shelf-item.is-selected {
  background: rgba(0, 90, 43, 0.12);
  color: var(--sanko-green);
  font-weight: 600;
}

.add-shelf-confirm {
  --el-button-bg-color: var(--sanko-green);
  --el-button-border-color: var(--sanko-green);
}
</style>

<style>
.add-shelf-dialog .el-dialog {
  background: #f5f0e8;
  border-radius: 10px;
}
</style>
