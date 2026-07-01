<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Search } from '@element-plus/icons-vue'
import PageHeader from '@/components/PageHeader.vue'
import { useClientPagination } from '@/composables/useClientPagination'
import { useAdminDataStore } from '@/stores/adminData'
import type { AdminUser } from '@/types/modules'

const store = useAdminDataStore()

const keyword = ref('')
const searchKeyword = ref('')
const dialogVisible = ref(false)
const editingId = ref<string | null>(null)

const form = reactive({ username: '', email: '' })

const filteredList = computed(() => store.filterUsers(searchKeyword.value))
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

const openCreate = () => {
  editingId.value = null
  form.username = ''
  form.email = ''
  dialogVisible.value = true
}

const openEdit = (row: AdminUser) => {
  editingId.value = row.id
  form.username = row.username
  form.email = row.email
  dialogVisible.value = true
}

const submitForm = () => {
  if (!form.username.trim()) {
    ElMessage.warning('请输入用户名')
    return
  }
  if (!form.email.trim()) {
    ElMessage.warning('请输入邮箱')
    return
  }
  if (editingId.value) {
    store.updateUser(editingId.value, { username: form.username, email: form.email })
    ElMessage.success('用户已更新')
  } else {
    store.createUser({ username: form.username, email: form.email })
    ElMessage.success('用户已创建')
  }
  dialogVisible.value = false
  resetPage()
}

const handleToggleStatus = async (row: AdminUser) => {
  const action = row.status === '正常' ? '禁用' : '启用'
  try {
    await ElMessageBox.confirm(`确定${action}用户「${row.username}」？`, `${action}用户`, {
      type: 'warning',
    })
    store.toggleUserStatus(row.id)
    ElMessage.success(`已${action}`)
  } catch {
    // cancelled
  }
}
</script>

<template>
  <div class="list-page">
    <PageHeader title="用户管理" description="管理平台注册用户">
      <template #extra>
        <el-button type="primary" :icon="Plus" @click="openCreate">新建用户</el-button>
      </template>
    </PageHeader>

    <el-card shadow="never" class="list-page__card">
      <div class="list-page__toolbar">
        <el-input
          v-model="keyword"
          placeholder="搜索用户名 / 邮箱"
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
        <el-table-column prop="username" label="用户名" min-width="120" />
        <el-table-column prop="email" label="邮箱" min-width="180" />
        <el-table-column prop="registeredAt" label="注册时间" width="120" />
        <el-table-column prop="status" label="状态" width="100">
          <template #default="{ row }">
            <el-tag :type="row.status === '正常' ? 'success' : 'danger'" size="small">
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="160" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" @click="openEdit(row)">编辑</el-button>
            <el-button
              link
              :type="row.status === '正常' ? 'danger' : 'success'"
              @click="handleToggleStatus(row)"
            >
              {{ row.status === '正常' ? '禁用' : '启用' }}
            </el-button>
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

    <el-dialog
      v-model="dialogVisible"
      :title="editingId ? '编辑用户' : '新建用户'"
      width="440px"
      destroy-on-close
    >
      <el-form label-width="72px">
        <el-form-item label="用户名" required>
          <el-input v-model="form.username" placeholder="请输入用户名" />
        </el-form-item>
        <el-form-item label="邮箱" required>
          <el-input v-model="form.email" placeholder="请输入邮箱" />
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
</style>
