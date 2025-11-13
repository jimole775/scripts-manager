import { getMain } from '@common/manager/window.manager'
// const winManager = useWindowManager()
// 定义一个函数用于发送消息到渲染线程
export default class Emittor {
  constructor() {
    this.targetWindow = null;
    this.messageQueues = [];
    this.emitting = false;
    this.channel = null;
  }

  // 持续读取文件内容并进行预载
  // 并给文件行数进行标记，使得不要重复读取
  fileLoad (fileName) {
    
  }

  /**
   * 预加载消息队列和目标窗口
   * @param {string} channel - 消息通道名
   * @param {Array} messageQueues - 消息队列数组，每个元素是一个消息对象
   * @param {BrowserWindow} targetWindow - 目标窗口对象，默认为主窗口
   */
  preload (messageQueues = []) {
    this.messageQueues = messageQueues
  }

  start (channel, targetWindow) {
    // 默认是主窗口
    if (!targetWindow) targetWindow = getMain()
    this.targetWindow = targetWindow.webContents
    this.channel = channel
    this.emitting = true;
    this._loop()
  }

  _loop () {
    if (this.emitting && this.targetWindow.send) {
      const message = this.messageQueues.shift(); // 从队列中获取消息
      if (message) {
        this.targetWindow.send(this.channel, message); // 发送消息到渲染线程
      } else {
        this.emitting = false; // 如果队列为空，停止发送消息
      }
      setTimeout(() => {
        this._loop(); // 递归调用，以实现循环
      }, 300);
    }
  }

  stop () {
    this.emitting = false;
  }
}
