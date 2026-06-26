<script setup lang="ts">
import StarRatingInput from '@/components/book/StarRatingInput.vue'

const props = defineProps<{
  modelValue: string
  placeholder?: string
  compact?: boolean
  showRating?: boolean
  rating?: number
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'update:rating': [value: number]
  submit: []
}>()

const onInput = (event: Event) => {
  emit('update:modelValue', (event.target as HTMLTextAreaElement).value)
}

const submit = () => {
  if (!props.modelValue.trim()) return
  emit('submit')
}
</script>

<template>
  <div class="comment-composer" :class="{ 'comment-composer--compact': compact }">
    <div v-if="showRating" class="comment-composer__rating">
      <span class="comment-composer__rating-label">评分</span>
      <StarRatingInput
        :model-value="rating ?? 5"
        @update:model-value="emit('update:rating', $event)"
      />
    </div>
    <textarea
      :value="modelValue"
      class="comment-composer__input"
      :placeholder="placeholder ?? '快来发表你的看法吧！'"
      rows="4"
      @input="onInput"
    />
    <div class="comment-composer__actions">
      <button type="button" class="comment-composer__send" @click="submit">发送</button>
    </div>
  </div>
</template>

<style scoped>
.comment-composer {
  margin-bottom: 20px;
}

.comment-composer__rating {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 10px;
}

.comment-composer__rating-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--sanko-text-secondary);
}

.comment-composer--compact {
  margin: 12px 0 0 48px;
}

.comment-composer__input {
  display: block;
  width: 100%;
  min-height: 100px;
  padding: 14px 16px;
  border: none;
  border-radius: 4px;
  background: #f5f0e8;
  font-size: 14px;
  font-family: inherit;
  line-height: 1.6;
  color: var(--sanko-text);
  resize: vertical;
  outline: none;
}

.comment-composer--compact .comment-composer__input {
  min-height: 72px;
}

.comment-composer__input::placeholder {
  color: var(--sanko-text-secondary);
}

.comment-composer__actions {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.comment-composer__send {
  padding: 8px 24px;
  border: none;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s;
}

.comment-composer__send:hover {
  background: var(--sanko-green-hover);
}

@media (max-width: 640px) {
  .comment-composer--compact {
    margin-left: 24px;
  }
}
</style>
