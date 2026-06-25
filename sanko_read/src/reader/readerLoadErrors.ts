export const READER_LOAD_TIMEOUT_MS = 45_000

export function buildReaderLoadTimeoutMessage(format: string): string {
  const seconds = READER_LOAD_TIMEOUT_MS / 1000
  return (
    `打开 ${format} 超时（超过 ${seconds} 秒未加载完成）。` +
    '可能原因：文件损坏或为空、格式不正确，或文件过大。请重新导入该书籍后再试。'
  )
}

export function buildEmptyBufferMessage(format: string): string {
  return `${format} 文件内容为空或已丢失，请重新导入该书籍。`
}

export function normalizeReaderLoadError(error: unknown, format: string): string {
  if (error instanceof Error && error.message) {
    const raw = error.message
    if (raw.includes('超时') || /timeout/i.test(raw)) {
      return buildReaderLoadTimeoutMessage(format)
    }
    if (
      /corrupted zip/i.test(raw) ||
      /end of data reached/i.test(raw) ||
      /data length = 0/i.test(raw)
    ) {
      return (
        `无法解析 ${format} 文件：文件可能损坏、为空或格式不正确。` +
        '请确认文件完整后重新导入。'
      )
    }
    if (/replaceChildren/i.test(raw)) {
      return '阅读器渲染失败，请刷新页面后重新导入该书籍。'
    }
    return raw
  }
  return '加载书籍失败，请稍后重试或重新导入。'
}

export async function withReaderLoadTimeout<T>(
  task: Promise<T>,
  format: string,
  timeoutMs = READER_LOAD_TIMEOUT_MS,
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(buildReaderLoadTimeoutMessage(format)))
    }, timeoutMs)
  })

  try {
    return await Promise.race([task, timeout])
  } finally {
    if (timer) clearTimeout(timer)
  }
}
