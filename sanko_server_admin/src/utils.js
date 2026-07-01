export function todayStr() {
  return new Date().toISOString().slice(0, 10)
}

export function nowStr() {
  return new Date().toISOString().replace('T', ' ').slice(0, 19)
}

export function nextId(prefix, list) {
  const nums = list
    .map((item) => Number.parseInt(String(item.id).replace(/\D/g, ''), 10))
    .filter((n) => !Number.isNaN(n))
  const next = nums.length ? Math.max(...nums) + 1 : 1
  return `${prefix}${String(next).padStart(3, '0')}`
}

export function filterByKeyword(list, keyword, fields) {
  const q = String(keyword ?? '').trim().toLowerCase()
  if (!q) return list
  return list.filter((item) =>
    fields.some((field) => String(item[field] ?? '').toLowerCase().includes(q)),
  )
}
