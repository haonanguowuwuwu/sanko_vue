<script setup lang="ts">
import { computed, reactive, ref, watch, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import BookReviewDrawer from '@/components/books/BookReviewDrawer.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { useAdminDataStore } from '@/stores/adminData'
import type { AdminBook, BookStatus } from '@/types/modules'

const store = useAdminDataStore()
const route = useRoute()

const keyword = ref('')
const searchKeyword = ref('')
const activeTab = ref<BookStatus | 'all'>('approved')
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)
const reviewBookId = ref<string | null>(null)

const form = reactive({
  title: '',
  author: '',
  category: '',
  purchaseType: '免费',
})

const statusLabel: Record<BookStatus, string> = {
  pending: '待审核',
  approved: '已上架',
  rejected: '已驳回',
  offline: '已下架',
}

const statusTagType: Record<BookStatus, 'warning' | 'success' | 'danger' | 'info'> = {
  pending: 'warning',
  approved: 'success',
  rejected: 'danger',
  offline: 'info',
}

const filteredList = computed(() => store.filterBooks(searchKeyword.value, activeTab.value))
const { page, total, pagedList, resetPage } = useClientPagination(filteredList)

const pendingCount = computed(() => store.pendingBookCount)

watch([keyword, activeTab], () => {
  if (!keyword.value) searchKeyword.value = ''
  resetPage()
})

const handleSearch = () => {
  searchKeyword.value = keyword.value
  resetPage()
}

const openReview = (row: AdminBook) => {
  reviewBookId.value = row.id
}

const closeReview = () => {
  reviewBookId.value = null
}

const onReviewUpdated = () => {
  resetPage()
}

const openCreate = () => {
  editingId.value = null
  form.title = ''
  form.author = ''
  form.category = ''
  form.purchaseType = '免费'
  dialogVisible.value = true
}

const openEdit = (row: AdminBook) => {
  editingId.value = row.id
  form.title = row.title
  form.author = row.author
  form.category = row.category
  form.purchaseType = row.purchaseType
  dialogVisible.value = true
}

const submitForm = () => {
  if (!form.title.trim() || !form.author.trim()) {
    ElMessage.warning('请填写书名和作者')
    return
  }
  const payload = {
    title: form.title.trim(),
    author: form.author.trim(),
    category: form.category.trim() || '未分类',
    purchaseType: form.purchaseType,
  }
  if (editingId.value) {
    store.updateBook(editingId.value, payload)
    ElMessage.success('书籍已更新')
  } else {
    store.createBook(payload)
    ElMessage.success('书籍已创建')
  }
  dialogVisible.value = false
  resetPage()
}

const handleOffline = async (row: AdminBook) => {
  try {
    await ElMessageBox.confirm(`确定下架《${row.title}》？`, '下架书籍', { type: 'warning' })
    store.setBookStatus(row.id, 'offline')
    ElMessage.success('已下架')
    resetPage()
  } catch {
    // cancelled
  }
}

onMounted(() => {
  if (route.query.tab === 'pending') {
    activeTab.value = 'pending'
  }
})
</script>

<template>
  <div class="list-page">
    <PageHeader title="书籍管理" description="管理书城书籍，审核用户上传内容">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建书籍</el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="list-page__card">
      <el-tabs v-model="activeTab" @tab-change="resetPage">
        <el-tab-pane label="已上架" name="approved" />
        <el-tab-pane name="pending">
          <template #label>
            待审核
            <el-badge v-if="pendingCount > 0" :value="pendingCount" class="tab-badge" />
          </template>
        </el-tab-pane>
        <el-tab-pane label="已驳回" name="rejected" />
        <el-tab-pane label="已下架" name="offline" />
      </el-tabs>

      <div class="list-page__toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索书名 / 作者"
          clearable
          style="width: 280px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <el-table :data="pagedList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="90" />
        <el-table-column prop="title" label="书名" min-width="130" show-overflow-tooltip />
        <el-table-column prop="author" label="作者" width="100" />
        <el-table-column prop="category" label="分类" width="90" />
        <el-table-column prop="format" label="格式" width="70" />
        <el-table-column prop="fileSize" label="大小" width="90" />
        <el-table-column v-if="activeTab === 'pending'" prop="uploader" label="上传者" width="100" />
        <el-table-column prop="status" label="状态" width="90">
          <template #default="{ row }">
            <el-tag :type="statusTagType[row.status as BookStatus]" size="small">
              {{ statusLabel[row.status as BookStatus] }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column
          v-if="activeTab === 'rejected'"
          prop="rejectReason"
          label="驳回原因"
          min-width="140"
          show-overflow-tooltip
        />
        <el-table-column prop="updatedAt" label="更新时间" width="110" />
        <el-table-column label="操作" width="200" fixed="right">
          <template #default="{ row }">
            <el-button
              v-if="row.status === 'pending'"
              link
              type="primary"
              @click="openReview(row)"
            >
              审核
            </el-button>
            <el-button v-else link type="primary" @click="openReview(row)">查看</el-button>
            <template v-if="row.status === 'approved'">
              <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
              <el-button link type="danger" @click="handleOffline(row)">下架</el-button>
            </template>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-if="total === 0" description="暂无数据" />

      <div v-if="total > 0" class="list-page__footer">
        <el-pagination
          v-model:current-page="page"
          background
          layout="total, prev, pager, next"
          :total="total"
        />
      </div>
    </el-card>

    <BookReviewDrawer
      :book-id="reviewBookId"
      @close="closeReview"
      @updated="onReviewUpdated"
    />

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑书籍' : '新建书籍'"
      width="480px"
      destroy-on-close
    >
      <el-form label-width="72px">
        <el-form-item label="书名" required>
          <el-input v-model="form.title" />
        </el-form-item>
        <el-form-item label="作者" required>
          <el-input v-model="form.author" />
        </el-form-item>
        <el-form-item label="分类">
          <el-input v-model="form.category" placeholder="如：科幻、文学" />
        </el-form-item>
        <el-form-item label="属性">
          <el-select v-model="form.purchaseType" style="width: 100%">
            <el-option label="免费" value="免费" />
            <el-option label="积分" value="积分" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="submitForm">确定</el-button>
      </template>
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

.tab-badge {
  margin-left: 6px;
  vertical-align: middle;
}
</style>
