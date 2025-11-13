/**
 * 获取对应的时间格式
 * @returns {String} date
 */
export function getUTC8Date() {
  const [year, month, date] = getUTC8Strings();
  return `${year}-${month}-${date}`;
}

/**
 * 获取当前的系统时间
 * @returns {String} date
 */
export function getUTC8Time() {
  const [year, month, date, hh, mm, ss] = getUTC8Strings();
  return `${year}-${month}-${date} ${hh}:${mm}:${ss}`;
}

/**
 * 以当前的时间为文件名
 * @returns {String} date
 */
export function dateToFileName() {
  const [year, month, date, hh, mm, ss] = getUTC8Strings();
  return `${year}-${month}-${date}_${hh}${mm}${ss}`;
}

export function getUTC8Strings() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const mm = String(now.getMinutes()).padStart(2, '0');
  const ss = String(now.getSeconds()).padStart(2, '0');
  return [year, month, day, hh, mm, ss];
}

export const now = getUTC8Time()
