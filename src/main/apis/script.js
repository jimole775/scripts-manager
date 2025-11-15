/**
 * @ Author: Rongxis
 * @ Create Time: 2025-05-20 11:18:46
 * @ Description: 脚本业务的 API 执行管理（多进程）
 */
import { asyncIpcHandlers } from '@services/ipc.handler'
import { createProcess, getProcess } from '@common/manager/process.manager'
// import { emitLogs } from '@services/emittor'
import { getModal } from '@common/manager/window.manager'
// const processManager = useProcessManager()

asyncIpcHandlers({
  // 执行脚本
  'exec-script': async ({ scriptName, args }) => {
    return new Promise((resolve, reject) => {
      const childProcess = createProcess(scriptName, (msg) => {
        // 进程执行完成，返回结果
        // 意外退出，也会执行
        return resolve(`script finish ${msg}`);
      })
      if (childProcess.status === 'running') {
        // 运行中，就直接返回
        return resolve(`${scriptName} still running`);
      } else {
        childProcess.start()
        global.loggerBus.init(scriptName)
        global.progressBus.init(scriptName)
      }
    })
  },
  // 终止脚本执行
  'terminate-script': async ({ scriptName, args }) => {
    const childProcess = getProcess(scriptName)
    if (!childProcess) return Error('脚本不存在');
    if (childProcess.status === 'running') {
      global.progressBus.update(100)
      childProcess.stop();
      return '脚本停止成功';
    } else {
      return '脚本已停止';
    }
  },
  // 前端请求log日志
  'start-log-to-front': async ({ scriptName, args } = {}) => {
    const win = getModal('log')
    // 通过管道，持续向前端输出 log 日志
    global.loggerBus.pipe((msg) => {
      win.webContents?.send('log-message', msg)
    }).open();
    return 'success'
  },
  // 前端停止接收log日志
  'stop-log-to-front': async ({ scriptName, args } = {}) => {
    global.loggerBus.close();
    return 'success'
  },

})
