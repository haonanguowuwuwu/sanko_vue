export function ok(data) {
  return { code: 0, message: 'ok', data }
}

export function fail(res, message, httpStatus = 400, code = -1) {
  return res.status(httpStatus).json({ code, message, data: null })
}
