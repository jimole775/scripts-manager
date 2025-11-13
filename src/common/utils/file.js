/**
 * @ Author: Rongxis
 * @ Create Time: 2025-01-21 16:19:45
 * @ TAPD: 无
 * @ Description: 处理 文件 的方法集
 */
import fs from 'fs'
import { join } from 'path'
import { buildPath } from './path'
import { isArray, isObject } from './assert'
/**
 * @param { String } filePath - 要读取的文件路径
 * @return { any } 根据读取的文件类型返回不同的数据
 * @template readFileSync('xxx/xxx/xxx.xx') => any
 */
export function read(filePath) {
  let data = null;
  try {
    const isExist = fs.existsSync(filePath);
    if (!isExist) return data;
    if (/\.json$/i.test(filePath)) {
      data = fs.readFileSync(filePath, 'utf8');
      data = data ? JSON.parse(data) : data;
    } else {
      data = fs.readFileSync(filePath, 'utf8');
    }
  } catch (error) {
    data = null;
  }
  return data;
}
/**
 * @description 同步写入文件，会自动创建不存在的目录
 * @param { String } asbFilePath - 要写入的文件路径
 * @param { * } data - 要写入的数据
 * @return { Undefined }
 * @template writeFileSync('xxx/xxx.xx', 'text')
 * @template writeFileSync('xxx/xxx.xx', [...])
 * @template writeFileSync('xxx/xxx.xx', {...})
 */
export function write(asbFilePath, data) {
  console.log("🚀 ~ write ~ data:", asbFilePath)
  try {
    buildPath(asbFilePath);
    if (isArray(data) || isObject(data)) {
      data = JSON.stringify(data);
    }
    fs.writeFileSync(asbFilePath, data, 'utf8');
  } catch (error) {
    console.log('file.write => error:', error);
  }
}
/**
 * @description 追加文本到文件末尾
 * @param { String } asbFilePath - 要追加的文件路径
 * @param { * } data - 要追加的数据
 * @return { Undefined }
 * @template writeFileSync('xxx/xxx.xx', 'text')
 * @template writeFileSync('xxx/xxx.xx', [...])
 * @template writeFileSync('xxx/xxx.xx', {...})
 */
export function append(asbFilePath, data) {
  try {
    buildPath(asbFilePath);
    if (isArray(data) || isObject(data)) {
      data = JSON.stringify(data);
    }
    // 由于 appendFileSync 会自动创建不存在的文件，所以不用再进行判断
    fs.appendFileSync(asbFilePath, data, 'utf8');
  } catch (error) {
    console.log('file.append => error:', error);
  }
}

/**
 * 根据提供的路径地址，递归删除该目录下的所有东西（慎用）
 * @param { String } asbFilePath - 要删除的目录路径
 * @return { void }
 */
export function removeAll(asbFilePath) {
  try {
    // 如果路径不存在则直接返回
    if (!fs.existsSync(asbFilePath)) {
      return;
    }

    // 获取文件状态
    const stats = fs.statSync(asbFilePath);

    // 如果是文件直接删除
    if (stats.isFile()) {
      fs.unlinkSync(asbFilePath);
      return;
    }

    // 如果是目录则递归删除
    if (stats.isDirectory()) {
      // 读取目录下的所有文件/目录
      const files = fs.readdirSync(asbFilePath);

      // 递归删除所有文件和子目录
      for (const file of files) {
        const curPath = join(asbFilePath, file);
        removeAll(curPath);
      }

      // 删除空目录
      fs.rmdirSync(asbFilePath);
    }
  } catch (error) {
    console.log('file.removeAll => error:', error);
  }
}
