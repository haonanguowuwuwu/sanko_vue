<script setup lang="ts">
import { ref } from 'vue'
import { storeToRefs } from 'pinia'
import { ElMessage } from 'element-plus'
import { Close, Delete, EditPen, Rank, Check } from '@element-plus/icons-vue'
import { useBookshelvesStore } from '@/stores/bookshelves'

defineProps<{
  visible: boolean
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
}>()

const bookshelvesStore = useBookshelvesStore()
const { shelves } = storeToRefs(bookshelvesStore)

const editingId = ref<string | null>(null)
const editingName = ref('')
const deletingId = ref<string | null>(null)
const dragIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

const handleClose = () => {
  editingId.value = null
  deletingId.value = null
  emit('update:visible', false)
}

const startEdit = (id: string, name: string) => {
  deletingId.value = null
  editingId.value = id
  editingName.value = name
}

const confirmEdit = async (id: string) => {
  if (!editingName.value.trim()) {
    ElMessage.warning('书架名称不能为空')
    return
  }
  await bookshelvesStore.renameShelf(id, editingName.value)
  editingId.value = null
  ElMessage.success('书架名称已更新')
}

const startDelete = (id: string) => {
  editingId.value = null
  deletingId.value = id
}

const cancelDelete = () => {
  deletingId.value = null
}

const confirmDelete = async (id: string) => {
  await bookshelvesStore.removeShelf(id)
  deletingId.value = null
  ElMessage.success('书架已删除')
}

const handleNewShelf = async () => {
  const shelf = await bookshelvesStore.addShelf('新书架')
  startEdit(shelf.id, shelf.name)
}

const onDragStart = (index: number) => {
  dragIndex.value = index
}

const onDragOver = (event: DragEvent, index: number) => {
  event.preventDefault()
  dragOverIndex.value = index
}

const onDrop = (index: number) => {
  if (dragIndex.value !== null) {
    void bookshelvesStore.reorderShelves(dragIndex.value, index)
  }
  dragIndex.value = null
  dragOverIndex.value = null
}

const onDragEnd = () => {
  dragIndex.value = null
  dragOverIndex.value = null
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="520px"
    :show-close="false"
    append-to-body
    align-center
    class="manage-shelf-dialog"
    @update:model-value="emit('update:visible', $event)"
    @closed="handleClose"
  >
    <template #header>
      <div class="manage-shelf-dialog__header">
        <span class="manage-shelf-dialog__title">管理书架</span>
        <el-button :icon="Close" text class="manage-shelf-dialog__close" @click="handleClose" />
      </div>
    </template>

    <div class="manage-shelf-dialog__body">
      <div v-if="shelves.length === 0" class="manage-shelf-dialog__empty" />

      <ul v-else class="shelf-list">
        <li
          v-for="(shelf, index) in shelves"
          :key="shelf.id"
          class="shelf-row"
          :class="{ 'shelf-row--drag-over': dragOverIndex === index && dragIndex !== index }"
          @dragover="onDragOver($event, index)"
          @drop="onDrop(index)"
        >
          <!-- 删除确认 -->
          <div v-if="deletingId === shelf.id" class="shelf-row__confirm">
            <p class="shelf-row__confirm-text">确认删除吗？</p>
            <div class="shelf-row__confirm-actions">
              <button type="button" class="shelf-row__confirm-btn" @click="cancelDelete">取消</button>
              <button
                type="button"
                class="shelf-row__confirm-btn shelf-row__confirm-btn--primary"
                @click="confirmDelete(shelf.id)"
              >
                确定
              </button>
            </div>
          </div>

          <!-- 编辑模式 -->
          <div v-else-if="editingId === shelf.id" class="shelf-row__edit">
            <el-input v-model="editingName" class="shelf-row__input" @keyup.enter="confirmEdit(shelf.id)" />
            <el-button
              class="shelf-row__check"
              :icon="Check"
              circle
              type="primary"
              @click="confirmEdit(shelf.id)"
            />
          </div>

          <!-- 普通显示 -->
          <div v-else class="shelf-row__content">
            <span class="shelf-row__name">{{ shelf.name }}</span>
            <div class="shelf-row__actions">
              <el-button :icon="Delete" text class="shelf-row__action" @click="startDelete(shelf.id)" />
              <el-button
                :icon="EditPen"
                text
                class="shelf-row__action"
                @click="startEdit(shelf.id, shelf.name)"
              />
              <el-button
                :icon="Rank"
                text
                class="shelf-row__action shelf-row__drag-handle"
                draggable="true"
                @dragstart="onDragStart(index)"
                @dragend="onDragEnd"
              />
            </div>
          </div>
        </li>
      </ul>
    </div>

    <template #footer>
      <div class="manage-shelf-dialog__footer">
        <button type="button" class="manage-shelf-dialog__new" @click="handleNewShelf">新建书架</button>
        <span class="manage-shelf-dialog__hint">拖动进行排序</span>
      </div>
    </template>
  </el-dialog>
</template>

<style scoped>
.manage-shelf-dialog__header {
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
}

.manage-shelf-dialog__title {
  font-size: 18px;
  font-weight: 600;
  color: var(--sanko-text);
}

.manage-shelf-dialog__close {
  position: absolute;
  right: 0;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  color: var(--sanko-text);
}

.manage-shelf-dialog__body {
  min-height: 200px;
}

.manage-shelf-dialog__empty {
  min-height: 200px;
  background: #e8e8e8;
  border-radius: 4px;
}

.shelf-list {
  list-style: none;
  margin: 0;
  padding: 0;
}

.shelf-row {
  border-bottom: 1px solid #ebe4d8;
  min-height: 52px;
}

.shelf-row--drag-over {
  background: rgba(0, 90, 43, 0.06);
}

.shelf-row__content,
.shelf-row__edit,
.shelf-row__confirm {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 4px;
  gap: 12px;
}

.shelf-row__name {
  font-size: 16px;
  font-weight: 500;
  color: var(--sanko-text);
}

.shelf-row__actions {
  display: flex;
  align-items: center;
  gap: 2px;
}

.shelf-row__action {
  color: var(--sanko-text-secondary);
  font-size: 16px;
}

.shelf-row__drag-handle {
  cursor: grab;
}

.shelf-row__drag-handle:active {
  cursor: grabbing;
}

.shelf-row__edit {
  padding: 8px 0;
}

.shelf-row__input {
  flex: 1;
}

.shelf-row__input :deep(.el-input__wrapper) {
  border-radius: 999px;
  background: #fff;
  box-shadow: none;
  border: 1px solid #ddd;
}

.shelf-row__check {
  flex-shrink: 0;
  --el-button-bg-color: var(--sanko-green);
  --el-button-border-color: var(--sanko-green);
}

.shelf-row__confirm {
  flex-direction: column;
  align-items: stretch;
  padding: 16px 8px;
  background: #ebe4d8;
  border-radius: 4px;
  margin: 4px 0;
}

.shelf-row__confirm-text {
  margin: 0 0 12px;
  text-align: center;
  font-size: 16px;
  font-weight: 600;
}

.shelf-row__confirm-actions {
  display: flex;
  gap: 12px;
}

.shelf-row__confirm-btn {
  flex: 1;
  height: 36px;
  border: 1px solid #d9d0c0;
  border-radius: 6px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

.shelf-row__confirm-btn--primary {
  background: #2a2a2a;
  color: #fff;
  border-color: #2a2a2a;
}

.manage-shelf-dialog__footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.manage-shelf-dialog__new {
  border: none;
  background: none;
  padding: 0;
  font-size: 15px;
  font-weight: 500;
  color: #1a8a8a;
  cursor: pointer;
}

.manage-shelf-dialog__new:hover {
  text-decoration: underline;
}

.manage-shelf-dialog__hint {
  font-size: 13px;
  color: var(--sanko-text-secondary);
}
</style>

<style>
.manage-shelf-dialog .el-dialog {
  background: #f5f0e8;
  border: 1px solid #333;
  border-radius: 12px;
}

.manage-shelf-dialog .el-dialog__header {
  padding: 20px 24px 12px;
  margin-right: 0;
}

.manage-shelf-dialog .el-dialog__body {
  padding: 8px 24px;
}

.manage-shelf-dialog .el-dialog__footer {
  padding: 12px 24px 20px;
}
</style>
