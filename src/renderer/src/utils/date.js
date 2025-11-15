import dayjs from 'dayjs';
import { isNumber, isString } from 'lodash'

const isValuableInput = (src) => {
  return isNumber(src) || dayjs.isDayjs(src) || isString(src)
}

export const isDate = (src) => {
  return dayjs.isDayjs(src)
}

// 日期格式化 输出年份
export const date2Y = (src) => {
  return isValuableInput(src) ? dayjs(src).format('YYYY') : ''
}

// 日期格式化 输出年月
export const date2YM = (src, splitSign = '-') => {
  return isValuableInput(src) ? dayjs(src).format(`YYYY${splitSign}MM`) : ''
}

// 日期格式化 输出年月日
export const date2YMD = (src, splitSign = '-') => {
  return isValuableInput(src) ? dayjs(src).format(`YYYY${splitSign}MM${splitSign}DD`) : ''
}

// 日期格式化 输出年月日 时
export const date2YMDH = (src, splitSign = '-') => {
  return isValuableInput(src) ? dayjs(src).format(`YYYY${splitSign}MM${splitSign}DD HH`) : ''
}

// 日期格式化 输出年月日 时分
export const date2YMDHM = (src, splitSign = '-') => {
  return isValuableInput(src) ? dayjs(src).format(`YYYY${splitSign}MM${splitSign}DD HH:mm`) : ''
}

// 日期格式化 输出年月日 时分秒
export const date2YMDHMS = (src, splitSign = '-') => {
  return isValuableInput(src) ? dayjs(src).format(`YYYY${splitSign}MM${splitSign}DD HH:mm:ss`) : ''
}

// 日期格式化 输出 时分
export const date2HM = (src) => {
  return isValuableInput(src) ? dayjs(src).format(`HH:mm`) : ''
}

// 日期格式化 输出 时分秒
export const date2HMS = (src) => {
  return isValuableInput(src) ? dayjs(src).format(`HH:mm:ss`) : ''
}

// 转成 dayjs 结构
export const toDate = (src) => {
  if (!src) return src
  return dayjs(src)
}
