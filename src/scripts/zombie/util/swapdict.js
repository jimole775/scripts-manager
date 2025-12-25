export function swapdict(src) {
  if (src === null || Array.isArray(src) || typeof src !== 'object') {
    return src
  }
  const result = {}
  for (const [k, v] of Object.entries(src)) {
    result[v] = k
  }
  return result
}