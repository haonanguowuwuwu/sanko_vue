<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { useAdminDataStore } from '@/stores/adminData'

const store = useAdminDataStore()

const keyword = ref('')
const searchKeyword = ref('')
const activeTab = ref('records')

const filteredRecords = computed(() => store.filterPointRecords(searchKeyword.value))
const filteredOrders = computed(() => store.filterPointOrders(searchKeyword.value))

const recordPagination = useClientPagination(filteredRecords)
const orderPagination = useClientPagination(filteredOrders)

watch([keyword, activeTab], () => {
  if (!keyword.value) searchKeyword.value = ''
  recordPagination.resetPage()
  orderPagination.resetPage()
})

const handleSearch = () => {
  searchKeyword.value = keyword.value
  recordPagination.resetPage()
  orderPagination.resetPage()
}

const currentPage = computed({
  get: () => (activeTab.value === 'records' ? recordPagination.page.value : orderPagination.page.value),
  set: (v) => {
    if (activeTab.value === 'records') recordPagination.page.value = v
    else orderPagination.page.value = v
  },
})

const currentTotal = computed(() =>
  activeTab.value === 'records' ? recordPagination.total.value : orderPagination.total.value,
)

const currentList = computed(() =>
  activeTab.value === 'records' ? recordPagination.pagedList.value : orderPagination.pagedList.value,
)
</script>

<template>
  <div class="list-page">
    <PageHeader title="积分管理" description="查看积分变动与充值记录" />

    <el-card shadow="never" class="list-page__card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="积分流水" name="records" />
        <el-tab-pane label="充值订单" name="orders" />
      </el-tabs>

      <div class="list-page__toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户"
          clearable
          style="width: 280px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <el-table v-if="activeTab === 'records'" :data="currentList" stripe style="width: 100%">
        <el-table-column prop="id" label="流水号" width="100" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="type" label="类型" width="100" />
        <el-table-column prop="amount" label="变动" width="100">
          <template #default="{ row }">
            <span :class="row.amount.startsWith('+') ? 'amount--plus' : 'amount--minus'">
              {{ row.amount }}
            </span>
          </template>
        </el-table-column>
        <el-table-column prop="balance" label="余额" width="100" />
        <el-table-column prop="time" label="时间" min-width="160" />
      </el-table>

      <el-table v-else :data="currentList" stripe style="width: 100%">
        <el-table-column prop="id" label="订单号" width="100" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="amount" label="金额 (元)" width="100" />
        <el-table-column prop="method" label="支付方式" width="100" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '已完成' ? 'success' : 'warning'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="time" label="时间" min-width="160" />
      </el-table>

      <div class="list-page__footer">
        <el-pagination
          v-model:current-page="currentPage"
          background
          layout="total, prev, pager, next"
          :total="currentTotal"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
.list-page__card {
  border: 1px solid var(--admin-border);
}

.list-page__toolbar {
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
}

.list-page__footer {
  display: flex;
  justify-content: flex-end;
  margin-top: 16px;
}

.amount--plus {
  color: #52c41a;
  font-weight: 600;
}

.amount--minus {
  color: #ff4d4f;
  font-weight: 600;
}
</style>
