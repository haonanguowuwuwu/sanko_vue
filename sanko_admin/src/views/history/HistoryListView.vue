<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { useAdminDataStore } from '@/stores/adminData'
import type { AuditLog, ReadingHistory } from '@/types/modules'

const store = useAdminDataStore()

const keyword = ref('')
const searchKeyword = ref('')
const activeTab = ref('audit')
const auditType = ref<'all' | AuditLog['type']>('all')
const detailVisible = ref(false)
const detailTitle = ref('')
const detailContent = ref('')

const filteredReading = computed(() => store.filterReadingHistory(searchKeyword.value))
const filteredAudit = computed(() => store.filterAuditLogs(searchKeyword.value, auditType.value))

const readingPagination = useClientPagination(filteredReading)
const auditPagination = useClientPagination(filteredAudit)

watch([keyword, activeTab, auditType], () => {
  if (!keyword.value) searchKeyword.value = ''
  readingPagination.resetPage()
  auditPagination.resetPage()
})

const handleSearch = () => {
  searchKeyword.value = keyword.value
  readingPagination.resetPage()
  auditPagination.resetPage()
}

const currentPage = computed({
  get: () =>
    activeTab.value === 'reading'
      ? readingPagination.page.value
      : auditPagination.page.value,
  set: (v) => {
    if (activeTab.value === 'reading') readingPagination.page.value = v
    else auditPagination.page.value = v
  },
})

const currentTotal = computed(() =>
  activeTab.value === 'reading' ? readingPagination.total.value : auditPagination.total.value,
)

const currentReadingList = computed(() => readingPagination.pagedList.value)
const currentAuditList = computed(() => auditPagination.pagedList.value)

const openReadingDetail = (row: ReadingHistory) => {
  detailTitle.value = '阅读记录详情'
  detailContent.value = `用户 ${row.user} 在 ${row.time} 对《${row.book}》进行了「${row.action}」操作，进度 ${row.progress}。`
  detailVisible.value = true
}

const openAuditDetail = (row: AuditLog) => {
  detailTitle.value = row.action
  detailContent.value = `${row.detail}\n\n操作人：${row.operator}\n对象：${row.target}\n时间：${row.time}`
  detailVisible.value = true
}

const auditTypeLabel: Record<AuditLog['type'], string> = {
  file: '文件',
  book: '书籍条目',
}
</script>

<template>
  <div class="list-page">
    <PageHeader title="历史记录" description="操作日志与阅读历史（由系统自动记录，后台只读展示）" />

    <el-card shadow="never" class="list-page__card">
      <el-tabs v-model="activeTab">
        <el-tab-pane label="操作日志" name="audit" />
        <el-tab-pane label="阅读历史" name="reading" />
      </el-tabs>

      <div class="list-page__toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索关键词"
          clearable
          style="width: 280px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-select
          v-if="activeTab === 'audit'"
          v-model="auditType"
          style="width: 140px"
          @change="auditPagination.resetPage()"
        >
          <el-option label="全部类型" value="all" />
          <el-option label="文件操作" value="file" />
          <el-option label="书籍条目" value="book" />
        </el-select>
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <el-table v-if="activeTab === 'audit'" :data="currentAuditList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="type" label="类型" width="100">
          <template #default="{ row }">
            <el-tag size="small">{{ auditTypeLabel[row.type as AuditLog['type']] }}</el-tag>
          </template>
        </el-table-column>
        <el-table-column prop="target" label="对象" min-width="140" show-overflow-tooltip />
        <el-table-column prop="operator" label="操作人" width="110" />
        <el-table-column prop="action" label="操作" width="120" />
        <el-table-column prop="detail" label="详情" min-width="200" show-overflow-tooltip />
        <el-table-column prop="time" label="时间" width="160" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openAuditDetail(row)">详情</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-table v-else :data="currentReadingList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="book" label="书籍" min-width="140" />
        <el-table-column prop="action" label="行为" width="100" />
        <el-table-column prop="progress" label="进度" width="100" />
        <el-table-column prop="time" label="时间" min-width="160" />
        <el-table-column label="操作" width="80" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openReadingDetail(row)">详情</el-button>
          </template>
        </el-table-column>
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

    <el-dialog v-model="detailVisible" :title="detailTitle" width="480px">
      <p class="detail-text">{{ detailContent }}</p>
    </el-dialog>
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

.detail-text {
  margin: 0;
  white-space: pre-wrap;
  line-height: 1.7;
  color: var(--admin-text);
}
</style>
