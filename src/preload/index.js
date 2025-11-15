import { contextBridge, ipcMain } from 'electron';
import { electronAPI } from '@electron-toolkit/preload';

// Custom APIs for renderer
const api = {
  test111: () => {
    console.log('election test');
  }
};

// 开启上下文隔离
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI);
    contextBridge.exposeInMainWorld('api', api);
  } catch (error) {
    console.error(error);
  }
}

// 使用contextBridge暴露安全的API给渲染进程
// contextBridge.exposeInMainWorld('electronAPI', {
//   // 模态框确认
//   confirmModal: (data) => ipcRenderer.send('modal-confirm', data),

//   // 关闭模态框
//   closeModal: () => ipcRenderer.send('close-modal'),

//   // 异步发送消息并等待回复
//   sendAsyncMessage: (channel, data) => {
//     // console.log('sendAsyncMessage:', ipcMain.eventNames)
//     console.log('已注册的 IPC 事件:', contextBridge, ipcRenderer, channel, data) // 应有 get-store
//     ipcRenderer.invoke(channel, data)
//   },

//   // 同步发送消息并立即返回结果（不推荐频繁使用）
//   sendSyncMessage: (channel, data) => {
//     try {
//       return ipcRenderer.sendSync(channel, data);
//     } catch (error) {
//       console.error(`Error in sendSyncMessage: ${error.message}`);
//       throw error;
//     }
//   },

//   // 监听来自主进程的异步回复
//   onAsyncReply: (channel, callback) => {
//     ipcRenderer.on(channel, (event, ...args) => {
//       try {
//         callback(...args);
//       } catch (error) {
//         console.error(`Error in callback for channel "${channel}": ${error.message}`);
//       }
//     });
//   },
//   invokeDialog: (currentName) => ipcRenderer.invoke('show-dialog', currentName),
//   // 异步发送消息并等待回复（与 sendAsyncMessage 功能相同，保留以保持兼容性）
//   invokeSyncMessage: (channel, data) => ipcRenderer.invoke(channel, data),
//   invoke: (channel, data) => ipcRenderer.invoke(channel, data)
// });
