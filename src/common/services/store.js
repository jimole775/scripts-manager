/**
 * @ Author: Rongxis
 * @ Create Time: 2024-12-13 15:31:55
 * @ Modified by: Rongxis
 * @ Modified time: 2024-12-13 17:29:36
 * @ Description: 数据持久化 工具
 * 1. 用户数据
 * 2. 脚本执行时的配置信息
 */
import { read, write, removeAll } from '@common/utils/file';
import { parse, verticalRead } from '@common/utils/data';
import { join } from 'path';

// store数据，先使用缓存，避免频繁访硬盘
let cache = {};

/**
 * 获取数据路径
 * @param {string} filePath 存储路径
 * @param {Array} args 参数路径
 * @returns {Object} 返回{storeData, setData, key, val}
 */
function _getDataByPaths(filePath, args) {
  if (args.length < 2) return { error: Error('需要至少2个参数') };
  const storeData = _readStoreData(filePath) || {};
  const val = args.pop();
  const key = args.pop();
  const setData = args.reduce((data, treePath) => {
    if (treePath in data) {
      return data[treePath];
    } else {
      data[treePath] = {};
      return data[treePath];
    }
  }, storeData);
  return { storeData, setData, key, val };
}

/**
 * 新增数据到存储
 * @param {string} filePath 存储路径
 * @param {...any} args 参数合集，必须保持最后两个参数是 key 和 val
 * @return void
 */
export function add(filePath, ...args) {
  const result = _getDataByPaths(filePath, args);
  if (result.error) return result.error;
  const { storeData, setData, key, val } = result;
  
  if (key in setData) {
    return Error('数据已存在，请使用update方法更新');
  }
  setData[key] = val;
  _saveStoreData(filePath, storeData);
}

/**
 * 删除存储中的数据
 * @param {string} filePath 存储路径
 * @param {...string} args 要删除的键路径
 * @return void
 */
export function remove(filePath, ...args) {
  if (args.length < 1) return Error('需要至少1个参数');
  const storeData = _readStoreData(filePath);
  const key = args.pop();
  const target = args.reduce((data, treePath) => {
    return data[treePath] || {};
  }, storeData);
  
  delete target[key];
  _saveStoreData(filePath, storeData);
}

/**
 * 更新存储中的数据
 * @param {string} filePath 存储路径
 * @param {...any} args 参数合集，必须保持最后两个参数是 key 和 val
 * @return void
 */
export function update(filePath, ...args) {
  const result = _getDataByPaths(filePath, args);
  if (result.error) return result.error;
  const { storeData, setData, key, val } = result;

  if (!(key in setData)) {
    return Error('数据不存在，请使用add方法新增');
  }
  setData[key] = val;
  _saveStoreData(filePath, storeData);
}

/**
 * 直接覆写某个表数据【谨慎使用】
 * @param {string} filePath 存储路径
 * @param  {...any} data
 * @return void
 */
export function cover(filePath, data) {
  // todo 需要判断 data 是否符合 schedule 的结构，否则会导致数据表错误
  _saveStoreData(filePath, data)
}

/**
 * 删除 所有数据表【谨慎使用】
 */
export function clear() {
  removeAll(STORE_HOME)
  cache = {}
}

/**
 * 重置 单个数据表
 */
export function reset(filePath) {
  _saveStoreData(join(STORE_HOME, filePath), {})
}

/**
 * 根据路劲，直接写入数据，不判断是否存在，一般用于程序自调
 * @param {string} filePath 存储路径
 * @param {...any} args 参数合集，必须保持最后两个参数是 key 和 val
 * @return void
 * @template set('a', 'b') => void
 * @template set('a', 'b', 'c') => void
 */
export function set(filePath, ...args) {
  const result = _getDataByPaths(filePath, args);
  if (result.error) return result.error;
  const { storeData, setData, key, val } = result;
  setData[key] = val;
  _saveStoreData(filePath, storeData);
}

/**
 * 设置存储的数据，支持快速访问 树级结构的数据
 * @param {string} filePath 存储路径
 * @param  {...string} args 参数合集，可根据树级结构取值
 * @return { any }
 * @template get() => store
 * @template get('a') => store.a
 * @template get('a', 'b') => store.a.b
 */
export function get(filePath, ...treePaths) {
  const storeData = _readStoreData(filePath);
  return verticalRead(storeData, ...treePaths);
}

/**
 * 读取当前运行脚本的存储数据
 * @param {string} filePath 存储路径
 * @returns any
 */
function _readStoreData(filePath) {
  if (cache[filePath]) return cache[filePath];
  let storeData = read(join(STORE_HOME, filePath));
  // 避免出现访问边界的问题
  if (!storeData) storeData = {};
  return storeData;
}

/**
 * 存入当前运行脚本的存储数据
 * @param {string} filePath 存储路径
 * @param {any} data
 * @returns void
 */
function _saveStoreData(filePath, data) {
  // 先缓存到内存，再写入硬盘数据
  cache[filePath] = parse(data);
  write(join(STORE_HOME, filePath), data);
}
