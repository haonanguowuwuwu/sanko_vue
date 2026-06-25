<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { ArrowDown } from '@element-plus/icons-vue'
import { fetchPointsOrders, fetchPointsSummary, rechargePoints } from '@/api/profile'
import { POINTS_RULES, RECHARGE_PRESETS, type PointsOrder, type PointsOrderType } from '@/types/profile'
import { useUserStore } from '@/stores/user'

type TabKey = 'overview' | 'recharge' | 'orders'
type FilterType = 'all' | PointsOrderType

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

const tabs: { key: TabKey; label: string }[] = [
  { key: 'overview', label: '积分总览' },
  { key: 'recharge', label: '充值中心' },
  { key: 'orders', label: '订单详情' },
]

const activeTab = ref<TabKey>('overview')
const summary = ref({ balance: 0, totalEarned: 0, totalUsed: 0 })
const orders = ref<PointsOrder[]>([])
const ordersTotal = ref(0)
const loading = ref(false)

const orderFilter = ref<FilterType>('all')
const currentPage = ref(1)
const pageSize = 10

const selectedAmount = ref<number | null>(null)
const customAmount = ref('')
const paymentMethod = ref<'wechat' | 'alipay'>('wechat')
const paying = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil(ordersTotal.value / pageSize)))

const typeLabel: Record<PointsOrderType, string> = {
  recharge: '充值',
  earn: '获得',
  use: '使用',
}

const syncTabFromRoute = () => {
  const tab = route.query.tab as TabKey | undefined
  if (tab && tabs.some((t) => t.key === tab)) {
    activeTab.value = tab
  }
}

const switchTab = (key: TabKey) => {
  activeTab.value = key
  router.replace({ query: { tab: key } })
}

const loadSummary = async () => {
  summary.value = await fetchPointsSummary()
}

const loadOrders = async () => {
  loading.value = true
  try {
    const result = await fetchPointsOrders({
      type: orderFilter.value,
      page: currentPage.value,
      pageSize,
    })
    orders.value = result.items
    ordersTotal.value = result.total
  } finally {
    loading.value = false
  }
}

const selectPreset = (amount: number) => {
  selectedAmount.value = amount
  customAmount.value = ''
}

const effectiveAmount = computed(() => {
  if (customAmount.value) {
    const n = parseInt(customAmount.value, 10)
    return Number.isInteger(n) && n > 0 ? n : null
  }
  return selectedAmount.value
})

const handlePay = async () => {
  const amount = effectiveAmount.value
  if (!amount) {
    ElMessage.warning('请选择或输入充值金额')
    return
  }
  paying.value = true
  try {
    await rechargePoints(amount, paymentMethod.value)
    ElMessage.success(`充值成功，获得 ${amount * 10} 积分`)
    selectedAmount.value = null
    customAmount.value = ''
    await loadSummary()
    if (activeTab.value === 'orders') await loadOrders()
  } catch (error) {
    const message = error instanceof Error ? error.message : '充值失败'
    ElMessage.error(message)
  } finally {
    paying.value = false
  }
}

const goRecharge = () => switchTab('recharge')

const changeFilter = (filter: FilterType) => {
  orderFilter.value = filter
  currentPage.value = 1
  void loadOrders()
}

const goPage = (page: number) => {
  if (page < 1 || page > totalPages.value) return
  currentPage.value = page
  void loadOrders()
}

watch(activeTab, (tab) => {
  if (tab === 'orders') void loadOrders()
})

watch(
  () => route.query.tab,
  () => syncTabFromRoute(),
)

onMounted(async () => {
  syncTabFromRoute()
  await loadSummary()
  if (activeTab.value === 'orders') await loadOrders()
})
</script>

<template>
  <div class="profile-points">
    <nav class="profile-points__tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        type="button"
        class="profile-points__tab"
        :class="{ 'profile-points__tab--active': activeTab === tab.key }"
        @click="switchTab(tab.key)"
      >
        {{ tab.label }}
      </button>
    </nav>

    <!-- 积分总览 -->
    <div v-if="activeTab === 'overview'" class="profile-points__panel">
      <div class="points-card">
        <div class="points-card__inner">
          <div class="points-card__info">
            <div class="points-card__title">{{ userStore.username }}的积分卡</div>
            <div class="points-card__balance">当前可用积分：{{ summary.balance }}</div>
            <button type="button" class="points-card__btn" @click="goRecharge">立即充值</button>
          </div>
          <div class="points-card__deco" aria-hidden="true">
            <span /><span /><span />
          </div>
        </div>
      </div>

      <section class="points-rules">
        <h3 class="points-rules__title">积分获取规则</h3>
        <p class="points-rules__text">{{ POINTS_RULES.earn }}</p>
      </section>

      <section class="points-rules">
        <h3 class="points-rules__title">积分消耗用途</h3>
        <p class="points-rules__text">{{ POINTS_RULES.use }}</p>
      </section>
    </div>

    <!-- 充值中心 -->
    <div v-else-if="activeTab === 'recharge'" class="profile-points__panel">
      <div class="recharge-header">
        <h2 class="recharge-header__title">充值中心</h2>
        <span class="recharge-header__rate">1元=10积分</span>
      </div>

      <div class="recharge-presets">
        <button
          v-for="preset in RECHARGE_PRESETS"
          :key="preset.amount"
          type="button"
          class="recharge-preset"
          :class="{ 'recharge-preset--active': selectedAmount === preset.amount && !customAmount }"
          :style="{ background: preset.color }"
          @click="selectPreset(preset.amount)"
        >
          {{ preset.amount }}元
        </button>
      </div>

      <div class="recharge-custom">
        <label class="recharge-custom__label">自选金额：</label>
        <input
          v-model="customAmount"
          type="text"
          inputmode="numeric"
          class="recharge-custom__input"
          placeholder="请输入正整数"
          @input="selectedAmount = null"
        />
      </div>

      <div class="recharge-methods">
        <button
          type="button"
          class="recharge-method"
          :class="{ 'recharge-method--active': paymentMethod === 'wechat' }"
          @click="paymentMethod = 'wechat'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#07c160" />
            <path
              fill="#fff"
              d="M8.5 10.5c-.6 0-1.1.5-1.1 1.1s.5 1.1 1.1 1.1 1.1-.5 1.1-1.1-.5-1.1-1.1-1.1zm7 0c-.6 0-1.1.5-1.1 1.1s.5 1.1 1.1 1.1 1.1-.5 1.1-1.1-.5-1.1-1.1-1.1zM12 7c-2.8 0-5.2 1.4-6.5 3.5.9 1.8 2.8 3 5 3 .5 0 1-.1 1.5-.2 1.2.8 2.6 1.2 4 1.2 1.1 0 2.1-.2 3-.6C18 10.5 15.2 7 12 7z"
            />
          </svg>
          微信支付
        </button>
        <button
          type="button"
          class="recharge-method"
          :class="{ 'recharge-method--active': paymentMethod === 'alipay' }"
          @click="paymentMethod = 'alipay'"
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <circle cx="12" cy="12" r="10" fill="#1677ff" />
            <text x="12" y="16" text-anchor="middle" fill="#fff" font-size="10" font-weight="700">
              支
            </text>
          </svg>
          支付宝支付
        </button>
      </div>

      <button
        type="button"
        class="recharge-submit"
        :disabled="paying"
        @click="handlePay"
      >
        确定支付
      </button>
    </div>

    <!-- 订单详情 -->
    <div v-else class="profile-points__panel profile-points__panel--orders">
      <div class="orders-stats">
        <div class="orders-stat">
          <span class="orders-stat__label">当前积分</span>
          <span class="orders-stat__value orders-stat__value--green">{{ summary.balance }}</span>
        </div>
        <div class="orders-stat">
          <span class="orders-stat__label">累计获得</span>
          <span class="orders-stat__value orders-stat__value--blue">{{ summary.totalEarned }}</span>
        </div>
        <div class="orders-stat">
          <span class="orders-stat__label">累计使用</span>
          <span class="orders-stat__value orders-stat__value--red">{{ summary.totalUsed }}</span>
        </div>
      </div>

      <div class="orders-toolbar">
        <div class="orders-filters">
          <button
            v-for="f in (['all', 'earn', 'use', 'recharge'] as FilterType[])"
            :key="f"
            type="button"
            class="orders-filter"
            :class="{ 'orders-filter--active': orderFilter === f }"
            @click="changeFilter(f)"
          >
            {{ f === 'all' ? '全部' : typeLabel[f] }}
          </button>
        </div>
        <div class="orders-date">
          时间范围：2026-06-01 - 至今
          <el-icon :size="12"><ArrowDown /></el-icon>
        </div>
      </div>

      <div v-loading="loading" class="orders-table-wrap">
        <table class="orders-table">
          <thead>
            <tr>
              <th>订单编号</th>
              <th>时间</th>
              <th>类型</th>
              <th>变动积分</th>
              <th>余额</th>
              <th>来源/用途</th>
              <th>状态</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in orders" :key="order.id">
              <td>{{ order.id }}</td>
              <td>{{ order.time }}</td>
              <td>{{ typeLabel[order.type] }}</td>
              <td
                :class="{
                  'orders-change--pos': order.change > 0,
                  'orders-change--neg': order.change < 0,
                }"
              >
                {{ order.change > 0 ? '+' : '' }}{{ order.change }}
              </td>
              <td>{{ order.balance }}</td>
              <td>{{ order.description }}</td>
              <td class="orders-status">已完成</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="totalPages > 1" class="orders-pagination">
        <button type="button" class="orders-page-btn" @click="goPage(currentPage - 1)">‹</button>
        <button
          v-for="p in Math.min(totalPages, 3)"
          :key="p"
          type="button"
          class="orders-page-btn"
          :class="{ 'orders-page-btn--active': currentPage === p }"
          @click="goPage(p)"
        >
          {{ p }}
        </button>
        <span v-if="totalPages > 4" class="orders-page-ellipsis">…</span>
        <button
          v-if="totalPages > 3"
          type="button"
          class="orders-page-btn"
          :class="{ 'orders-page-btn--active': currentPage === totalPages }"
          @click="goPage(totalPages)"
        >
          {{ totalPages }}
        </button>
        <button type="button" class="orders-page-btn" @click="goPage(currentPage + 1)">›</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.profile-points {
  max-width: 960px;
  margin: 0 auto;
}

.profile-points__tabs {
  display: flex;
  gap: 32px;
  padding: 0 8px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--sanko-border);
}

.profile-points__tab {
  padding: 12px 4px;
  border: none;
  background: none;
  font-size: 15px;
  font-weight: 500;
  color: var(--sanko-text-secondary);
  cursor: pointer;
  position: relative;
}

.profile-points__tab--active {
  color: var(--sanko-green);
  font-weight: 600;
}

.profile-points__tab--active::after {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  bottom: -1px;
  height: 2px;
  background: var(--sanko-green);
}

.profile-points__panel {
  background: #fff;
  border: 1px solid var(--sanko-border);
  border-radius: 12px;
  padding: 32px 40px;
}

.profile-points__panel--orders {
  padding: 24px 28px;
}

/* 积分卡 */
.points-card {
  display: flex;
  justify-content: center;
  margin-bottom: 32px;
}

.points-card__inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  max-width: 520px;
  padding: 28px 32px;
  border-radius: 16px;
  background: linear-gradient(135deg, #d4e8c8 0%, #c8dcc0 100%);
  position: relative;
  overflow: hidden;
}

.points-card__title {
  font-size: 15px;
  font-weight: 600;
  color: var(--sanko-text);
  margin-bottom: 12px;
}

.points-card__balance {
  font-size: 16px;
  font-weight: 600;
  color: var(--sanko-text);
  margin-bottom: 16px;
}

.points-card__btn {
  padding: 8px 24px;
  border: none;
  border-radius: 999px;
  background: #1a8a8f;
  color: #fff;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
}

.points-card__btn:hover {
  background: #157579;
}

.points-card__deco {
  display: flex;
  gap: -8px;
  flex-shrink: 0;
}

.points-card__deco span {
  display: block;
  width: 48px;
  height: 48px;
  border-radius: 50%;
  margin-left: -12px;
}

.points-card__deco span:nth-child(1) {
  background: rgba(0, 90, 43, 0.25);
}

.points-card__deco span:nth-child(2) {
  background: rgba(0, 90, 43, 0.4);
}

.points-card__deco span:nth-child(3) {
  background: rgba(0, 90, 43, 0.55);
}

.points-rules {
  margin-bottom: 20px;
}

.points-rules__title {
  margin: 0 0 8px;
  font-size: 15px;
  font-weight: 600;
  color: var(--sanko-green);
}

.points-rules__text {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
  color: var(--sanko-text-secondary);
}

/* 充值中心 */
.recharge-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 28px;
}

.recharge-header__title {
  margin: 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--sanko-text);
}

.recharge-header__rate {
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.recharge-presets {
  display: flex;
  gap: 16px;
  margin-bottom: 24px;
  flex-wrap: wrap;
}

.recharge-preset {
  flex: 1;
  min-width: 80px;
  max-width: 120px;
  height: 100px;
  border: 2px solid transparent;
  border-radius: 12px;
  font-size: 16px;
  font-weight: 600;
  color: var(--sanko-text);
  cursor: pointer;
  transition: border-color 0.15s;
}

.recharge-preset--active {
  border-color: var(--sanko-green);
}

.recharge-custom {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 28px;
}

.recharge-custom__label {
  font-size: 14px;
  color: var(--sanko-text);
  white-space: nowrap;
}

.recharge-custom__input {
  flex: 1;
  max-width: 280px;
  padding: 10px 14px;
  border: 1px solid var(--sanko-border);
  border-radius: 8px;
  font-size: 14px;
  background: var(--sanko-search-bg);
  outline: none;
}

.recharge-custom__input:focus {
  border-color: var(--sanko-green);
}

.recharge-methods {
  display: flex;
  gap: 16px;
  margin-bottom: 32px;
}

.recharge-method {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 24px;
  border: 1px solid var(--sanko-border);
  border-radius: 8px;
  background: #fff;
  font-size: 14px;
  cursor: pointer;
}

.recharge-method--active {
  border-color: var(--sanko-green);
  background: rgba(0, 90, 43, 0.04);
}

.recharge-submit {
  display: block;
  width: 100%;
  max-width: 360px;
  margin: 0 auto;
  padding: 12px;
  border: none;
  border-radius: 999px;
  background: var(--sanko-green);
  color: #fff;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
}

.recharge-submit:hover:not(:disabled) {
  background: var(--sanko-green-hover);
}

.recharge-submit:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 订单详情 */
.orders-stats {
  display: flex;
  gap: 48px;
  margin-bottom: 24px;
  padding-bottom: 20px;
  border-bottom: 1px solid var(--sanko-border);
}

.orders-stat {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.orders-stat__label {
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.orders-stat__value {
  font-size: 28px;
  font-weight: 700;
}

.orders-stat__value--green {
  color: var(--sanko-green);
}

.orders-stat__value--blue {
  color: #1a5fb4;
}

.orders-stat__value--red {
  color: #c0392b;
}

.orders-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
  flex-wrap: wrap;
  gap: 12px;
}

.orders-filters {
  display: flex;
  gap: 8px;
}

.orders-filter {
  padding: 6px 16px;
  border: 1px solid var(--sanko-border);
  border-radius: 999px;
  background: #fff;
  font-size: 13px;
  color: var(--sanko-text);
  cursor: pointer;
}

.orders-filter--active {
  background: var(--sanko-green);
  border-color: var(--sanko-green);
  color: #fff;
}

.orders-date {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: var(--sanko-text-secondary);
}

.orders-table-wrap {
  overflow-x: auto;
  min-height: 200px;
}

.orders-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.orders-table th {
  padding: 10px 8px;
  text-align: left;
  font-weight: 600;
  color: var(--sanko-text);
  border-bottom: 1px solid var(--sanko-border);
  white-space: nowrap;
}

.orders-table td {
  padding: 12px 8px;
  border-bottom: 1px solid #f0f0f0;
  color: var(--sanko-text);
}

.orders-change--pos {
  color: var(--sanko-green);
  font-weight: 600;
}

.orders-change--neg {
  color: #c0392b;
  font-weight: 600;
}

.orders-status {
  color: var(--sanko-green);
}

.orders-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  margin-top: 20px;
}

.orders-page-btn {
  min-width: 32px;
  height: 32px;
  padding: 0 8px;
  border: 1px solid var(--sanko-border);
  border-radius: 4px;
  background: #fff;
  font-size: 13px;
  cursor: pointer;
}

.orders-page-btn--active {
  background: var(--sanko-green);
  border-color: var(--sanko-green);
  color: #fff;
}

.orders-page-ellipsis {
  padding: 0 4px;
  color: var(--sanko-text-secondary);
}
</style>
