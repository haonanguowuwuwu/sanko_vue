<script setup lang="ts">
import { reactive } from 'vue'
import { ElMessage } from 'element-plus'
import PageHeader from '@/components/PageHeader.vue'
import { useAdminDataStore } from '@/stores/adminData'

const store = useAdminDataStore()

const settings = reactive({ ...store.data.settings })

const saveSettings = () => {
  store.saveSettings({ ...settings })
  ElMessage.success('设置已保存')
}

const publishAnnouncement = () => {
  settings.announcementEnabled = true
  store.saveSettings({ ...settings })
  ElMessage.success('公告已发布')
}
</script>

<template>
  <div class="settings-page">
    <PageHeader title="系统设置" description="管理平台全局配置与公告" />

    <el-row :gutter="16">
      <el-col :xs="24" :lg="14">
        <el-card shadow="never" class="settings-card">
          <template #header>基本设置</template>
          <el-form label-width="120px" label-position="left">
            <el-form-item label="站点名称">
              <el-input v-model="settings.siteName" />
            </el-form-item>
            <el-form-item label="维护模式">
              <el-switch v-model="settings.maintenanceMode" />
            </el-form-item>
            <el-form-item label="开放注册">
              <el-switch v-model="settings.allowRegister" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="saveSettings">保存设置</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>

      <el-col :xs="24" :lg="10">
        <el-card shadow="never" class="settings-card">
          <template #header>公告管理</template>
          <el-form label-width="80px" label-position="left">
            <el-form-item label="启用">
              <el-switch v-model="settings.announcementEnabled" />
            </el-form-item>
            <el-form-item label="标题">
              <el-input v-model="settings.announcementTitle" />
            </el-form-item>
            <el-form-item label="内容">
              <el-input v-model="settings.announcementContent" type="textarea" :rows="5" />
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="publishAnnouncement">发布公告</el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<style scoped>
.settings-card {
  border: 1px solid var(--admin-border);
  margin-bottom: 16px;
}
</style>
