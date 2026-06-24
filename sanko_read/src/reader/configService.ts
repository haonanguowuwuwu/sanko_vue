/** 精简版 ConfigService，供 kookit StyleHelper 读取阅读样式默认值 */

import { loadReaderSettings, saveReaderSettings, type ReaderSettings } from '@/reader/readerSettings'

const READER_DEFAULTS: Record<string, string> = {
  readerMode: 'double',
  fontSize: '16',
  lineHeight: '1.9',
  textColor: '#333333',
  backgroundColor: '#faf8f4',
  isIndent: 'yes',
  isHyphenation: 'no',
  textOrientation: 'horizontal',
  isMergeWord: 'no',
  isOverwriteLink: 'no',
  isOverwriteBackground: 'no',
  isOverwriteText: 'no',
  paraSpacing: '0',
  paraSpacingValue: '1.5',
  appSkin: 'light',
  isOSNight: 'no',
}

const objectStore = new Map<string, Record<string, unknown>>()
let readerOverrides: Record<string, string> = {}
let readerOverridesInitialized = false

function ensureReaderOverrides(): void {
  if (readerOverridesInitialized) return
  readerOverridesInitialized = true
  readerOverrides = settingsToOverrides(loadReaderSettings())
}

function settingsToOverrides(settings: ReaderSettings): Record<string, string> {
  return {
    fontSize: String(settings.fontSize),
    lineHeight: String(settings.lineHeight),
    textColor: settings.textColor,
    backgroundColor: settings.backgroundColor,
    readerMode: settings.readerMode,
    isIndent: settings.isIndent ? 'yes' : 'no',
    paraSpacingValue: String(Math.max(1, settings.lineHeight * 0.75)),
  }
}

function persistReaderOverrides(): void {
  saveReaderSettings({
    fontSize: parseInt(readerOverrides.fontSize ?? READER_DEFAULTS.fontSize ?? '16', 10),
    lineHeight: parseFloat(readerOverrides.lineHeight ?? READER_DEFAULTS.lineHeight ?? '1.9'),
    textColor: readerOverrides.textColor ?? READER_DEFAULTS.textColor ?? '#333333',
    backgroundColor:
      readerOverrides.backgroundColor ?? READER_DEFAULTS.backgroundColor ?? '#faf8f4',
    readerMode: (readerOverrides.readerMode ??
      READER_DEFAULTS.readerMode ??
      'double') as ReaderSettings['readerMode'],
    isIndent: (readerOverrides.isIndent ?? READER_DEFAULTS.isIndent ?? 'yes') === 'yes',
  })
}

export const configService = {
  getReaderConfig(key: string): string {
    ensureReaderOverrides()
    if (key in readerOverrides) {
      return readerOverrides[key]!
    }
    return READER_DEFAULTS[key] ?? ''
  },

  setReaderConfig(key: string, value: string): void {
    ensureReaderOverrides()
    readerOverrides[key] = value
    persistReaderOverrides()
  },

  setReaderConfigs(entries: Record<string, string>): void {
    ensureReaderOverrides()
    Object.assign(readerOverrides, entries)
    persistReaderOverrides()
  },

  applySettings(settings: ReaderSettings): void {
    readerOverridesInitialized = true
    readerOverrides = settingsToOverrides(settings)
    saveReaderSettings(settings)
  },

  getObjectConfig(bookKey: string, category: string, fallback: Record<string, unknown>) {
    const id = `${bookKey}:${category}`
    return objectStore.get(id) ?? fallback
  },

  setObjectConfig(bookKey: string, value: Record<string, unknown>, category: string) {
    const id = `${bookKey}:${category}`
    objectStore.set(id, value)
  },

  getAllListConfig(_key: string): string[] {
    return []
  },
}
