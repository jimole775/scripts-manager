/**
 * @ Author: Rongxis
 * @ Create Time: 2025-05-22 15:47:55
 * @ Description: 配置页面的 API
 */
import { get, update } from '@common/services/store'
import { asyncIpcHandlers } from '@services/ipc.handler'
import { verticalRead, shaking } from '@common/utils/data';

// 获取基础配置
asyncIpcHandlers({
  'get-base-config': async (args = []) => {
    const data = get('config.json', ...args)
    return data
  }
})

// 更新基础配置
asyncIpcHandlers({
  'set-base-config': async (args = []) => {
    const value = args.pop()
    // 裁剪数据,确保符合 CONFIG_SCHEDULE 结构
    const storeSite = verticalRead(CONFIG_SCHEDULE, ...args)
    const trimmedValue = shaking(storeSite, value)
    update('config.json', ...args, trimmedValue)
    return 'success'
  }
})

// 获取脚本配置
asyncIpcHandlers({
  'get-script-config': async (args = []) => {
    const data = get('script.json', ...args)
    return data
  }
})

// 更新脚本配置
asyncIpcHandlers({
  'set-script-config': async (args = []) => {
    const value = args.pop()
    // 裁剪数据,确保符合 SCRIPT_SCHEDULE 结构
    const storeSite = verticalRead(SCRIPT_SCHEDULE, ...args)
    const trimmedValue = shaking(storeSite, value)
    update('script.json', ...args, trimmedValue)
    return 'success'
  }
})
