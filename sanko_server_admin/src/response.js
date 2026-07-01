export function ok(data, message = 'ok') {
  return { code: 0, message, data }
}

export function fail(res, message, code = 400, httpStatus = code) {
  return res.status(httpStatus).json({ code, message, data: null })
}
