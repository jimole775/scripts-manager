/**
 * 判断是否为字符串
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是字符串返回true，否则返回false
 */
export function isString(src) {
  return Object.prototype.toString.call(src) === '[object String]';
}

/**
 * 判断是否为对象
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是对象返回true，否则返回false
 */
export function isObject(src) {
  return Object.prototype.toString.call(src) === '[object Object]';
}

/**
 * 判断是否为空对象
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是空数组返回true，否则返回false
 */
export function isEmptyObject(src) {
  return isObject(src) && JSON.stringify(src) === '{}'
}

/**
 * 判断是否为数组
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是数组返回true，否则返回false
 */
export function isArray(src) {
  return Object.prototype.toString.call(src) === '[object Array]';
}

/**
 * 判断是否为空数组
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是空数组返回true，否则返回false
 */
export function isEmptyArray(src) {
  return isArray(src) && src.length === 0;
}

/**
 * 判断是否为空
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果为空返回true，否则返回false
 */
export function isEmpty(src) {
  return isNone(src) || isEmptyArray(src) || isEmptyObject(src);
}

/**
 * 判断是否为null
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是null返回true，否则返回false
 */
export function isNull(src) {
  return Object.prototype.toString.call(src) === '[object Null]';
}

/**
 * 判断是否为undefined
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是undefined返回true，否则返回false
 */
export function isUndefined(src) {
  return Object.prototype.toString.call(src) === '[object Undefined]';
}

/**
 * 判断是否为null或undefined或空字符串
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是null或undefined或空字符串返回true，否则返回false
 */
export function isNone(src) {
  return isUndefined(src) || isNull(src) || src === '';
}

/**
 * 判断是否有值
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果有值返回true，否则返回false
 */
export function isValuable(src) {
  return !isUndefined(src) && !isNull(src) && src !== '';
}

/**
 * 判断是否为Promise
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是Promise返回true，否则返回false
 */
export function isPromise(src) {
  return Object.prototype.toString.call(src) === '[object Promise]';
}

/**
 * 判断是否为数字
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是数字返回true，否则返回false
 */
export function isNumber(src) {
  return Object.prototype.toString.call(src) === '[object Number]';
}

/**
 * 判断是否为Blob
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是Blob返回true，否则返回false
 */
export function isBlob(src) {
  return Object.prototype.toString.call(src) === '[object Blob]';
}

/**
 * 判断是否为布尔值
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是布尔值返回true，否则返回false
 */
export function isBoolean(src) {
  return Object.prototype.toString.call(src) === '[object Boolean]';
}

/**
 * 判断 数据 是否是 JSON 字符串
 * @param {any} src - 要检查的值
 * @returns {boolean} - 如果是JSON字符串返回true，否则返回false
 */
export function isJSONString(src) {
  if (isString(src)) {
    const firstChar = src[0];
    const lastChar = src[src.length - 1];
    if ((firstChar === '[' && lastChar === ']') || (firstChar === '{' && lastChar === '}')) {
      return true;
    }
  }
  return false;
}
