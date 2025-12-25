const fs = require('fs')

export function mkdir(p) {
  let path = String(p || '').trim().replace(/\\+$/, '')
  const exists = fs.existsSync(path)
  if (!exists) {
    fs.mkdirSync(path, { recursive: true })
    return true
  }
  return false
}