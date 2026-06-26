<script setup lang="ts">
const props = withDefaults(
  defineProps<{
    modelValue: number
    max?: number
    readonly?: boolean
  }>(),
  {
    max: 5,
    readonly: false,
  },
)

const emit = defineEmits<{
  'update:modelValue': [value: number]
}>()

const stars = () => Array.from({ length: props.max }, (_, i) => i + 1)

const setRating = (value: number) => {
  if (props.readonly) return
  emit('update:modelValue', value)
}
</script>

<template>
  <div class="star-rating-input" role="group" aria-label="评分">
    <button
      v-for="star in stars()"
      :key="star"
      type="button"
      class="star-rating-input__star"
      :class="{ 'is-active': star <= modelValue }"
      :disabled="readonly"
      :aria-label="`${star} 星`"
      @click="setRating(star)"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
        <path
          fill="currentColor"
          d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"
        />
      </svg>
    </button>
  </div>
</template>

<style scoped>
.star-rating-input {
  display: inline-flex;
  align-items: center;
  gap: 2px;
}

.star-rating-input__star {
  padding: 0;
  border: none;
  background: none;
  color: #d9d9d9;
  cursor: pointer;
  line-height: 0;
  transition: color 0.15s, transform 0.1s;
}

.star-rating-input__star.is-active {
  color: #e8a317;
}

.star-rating-input__star:not(:disabled):hover {
  transform: scale(1.08);
}

.star-rating-input__star:disabled {
  cursor: default;
}
</style>
