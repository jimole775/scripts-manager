import { isString } from "lodash"

// 清除边际空白
const trim = (src) => {
  return isString(src) ? src.trim() : src
}

// 判断是否是纯数字的字符串
const isNumberStr = (src) => {
  return /^(\d+)$/.test(trim(src))
}

// 判断是否是正确的样式字符串类型
const isCorrectStyleString = (src) => {
  return /^([\w\d\-_]+:.+;?)+$/.test(src)
}

// string 类型，转 object 类型
export const string2object = (src) => {
  if (!isCorrectStyleString(src)) return {}
  const style = Object.create({})
  const items = src.split(';') || []
  items.filter(Boolean).forEach((item) => {
    const [key, value] = item.split(':')
    style[trim(key)] = isNumberStr(value) ? Number(value) : trim(value)
  })
  return style
}

// object 类型，转 string 类型
export const object2string = (src) => {
  let str = ''
  Object.entries(src).forEach(([key, val]) => {
    str = str + `${trim(key)}:${trim(val)};`
  })
  return str
}

// 混合 样式属性，支持文本类型
export const mixinStyleAttribute = function mixinStyleAttribute(...args) {
  const sheets = Array.from(args)
  const res = {}
  sheets.forEach((sheet) => {
    const sheetObj = isString(sheet) ? string2object(sheet) : sheet
    Object.entries(sheetObj).forEach(([key, value]) => {
      res[key] = value
    })
  })
  return object2string(res)
}
