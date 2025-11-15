import { useAppStore } from '@ui/stores/app'
import { debounce } from 'lodash-es'
import { ipcPost } from './ipc'
import { parse } from '@common/utils/data'

// 更新 app 的配置信息
export const updateBaseConfig = debounce((...args) => {
  ipcPost('set-base-config', args).then(() => {
    useAppStore().initBaseConfig()
  })
}, 500)

// 获取 app 的配置信息
export const getBaseConfig = async (...args) => {
  return ipcPost('get-base-config', args)
}

// 获取 app 的脚本配置信息
export const getScriptConfig = async (...args) => {
  return ipcPost('get-script-config', args)
}

// 设置 app 的脚本配置信息
export const updateScriptConfig = debounce((...args) => {
  return ipcPost('set-script-config', args)
}, 500)

// 选择文件目录
export const selectDirectory = async (...args) => {
  const res = await electron.ipcRenderer.invoke('select-directory', { data: parse(args) });
  return res
}

// 通知 app 执行脚本
export const execScript = async (scriptName, ...args) => {
  return ipcPost('exec-script', { scriptName, args })
}

// 终止脚本执行
export const terminateScript = async (scriptName, ...args) => {
  return ipcPost('terminate-script', { scriptName, args })
}

// 显示log日志窗口
export const openModal = async (scriptName, ...args) => {
  return ipcPost('show-log-screen', { scriptName, args })
}

// 显示log日志窗口
export const closeModal = async (scriptName, ...args) => {
  return ipcPost('hide-log-screen', { scriptName, args })
}
