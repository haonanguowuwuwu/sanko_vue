import { fail } from '../response.js'
import { store } from '../store.js'

export function requireAdminAuth(req, res, next) {
  const header = req.headers.authorization ?? ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : ''
  const session = token ? store.sessions.get(token) : null
  if (!session) {
    return fail(res, '未登录或登录已过期', 401, 401)
  }
  req.admin = session
  next()
}
