import { store } from '../store.js'
import { fail } from '../response.js'

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  req.user = token ? store.sessions.get(token) ?? null : null
  next()
}

export function requireAuth(req, res, next) {
  optionalAuth(req, res, () => {
    if (!req.user) {
      return fail(res, '未登录或登录已过期', 401, 401)
    }
    next()
  })
}
