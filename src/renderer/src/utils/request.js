/**
 * @ Author: Rongxis
 * @ Create Time: 2025-03-04 11:03:38
 * @ Description: 仿 axios 和 主进程进行数据交互
 */
class IpcRequest {
  static instance;
  defaultTimeout = 3000; // 默认超时时间 30s

  constructor() {
    this.ipcRenderer = window.electron.ipcRenderer
  }

  static getInstance() {
    if (!IpcRequest.instance) {
      IpcRequest.instance = new IpcRequest();
    }
    return IpcRequest.instance;
  }

  send(channel, data) {

    return new Promise((resolve, reject) => {
      // 生成唯一的响应通道
      const responseChannel = `${channel}:response:${Date.now()}`;
      
      // 设置超时处理
      const timeoutId = setTimeout(() => {
        this.ipcRenderer.removeAllListeners(responseChannel);
        reject(new Error(`IPC request timeout: ${channel}`));
      }, this.defaultTimeout);

      // 监听响应
      this.ipcRenderer.once(responseChannel, (_, response) => {
        console.log("🚀 ~ IpcRequest ~ this.ipcRenderer.once ~ _:", _)
        console.log("🚀 ~ IpcRequest ~ this.ipcRenderer.once ~ response:", response)
        clearTimeout(timeoutId);
        if (response.status === 200) {
          resolve(response);
        } else {
          reject(new Error(response.message || 'IPC request failed'));
        }
      });

      // 发送请求
      this.ipcRenderer.send(channel, { data, responseChannel });
    });
  }
}

// 创建便捷方法
const ipcRequest = IpcRequest.getInstance();

export default ipcRequest;
