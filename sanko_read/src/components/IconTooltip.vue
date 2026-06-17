<script setup lang="ts">
defineProps<{
  content: string
  placement?: 'top' | 'bottom' | 'left' | 'right'
}>()
</script>

<template>
  <el-tooltip
    :content="content"
    :placement="placement ?? 'bottom'"
    popper-class="sanko-icon-tooltip"
  >
    <span class="icon-tooltip-trigger">
      <slot />
    </span>
  </el-tooltip>
</template>

<style scoped>
.icon-tooltip-trigger {
  display: inline-flex;
  align-items: center;
  justify-content: center;
}
</style>

<style>
.sanko-icon-tooltip.el-popper {
  background: #303133 !important;
  color: #fff !important;
  border: none !important;
  padding: 6px 12px !important;
  font-size: 13px !important;
  border-radius: 6px !important;
}

.sanko-icon-tooltip.el-popper .el-popper__arrow::before {
  background: #303133 !important;
  border: none !important;
}
</style>
