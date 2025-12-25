const r_is_params = /^(.*?):(.+)$/
const r_attrs_params = /(.*?),(.+)$/
const r_eval_params = /(.*?)=(.+)$/
const r_has_suffix = /.+;$/

function isNumber(x) {
  if (typeof x === 'string') {
    return /^[-\d]\d*(\.\d+)?$/.test(x)
  }
  return typeof x === 'number' && !Number.isNaN(x)
}

function isBoolean(x) {
  if (typeof x === 'string') {
    return /^(true|false)$/i.test(x)
  }
  return typeof x === 'boolean'
}

function correctValue(val) {
  if (isNumber(val)) return Number(val)
  if (isBoolean(val)) return /^true$/i.test(String(val))
  return val
}

function evalHandle(paramStr) {
  if (r_attrs_params.test(paramStr)) {
    const out = {}
    const attrs = paramStr.split(',')
    for (const attr of attrs) {
      const [k, v] = attr.split('=')
      out[k] = correctValue(v)
    }
    return out
  }
  if (r_eval_params.test(paramStr)) {
    const [k, v] = paramStr.split('=')
    const out = {}
    out[k] = correctValue(v)
    return out
  }
  return correctValue(paramStr)
}

function children(defConf, parentVal) {
  const objArr = parentVal.split(';').filter(Boolean)
  for (const obj of objArr) {
    const m = obj.match(r_is_params)
    if (m) {
      const cKey = m[1]
      const cVal = m[2]
      if (cVal.includes(';')) {
        defConf[cKey] = {}
        children(defConf[cKey], cVal)
      } else {
        defConf[cKey] = evalHandle(cVal)
      }
    }
  }
}

function cutSuffix(val) {
  if (r_has_suffix.test(val)) {
    return val.slice(0, val.length - 1)
  }
  return val
}

export function spillargv(argvs, defConf) {
  for (let argv of argvs) {
    argv = cutSuffix(argv)
    const top = argv.match(r_is_params)
    if (top) {
      const topKey = top[1]
      const topVal = top[2]
      if (topVal.includes(';')) {
        defConf[topKey] = {}
        children(defConf[topKey], topVal)
      } else {
        defConf[topKey] = evalHandle(topVal)
      }
    }
  }
  return defConf
}