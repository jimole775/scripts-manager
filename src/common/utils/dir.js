/**
 * @ Author: Rongxis
 * @ Create Time: 2025-01-20 17:17:44
 * @ TAPD: 无
 * @ Description: 处理 树级目录 的方法集
 */
import fs from 'fs'
import path from 'path'
import { isString } from '@common/utils/assert'

const defaultIgnoreFolders = ['node_modules', 'scripts-manager'];

// 读取路径，返回目录的描述对象集合
export const readdirToDirents = (dir, ignoreFolders) => {
  const ignoreSet = new Set(ignoreFolders);
  try {
    const dirents = fs.readdirSync(dir, { withFileTypes: true });
    return dirents.filter((item) => {
      return !ignoreSet.has(item.name) && item.isDirectory()
    });
  } catch (error) {
    console.error('读取目录失败:', error);
    return [];
  }
}

// 判断文件存在与否
export function isExists(fullPath) {
  return fs.existsSync(fullPath)
}

// 判断字符串路径是否是文件夹
export const isDir = (fullPath) => {
  if (!isExists(fullPath)) return false; // 如果路径不存在则直接返回
  return fs.statSync(fullPath).isDirectory()
}

// 判断字符串路径是否是文件
export const isFile = (fullPath) => {
  if (!isExists(fullPath)) return false;
  return !fs.statSync(fullPath).isDirectory()
}

/**
 * 遍历指定目录的下一层目录
 * @param {String} parentDir
 * @param {Function<currentPath, parentPath>} callback
 * @param {Array<String>} ignoreFolders
 * @return void
 */
export function forEachShallow(parentDir, callback, ignoreFolders = defaultIgnoreFolders) {
  const dirents = readdirToDirents(parentDir, ignoreFolders);
  dirents.forEach((dirent) => {
    const fullPath = path.join(parentDir, dirent.name);
    callback(fullPath, parentDir);
  });
}

/**
 * 递归遍历所有目录
 * @param {String|Array<String>} parentDirs
 * @param {Function<currentPath, parentPath>} callback
 * @param {Array<String>} ignoreFolders
 * @return void
 */
export function forEach(parentDirs, callback, ignoreFolders = defaultIgnoreFolders) {
  if (isString(parentDirs)) parentDirs = [parentDirs];
  parentDirs.forEach((parentDir) => {
    const dirents = readdirToDirents(parentDir, ignoreFolders);
    dirents.forEach((dirent) => {
      const fullPath = path.join(parentDir, dirent.name);
      callback(fullPath, parentDir);
      return forEach(fullPath, callback, ignoreFolders);
    });
  })
}

/**
 * 以递归的形式，从 parentDir 中查找指定目录，找到就直接返回
 * @param {String} parentDir
 * @param {String|Function} callbackOrFolder 可以指定目录名，或者回调
 * @return {String|Null}
 */
export function find(parentDir, callbackOrFolder, ignoreFolders = defaultIgnoreFolders) {
  const dirents = readdirToDirents(parentDir, ignoreFolders);
  for (let dirent of dirents) {
    const fullPath = path.join(parentDir, dirent.name);
    if (typeof callbackOrFolder === 'string' && dirent.name === callbackOrFolder) {
      return fullPath;
    } else if (typeof callbackOrFolder === 'function' && callbackOrFolder(fullPath)) {
      return fullPath;
    }
    const result = find(fullPath, callbackOrFolder, ignoreFolders);
    if (result) return result;
  }
  return null;
}

/**
 * 递归遍历目录，查找符合规则的目录
 * @param {String} parentDir
 * @param {Function<currentPath, parentPath>} callback
 * @return {Boolean}
 */
export function filter(parentDir, callback, ignoreFolders = defaultIgnoreFolders) {
  const res = [];
  loop(parentDir, res);
  return res;
  function loop(_parentDir, _res) {
    const dirents = readdirToDirents(_parentDir, ignoreFolders);
    return dirents.forEach((item) => {
      const fullPath = path.join(_parentDir, item.name);
      if (callback(fullPath, _parentDir)) {
        _res.push(fullPath);
      }
      return loop(fullPath, _res);
    })
  }
}

/**
 * 递归遍历目录，如果遇到一个 callback 返回 true，就中断遍历，返回 true
 * @param {String} parentDir
 * @param {Function<currentPath, parentPath>} callback
 * @return {Boolean}
 */
export function some(parentDir, callback, ignoreFolders = []) {
  const dirents = readdirToDirents(parentDir, ignoreFolders);

  for (let dirent of dirents) {
    const fullPath = path.join(parentDir, dirent.name);
    if (callback(fullPath, parentDir) || some(fullPath, callback)) {
      return true;
    }
  }
  return false;
}

/**
 * 递归遍历目录，如果所有 callback 执行都返回 true，函数执行则返回 true，如果其中一个 callback 返回 false，函数执行则返回 false
 * @param {String} parentDir
 * @param {Function<currentPath, parentPath>} callback
 * @return {Boolean}
 */
export function every(parentDir, callback, ignoreFolders = []) {
  const dirents = readdirToDirents(parentDir, ignoreFolders);
  for (let dirent of dirents) {
    const fullPath = path.join(parentDir, dirent.name);
    if (!callback(fullPath, parentDir) || !every(fullPath, callback)) {
      return false;
    }
  }
  return true;
}

// 测试代码
if (require.main === module) {
  const res1 = find('D:\\my_work', 'wx-mina');
  const res2 = find('D:\\my_work', (dir) => /(wx-mina)$/.test(dir));
}
