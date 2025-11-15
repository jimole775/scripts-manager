/**
 * @ Author: Rongxis
 * @ Create Time: 2025-05-22 15:47:55
 * @ Description: 公共 API
 */
import { syncIpcHandlers, asyncIpcHandlers } from '@services/ipc.handler'
import { getModal, getMain } from '@common/manager/window.manager'
// const winManager = useWindowManager()

syncIpcHandlers({
  // 目录选择
  'select-directory': async (args = []) => {
    const { dialog } = require('electron')
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory', 'createDirectory']
    })
    if (!result.canceled) {
      return result.filePaths[0]
    }
    return null
  }
})

// 显示日志窗口
asyncIpcHandlers({
  'show-log-screen': async ({ scriptName, args: [] }) => {
    const logScreen = getModal('log')
    logScreen.show()
    logScreen.webContents.send('script-name', scriptName)
    return 'success'
  }
})

// 隐藏日志窗口
asyncIpcHandlers({
  'hide-log-screen': async (args = []) => {
    const logScreen = getModal('log')
    logScreen.hide()
    return 'success'
  }
})

// 接收 子渲染进程 的进度条更新
// asyncIpcHandlers({
//   'progress-update': async (args = []) => {
//     const mainScreen = getMain()
//     mainScreen.webContents.send('progress-update', {
//       value: 50
//     })
//     return 'success'
//   }
// })
