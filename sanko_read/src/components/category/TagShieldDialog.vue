<script setup lang="ts">
const props = defineProps<{
  visible: boolean
  tags: string[]
  blockedTags: string[]
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  toggle: [tag: string]
  confirm: []
}>()

const close = () => emit('update:visible', false)

const confirm = () => {
  emit('confirm')
  close()
}

const isBlocked = (tag: string) => props.blockedTags.includes(tag)
</script>

<template>
  <Transition name="shield-dialog">
    <div v-if="visible" class="tag-shield-dialog">
      <div class="tag-shield-dialog__backdrop" @click="close" />
      <div class="tag-shield-dialog__panel" role="dialog" aria-label="标签屏蔽">
        <div class="tag-shield-dialog__header">
          <div class="tag-shield-dialog__hints">
            <span class="tag-shield-dialog__hint">点击标签选择或取消</span>
            <span class="tag-shield-dialog__hint tag-shield-dialog__hint--blocked">绿色表示已屏蔽</span>
          </div>
          <div class="tag-shield-dialog__actions">
            <button type="button" class="tag-shield-dialog__action" @click="confirm">确定</button>
            <button type="button" class="tag-shield-dialog__action" @click="close">取消</button>
          </div>
        </div>
        <div class="tag-shield-dialog__grid">
          <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            class="tag-shield-dialog__tag"
            :class="{ 'is-blocked': isBlocked(tag) }"
            @click="emit('toggle', tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tag-shield-dialog {
  position: fixed;
  inset: 0;
  z-index: 100;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding: 120px 24px 24px;
}

.tag-shield-dialog__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.08);
}

.tag-shield-dialog__panel {
  position: relative;
  width: min(720px, 100%);
  background: #f5f0e8;
  border: 1px solid #d9d0c0;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.tag-shield-dialog__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px 16px;
  border-bottom: 1px solid #e0d8cc;
  flex-wrap: wrap;
}

.tag-shield-dialog__hints {
  display: flex;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.tag-shield-dialog__hint {
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.tag-shield-dialog__hint--blocked {
  color: var(--sanko-green);
}

.tag-shield-dialog__actions {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
}

.tag-shield-dialog__action {
  padding: 5px 8px;
  border: none;
  background: none;
  color: var(--sanko-green);
  font-size: 13px;
  cursor: pointer;
}

.tag-shield-dialog__action:hover {
  opacity: 0.85;
}

.tag-shield-dialog__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px 16px;
  padding: 16px 20px 20px;
  max-height: 320px;
  overflow-y: auto;
}

.tag-shield-dialog__tag {
  padding: 4px 0;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: var(--sanko-text);
  cursor: pointer;
}

.tag-shield-dialog__tag.is-blocked {
  color: var(--sanko-green);
  font-weight: 600;
}

.shield-dialog-enter-active,
.shield-dialog-leave-active {
  transition: opacity 0.15s ease;
}

.shield-dialog-enter-from,
.shield-dialog-leave-to {
  opacity: 0;
}

@media (max-width: 640px) {
  .tag-shield-dialog__grid {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
</style>
