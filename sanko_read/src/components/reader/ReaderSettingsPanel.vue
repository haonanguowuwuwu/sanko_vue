<script setup lang="ts">

import { computed, ref, watch } from 'vue'

import { Close } from '@element-plus/icons-vue'

import { configService } from '@/reader/configService'

import {

  DEFAULT_READER_SETTINGS,

  getBackgroundPresetsForFormat,

  isPaginatedTextFormat,

  isPdfFormat,

  loadReaderSettings,

  normalizeSettingsForFormat,

  supportsReaderTextStyles,

  type ReaderMode,

  type ReaderSettings,

} from '@/reader/readerSettings'



const props = defineProps<{

  visible: boolean

  format: string

}>()



const emit = defineEmits<{

  'update:visible': [value: boolean]

  apply: [reload: boolean]

}>()



const settings = ref<ReaderSettings>(loadReaderSettings())

const readerModeBeforeEdit = ref<ReaderMode>(settings.value.readerMode)



const textStylesSupported = computed(() => supportsReaderTextStyles(props.format))

const pdfFormat = computed(() => isPdfFormat(props.format))

const paginatedTextFormat = computed(() => isPaginatedTextFormat(props.format))

const backgroundPresets = computed(() => getBackgroundPresetsForFormat(props.format))

const showPageModeSettings = computed(() => !pdfFormat.value)



function loadSettingsForFormat() {

  settings.value = normalizeSettingsForFormat(loadReaderSettings(), props.format)

  readerModeBeforeEdit.value = settings.value.readerMode

}



watch(

  () => props.visible,

  (open) => {

    if (open) {

      loadSettingsForFormat()

    }

  },

)



watch(

  () => props.format,

  () => {

    if (props.visible) {

      loadSettingsForFormat()

    }

  },

)



function closePanel() {

  emit('update:visible', false)

}



function resetDefaults() {

  settings.value = normalizeSettingsForFormat({ ...DEFAULT_READER_SETTINGS }, props.format)

  commitSettings()

}



function commitSettings() {

  settings.value = normalizeSettingsForFormat(settings.value, props.format)

  configService.applySettings(settings.value)

  const reload = readerModeBeforeEdit.value !== settings.value.readerMode

  readerModeBeforeEdit.value = settings.value.readerMode

  emit('apply', reload)

}



watch(

  () => settings.value.fontSize,

  () => {

    if (!textStylesSupported.value) return

    commitSettings()

  },

)



watch(

  () => settings.value.lineHeight,

  () => {

    if (!textStylesSupported.value) return

    commitSettings()

  },

)



watch(

  () => settings.value.isIndent,

  () => {

    if (!textStylesSupported.value) return

    commitSettings()

  },

)



watch(

  () => settings.value.backgroundColor,

  () => {

    commitSettings()

  },

)



watch(

  () => settings.value.readerMode,

  () => {

    if (!showPageModeSettings.value) return

    commitSettings()

  },

)



function selectBackground(color: string) {

  settings.value.backgroundColor = color

  commitSettings()

}

</script>



<template>

  <Transition name="reader-settings">

    <aside v-if="visible" class="reader-settings" role="dialog" aria-label="阅读设置">

      <header class="reader-settings__header">

        <h2 class="reader-settings__title">阅读设置</h2>

        <button type="button" class="reader-settings__close" aria-label="关闭" @click="closePanel">

          <el-icon><Close /></el-icon>

        </button>

      </header>



      <div class="reader-settings__body">

        <p v-if="pdfFormat" class="reader-settings__hint">

          PDF 固定为滚动浏览，请上下滑动阅读；字号与行距不适用，可调整背景色。

        </p>

        <p v-else-if="!textStylesSupported" class="reader-settings__hint">

          当前为 {{ format.toUpperCase() }} 格式，部分排版选项可能不适用。

        </p>



        <section v-if="textStylesSupported" class="reader-settings__section">

          <label class="reader-settings__label">字号</label>

          <el-slider v-model="settings.fontSize" :min="12" :max="28" :step="1" show-input />

        </section>



        <section v-if="textStylesSupported" class="reader-settings__section">

          <label class="reader-settings__label">行距</label>

          <el-slider

            v-model="settings.lineHeight"

            :min="1.2"

            :max="3"

            :step="0.1"

            show-input

          />

        </section>



        <section v-if="textStylesSupported" class="reader-settings__section">

          <label class="reader-settings__label">段首缩进</label>

          <el-switch v-model="settings.isIndent" active-text="开启" inactive-text="关闭" />

        </section>



        <section class="reader-settings__section">

          <label class="reader-settings__label">背景色</label>

          <div class="reader-settings__swatches">

            <button

              v-for="preset in backgroundPresets"

              :key="preset.value"

              type="button"

              class="reader-settings__swatch"

              :class="{ 'is-active': settings.backgroundColor === preset.value }"

              :style="{ backgroundColor: preset.value }"

              :title="preset.label"

              @click="selectBackground(preset.value)"

            />

          </div>

        </section>



        <section v-if="showPageModeSettings" class="reader-settings__section">

          <label class="reader-settings__label">翻页模式</label>

          <el-radio-group v-model="settings.readerMode" class="reader-settings__modes">

            <el-radio label="double">双页</el-radio>

            <el-radio label="single">单页</el-radio>

            <el-radio v-if="!paginatedTextFormat" label="scroll">滚动</el-radio>

          </el-radio-group>

          <p class="reader-settings__note">切换翻页模式将重新加载当前书籍。</p>

        </section>



        <el-button class="reader-settings__reset" text type="primary" @click="resetDefaults">

          恢复默认

        </el-button>

        <p v-if="pdfFormat" class="reader-settings__tip">

          温馨提示：纯图片扫描的 PDF 无法选中文字，因此不能使用高亮与笔记功能。

        </p>

      </div>

    </aside>

  </Transition>

</template>



<style scoped>

.reader-settings {

  position: fixed;

  top: 0;

  right: 0;

  z-index: 60;

  width: min(360px, 92vw);

  height: 100vh;

  background: #fff;

  border-left: 1px solid #e0d8cc;

  box-shadow: -8px 0 24px rgba(0, 0, 0, 0.06);

  display: flex;

  flex-direction: column;

}



.reader-settings__header {

  display: flex;

  align-items: center;

  justify-content: space-between;

  padding: 16px 20px;

  border-bottom: 1px solid #eee6da;

}



.reader-settings__title {

  margin: 0;

  font-size: 16px;

  font-weight: 600;

  color: var(--sanko-text);

}



.reader-settings__close {

  border: none;

  background: none;

  cursor: pointer;

  color: var(--sanko-text-secondary);

  display: flex;

  padding: 4px;

}



.reader-settings__body {

  flex: 1;

  overflow-y: auto;

  padding: 20px;

}



.reader-settings__hint,

.reader-settings__note {

  margin: 0 0 16px;

  font-size: 12px;

  line-height: 1.6;

  color: var(--sanko-text-secondary);

}

.reader-settings__tip {

  margin: 8px 0 0;

  font-size: 12px;

  line-height: 1.6;

  color: #b88230;

}



.reader-settings__section {

  margin-bottom: 24px;

}



.reader-settings__label {

  display: block;

  margin-bottom: 10px;

  font-size: 13px;

  font-weight: 500;

  color: var(--sanko-text);

}



.reader-settings__swatches {

  display: flex;

  flex-wrap: wrap;

  gap: 10px;

}



.reader-settings__swatch {

  width: 36px;

  height: 36px;

  border-radius: 8px;

  border: 2px solid transparent;

  cursor: pointer;

  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.08);

}



.reader-settings__swatch.is-active {

  border-color: var(--sanko-green);

}



.reader-settings__modes {

  display: flex;

  flex-direction: column;

  align-items: flex-start;

  gap: 8px;

}



.reader-settings__reset {

  margin-top: 8px;

}



.reader-settings-enter-active,

.reader-settings-leave-active {

  transition:

    transform 0.22s ease,

    opacity 0.22s ease;

}



.reader-settings-enter-from,

.reader-settings-leave-to {

  transform: translateX(100%);

  opacity: 0;

}

</style>


