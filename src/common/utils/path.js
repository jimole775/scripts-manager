import fs from 'fs'
import path from 'path'

/**
 * 把所有路径的分隔符，强制转为 /
 * @param {String} p 路径
 * @returns String 转换后的路径
 */
export function convertSeparators(p = '') {
  return p.replace(/\\/g, '/');
}

/**
 * 判断路径是否是相对路径
 * @param {String} p 路径
 * @returns Boolean
 */
export function isRelativePath(p = '') {
  return /^\.+[\\/]+/.test(p);
}

/**
 * 不用担心无目录的错误
 * @param { String } asbFilePath 绝对路径
 * @return { String } 返回已创建的目录
 * @template buildPath('xxxxxx/xxxxxx') => 'xxxxxx/xxxxxx'
 */
export function buildPath(asbFilePath) {
  const isExist = fs.existsSync(asbFilePath);
  if (isExist) return asbFilePath;
  let prevPath = '';
  const splitMark = getSeparator(asbFilePath);
  const pathArr = asbFilePath.split(splitMark);
  for (const segment of pathArr) {
    if (!prevPath) prevPath = segment;
    else prevPath = path.join(prevPath, segment);
    const isDirExist = fs.existsSync(prevPath);
    if (!isDirExist && !/\.\w+$/i.test(segment)) fs.mkdirSync(prevPath);
  }
  return asbFilePath;
}

/**
 * 处理 \\ 的路径，统一转成 /
 * @param {String} path
 * @returns {String}
 */
export function getSeparator(path) {
  let separator = '\\';
  if (path.includes('/')) {
    separator = '/';
  } else if (path.includes('\\\\')) {
    separator = '\\\\';
  }
  return separator;
}
