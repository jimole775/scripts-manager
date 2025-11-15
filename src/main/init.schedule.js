/**
 * @ Author: Rongxis
 * @ Create Time: 2025-03-05 11:52:48
 * @ Description: 
 * 初始化存储的数据结构；
 * 如果存储位置没有数据，直接使用默认数据进行填充
 * 如果存储位置有数据，则判断 version 是否相同，不同的话，就进行更新
 */
import { get, set, cover }  from '@common/services/store'
import { isEmpty, isObject, isArray }  from '@common/utils/assert'
// import { clear } from '@common/services/store'
// clear() // 清空所有数据, 调试的时候使用
const config = get('config.json')
const script = get('script.json')

/**
 * 递归处理配置文件的字段,
 * 以 SCHEDULE 结构为准
 * 如果 config 文件中的相同位置的数据不存在，就从 scheduleData 中获取
 * @param {String} configAddress 配置文件的地址
 * @param {Object} scheduleData 数据表的结构
 * @param {Object} configData 配置文件的数据
 * @param {Array<String>} dataTreePaths 数据树的路径，主要用于判断怎么写入数据
 */
function recursiveSetFields(configAddress, scheduleData, configData, dataTreePaths = []) {
  Object.keys(scheduleData).forEach(key => {
    const currentNodePaths = [...dataTreePaths, key]
    // 如果配置文件中不存在该字段，就赋值
    if (configData[key] === undefined) {
      set.apply(null, [configAddress, ...currentNodePaths, scheduleData[key]])
    } else if (isObject(scheduleData[key]) && isObject(configData[key])) {
      // 如果都是对象, 则递归处理
      recursiveSetFields(configAddress, scheduleData[key], configData[key], currentNodePaths)
    } else if (isArray(scheduleData[key]) && isArray(configData[key])) {
      // 处理数组类型
      scheduleData[key].forEach((scheduleItem, index) => {
        const configItem = configData[key][index]
        const arrTypePaths = [...currentNodePaths, index]
        if (isObject(scheduleItem) && isObject(configItem)) {
          // 默认是对象, 则递归处理
          recursiveSetFields(configAddress, scheduleItem, configItem, arrTypePaths)
        } else if (configItem === undefined) {
          // 暂时不支持二维数组，所以不是对象，就是基础类型，可以直接赋值
          set.apply(null, [configAddress, ...arrTypePaths, scheduleItem])
        }
      })
    }
  })
}

/**
 * 处理配置文件更新
 * @param {String} configAddress 配置文件的地址
 * @param {Object} scheduleData 数据表的结构
 * @param {Object} configData 配置文件的数据
 */
const handleStoreUpdate = (configAddress, scheduleData, configData) => {
  if (isEmpty(configData)) {
    cover(configAddress, scheduleData)
  } else if (configData.version !== scheduleData.version) {
    // 只处理新增字段，不处理变更字段
    recursiveSetFields(configAddress, scheduleData, configData)
    set(configAddress, 'version', scheduleData.version)
  } else {
    // todo 变更字段的逻辑

  }
}

// 以 CONFIG_SCHEDULE 解构，去刷新 config.json 文件
handleStoreUpdate('config.json', CONFIG_SCHEDULE, config)
// 以 SCRIPT_SCHEDULE 解构，去刷新 script.json 文件
handleStoreUpdate('script.json', SCRIPT_SCHEDULE, script)
