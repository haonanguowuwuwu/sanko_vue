import type { RouteLocationNormalizedLoaded, Router } from 'vue-router'

function isValidReturnPath(path: string): boolean {
  return path.startsWith('/') && !path.startsWith('/read/')
}

/** 打开阅读页，并记录当前页面以便退出时返回 */
export function openReader(
  router: Router,
  route: RouteLocationNormalizedLoaded,
  bookId: string,
  options?: { spreadIndex?: number },
): void {
  const from = route.fullPath
  const query: Record<string, string> = {}
  if (isValidReturnPath(from)) {
    query.from = from
  }
  if (options?.spreadIndex != null && Number.isFinite(options.spreadIndex)) {
    query.at = String(options.spreadIndex)
  }
  void router.push({
    name: 'reader',
    params: { id: bookId },
    query: Object.keys(query).length ? query : undefined,
  })
}

/** 退出阅读页，返回进入阅读前的页面 */
export function exitReader(router: Router, route: RouteLocationNormalizedLoaded): void {
  const from = route.query.from
  if (typeof from === 'string' && isValidReturnPath(from)) {
    void router.push(from)
    return
  }
  if (window.history.length > 1) {
    router.back()
    return
  }
  void router.push('/')
}
