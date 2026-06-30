<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import type { CatalogBook } from '@/types/catalog'
import { useCatalogPurchaseStore } from '@/stores/catalogPurchase'
import { useProfileStore } from '@/stores/profile'

const props = defineProps<{
  visible: boolean
  book: CatalogBook | null
}>()

const emit = defineEmits<{
  'update:visible': [value: boolean]
  success: []
}>()

const router = useRouter()
const purchaseStore = useCatalogPurchaseStore()
const profileStore = useProfileStore()

const paying = ref(false)

const price = computed(() => props.book?.pointsPrice ?? 0)
const balance = computed(() => profileStore.pointsBalance)
const canAfford = computed(() => balance.value >= price.value)

watch(
  () => props.visible,
  (open) => {
    if (open) paying.value = false
  },
)

const close = () => {
  emit('update:visible', false)
}

const goRecharge = () => {
  close()
  void router.push({ name: 'profile', query: { tab: 'recharge' } })
}

const confirmPurchase = async () => {
  if (!props.book || paying.value) return
  if (!canAfford.value) {
    ElMessage.warning('积分不足，请先充值')
    return
  }
  paying.value = true
  try {
    await purchaseStore.purchaseBook(props.book.id)
    ElMessage.success(`已解锁《${props.book.title}》，可以阅读和下载了`)
    emit('success')
    close()
  } catch (error) {
    const message = error instanceof Error ? error.message : '购买失败'
    ElMessage.error(message)
  } finally {
    paying.value = false
  }
}
</script>

<template>
  <el-dialog
    :model-value="visible"
    width="440px"
    :show-close="false"
    align-center
    class="book-purchase-dialog"
    @update:model-value="(v: boolean) => !v && close()"
  >
    <div v-if="book" class="book-purchase">
      <header class="book-purchase__header">
        <h2 class="book-purchase__title">积分购买</h2>
        <p class="book-purchase__subtitle">解锁后可阅读全书并下载所选格式</p>
      </header>

      <div class="book-purchase__book">
        <div class="book-purchase__cover" :style="{ background: book.coverColor }">
          <span>{{ book.coverTitle }}</span>
        </div>
        <div class="book-purchase__info">
          <h3 class="book-purchase__name">{{ book.title }}</h3>
          <p class="book-purchase__author">{{ book.author }}</p>
          <p class="book-purchase__category">{{ book.category }}</p>
        </div>
      </div>

      <div class="book-purchase__price-row">
        <span class="book-purchase__label">所需积分</span>
        <span class="book-purchase__price">{{ price.toLocaleString() }}</span>
      </div>
      <div class="book-purchase__price-row">
        <span class="book-purchase__label">当前余额</span>
        <span
          class="book-purchase__balance"
          :class="{ 'book-purchase__balance--low': !canAfford }"
        >
          {{ balance.toLocaleString() }}
        </span>
      </div>

      <p v-if="!canAfford" class="book-purchase__hint">
        积分不足，还差 {{ (price - balance).toLocaleString() }} 积分
      </p>

      <footer class="book-purchase__footer">
        <button type="button" class="book-purchase__btn book-purchase__btn--ghost" @click="close">
          取消
        </button>
        <button
          v-if="canAfford"
          type="button"
          class="book-purchase__btn book-purchase__btn--primary"
          :disabled="paying"
          @click="confirmPurchase"
        >
          {{ paying ? '购买中…' : '确认购买' }}
        </button>
        <button
          v-else
          type="button"
          class="book-purchase__btn book-purchase__btn--primary"
          @click="goRecharge"
        >
          去充值
        </button>
      </footer>
    </div>
  </el-dialog>
</template>

<style scoped>
.book-purchase__header {
  margin-bottom: 20px;
}

.book-purchase__title {
  margin: 0 0 6px;
  font-size: 20px;
  font-weight: 700;
  color: var(--sanko-text);
}

.book-purchase__subtitle {
  margin: 0;
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.book-purchase__book {
  display: flex;
  gap: 16px;
  padding: 16px;
  margin-bottom: 16px;
  border-radius: 8px;
  background: #f5f0e8;
}

.book-purchase__cover {
  flex-shrink: 0;
  width: 72px;
  height: 96px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 4px;
  color: #1a1a1a;
  font-size: 18px;
  font-weight: 700;
  writing-mode: vertical-rl;
  letter-spacing: 2px;
}

.book-purchase__name {
  margin: 0 0 4px;
  font-size: 16px;
  font-weight: 700;
}

.book-purchase__author,
.book-purchase__category {
  margin: 0 0 2px;
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.book-purchase__price-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 0;
  border-bottom: 1px solid #eee;
}

.book-purchase__label {
  font-size: 14px;
  color: var(--sanko-text-secondary);
}

.book-purchase__price {
  font-size: 22px;
  font-weight: 700;
  color: #e8a317;
}

.book-purchase__balance {
  font-size: 18px;
  font-weight: 600;
  color: var(--sanko-green);
}

.book-purchase__balance--low {
  color: #e74c3c;
}

.book-purchase__hint {
  margin: 12px 0 0;
  font-size: 13px;
  color: #e74c3c;
  text-align: center;
}

.book-purchase__footer {
  display: flex;
  gap: 12px;
  margin-top: 24px;
}

.book-purchase__btn {
  flex: 1;
  padding: 11px 16px;
  border-radius: 999px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  border: none;
}

.book-purchase__btn--ghost {
  background: #eee;
  color: var(--sanko-text);
}

.book-purchase__btn--primary {
  background: var(--sanko-green);
  color: #fff;
}

.book-purchase__btn--primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>

<style>
.book-purchase-dialog.el-dialog {
  border-radius: 12px;
  padding: 24px;
}

.book-purchase-dialog .el-dialog__header {
  display: none;
}

.book-purchase-dialog .el-dialog__body {
  padding: 0;
}
</style>
