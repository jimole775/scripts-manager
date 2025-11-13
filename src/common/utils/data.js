/**
 * @ Author: Rongxis
 * @ Create Time: 2024-12-13 10:18:04
 * @ Modified by: Rongxis
 * @ Modified time: 2024-12-16 09:27:10
 * @ Description: 处理 数据结构 的方法集
 */
import { isObject, isArray } from './assert'
/**
 * 把树级结构转成一维数组
 * @param {Array|Object} src
 * @param {String} dir 树级结构的节点名
 * @param {Boolean} isRef 是否保留各个节点之间对象的引用
 * @returns {Array}
 */
export function flatten(src, dir = 'children', isRef = true) {
  const res = [];
  if (src instanceof Array) {
    loop(src);
  }
  // 如果是树的根节点，直接存第一个元素
  if (isObject(src)) {
    res.push(src);
    loop(src[dir]);
  }
  // 递归逻辑
  function loop(children, level = 0, parentId = null) {
    children.forEach((node, index) => {
      node._level = level; // 转成一维数组时，需要给与一个标识，判断是第几层的
      node._parentId = parentId;
      node._id = `${level}_${index}`; // 标识唯一 id，帮助构建父子 id 关联
      res.push(node);
      if (node[dir] && node[dir].length) {
        loop(node[dir], level + 1, node._id);
      }
    });
  }

  return res;
}

/**
 * 系列化数据，比如：洗掉 proxy 之类的监听逻辑
 * @param {Array|Object} data
 * @returns {Array|Object}
 */
export function parse(data) {
  return JSON.parse(JSON.stringify(data));
}

/**
 * 递归裁剪数据,确保符合 construction 的结构
 * @param {Object|Array} construction
 * @param {Object|Array} insertData
 * @returns {Object|Array}
 */
export function shaking(construction, insertData) {
  if (!isObject(insertData) && !isArray(insertData)) return insertData

  // 如果是数组类型，直接处理数组
  if (isArray(construction) && isArray(insertData)) {
    return insertData.map(item => {
      // 只使用construction的第一个元素作为结构模板
      const itemConstruction = construction[0]
      return itemConstruction ? shaking(itemConstruction, item) : item
    })
  }

  // 如果是对象类型，创建新对象
  const result = isArray(construction) ? [] : {}

  // 循环结构的keys，如果 insertData 没有对应的 key ，就跳过
  Object.keys(construction).forEach(key => {
    if (key in insertData) {
      if (isObject(construction[key]) && isObject(insertData[key])) {
        // 处理对象类型
        result[key] = shaking(construction[key], insertData[key])
      } else if (isArray(construction[key]) && isArray(insertData[key])) {
        // 处理数组类型
        result[key] = insertData[key].map((item, index) => {
          // 只使用 construction[key] 的第一个元素当作存储结构
          const itemConstruction = construction[key][0]
          return itemConstruction ? shaking(itemConstruction, item) : item
        })
      } else {
        // 非 复合类型，直接赋值
        result[key] = insertData[key]
      }
    }
  })
  return result
}

/**
 * 根据 paths 依次读取树级结构 data 的值
 * @param {Object} data 
 * @param  {...any} paths 
 * @returns {any} 返回读取到的值
 */
export function verticalRead (data, ...paths) {
  if (!data || !paths || paths.length === 0) return data;
  // 判断如果是最后一个树级节点，就直接返回访问的 value，即使是 undefined
  const isEnd = (index) => paths.length === index + 1;
  // 根据入参，遍历树级数据
  return paths.reduce(
    (result, path, index) => (path in result || isEnd(index) ? result[path] : {}),
    data
  );
}

/**
 * 字符串转数组，主要增加清边逻辑
 * @param {String} str 
 * @returns {Array}
 */
export function string2array(str, split = ',') {
  if (!str) return [];
  return str.split(split).map(item => item.trim());
}

/**
 * 清除字符串首尾的空格
 * @param {String} str 
 * @returns {String}
 */
export function trim(str) {
  if (!str) return '';
  return str.trim();
}
