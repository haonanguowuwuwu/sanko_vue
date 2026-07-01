<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { useAdminDataStore } from '@/stores/adminData'
import type { AdminComment } from '@/types/modules'

const store = useAdminDataStore()

const keyword = ref('')
const searchKeyword = ref('')
const detailVisible = ref(false)
const currentComment = ref<AdminComment | null>(null)

const filteredList = computed(() => store.filterComments(searchKeyword.value))
const { page, total, pagedList, resetPage } = useClientPagination(filteredList)

watch(keyword, () => {
  if (!keyword.value) {
    searchKeyword.value = ''
    resetPage()
  }
})

const handleSearch = () => {
  searchKeyword.value = keyword.value
  resetPage()
}

const openDetail = (row: AdminComment) => {
  currentComment.value = row
  detailVisible.value = true
}

const handleDelete = async (row: AdminComment) => {
  try {
    await ElMessageBox.confirm('确定删除这条评论？此操作不可恢复。', '删除评论', {
      type: 'warning',
    })
    store.deleteComment(row.id)
    ElMessage.success('评论已删除')
    resetPage()
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="list-page">
    <PageHeader title="评论管理" description="审核与管理用户评论" />

    <el-card shadow="never" class="list-page__card">
      <div class="list-page__toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户 / 书籍 / 内容"
          clearable
          style="width: 280px"
          :prefix-icon="Search"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        />
        <el-button type="primary" @click="handleSearch">搜索</el-button>
      </div>

      <el-table :data="pagedList" stripe style="width: 100%">
        <el-table-column prop="id" label="ID" width="100" />
        <el-table-column prop="user" label="用户" width="120" />
        <el-table-column prop="book" label="所属书籍" width="120" />
        <el-table-column prop="content" label="内容" min-width="200" show-overflow-tooltip />
        <el-table-column prop="likes" label="点赞" width="80" />
        <el-table-column prop="reported" label="举报" width="80">
          <template #default="{ row }">
            <el-tag v-if="row.reported > 0" type="danger" size="small">{{ row.reported }}</el-tag>
            <span v-else>0</span>
          </template>
        </el-table-column>
        <el-table-column prop="date" label="日期" width="120" />
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openDetail(row)">查看</el-button>
            <el-button link type="danger" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="list-page__footer">
        <el-pagination
          v-model:current-page="page"
          background
          layout="total, prev, pager, next"
          :total="total"
        />
      </div>
    </el-card>

    <el-dialog v-model="detailVisible" title="评论详情" width="520px">
      <template v-if="currentComment">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="用户">{{ currentComment.user }}</el-descriptions-item>
          <el-descriptions-item label="书籍">{{ currentComment.book }}</el-descriptions-item>
          <el-descriptions-item label="日期">{{ currentComment.date }}</el-descriptions-item>
          <el-descriptions-item label="点赞">{{ currentComment.likes }}</el-descriptions-item>
          <el-descriptions-item label="举报">{{ currentComment.reported }}</el-descriptions-item>
          <el-descriptions-item label="内容">{{ currentComment.content }}</el-descriptions-item>
        </el-descriptions>
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
</style>
