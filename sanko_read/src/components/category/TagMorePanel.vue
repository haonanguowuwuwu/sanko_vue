<script setup lang="ts">
defineProps<{
  visible: boolean
  tags: string[]
  activeTag: string
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  select: [tag: string]
}>()

const close = () => emit('update:visible', false)

const selectTag = (tag: string) => {
  emit('select', tag)
  close()
}
</script>

<template>
  <Transition name="tag-panel">
    <div v-if="visible" class="tag-more-panel">
      <div class="tag-more-panel__backdrop" @click="close" />
      <div class="tag-more-panel__body">
        <div class="tag-more-panel__grid">
          <button
            v-for="tag in tags"
            :key="tag"
            type="button"
            class="tag-more-panel__tag"
            :class="{ 'is-active': tag === activeTag }"
            @click="selectTag(tag)"
          >
            {{ tag }}
          </button>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.tag-more-panel {
  position: absolute;
  inset: 0;
  z-index: 20;
}

.tag-more-panel__backdrop {
  position: absolute;
  inset: 0;
  background: rgba(255, 255, 255, 0.6);
}

.tag-more-panel__body {
  position: relative;
  margin-top: 4px;
  padding: 16px 20px;
  background: #f3f3f3;
  border: 1px solid var(--sanko-border);
  border-radius: 6px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
  max-height: 280px;
  overflow-y: auto;
}

.tag-more-panel__grid {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 8px 16px;
}

.tag-more-panel__tag {
  padding: 4px 0;
  border: none;
  background: none;
  text-align: left;
  font-size: 14px;
  color: var(--sanko-text);
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tag-more-panel__tag:hover {
  color: var(--sanko-green);
}

.tag-more-panel__tag.is-active {
  color: var(--sanko-green);
  font-weight: 600;
}

.tag-panel-enter-active,
.tag-panel-leave-active {
  transition: opacity 0.15s ease;
}

.tag-panel-enter-from,
.tag-panel-leave-to {
  opacity: 0;
}

@media (max-width: 900px) {
  .tag-more-panel__grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}
</style>
