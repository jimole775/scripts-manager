const fs = require('fs')

export function rmdir(p) {
  let path = String(p || '').trim().replace(/\\+$/, '')
  if (!fs.existsSync(path)) {
    return false
  }
  const items = fs.readdirSync(path)
  for (const item of items) {
    const pitem = path + '\\' + item
    const stat = fs.statSync(pitem)
    if (stat.isDirectory()) {
      const sub = fs.readdirSync(pitem)
      if (sub.length === 0) {
        fs.rmdirSync(pitem)
      } else {
        rmdir(pitem)
      }
    } else {
      fs.unlinkSync(pitem)
    }
  }
  return true
}