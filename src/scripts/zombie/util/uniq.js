export function is_uniq(src) {
  let res = true
  const l = src.length
  let i = 0
  while (i < l) {
    if (!res) break
    const item = src[i]
    let j = l - 1
    while (j > i) {
      const jtem = src[j]
      if (item === jtem) {
        res = false
        break
      }
      j = j - 1
    }
    i = i + 1
  }
  return res
}

export function uniq(src) {
  return Array.from(new Set(src))
}