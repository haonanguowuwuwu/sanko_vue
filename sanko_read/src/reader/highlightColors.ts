import type { HighlightColor } from '@/types/reader'

export interface HighlightColorDef {
  id: HighlightColor
  label: string
  /** 工具栏/弹窗色块 */
  swatch: string
  /** 阅读区高亮填充 */
  fill: string
  /** 弹窗竖条、确认按钮 */
  accent: string
  /** 笔记输入框背景 */
  inputBg: string
  /** 侧边栏高亮左边框 */
  border: string
  /** kookit 内置色索引 0–3 */
  kookitIndex: number
}

export const HIGHLIGHT_COLOR_OPTIONS: HighlightColorDef[] = [
  {
    id: 'blue',
    label: '淡蓝',
    swatch: 'rgba(100, 180, 255, 0.8)',
    fill: 'rgba(100, 180, 255, 0.45)',
    accent: '#64b4ff',
    inputBg: 'rgba(100, 180, 255, 0.18)',
    border: '#5b8def',
    kookitIndex: 3,
  },
  {
    id: 'green',
    label: '淡绿',
    swatch: 'rgba(120, 200, 140, 0.9)',
    fill: 'rgba(120, 200, 140, 0.45)',
    accent: '#5a9a6a',
    inputBg: 'rgba(120, 200, 140, 0.18)',
    border: '#5a7a6a',
    kookitIndex: 2,
  },
  {
    id: 'cyan',
    label: '青色',
    swatch: 'rgba(80, 210, 210, 0.85)',
    fill: 'rgba(80, 210, 210, 0.42)',
    accent: '#3db8b8',
    inputBg: 'rgba(80, 210, 210, 0.18)',
    border: '#3db8b8',
    kookitIndex: 3,
  },
  {
    id: 'yellow',
    label: '淡黄',
    swatch: 'rgba(255, 220, 100, 0.85)',
    fill: 'rgba(255, 220, 100, 0.45)',
    accent: '#d4a820',
    inputBg: 'rgba(255, 220, 100, 0.22)',
    border: '#c9a030',
    kookitIndex: 0,
  },
  {
    id: 'purple',
    label: '淡紫',
    swatch: 'rgba(190, 150, 255, 0.85)',
    fill: 'rgba(190, 150, 255, 0.42)',
    accent: '#9b6fd4',
    inputBg: 'rgba(190, 150, 255, 0.18)',
    border: '#9b6fd4',
    kookitIndex: 1,
  },
]

const LEGACY_GRAY: HighlightColorDef = {
  id: 'gray',
  label: '灰色',
  swatch: 'rgba(160, 160, 160, 0.8)',
  fill: 'rgba(0, 0, 0, 0.06)',
  accent: '#888',
  inputBg: 'rgba(0, 0, 0, 0.06)',
  border: '#999',
  kookitIndex: 1,
}

const colorMap = new Map<HighlightColor, HighlightColorDef>(
  [...HIGHLIGHT_COLOR_OPTIONS, LEGACY_GRAY].map((item) => [item.id, item]),
)

export const HIGHLIGHT_COLOR_IDS = HIGHLIGHT_COLOR_OPTIONS.map((item) => item.id)

export function getHighlightColorDef(color: HighlightColor): HighlightColorDef {
  return colorMap.get(color) ?? HIGHLIGHT_COLOR_OPTIONS[1]!
}

export function highlightColorToKookitIndex(color: HighlightColor): number {
  return getHighlightColorDef(color).kookitIndex
}
