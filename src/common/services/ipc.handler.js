/**
 * @ Author: Rongxis
 * @ Create Time: 2025-04-18 08:48:24
 * @ Description: ipc 处理器封装，用于处理前端的 ipc 调用，支持异步和同步两种方式，支持自定义响应通道
 * @ todo: 1. 支持自定义错误处理
 */
import { ipcMain } from 'electron';

// 异步 ipc 处理器，对接前端的 send 接口
export function asyncIpcHandlers(handlers) {
  Object.keys(handlers).forEach(channel => {
    ipcMain.on(channel, async (event, { data, responseChannel } = {}) => {
      try {
        const result = await handlers[channel](data);
        event.reply(responseChannel || channel, {
          status: 200,
          data: result,
          message: 'success',
        });
      } catch (error) {
        console.log("ipcMain.on ~ error:", error)
        global.loggerBus.err(error)
        event.reply(responseChannel || channel, {
          status: 500,
          data: null,
          message: error.message,
        });
      }
    });
  });
}

// 同步 ipc 处理器，对接前端的 invoke 接口
export function syncIpcHandlers(handlers) {
  Object.keys(handlers).forEach(channel => {
    ipcMain.handle(channel, async (event, { data }) => {
      try {
        const result = await handlers[channel](data);
        return {
          status: 200,
          data: result,
          message: 'success'
        };
      } catch (error) {
        console.log("ipcMain.handle ~ error:", error)
        global.loggerBus.err(error)
        return {
          status: 500,
          message: error.message,
          data: null
        };
      }
    });
  });
}
