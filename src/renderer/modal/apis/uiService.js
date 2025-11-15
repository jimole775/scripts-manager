import { useAppStore } from '@ui/stores/app'
import { debounce } from 'lodash-es'
const electron = window.electron || {}

// 给的有可能是 proxy 对象的数据，提交出去之前，先系列化一下
const parse = (data) => JSON.parse(JSON.stringify(data))

// 显示log日志窗口
export const requestLogs = async (scriptName, ...args) => {
  electron.ipcRenderer.send('start-log-to-front', { data: parse({ scriptName, args }) });
  return new Promise((resolve, reject) => {
    electron.ipcRenderer.once('start-log-to-front', (event, res) => {
      if (res.status === 200) {
        return resolve(true)
      } else {
        console.log("🚀 ~ electron.ipcRenderer.once ~ res.message:", res.message)
        return resolve(false)
      }
    })
  })
}

// 显示log日志窗口
export const stopLogs = async (scriptName, ...args) => {
  electron.ipcRenderer.send('stop-log-to-front', { data: parse({ scriptName, args }) });
  return new Promise((resolve, reject) => {
    electron.ipcRenderer.once('stop-log-to-front', (event, res) => {
      if (res.status === 200) {
        return resolve(true)
      } else {
        console.log("🚀 ~ electron.ipcRenderer.once ~ res.message:", res.message)
        return resolve(false)
      }
    })
  })
}
